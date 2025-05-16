<script lang="ts" setup>
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getUserListBySearch } from '@/api/user'
import type { ProjectMemberListItem, UserListItem } from '@/api/interface'
import { debounce, deepCopy, getTextLength } from '@/utils'
import { useUserStore } from '@/stores/modules/user'
import { SpaceRole } from '@/enum'
import { useProjectStore } from '@/stores/modules/project'
import router from '@/router'

const props = withDefaults(defineProps<Props>(), {
  type: '',
  dialogVisible: false,
  currentList: () => [],
  projectCurrentList: () => [],
  // 是否为创建
  isCreate: false,
  title: '添加项目成员',
  userType: '',
  userGroupName: '',
  // 提示内容
  tipContent: '用户',
})
const emits = defineEmits(['onConfirm', 'onClose'])
const { userInfo } = useUserStore()
const projectStore = useProjectStore()
const groupName = ref<string>('')

interface Props {
  type?: string
  dialogVisible: boolean
  currentList?: UserListItem[]
  projectCurrentList?: ProjectMemberListItem[]
  isCreate?: boolean
  title?: string
  userType?: string
  userGroupName?: string
  tipContent?: string
}

// 搜索关键词
const keyword = ref('')
// 左侧列表
const leftList = ref<UserListItem[]>([])
// 右侧列表
const rightList = ref<UserListItem[]>([])
// 是否显示loading
const loading = ref<boolean>(false)

// 监听 dialog 打开
function openDialog() {
  keyword.value = ''
  if (props?.userType === 'group')
    groupName.value = props.userGroupName || ''

  getUserList('', false)
}

// 监听输入框输入
const handleInput = debounce(async () => {
  getUserList(keyword.value, true)
}, 300)

// 是否为作者
const hasCreator = computed(() => {
  if (props.isCreate)
    return true

  const filterList = props.projectCurrentList?.filter(item => Number(item.roleId) === Number(SpaceRole.CREATOR))[0]
  return filterList && filterList.userId === userInfo.id
})

// 获取用户列表
async function getUserList(py: string, isSearch: boolean) {
  const cloneRightList: UserListItem[] = deepCopy(rightList.value)
  loading.value = true

  try {
    let dataList: any = []
    if (props.userType) {
      const id = router.currentRoute.value.params.id as string
      const list = await projectStore.getProjectMemberList(id || '', py || '', [], false)
      list?.forEach((item: any) => {
        item.id = item.userId
      })
      dataList = list
    }
    else {
      const { data } = await getUserListBySearch({ py })
      dataList = data.list
    }
    const filterList = dataList.filter((item: any) => item.id !== String(userInfo.id))
    filterList.forEach((item: any) => {
      item.active = false
      item.roleId = 2
      if (props.userType) {
        item.disabled = false
        if (props.projectCurrentList?.length) {
          props.projectCurrentList?.forEach((ytem) => {
            if (item.id === ytem.userId) {
              item.active = true
              item.disabled = props.userType !== 'group'
            }
          })
        }
      }
      else if (props.type === 'projectIntro') {
        props.projectCurrentList?.forEach((ytem) => {
          if (item.id === ytem.userId) {
            item.active = ytem.active
            item.roleId = ytem.roleId
            item.disabled = ytem.disabled
          }
        })
      }
      else {
        props.currentList?.forEach((ytem) => {
          if (item.id === ytem.id) {
            item.active = ytem.active
            item.roleId = ytem.roleId
            item.disabled = ytem.disabled
          }
        })
      }
    })
    if (isSearch) {
      if (cloneRightList.length) {
        cloneRightList.forEach((item) => {
          filterList.forEach((ytem: any) => {
            if (item.id === ytem.id) {
              ytem.active = item.active
              item.roleId = ytem.roleId
            }
          })
        })
      }
      else {
        filterList.forEach((item: any) => {
          if (props.type !== 'projectIntro') {
            item.active = false
          }
        })
      }

      leftList.value = filterList
    }
    else {
      leftList.value = filterList
      rightList.value = filterList.filter((item: any) => item.active && !item.disabled)
    }
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
  finally {
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

// 勾选左侧列表
function checkLeftItem(data: UserListItem) {
  if (data.active)
    rightList.value.push(data)
  leftList.value.forEach((item) => {
    rightList.value.forEach((ytem) => {
      if (item.id === ytem.id)
        ytem.active = item.active
    })
  })
  const filterList = rightList.value.filter(item => item.active)
  rightList.value = filterList
}

// 勾选右侧列表
function checkRightItem(data: UserListItem) {
  const arr = rightList.value.filter(item => item.active)
  leftList.value.forEach((item) => {
    if (item.id === data.id)
      item.active = data.active
  })
  rightList.value = arr
}

// 点击取消
function cancelDialog() {
  rightList.value = []
  // leftList.value.map(item => (item.active = false))
  leftList.value = []
  keyword.value = ''
  groupName.value = ''
  emits('onClose')
}

// 点击添加
function confirmDialog() {
  if (rightList.value.length || props.currentList.length) {
    if (props.userType === 'group') {
      const length = getTextLength(groupName.value.trim())
      if (!length) {
        message.error('请填写用户组名称', 2)
        return
      }
      else if (!(length >= 2 && length <= 80)) {
        message.error('请输入有效格式(2 ~ 14个字符)', 2)
        return
      }
      emits('onConfirm', rightList.value, groupName.value)
    }
    else {
      emits('onConfirm', rightList.value)
    }
  }

  cancelDialog()
}

// 全选
function checkAll() {
  leftList.value.forEach((item) => {
    item.active = true
  })
  const filterList = leftList.value.filter(item => !item.disabled)
  const newList = filterDuplicates(rightList.value, filterList)
  rightList.value = [...newList, ...rightList.value]
}

function filterDuplicates(a: UserListItem[], b: UserListItem[]) {
  return b.filter(item => !a.map(obj => obj.id).includes(item.id))
}

// 取消全选
function clearAll() {
  leftList.value.forEach((item) => {
    if (!item.disabled)
      item.active = false
  })
  // keyword.value = ''
  rightList.value = []
}

// 是否全选
function isAllSelect() {
  if (leftList.value.length === 0)
    return false
  const selectList = leftList.value.filter((find: any) => find.active)
  const selecteIndex = selectList?.length || 0
  const allSelecteIndex = leftList.value?.length || 0
  return allSelecteIndex === selecteIndex
}
</script>

<template>
  <b-dialog
    :dialog-visible="dialogVisible"
    :show-close="true"
    close-icon="add_member_close"
    close-size="16"
    close-color="#333333"
    :title="title"
    header-padding="12px 16px"
    main-padding="0 16px"
    footer-padding="16px"
    width="720px"
    @on-open="openDialog"
    @on-cancel="cancelDialog"
    @on-confirm="confirmDialog"
  >
    <!-- 用户组名称 -->
    <div v-if="userType === 'group'" class="mb24">
      <div class="mb12">
        <span class="mr4 title-color">用户组名称</span>
        <span class="error-color">*</span>
      </div>

      <a-input
        v-model:value="groupName"
        allow-clear
        class="gray-input"
        :bordered="false"
        placeholder="请输入用户组名称"
      >
        <template #clearIcon>
          <a-tooltip title="清空" effect="dark">
            <img class="delete-icon w14 mt4" src="@/assets/svg/input-close.svg">
          </a-tooltip>
        </template>
      </a-input>
    </div>

    <div class="member-transfer flex-row-start">
      <div class="left">
        <div class="top">
          <a-input
            v-model:value="keyword"
            allow-clear
            class="gray-input"
            style="width: 100%"
            placeholder="输入用户名或昵称"
            @change="handleInput"
          >
            <template #prefix>
              <svg-icon name="search" size="18" color="#333" />
            </template>
            <template #clearIcon>
              <el-tooltip effect="dark" placement="top" :show-after="100" content="清空">
                <img class="delete-icon w16" src="@/assets/svg/input-close.svg">
              </el-tooltip>
            </template>
          </a-input>
          <div class="tools mt14 text12 flex-row-between flex-wrap">
            <p class="num">
              共 {{ leftList.length }} 位{{ tipContent }}
            </p>
            <p v-if="isAllSelect()" class="all" @click="clearAll">
              取消
            </p>
            <p v-else class="all" :class="{ active: isAllSelect(), disabled: leftList.length === 0 }" @click="checkAll">
              全选
            </p>
          </div>
        </div>
        <div v-loading="loading" class="list">
          <b-empty
            v-if="leftList.length === 0"
            desc="暂无数据"
            pt="105px"
            desc-color="#999999"
          />
          <b-member-list
            v-else
            :is-delete="false"
            :is-auth="false"
            :list="leftList"
            :is-bottom-border="false"
            :is-tooltip="true"
            :is-disabled="false"
            wrapper-padding="0px 8px"
            item-padding="6px 8px"
            item-margin-bottom="2px"
            item-border-radius="6px"
            type="memberDialogLeft"
            @check-item="checkLeftItem"
          />
        </div>
      </div>
      <div class="right">
        <div class="tools mt14 mb14 pl16 pr16 flex-row-between text12">
          <p class="num">
            已选择 {{ rightList.length }} 位{{ tipContent }}
          </p>
          <p v-if="rightList?.length" class="all" @click="clearAll">
            清空
          </p>
        </div>
        <div class="list">
          <b-empty
            v-if="rightList.length === 0"
            desc="暂无数据"
            pt="160px"
            desc-color="#999999"
          />
          <b-member-list
            v-else
            :height="372"
            :is-delete="false"
            :is-auth="true"
            :list="rightList"
            :is-bottom-border="false"
            :is-disabled="false"
            :show-auth="hasCreator"
            :is-hidden="!!userType"
            wrapper-padding="0px 8px"
            item-padding="6px 8px"
            item-margin-bottom="2px"
            item-border-radius="6px"
            type="memberDialogRight"
            @check-item="checkRightItem"
          />
        </div>
      </div>
    </div>
  </b-dialog>
</template>

<style lang="scss">
.gray-input {
  .ant-input {
    &::placeholder {
      font-size: 12px;
    }
  }
}
.member-transfer {
  width: 100%;
  height: 405px;
  border-radius: 8px;
  border: 1px solid $color-border-main;

  .left,
  .right {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .left {
    width: 45%;
    position: relative;

    &::after {
      content: '';
      width: 0px;
      height: 100%;
      border-right: 1px solid $color-border-main;
      transform: scaleX(0.5);
      position: absolute;
      right: 0;
      top: 0;
    }

    .top {
      padding: 16px;
      padding-bottom: 14px;
    }
    .list {
      overflow-y: scroll;
    }
  }

  .right {
    width: 55%;
    .list {
      overflow-y: scroll;
    }
  }

  .tools {
    .num {
      font-weight: initial;
      color: $color-minor;
    }

    .all {
      font-weight: initial;
      color: $color-title;
      cursor: pointer;

      &:hover,
      &.active {
        color: $color-primary;
      }
      &.disabled {
        cursor: not-allowed;
      }
    }
  }
}
</style>
