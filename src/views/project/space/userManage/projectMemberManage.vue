<script lang="ts" setup>
import { computed, inject, nextTick, onMounted, reactive, ref } from 'vue'
import type { VxeGridInstance } from 'balala-vxe-table'
import { message } from 'ant-design-vue'
import { getProjectOptions } from '../../intro/config/user'
import router from '@/router'
import { useProjectStore } from '@/stores/modules/project'
import { deepCopy } from '@/utils'
import { getUserPermSelect, userAuth } from '@/utils/auth'
import { SpaceRole } from '@/enum'
import { AUTH_LIST } from '@/config'
import type { CreateProjectUsers, ProjectMemberListItem, UserListItem } from '@/api/interface'
import {
  addProjectMember,
  editProjectMemberRole,
  getMemberListById,
  removeProjectMember,
} from '@/api/project'
import { useUserStore } from '@/stores/modules/user'
import { userWorkItemCount } from '@/api/user'
import { Perm } from '@/enum/permission'
import { usePermission } from '@/hooks/usePermission'
import { testUserWidthProject } from '@/mixins/condition'

const emits = defineEmits(['handleLoading'])
/** STORE */
const projectStore = useProjectStore()
const { userInfo } = useUserStore()
const { checkPerm } = usePermission()

/** EMIT */
// const leaveSpace: Function = inject('leaveSpace') as Function

/** DATA */
const introUserGrid = ref<VxeGridInstance>() // 表格 DOM
const currentMember = ref<ProjectMemberListItem>()
const memberData = ref<ProjectMemberListItem[]>([]) // 项目成员数据
const isCreator = computed(() => {
  // 是否是项目创建者
  const filterList = memberData.value.filter(item => item.roleId === SpaceRole.CREATOR)[0]
  return filterList && filterList.userId === userInfo.id
})
const removeDialog: {
  visible: boolean
  removeItem: {
    title: string
    options: Array<any> // Replace 'any' with the actual type
    selected: any // Replace 'any' with the actual type
    count: number
  }
} = reactive({
  visible: false,
  removeItem: {
    title: '',
    options: [],
    selected: null,
    count: 0,
  },
})

const memberDialog: {
  visible: boolean
} = reactive({
  visible: false,
})

onMounted(() => {
  getMemberlist(true)
})
// 获取模块列表
const allMembers = ref<any[]>([])
async function getMemberlist(isShowLoading: boolean = false) {
  try {
    if (isShowLoading)
      emits('handleLoading', true)

    const id = router.currentRoute.value.params.id as string
    const list = await projectStore.getProjectMemberList(id || '', '', [], false)
    setTimeout(() => {
      emits('handleLoading', false)
      memberData.value = list?.filter((find: any) => find.roleId < 98) || []
      allMembers.value = list || []
      nextTick(() => {
        const $grid = introUserGrid.value
        requestAnimationFrame(async () => {
          if ($grid)
            $grid.reloadData(memberData.value)
        })
      })
    }, 400)
  }
  catch (error) {
    emits('handleLoading', false)
  }
}

// 添加模块
function addMember() {
  memberDialog.visible = true
}

// 添加项目成员弹框 点击确认
function dialogConfirm(arr: UserListItem[]) {
  const list = deepCopy(arr.filter(item => !item.disabled))
  const filterList = list.map((item: UserListItem) => {
    return {
      userId: item.id,
      roleId: item.roleId,
    }
  })

  // 请求添加项目成员接口
  createMember(filterList)
}

// 添加成员
async function createMember(users: CreateProjectUsers[]) {
  try {
    await addProjectMember({
      spaceId: router.currentRoute.value.params.id as string,
      users,
    })
  }
  finally {
    getMemberlist()
  }
}

async function deleteMember(row: any, _rowIndex: any) {
  const spaceId = router.currentRoute.value.params.id as string
  const { userNickname, userId } = row

  // 判断该用户是否有关联流程
  const r = await testUserWidthProject(spaceId, userId, userNickname)
  if (r) {
    return
  }
  let countTotle = 0

  currentMember.value = row
  removeDialog.visible = true
  removeDialog.removeItem.selected = null

  const { data } = await userWorkItemCount({
    userId: row.userId as string,
    spaceId: row.spaceId as string,
  })

  if (data && data.COUNT)
    countTotle = Number(data.COUNT)

  removeDialog.removeItem.count = countTotle

  if (countTotle) {
    const res: any = await getMemberListById({ spaceId: row.spaceId as string })
    if (res?.data?.list?.length) {
      removeDialog.removeItem.options = res.data.list
        .map((item: any) => {
          item.value = item.userId
          item.label = item.userNickname
          item.disabled = false
          return item
        })
        .filter((item: any) => item.value !== row.userId)
    }
    else {
      removeDialog.removeItem.options = []
    }

    removeDialog.removeItem.title = `${row.userNickname} 已关联任务 <span class='minor-color'>${countTotle}</span> ，确认移除吗？`
  }
  else {
    removeDialog.removeItem.title = `确认移除 ${row.userNickname} 成员吗？`
  }
}

// 移除弹框 确认移除
async function confirmRemove() {
  const { removeItem } = removeDialog

  try {
    if (removeItem.count && !removeItem.selected) {
      message.error('请选择转移成员', 2)
      return
    }

    await removeProjectMember({
      spaceId: currentMember.value?.spaceId,
      userId: currentMember.value?.userId,
      targetUserId: removeItem.selected,
    })

    if (removeItem.selected) {
      message.success(
        `成员 ${currentMember.value?.userNickname} 已移除，成功转移 ${removeItem?.count} 条任务`,
        2,
      )
    }
    else {
      message.success(`成员 ${currentMember.value?.userNickname} 已移除`, 2)
    }

    removeDialog.visible = false
    removeDialog.removeItem = {
      title: '',
      options: [],
      selected: null,
      count: 0,
    }
    getMemberlist()
  }
  catch (error) {}
}

// 选择项目成员权限
function chooseItemAuth(row: UserListItem, id: number) {
  row.roleId = Number(id)
  row.popVisible = false
  // 请求修改项目成员权限
  editMemberRole(row)
}

// 修改项目成员权限
async function editMemberRole(row: UserListItem) {
  try {
    await editProjectMemberRole({
      spaceId: router.currentRoute.value.params.id as string,
      userId: row.userId,
      roleId: row.roleId,
    })
  }
  finally {
    message.success(`修改权限成功`, 2)
    getMemberlist()
  }
}

// 离开项目
// function levelSpace() {
//   leaveSpace && leaveSpace()
// }

// 监听滚动条自定义滚动
function handleScroll(e: { scrollLeft: number, scrollTop: number }) {
  introUserGrid.value?.scrollTo(0, e.scrollTop)
}

// 监听表格滚动
const customScrollRef = ref()
function gridScroll(e: { scrollTop: number }) {
  customScrollRef.value?.setScrollTop(e.scrollTop)
}
</script>

<template>
  <div class="h32 intro-member-title flex-row-between mb24">
    <div class="left flex-row-start icon-color pfm text16">
      成员管理
      <span class="minor-color text14 ml8">共 {{ memberData.length }}</span>
    </div>
    <a-button v-if="checkPerm(Perm.AddSpaceMember)" class="add-btn" @click="addMember">
      添加成员
    </a-button>
  </div>
  <div class="table-wrap">
    <vxe-grid
      ref="introUserGrid"
      class="intro-user-grid"
      :class="{ 'no-data': memberData.length === 0 }"
      v-bind="getProjectOptions(checkPerm(Perm.RemoveSpaceMember))"
      :params="{ isGroup: false }"
      :row-class-name="checkPerm(Perm.RemoveSpaceMember) ? 'hasPerm' : ''"
      @scroll="gridScroll"
    >
      <!-- 成员名称头部 -->
      <template #name_header>
        <p class="flex-row-start pl5">
          成员
        </p>
      </template>
      <!-- 成员名称 -->
      <template #name_default="{ row }">
        <div class="text14 icon-color flex-row-start name-box ml4">
          <b-head
            :id="row.userId"
            class="mr8"
            width="28px"
            :name="row.userNickname"
            fs="text13"
            :src="row?.avatar || ''"
          />
          <p class="nickname text14 icon-color mr8 short-name">
            <b-ellipsis :content="row.userNickname" />
          </p>
          <p class="username text13 minor-color short-name">
            <b-ellipsis :content="row.userName" />
          </p>
        </div>
      </template>

      <!-- 权限管理 -->
      <template #auth_default="{ row }">
        <p v-if="row.roleId === SpaceRole.CREATOR" class="text14 icon-color pointer">
          -
        </p>
        <div
          v-else-if="!userAuth(row.roleId)"
          class="w69 h28 br4 auth-btn text12 minor-color flex-row-center disabled ml5"
        >
          <p v-if="row.roleId === SpaceRole.SUPER_MANAGER">
            可管理
          </p>
          <p else>
            {{ AUTH_LIST[row.roleId || SpaceRole.EDITOR]?.title }}
          </p>
        </div>
        <a-popover
          v-else-if="userAuth(row.roleId)"
          v-model:open="row.popVisible"
          :align="{
            offset: [0, -5],
          }"
          overlay-class-name="space-auth-popover"
          placement="bottomRight"
          destroy-tooltip-on-hide
          trigger="click"
        >
          <template #content>
            <div class="auth-list">
              <div class="flex-column-reverse">
                <div
                  v-for="auth of getUserPermSelect(row.roleId)"
                  :key="auth.id"
                  class="row pointer"
                  @click="chooseItemAuth(row, auth.id)"
                >
                  <p>{{ auth.title }}</p>
                  <span>{{ auth.desc }}</span>
                </div>
              </div>
              <div v-if="isCreator" class="row pointer">
                <p>转移创建者</p>
                <span>拥有项目空间所有权限</span>
              </div>
            </div>
          </template>
          <div class="w69 h28 br4 auth-btn text12 icon-color flex-row-center ml5">
            <span v-if="row.roleId === SpaceRole.SUPER_MANAGER">可管理</span>
            <span v-else>{{ AUTH_LIST[row.roleId || SpaceRole.EDITOR]?.title }}</span>
            <svg-icon name="arrow-b-out" size="16" color="#666666" />
          </div>
        </a-popover>
      </template>

      <!-- 工具栏 -->
      <template #tool_default="{ row, _rowIndex }">
        <div v-if="userAuth(row.roleId)" class="tool-box flex-inline">
          <a-tooltip title="移除" effect="dark">
            <svg-icon
              name="filter-close"
              color="#999999"
              size="16"
              @mousedown.left="deleteMember(row, _rowIndex)"
            />
          </a-tooltip>
        </div>
      </template>
      <!-- 空数据模板 -->
      <template #empty>
        <div v-if="memberData.length === 0" class="empty-box flex-row-center">
          <p v-if="checkPerm(Perm.AddSpaceMember)" class="text14 minor-color">
            当前暂无成员，请添加
          </p>
          <p v-else class="text14 minor-color">
            请联系 <span class="icon-color">项目管理员</span> 添加成员
          </p>
        </div>
      </template>
    </vxe-grid>

    <!-- 自定义滚动条 -->
    <el-scrollbar
      ref="customScrollRef"
      max-height="calc(100vh - 199px)"
      :style="{ top: `${183}px` }"
      class="scrollbar"
      always
      @scroll="handleScroll"
    >
      <div class="w6" :style="{ height: `${memberData.length * 48}px` }" />
    </el-scrollbar>
  </div>

  <b-member-dialog
    :dialog-visible="memberDialog.visible"
    :project-current-list="allMembers"
    confirm-btn-text="添加"
    type="projectIntro"
    tip-content="成员"
    @on-confirm="dialogConfirm"
    @on-close="memberDialog.visible = false"
  />

  <!-- 移除成员确认弹框 -->
  <b-dialog
    v-model:dialogVisible="removeDialog.visible"
    :width="removeDialog.removeItem.count > 0 ? '480px' : '408px'"
    :title="removeDialog.removeItem.title"
    title-icon="warning.svg"
    confirm-btn-color="danger"
    @on-confirm="confirmRemove"
  >
    <p v-if="removeDialog.removeItem.count" class="desc text14 icon-color mb16">
      移除成员需要把关联任务转移至指定成员
    </p>
    <BBaseSelect
      v-if="removeDialog.removeItem.count"
      v-model:value="removeDialog.removeItem.selected"
      size="large"
      placeholder="请选择任务转移指定成员"
      :options="removeDialog.removeItem.options"
      :show-head="true"
    />
  </b-dialog>
</template>

<style lang="scss" scoped>
.add-btn {
  width: 81px;
  height: 32px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid $color-border-main;
  color: $color-title;
  padding: 0;
  &:hover {
    border-color: $color-border-main;
    color: $color-title;
  }
}

.intro-user-grid {
  position: relative;
  :deep(.vxe-table) {
    .vxe-table--render-wrapper {
      display: block;
      .vxe-table--main-wrapper {
        .vxe-table--header-wrapper {
          background-color: #fafbfc;
          .vxe-table--header-border-line {
            border-bottom: 0;
            background-image: linear-gradient(#edeef0, $color-border-main),
              linear-gradient(#edeef0, $color-border-main);
          }

          .vxe-header--row {
            .vxe-header--column {
              padding: 1px 0;
              height: 40px;
              background-image: linear-gradient(#edeef0, $color-border-main),
                linear-gradient(#edeef0, $color-border-main);
              &:last-child {
                background-image: linear-gradient(transparent, transparent),
                  linear-gradient(#edeef0, $color-border-main);
              }
            }
          }
          .vxe-cell--title {
            font-size: 14px;
            color: $color-main;
          }
        }
        .vxe-table--body-wrapper {
          .vxe-table--body {
            .vxe-body--row {
              .vxe-body--column {
                position: relative;
                background-image: linear-gradient(#edeef0, $color-border-main),
                  linear-gradient(#edeef0, $color-border-main);
                &:last-child {
                  background-image: linear-gradient(transparent, transparent),
                    linear-gradient(#f2f3f5, #f2f3f5);
                }
              }
              &.row--hover {
                background: $color-default-hover;
                &.hasPerm {
                  .drag-btn {
                    opacity: 1;
                    cursor: move;
                  }
                }
              }
            }
          }
          &::-webkit-scrollbar {
            // 整体样式
            background-color: transparent;
            width: 0px;
            height: 0px;
            border: 0px solid transparent !important;
          }
        }

        .auth-btn {
          background: $color-input;
          border: 1px solid $color-input;
          cursor: pointer;
          transition: 0.3s all;
          &:hover {
            background: #fff;
            border-color: $color-border-main;
          }
          &.disabled {
            cursor: not-allowed;
          }
        }

        .tool-box {
          width: 20px;
          height: 20px;
          border-radius: 2px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          &:hover {
            background: $color-bg-hover;
          }
          &.del-hide {
            opacity: 0;
            pointer-events: none;
          }
        }
      }
    }
    .vxe-table--border-line {
      border: 0;
    }
  }
  :deep(.vxe-grid--bottom-wrapper) {
    position: absolute;
    right: 0;
    top: 40px;
  }
  &.no-data {
    :deep(.vxe-table) {
      .vxe-table--render-wrapper {
        display: none;
      }
      .vxe-table--empty-placeholder {
        height: 215px !important;
        position: relative;
        .vxe-table--empty-content {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          .empty-box {
            height: 100%;
          }
        }
      }
    }
  }
}

.scrollbar {
  position: absolute;
  right: 24px;
  top: 119px;
  bottom: 0;
  :deep(.el-scrollbar__bar.is-vertical) {
    right: 0px;
  }
}

.table-wrap {
  height: calc(100vh - 164px);
  .scrollbar {
    opacity: 0;
  }
  &:hover {
    .scrollbar {
      opacity: 1;
    }
  }
}
</style>

<style lang="scss">
.space-auth-popover {
  .ant-popover-inner {
    padding: 0;
  }
}
</style>
