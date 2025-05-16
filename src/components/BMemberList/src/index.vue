<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { UserListItem } from '@/api/interface'
import { getUserPermSelect } from '@/utils/auth'
import { SpaceRole } from '@/enum'
import { AUTH_LIST } from '@/config'
import { useProjectStore } from '@/stores/modules/project'
import { userWorkItemCount } from '@/api/user'
import { useUserStore } from '@/stores/modules/user'
import { getMemberListById, projectTransferOwnership } from '@/api/project'

const props = withDefaults(defineProps<Props>(), {
  // 类型 => 指父级组件标识
  type: '',
  // 列表数据
  list: () => [],
  // 列表高度
  height: 310,
  // item 内边距 控制高度
  itemPadding: '10px 8px',
  wrapperPadding: '0px 12px',
  // 下边距
  itemMarginBottom: '0px',
  // 圆角
  itemBorderRadius: '0px',
  // 是否禁用多选框
  isDisabled: true,
  // 是否显示 item 下边框
  isBottomBorder: true,
  // 是否显示权限选择控件
  isAuth: true,
  // 是否显示删除按钮
  isDelete: true,
  // 是否隐藏自己的删除
  isHideDel: false,
  // 是否显示查看
  isRead: false,
  // 是否显示 tooltip
  isTooltip: false,
  // 右侧权限下拉框是否隐藏
  isHidden: false,
})

const emits = defineEmits([
  'chooseItem',
  'deleteItem',
  'checkGroup',
  'checkItem',
  'editItemRole',
  'updateOwner',
])

const { userInfo } = useUserStore()

interface Props {
  type?: string
  list: UserListItem[]
  height?: number
  itemPadding?: string
  wrapperPadding?: string
  itemMarginBottom?: string
  itemBorderRadius?: string
  isDisabled?: boolean
  isBottomBorder?: boolean
  isAuth?: boolean
  isDelete?: boolean
  isTooltip?: boolean
  isHideDel?: boolean
  isRead?: boolean
  // 是否强制显示可管理
  showAuth?: boolean
  isHidden?: boolean
}

const projectStore = useProjectStore()
const memberAllList = computed(() => projectStore.memberList)
// 移除成员确认框
const removeMemberDialog = ref<boolean>(false)
const transferDialog = ref<boolean>(false)
// 临时存储当前选择条
const currentItem = ref<UserListItem>()
const checked = ref<boolean>(false)

const removeItem = reactive<any>({
  title: '',
  options: [],
  selected: null,
  count: 0,
})

// 选择权限
function chooseItemAuth(item: UserListItem, id: number) {
  item.roleId = Number(id)
  emits('editItemRole', item)
}

// 选择当前行
function chooseItem(item: UserListItem) {
  if (props.type === 'searchInput') {
    item.active = !item.active
    memberAllList.value.map((m: UserListItem) => {
      if (item.id === m.id)
        m.active = !m.active
    })
    emits('chooseItem', memberAllList.value)
  }
}

// 删除当前行
async function deleteItem(row: UserListItem) {
  if (props.type === 'b-member') {
    // 项目创建 - 删除人员 - 无需二次确认
    emits('deleteItem', row)
    return
  }

  currentItem.value = row
  removeMemberDialog.value = true
  removeItem.selected = null

  const { data } = await userWorkItemCount({
    userId: row.userId as string,
    spaceId: row.spaceId as string,
  })

  let countTotle = 0

  if (data && data.COUNT)
    countTotle = Number(data.COUNT)

  removeItem.count = countTotle

  if (countTotle) {
    const res: any = await getMemberListById({ spaceId: row.spaceId as string })
    if (res?.data?.list?.length) {
      removeItem.options = res.data.list
        .map((item: any) => {
          item.value = item.userId
          item.label = item.userNickname
          item.disabled = false
          return item
        })
        .filter((item: any) => item.value !== row.userId)
    }
    else {
      removeItem.options = []
    }

    removeItem.title = `${row.userNickname} 已关联任务 <span class='minor-color'>${countTotle}</span> ，确认移除吗？`
  }
  else {
    removeItem.title = `确认移除 ${row.userNickname} 成员吗？`
  }
}
// 确认删除
function confirmDelete() {
  emits('deleteItem', {
    ...currentItem.value,
    targetUserId: removeItem.selected,
    count: removeItem.count,
  })
  removeMemberDialog.value = false
}

// 勾选单条数据
function checkItem(value: boolean, item: UserListItem) {
  if (props.type === 'memberDialogLeft') {
    item.active = value
    emits('checkItem', item)
  }
  if (props.type === 'memberDialogRight')
    emits('checkItem', item)
}

const hasCreator = computed(() => {
  const filterList = props.list.filter(item => item.roleId === SpaceRole.CREATOR)[0]
  return filterList && filterList.userId === userInfo.id
})

// 转移项目创建者
function transferOwnership(item: UserListItem) {
  transferDialog.value = true
  currentItem.value = item
}

// 确认 - 转移项目创建者
function confirmTransfer() {
  if (!checked.value) {
    message.error('请确认已知悉转移创建者的风险')
    return
  }
  projectTransferOwnership(currentItem.value?.spaceId || '', currentItem.value?.userId || '').then(
    () => {
      emits('updateOwner')
      message.success('项目创建者已转移')
      currentItem.value = {} as any
      transferDialog.value = false
    },
  )
}
</script>

<template>
  <div :style="{ padding: wrapperPadding }">
    <div
      v-for="item in list"
      :key="item.id"
      class="item flex-row-start"
      :class="{
        hideBorder: !isBottomBorder,
        active: type === 'searchInput' && item.active,
        disabled: isDisabled,
      }"
      :style="{
        padding: itemPadding,
        marginBottom: itemMarginBottom,
        borderRadius: itemBorderRadius,
      }"
      @click="chooseItem(item)"
    >
      <!-- !item.disabled || !isTooltip -->
      <el-tooltip
        class="box-item"
        effect="dark"
        :teleported="false"
        :disabled="true"
        content="成员已添加"
        placement="top"
        :show-after="200"
      >
        <div class="info flex-one flex-row-start">
          <el-checkbox
            v-model="item.active"
            class="full-100 flex-row-start"
            :label="item"
            :disabled="isDisabled || item.disabled"
            @change="(value: boolean) => checkItem(value, item)"
          >
            <svg-icon
              v-if="type === 'searchInput'"
              name="gou"
              size="16"
              color="#1D74F5"
              class="mr12 ml4"
              :style="{ opacity: item.active ? 1 : 0 }"
            />
            <b-head
              :id="item.userId"
              class="mr4"
              width="28px"
              :name="item.userNickname"
              fs="text12"
              :role-id="item.roleId"
              :src="item?.avatar || ''"
            />
            <p class="nickname text12 mr4 short-name">
              <b-ellipsis :fs="12" :content="item.userNickname" />
            </p>
            <!-- <p class="username text13 short-name">
              <b-ellipsis :content="item.userName" />
            </p> -->
          </el-checkbox>
        </div>
      </el-tooltip>
      <div v-if="item.roleId !== SpaceRole.CREATOR && !isHidden" class="tool flex-row-center">
        <a-dropdown
          v-if="isAuth && (item.userId !== userInfo.id || item.roleId !== SpaceRole.MANAGER)"
          :trigger="['click']"
          :align="{ offset: [0, 8] }"
          placement="bottomRight"
          :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
        >
          <div class="auth-btn flex-row-center">
            {{ AUTH_LIST[item.roleId || SpaceRole.EDITOR].title
            }}<svg-icon name="arrow-b" size="16" />
          </div>
          <template #overlay>
            <div class="auth-list">
              <div class="flex-column-reverse">
                <div
                  v-for="auth of getUserPermSelect(item.roleId as number)"
                  :key="auth.id"
                  class="row pointer"
                  @click="chooseItemAuth(item, auth.id)"
                >
                  <p>{{ auth.title }}</p>
                  <span>{{ auth.desc }}</span>
                </div>
              </div>
              <div v-if="hasCreator" class="row pointer" @click="transferOwnership(item)">
                <p>转移创建者</p>
                <span>拥有项目空间所有权限</span>
              </div>
            </div>
          </template>
        </a-dropdown>
        <div v-else-if="isRead" class="auth-text auth-btn text12 icon-color mr5 flex-row-center">
          {{ AUTH_LIST[item.roleId || SpaceRole.MANAGER].title }}
        </div>
        <div
          v-if="isDelete"
          class="delete ml4"
          :class="{
            'del-hide':
              (userInfo.id === item.userId && isHideDel) || item.roleId === SpaceRole.CREATOR,
          }"
          @click="deleteItem(item)"
        >
          <a-tooltip title="移除" placement="top">
            <svg-icon name="close" size="20" />
          </a-tooltip>
        </div>
      </div>
    </div>
  </div>

  <!-- 移除成员确认弹框 -->
  <b-dialog
    v-model:dialogVisible="removeMemberDialog"
    :width="removeItem.count > 0 ? '480px' : '408px'"
    :title="removeItem.title"
    title-icon="warning.svg"
    confirm-btn-color="danger"
    @on-confirm="confirmDelete"
  >
    <p v-if="removeItem.count" class="desc text12 icon-color mb16">
      移除成员需要把关联任务转移至指定成员
    </p>
    <BBaseSelect
      v-if="removeItem.count"
      v-model:value="removeItem.selected"
      size="large"
      placeholder="请选择任务转移指定成员"
      :options="removeItem.options"
      :show-head="true"
    />
  </b-dialog>
  <!-- 转移项目空间创建者 -->
  <b-dialog
    v-model:dialogVisible="transferDialog"
    width="480px"
    title="是否确认转移项目空间创建者？"
    title-icon="orange.svg"
    @on-confirm="confirmTransfer"
    @on-cancel="checked = false"
  >
    <p class="desc text12 icon-color mb16">
      1、该项目空间创建者转移给 {{ currentItem?.userNickname }}
      <span class="user-name minor-color"> ({{ currentItem?.userName }}) </span>
      ，将获得创建者权限。<br>
      2、您自身权限将自动变更为“可管理”。
    </p>
    <div class="agree text12 minor-color mt4 el-checkobx-label-color">
      <el-checkbox v-model="checked" size="large">
        我已知悉转移创建者的风险
      </el-checkbox>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.item {
  padding: 10px 8px;
  align-self: stretch;
  transition: all 0.2s;
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    width: 100%;
    height: 1px;
    background: $color-input-hover;
    position: absolute;
    left: 0;
    bottom: 0;
  }

  .info {
    :deep(.el-checkbox) {
      height: auto;

      .el-checkbox__inner {
        width: 14px;
        height: 14px;
        border-radius: 2px;
      }

      // &.is-disabled {
      //   cursor: pointer;
      //   .el-checkbox__input.is-disabled {
      //     display: none;
      //   }
      //   .el-checkbox__label {
      //     padding-left: 0;
      //     cursor: pointer;
      //   }
      // }
    }

    :deep(.el-checkbox__label) {
      flex: 1;
      display: flex !important;
      align-items: center;
      justify-content: start;
    }
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $color-warning;
    color: #fff;
    font-size: 13px;
  }

  .nickname {
    color: $color-title;
    font-weight: initial;
    line-height: 16px;
  }

  .username {
    color: $color-minor;
    font-weight: initial;
    line-height: 16px;
  }

  .auth-btn {
    min-width: 60px;
    height: 24px;
    border-radius: 4px;
    padding: 4px 4px;
    background: $color-input;
    font-size: 12px;
    color: $color-icon;
    cursor: pointer;
    border: 1px solid $color-input;
    flex-shrink: 0;
    align-items: center;
    margin-left: 2px;
  }

  .delete {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: $color-bg-hover;
    }
  }

  &:last-child {
    &::after {
      display: none;
    }
  }

  &:hover {
    background: rgba($color: #000000, $alpha: 0.04);

    .auth-btn {
      background: #ffffff;
      border-color: $color-border-main;
    }
  }

  // 隐藏下边框
  &.hideBorder {
    &::after {
      display: none;
    }
  }

  &.disabled {
    :deep(.el-checkbox) {
      .el-checkbox__input {
        display: none;
      }

      .el-checkbox__label {
        padding-left: 0;
        cursor: pointer;
      }
    }
  }
}

.del-hide {
  opacity: 0;
  pointer-events: none;
}

.short-name {
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 42px;
}

.item .auth-text {
  background: #f7f8fa;
  color: #999;
}

.user-name {
  color: #999999;
}
</style>
