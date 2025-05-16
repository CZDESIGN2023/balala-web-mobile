<script lang="ts" setup>
import { computed, h, inject, nextTick, onMounted, reactive, ref } from 'vue'
import type { VxeGridInstance } from 'balala-vxe-table'
import { message } from 'ant-design-vue'
import { getMemberOptions } from '../config/user.ts'
import BDropDown from '@/components/BDropdown/index.vue'
import moduleHead from '@/views/project/space/components/head.vue'
import router from '@/router'
import { deepCopy, getCurrentWeek } from '@/utils'
import type { CreateProjectUsers, ProjectMemberListItem, UserListItem } from '@/api/interface'
import {
  addProjectMember,
  editProjectMemberRole,
  getMemberListById,
  projectTransferOwnership,
  removeProjectMember,
  spaceManagerAdd,
  spaceManagerRemove,
} from '@/api/project'
import { usePermission } from '@/hooks/usePermission'
import { Perm } from '@/enum/permission'
import { SpaceRole } from '@/enum'
import { EmitEvent } from '@/enum/event'
import { useEmitter } from '@/hooks/useEmitter'
import type { UserItem } from '@/api/project/intro/types'
import { useUser } from '@/hooks/useUser'
import { useProjectStore } from '@/stores/modules/project'
import type { QueryCondition } from '@/components/BSearchFilter/interface'
import { archivedTaskStatus } from '@/enum/TaskStatus'
import { getTodayTime, testUserWidthProject } from '@/mixins/condition'
import { Msgbox } from '@/utils/msgbox'
import { userWorkItemCount } from '@/api/user'
import { compareUserNickName } from '@/utils/array'

const emits = defineEmits(['handleLoading'])
const { emitUpdate } = useEmitter<string>(EmitEvent.UPDATE_USER_LIST)
const { getUserList } = useUser()
const projectStore = useProjectStore()

const getInfo: Function = inject('getInfo') as Function
const { checkPerm } = usePermission()

/** INJECT */
const handleChangeTab: Function = inject('handleChangeTab') as Function

/** DATA */
const introUserGrid = ref<VxeGridInstance>() // 表格 DOM
const currentItem = ref<any>()
const projectList = ref<any[]>([]) // 项目成员数据
const allMembers = ref<any[]>([])
const currentMember = ref<ProjectMemberListItem>()
const searchKeyword = ref('')

const removeSuperManagerDialog: {
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

// 是否为0
const isZero = computed(() => {
  return (value: any) => {
    if (Number(value) === 0 /* && props.type === 'main' */)
      return 'minor-color'
  }
})

const afterProjectList = computed(() => {
  if (!searchKeyword.value) {
    return projectList.value
  }
  return projectList.value.filter((item) => {
    return item.userNickname.includes(searchKeyword.value) || item.userPinyin.includes(searchKeyword.value) || item.userName.includes(searchKeyword.value)
  })
})

onMounted(() => {
  getDataList(true)
})

// 获取成员列表
async function getDataList(isShowLoading: boolean = false) {
  try {
    if (isShowLoading)
      emits('handleLoading', true)

    const id = router.currentRoute.value.params.id as string
    const data = await getUserList(id, true, '', '') as UserItem[]
    emits('handleLoading', false)
    // 排序：roleId + userNickname
    projectList.value = (data || []).sort((a, b) => {
      const roleOrder = { [SpaceRole.CREATOR]: 0, [SpaceRole.SUPER_MANAGER]: 1, [SpaceRole.MANAGER]: 2, [SpaceRole.EDITOR]: 3, [SpaceRole.WATCHER]: 4 }
      if (roleOrder[a.roleId as SpaceRole] !== roleOrder[b.roleId as SpaceRole]) {
        return roleOrder[a.roleId as SpaceRole] - roleOrder[b.roleId as SpaceRole]
      }
      return compareUserNickName(a.userNickname || '', b.userNickname || '')
    })
    nextTick(() => {
      getInfo && getInfo(false)
    })
    allMembers.value = (await projectStore.getProjectMemberList(id || '', '', [], false)) || []
  }
  catch (error) {
    console.log(error)
    emits('handleLoading', false)
  }
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
  addMember(filterList)
}

// 添加成员
async function addMember(users: CreateProjectUsers[]) {
  try {
    await addProjectMember({
      spaceId: router.currentRoute.value.params.id as string,
      users,
    })
    message.success('成员添加成功', 3)
    emitUpdate('updateUserList')
  }
  finally {
    getDataList()
  }
}

// 添加管理员
async function addManagerMember(row: any) {
  await Msgbox.warning.m({ title: '是否确认设置项目管理员？', width: 480, content: [h('div', { style: { marginTop: '6px' } }, [
    h('p', [
      `1.${row.userNickname}`,
      h('span', { style: { color: '#999999' } }, `（${row.userName}）`),
      '，将获得管理项目空间的权限。',
    ]),
    h('p', '2.设置后，该成员可对项目空间中，更多功能进行配置。'),
  ])] })
  try {
    await spaceManagerAdd(router.currentRoute.value.params.id as string, [row.userId])
    message.success('项目管理员添加成功', 3)
  }
  finally {
    getDataList()
    emitUpdate('updateUserList')
  }
}

// 删除成员
async function deleteMember(row: any) {
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
  try {
    await spaceManagerRemove(currentItem.value?.spaceId, [currentItem.value?.userId])
    emitUpdate('updateUserList')
    // message.success(`项目管理员 ${currentItem.value?.userNickname} 已移除`, 2)
    message.success({ content: '项目管理员撤销成功' }, 2)
    removeSuperManagerDialog.visible = false
    removeSuperManagerDialog.removeItem = {
      title: '',
      options: [],
      selected: null,
      count: 0,
    }
    getDataList()
  }
  catch (error) {}
}

// 移除弹框 确认移除
async function confirmRemoveUser() {
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
    emitUpdate('updateUserList')
    getDataList()
  }
  catch (error) {}
}

// 转移创建者
const transferDialog = ref<boolean>(false)
const checked = ref<boolean>(false)
function onTransfer(row: any) {
  currentItem.value = row
  transferDialog.value = true
}

// 确认 - 转移项目创建者
async function confirmTransfer() {
  if (!checked.value) {
    message.error('请确认已知悉转移创建者的风险')
    return
  }
  await projectTransferOwnership(
    currentItem.value?.spaceId || '',
    currentItem.value?.userId || '',
  ).then(() => {
    message.success('项目创建者已转移')
    currentItem.value = {} as any
    transferDialog.value = false
    getDataList()
    getInfo && getInfo()
    emitUpdate('updateUserList')
  })
}

// 监听滚动条自定义滚动
function handleScroll(e: { scrollLeft: number, scrollTop: number }) {
  introUserGrid.value?.scrollTo(0, e.scrollTop)
}

// 监听表格滚动
const customScrollRef = ref()
function gridScroll(e: { scrollTop: number }) {
  customScrollRef.value?.setScrollTop(e.scrollTop)
}

// 跳转
function goTable(type: string, versionId: string | number) {
  const expiredCondition: QueryCondition = {
    field: 'plan_time',
    operator: 'LT',
    values: getTodayTime(),
    spaceId: '0',
  }

  const currentWeek = getCurrentWeek() // 当前周

  const planTimeCondition: QueryCondition = {
    field: 'plan_time',
    operator: 'BETWEEN',
    values: [currentWeek.start, currentWeek.end],
    spaceId: '0',
  }

  const processingCondition: QueryCondition = {
    field: 'work_item_status',
    operator: 'NOT_IN',
    values: archivedTaskStatus,
    spaceId: '0',
  }

  let field = ''
  switch (type) {
    case 'processing':
    case 'weekProcessing':
    case 'expired':
      field = 'node_directors'
      break
    case 'total':
      field = 'participators'
      break
  }
  const userCondition: QueryCondition = {
    field,
    operator: 'IN',
    values: [String(versionId)],
    spaceId: '0',
  }

  const conditions: QueryCondition[] = [userCondition]

  switch (type) {
    case 'expired':
      conditions.push(expiredCondition, processingCondition)
      break
    case 'weekProcessing':
      conditions.push(planTimeCondition, processingCondition)
      break
    case 'processing':
      conditions.push(processingCondition)
      break
    case 'total':
      break
  }

  handleChangeTab
  && handleChangeTab({
    conditions,
    conjunction: 'AND',
    groups: [],
  })
}

// 可查看、可管理、可编辑 的权限变更
function onPermChange(role: SpaceRole, row: any) {
  editProjectMemberRole({ spaceId: row.spaceId, userId: row.userId, roleId: role })
    .then(() => {
      message.success('权限变更成功')
      row.roleId = role
      emitUpdate('updateUserList')
    })
}

// 转移创建者、设为管理员、移除成员
function onRoleChange(type: string, row: any) {
  switch (type) {
    case 'transferCreator':
      onTransfer(row)
      break
    case 'addAdmin':
      addManagerMember(row)
      break
    case 'removeAdmin':
      currentItem.value = row
      removeSuperManagerDialog.visible = true
      break
    case 'removeUser':
      deleteMember(row)
      break
  }
}

const tableHeight = computed(() => {
  return window.innerHeight - 150
})
</script>

<template>
  <!-- <div class="h32 intro-member-title flex-row-between mb24">
    <div class="left flex-row-start text-gray-800 pfm text16">
      成员管理
      <span class="minor-color text14 ml8">共 {{ projectList.length }}</span>
    </div>
    <a-button v-if="checkPerm(Perm.AddSpaceSuperManager)" class="add-btn" @click="memberDialog.visible = true">
      添加成员
    </a-button>
  </div> -->

  <module-head
    title="成员管理"
    :total="projectList.length"
  >
    <template #leftTool>
      <button
        v-if="checkPerm(Perm.AddSpaceMember)"
        class="add-btn flex-row-center text14 w71 h32 br4 pl8 pr8 gap4 pointer ml16"
        @click="memberDialog.visible = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14.000000953674316" height="14.000000953674316" viewBox="0 0 14.000000953674316 14.000000953674316"><defs><clipPath id="master_svg0_10996_18376/10961_23417"><rect x="0" y="0" width="14.000000953674316" height="14.000000953674316" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_10996_18376/10961_23417)"><g><path d="M7,1.75C6.67783,1.75,6.41667,2.011167,6.41667,2.333333L6.41667,6.41667L2.333333,6.41667C2.011167,6.41667,1.75,6.67783,1.75,7C1.75,7.32217,2.011167,7.58333,2.333333,7.58333L6.41667,7.58333L6.41667,11.66667C6.41667,11.9888,6.67783,12.25,7,12.25C7.32217,12.25,7.58333,11.9888,7.58333,11.66667L7.58333,7.58333L11.66667,7.58333C11.9888,7.58333,12.25,7.32217,12.25,7C12.25,6.67783,11.9888,6.41667,11.66667,6.41667L7.58333,6.41667L7.58333,2.333333C7.58333,2.011167,7.32217,1.75,7,1.75Z" fill-rule="evenodd" fill="#1D74F5" fill-opacity="1" /></g></g></svg>添加
      </button>
      <BTableSearch class="ml4" placeholder="请输入成员昵称" @change="searchKeyword = $event" />
    </template>
  </module-head>
  <div class="table-wrap">
    <BTable
      ref="introUserGrid"
      v-bind="getMemberOptions(checkPerm(Perm.ModifyUserPermission))"
      :data="afterProjectList"
      :height="tableHeight"
      :row-class-name="checkPerm(Perm.ModifyUserPermission) ? 'hasPerm' : ''"
      :class="{ 'no-data': projectList.length === 0 }"
      class="intro-user-grid"
      @scroll="gridScroll"
    >
      <!-- 成员名称 -->
      <template #name="{ row }">
        <div class="text14 text-gray-800 flex-row-start name-box ml4">
          <b-head
            :id="row.userId"
            class="mr8"
            width="28px"
            :name="row.userNickname"
            :role-id="row.roleId"
            fs="text13"
            :src="row?.avatar || ''"
          />
          <p class="nickname text14 text-gray-800 mr8 short-name">
            <b-ellipsis :content="row.userNickname" />
          </p>
          <p class="username text13 minor-color short-name">
            <b-ellipsis :content="row.userName" />
          </p>
        </div>
      </template>

      <!-- 逾期任务 -->
      <template #stats-expired="{ row }">
        <p
          class="text14 icon-color pointer num-box hover:text-primary"
          :class="isZero(row?.stats.expired || 0)"
          @click="goTable('expired', row.userId)"
        >
          {{ row?.stats.expired || 0 }}
        </p>
      </template>

      <!-- 本周待办 -->
      <template #stats-weekProcessing="{ row }">
        <p
          class="text14 icon-color pointer num-box hover:text-primary"
          :class="isZero(row?.stats.weekProcessing || 0)"
          @click="goTable('weekProcessing', row.userId)"
        >
          {{ row?.stats.weekProcessing || 0 }}
        </p>
      </template>

      <!-- 待办任务 -->
      <template #stats-processing="{ row }">
        <p
          class="text14 icon-color pointer num-box hover:text-primary"
          :class="isZero(row?.stats.processing || 0)"
          @click="goTable('processing', row.userId)"
        >
          {{ row?.stats.processing || 0 }}
        </p>
      </template>

      <!-- 任务总数 -->
      <template #stats-total="{ row }">
        <p
          class="text14 icon-color pointer num-box hover:text-primary"
          :class="isZero(row?.stats.total || 0)"
          @click="goTable('total', row.userId)"
        >
          {{ row?.stats.total || 0 }}
        </p>
      </template>

      <!-- 成员进度 -->
      <template #rate="{ row }">
        <rate-circle :rate="row.stats.completeRate" />
      </template>

      <!-- 权限 -->
      <template #perm="{ row }">
        <template v-if="[SpaceRole.CREATOR, SpaceRole.SUPER_MANAGER].includes(row.roleId)">
          <div class="flex justify-center cursor-not-allowed">
            <div class="text12 text-gray-500 bg-gray-input w61 text-center rounded">
              {{ row.roleId === SpaceRole.CREATOR ? '创建者' : '管理员' }}
            </div>
          </div>
        </template>
        <BDropdown
          v-else
          :model-value="row.roleId"
          :options="[
            { label: '可查看', value: SpaceRole.WATCHER, description: '拥有查看/执行任务的权限' },
            { label: '可编辑', value: SpaceRole.EDITOR, description: '拥有新建/编辑任务的权限' },
            { label: '可管理', value: SpaceRole.MANAGER, description: '拥有管理任务的权限' },
          ]"
          :min-width="61"
          :dropdown-width="204"
          trigger="click"
          :disabled="!checkPerm(Perm.ModifyUserPermission)"
          @update:model-value="onPermChange($event, row)"
        />
      </template>

      <!-- 工具栏 -->
      <template #tool="{ row }">
        <BDropdown
          :options="[
            { label: '移除成员', value: 'removeUser', description: '将该成员移除当前项目', show: [SpaceRole.EDITOR, SpaceRole.MANAGER, SpaceRole.WATCHER].includes(row.roleId) && checkPerm(Perm.RemoveSpaceMember) },
            { label: '转移创建者', value: 'transferCreator', description: '拥有项目空间所有权限', show: [SpaceRole.SUPER_MANAGER].includes(row.roleId) && checkPerm(Perm.DeleteSpace) },
            { label: '设为项目管理员', value: 'addAdmin', description: '拥有管理项目空间的权限', show: [SpaceRole.EDITOR, SpaceRole.WATCHER, SpaceRole.MANAGER].includes(row.roleId) && checkPerm(Perm.DeleteSpace) },
            { label: '撤销项目管理员', value: 'removeAdmin', description: '移除后恢复成员本身权限', show: [SpaceRole.SUPER_MANAGER].includes(row.roleId) && checkPerm(Perm.DeleteSpace) },
          ]"
          :dropdown-width="204"
          more-type
          class="align-middle"
          @select="onRoleChange($event, row)"
        />
      </template>

      <!-- 空数据模板 -->
      <template #empty>
        <b-empty
          img-name="no-data-search.svg"
          :is-svg="false"
          icon-mb="5px"
          pt="227px"
          desc="暂无数据"
        />
      </template>
    </BTable>

    <!-- 自定义滚动条 -->
    <!-- <el-scrollbar
      ref="customScrollRef"
      max-height="calc(100vh - 199px)"
      :style="{ top: `${183}px` }"
      class="scrollbar"
      always
      @scroll="handleScroll"
    >
      <div class="w6" :style="{ height: `${projectList.length * 48}px` }" />
    </el-scrollbar> -->
  </div>
  <!-- <b-member-dialog
    :dialog-visible="memberDialog.visible"
    :project-current-list="allMembers"
    confirm-btn-text="添加"
    title="添加成员"
    type="projectIntro"
    tip-content="成员"
    @on-confirm="dialogConfirm"
    @on-close="memberDialog.visible = false"
  /> -->

  <b-member-dialog
    :dialog-visible="memberDialog.visible"
    :project-current-list="allMembers"
    title="添加成员"
    confirm-btn-text="添加"
    type="projectIntro"
    tip-content="成员"
    @on-confirm="dialogConfirm"
    @on-close="memberDialog.visible = false"
  />

  <!-- 移除管理员确认弹框 -->
  <b-dialog
    v-model:dialogVisible="removeSuperManagerDialog.visible"
    width="480"
    title="是否确认移除项目管理员"
    title-icon="orange.svg"
    title-icon-color="danger"
    @on-confirm="confirmRemove"
  >
    <p class="desc text14 text-gray-800 h38">
      1、{{ currentItem?.userNickname }}<span class="minor-color">（{{ currentItem?.userName }}）</span>，将移除项目管理相关的权限。<br>
      2、移除后，该成员的权限将回到成为项目管理员之前的权限。
    </p>
  </b-dialog>

  <!-- 移除成员确认弹框 -->
  <b-dialog
    v-model:dialogVisible="removeDialog.visible"
    :width="removeDialog.removeItem.count > 0 ? '480px' : '408px'"
    :title="removeDialog.removeItem.title"
    title-icon="orange.svg"
    title-icon-color="danger"
    confirm-btn-color="danger"
    @on-confirm="confirmRemoveUser"
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

  <!-- 转移项目空间创建者 -->
  <b-dialog
    v-model:dialogVisible="transferDialog"
    width="480px"
    title="是否确认转移项目空间创建者？"
    title-icon="orange.svg"
    @on-confirm="confirmTransfer"
    @on-cancel="checked = false"
  >
    <p class="desc text14 text-gray-800 mb16">
      1、该项目空间创建者转移给 {{ currentItem?.userNickname }}<span class="minor-color">（{{ currentItem?.userName }})）</span>，将获得创建者权限。<br>
      2、您自身权限将自动变更为“可管理”。
    </p>
    <div class="text14 minor-color mt4 el-checkobx-label-color">
      <el-checkbox v-model="checked" size="large">
        我已知悉转移创建者的风险
      </el-checkbox>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.add-btn {
  background: #ffffff;
  border: 0;
  --uno: text-primary;
  &:hover,
  &.active {
    background: $color-default-hover;
  }
  &:active {
    background: $color-default-active;
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
                .vxe-cell {
                  overflow: inherit;
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

.operation-popover {
  :global(.operation-popover .ant-popover-content) {
    width: 204px;
  }

  :global(.operation-popover .ant-popover-title) {
    margin-bottom: 0;
  }

  :global(.operation-popover .ant-popover-inner) {
    padding: 8px;
  }

  .operation-item {
    border-radius: 4px;
    padding: 8px;
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
}

.more-icon {
  border-radius: 4px;
  &:hover {
    background: rgba(0, 0, 0, 0.04);
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
