<script lang="ts" setup>
import { computed, getCurrentInstance, h, nextTick, onMounted, onUnmounted, provide, reactive, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { TaskDialogInfoParams } from '../types/task'
import TaskHeaderInfo from './components/task-edit-header-info.vue'
import TaskHeaderTool from './components/task-edit-header-tool.vue'
import taskEditForm from './components/task-edit-form.vue'
import TaskComment from './components/task-comment.vue'
import TaskOperation from './components/task-operation.vue'
import TaskFooter from './components/task-edit-footer.vue'
import TaskEditNode from './components/task-edit-node.vue'
import useEvents from './task-events'
import { getCurrentNode } from './utils/task'
import useTaskCoolaborate from './hooks/useTaskCollaborate'
import { getWorkItemDetail, taskCommentAdd } from '@/api/project'
import { TaskStatusKey } from '@/enum/TaskStatus'
import { isEmptyObject } from '@/utils'
import type {
  CommentItem,
  WorkDetailData,
  WorkDetailNode,
  WorkTaskInfo,
} from '@/api/interface'
import { useUserStore } from '@/stores/modules/user'
import { useProjectStore } from '@/stores/modules/project'
import type { NodeProp, Workflow } from '@/views/flowNode/types'
import NodePanel from '@/views/flowNode/components/nodePanel.vue'
import { NodeStatus } from '@/enum/NodeStatus'
import { useFormPermission } from '@/hooks/useTaskPermission'
import useFlowTemplate from '@/hooks/useFlowTemplate'
import type { Node, TemplateConfNode, WorkFlowTemplateData } from '@/api/project/types'

const props = withDefaults(defineProps<Props>(), {
  openType: 'detail',
  taskTabKey: 'base',
  taskParams: () => ({}),
})

const emits = defineEmits(['onCloseDrawer'])

/** PROPS */
interface Props {
  openType: string
  taskTabKey?: string
  taskParams: TaskDialogInfoParams
}
const { proxy } = getCurrentInstance() as any

/** STORE */
const { currentRoute } = useRouter()
const { userInfo } = useUserStore()
const projectStore = useProjectStore()
const { currentNode: currentTemplate, flowTemplateInfo: workFlow, initFlowTemplate, setCurrentTemplate } = useFlowTemplate()
const { perms: taskPermissions, isArchived, btns: taskBtnPermissions, initFormPermission } = useFormPermission()

const commentType = ref<string>('add')
provide('isArchived', isArchived)
provide('taskPermissions', taskPermissions)
provide('taskBtnPermissions', taskBtnPermissions)

/** DATA */
const taskHeaderInfoRef = ref()
const taskHeaderToolRef = ref()
const taskEditFormRef = ref()
const taskCommentRef = ref()
const taskOperationRef = ref()
const scrollFun = ref()
const taskEditFooterRef = ref()
const nodePanelRef = ref()
const refreshOnClose = ref(false) // 关闭时是刷新这个表格还是单独一条数据
const state = reactive({
  dialogVisible: false,
  taskIsError: false,
  commentIsEdit: false,
  taskErrorText: '',
  // 任务流程
  workItemType: 1,
  // 任务header信息
  taskHeaderInfo: {} as WorkTaskInfo,
  taskHeaderToolInfo: {} as any,
  // 任务节点信息
  taskNodeFlowData: {} as any,
  tabKey: props.taskTabKey,
  taskDetail: {} as WorkDetailData,
  spaceId: currentRoute.value.params.id as string,
  workItemId: props.taskParams.workItemId || '',
  commentSort: 'ASC',
  commentNum: 0,
  // 任务footer
  taskFooter: {},
  // 当前选中节点
  currentNode: {} as WorkDetailNode | undefined,
  currentTemplate: {} as TemplateConfNode | undefined,
  currentRole: {},
  deleteTaskDialog: {
    visible: false,
    workItemName: '',
    nickName: '',
    userName: '',
  },
  defaultKey: '' as string | undefined,
  isShowTopBtn: false,
  isShowCommentReloadBtn: false,
  workItemIds: [] as string[],
  commentRedStatus: true,
})

provide('workFlow', workFlow)

useTaskCoolaborate({ proxy, callback: async () => {
  await getTaskDetail()
  nodePanelRef.value.refresh()
}, taskDetail: toRef(state, 'taskDetail') })

const { visible, openTaskDrawer, closeTaskDrawer } = useEvents()

// 是否显示任务节点流
const isShowNodeFlow = computed(() => {
  // return !isEmptyObject(state.taskNodeFlowData)
  return workFlow.value.templateConf?.nodes?.length > 0
})

// 是否显示头部骨架
const isShowHeaderSkeleton = computed(() => {
  return isEmptyObject(state.taskDetail) && !state.taskIsError
})

// 是否显示头部骨架
const isShowBodyLoading = computed(() => {
  return isEmptyObject(state.taskDetail) && !state.taskIsError
})

// 是否显示评论未读标红
const isCommentUnread = computed(() => {
  return Number(state.taskDetail.unreadCommentNum) > 0 && state.commentRedStatus && props.taskTabKey !== 'comment'
})

const templateNodes = computed(() => {
  return workFlow.value.templateConf.nodes.map((item) => {
    const node: any = state.taskDetail.nodes?.find((ele) => {
      return ele.flowNodeCode === item.key
    })
    if (!node) {
      return undefined
    }
    else if (node.planTime.completeAt !== '0' && [NodeStatus.COMPLETED, NodeStatus.INPROGRESS].includes(node.flowNodeStatus)) {
      // 已完成：是否延期 = 完成时间 > 排期时间
      // 未完成：是否延期 = 当前时间 > 排期时间
      if (
        node.flowNodeStatus === NodeStatus.COMPLETED
        && new Date(Number.parseInt(node.finishAt) * 1000) > new Date(Number.parseInt(node.planTime.completeAt) * 1000)
      )
        item.$isDelay = true

      else if (
        node.flowNodeStatus === NodeStatus.INPROGRESS
        && new Date() > new Date(Number.parseInt(node.planTime.completeAt) * 1000)
      )
        item.$isDelay = true
    }
    // 节点状态：1. 直接从详情获取状态； 2. 如果任务已终止，当前节点赋值为: -1
    if (state.taskDetail.workItemStatus.key === TaskStatusKey.TERMINATED && node.flowNodeStatus === NodeStatus.INPROGRESS) {
      item.$flowNodeStatus = NodeStatus.TERMINATED
    }
    else {
      item.$flowNodeStatus = node.flowNodeStatus
    }
    return item
  }).filter(item => item)
})

/** METHODS */

// 切换任务tab
function changeTaskTab(key: string) {
  if (key === 'comment') {
    state.commentRedStatus = false
  }
  state.tabKey = key
  state.commentIsEdit = false
  state.isShowCommentReloadBtn = false
}

// 获取任务详情
async function getTaskDetail() {
  try {
    const taskDetail = await fetchTaskDetail({ spaceId: state.spaceId || '', workItemId: props.taskParams?.workItemId || '' })
    const currentNode = getCurrentNode(state.taskDetail)
    await initFlowTemplate(state.spaceId, taskDetail.template.templateId, currentNode?.flowNodeCode)
    initFormPermission({ currentNode: currentTemplate.value, workItemStatus: state.taskDetail.workItemStatus, operationPermissions: JSON.parse(state.taskDetail.operationPermissions || '') })
    await fetchAndSetProjectRelatedData(taskDetail)
    await renderHeader(taskDetail)
    await renderForm(taskDetail)
    await renderFooter(taskDetail, workFlow.value)
    return { currentNode, currentTemplate: currentTemplate.value }
  }
  catch (error: any) {
    switch (error.code) {
      case 305003:
        state.taskIsError = true
        state.taskErrorText = '您已不在当前项目中，无权查看'
        break
      case 301002:
        state.taskIsError = true
        state.taskErrorText = '该任务不存在'
        break
      default:
        state.taskIsError = true
        state.taskErrorText = '项目信息错误'
        break
    }
  }
}

// 请求任务详情
async function fetchTaskDetail({ spaceId, workItemId }: { spaceId: string, workItemId: string }) {
  const { data } = await getWorkItemDetail({ spaceId, workItemId })
  data.commentNum = Number(data.commentNum)
  state.taskDetail = data
  // console.log(taskDetail)
  // taskDetail.value = data
  return data
}

// 获取任务详情所需的列表数据
async function fetchAndSetProjectRelatedData(data: WorkDetailData) {
  const { tags } = data
  const { spaceId, workObjectId, versionId } = data
  // const { participators } = data.subInfo
  await projectStore.getProjectModuleList(spaceId as string, false, [workObjectId as string])
  await projectStore.getProjectVersionList(spaceId as string, [versionId as string])
  await projectStore.getProjectTagList(spaceId as string, tags?.map(item => item.id as string))
  // if (participators)
  //   await projectStore.getProjectMemberList(spaceId as string, '', participators)
}

// 渲染头部
function renderHeader(data: WorkDetailData) {
  nextTick(() => {
    taskHeaderInfoRef.value?.setData(data)
  })
  taskHeaderToolRef.value?.setData(data, state.tabKey)
}

// 渲染表单区域
function renderForm(data: WorkDetailData) {
  taskEditFormRef.value?.setFormData(data, workFlow.value)
}

// 渲染底部
function renderFooter(data: WorkDetailData, workflowData: WorkFlowTemplateData) {
  taskEditFooterRef.value?.setData(data, workflowData)
}

function editComment(isEdit: boolean) {
  state.commentIsEdit = isEdit
}

// 打开任务弹框
function handleOpen(open: boolean) {
  if (open) {
    state.spaceId = props.taskParams.spaceId || (currentRoute.value.params.id as string)
    state.workItemId = props.taskParams.workItemId as string
    refreshOnClose.value = false
    nextTick(async () => {
      const r = await getTaskDetail()
      if (r?.currentNode) {
        state.currentNode = r.currentNode
        state.currentTemplate = r.currentTemplate
        // 流程图默认选中节点
        state.defaultKey = state.currentNode?.flowNodeCode
      }
      proxy.mittBus.on('openDeleteItemDialog', (data: any) => {
        if (data.operator.id === Number(userInfo.id) || Number(state.workItemId) !== Number(data.workItem.id))
          return
        state.deleteTaskDialog.nickName = data.operator.nickname
        state.deleteTaskDialog.userName = data.operator.username
        state.deleteTaskDialog.workItemName = data.workItem.name
        state.deleteTaskDialog.visible = true
      })
    })
  }
  else {
    handleRefreshTable()
    emits('onCloseDrawer')
  }
}

// 修改表单数据
function changeFormItem(tableIds: string[]) {
  getTaskDetail()

  // 通知表格刷新
  if (tableIds.length > 0) {
    state.workItemIds = tableIds
    return
  }

  refreshOnClose.value = true
}

// 刷新表格
function handleRefreshTable(workIds?: string[]) {
  if (refreshOnClose.value || workIds?.length === 0 || state.taskIsError) {
    proxy.mittBus.emit('onRefreshTable', [])
  }
  else {
    const ids = workIds || (state.workItemIds.length > 0 ? state.workItemIds : [state.workItemId])
    proxy.mittBus.emit('onRefreshTable', ids)
  }
}

function handleCloseDrawerAndRefreshTable(workIds?: string[]) {
  visible.value = false
  handleRefreshTable(workIds)
}

function changeCommentSort() {
  state.commentSort = state.commentSort === 'DESC' ? 'ASC' : 'DESC'
  nextTick(() => {
    getCommentList({ isSort: true, isClear: true })
  })
}

function replayComment(item: any) {
  commentType.value = item.type
  taskEditFooterRef.value?.openCommentEditor(item)
}
// 富文本失焦
async function getCommentContent(describe: string, userIds: number[], replyCommentId: number) {
  if (!commentType.value) {
    return
  }
  if (commentType.value === 'reply' || commentType.value === 'add') {
    try {
      const { data } = await taskCommentAdd(props.taskParams.workItemId || '', describe, userIds, replyCommentId)
      if (!data)
        return

      state.tabKey = state.tabKey !== 'comment' ? 'comment' : state.tabKey
      message.success('评论成功！', 2, () => {})
      getCommentList({ isAdd: true })
    }
    catch (error) {}
  }
  if (commentType.value === 'edit') {
    taskCommentRef.value?.updateComment(describe, userIds, replyCommentId)
    commentType.value = 'add'
  }
}

function addCommentSuccess() {
  nextTick(() => {
    const scrollHeight = state.commentSort === 'ASC' ? scrollFun.value?.scrollHeight : 0
    scrollFun.value!.scrollTo({ top: scrollHeight, behavior: 'smooth' })
  })
}

function getCommentList(params: any) {
  state.commentRedStatus = false
  taskCommentRef.value?.getCommentList(params)
  state.isShowCommentReloadBtn = false
}

function handleScroll() {
  const scrollTop = scrollFun.value.scrollTop
  if (scrollTop > 600 && state.tabKey === 'comment')
    state.isShowTopBtn = true

  else
    state.isShowTopBtn = false

  // 滚动到底部时
  if (
    scrollFun.value.clientHeight + scrollTop
    >= scrollFun.value.scrollHeight - 10
  ) {
    if (state.tabKey === 'comment')
      taskCommentRef.value?.getCommentList()

    if (state.tabKey === 'operation')
      taskOperationRef.value?.getOperationList()
  }
}

// 评论滚动
function commentScroll(type: string) {
  if (type === 'top')
    scrollFun.value!.scrollTo({ top: 0, behavior: 'smooth' })
  if (type === 'bottom')
    scrollFun.value!.scrollTo({ top: scrollFun.value?.scrollHeight, behavior: 'smooth' })
}

defineExpose({
  openTaskDrawer,
  closeTaskDrawer,
})
</script>

<template>
  <a-drawer
    v-model:open="visible"
    class="task-edit-drawer"
    root-class-name="project-task-drawer"
    :mask-style="{ backgroundColor: 'transparent' }"
    :closable="false"
    :push="{
      distance: 0,
    }"
    :z-index="2001"
    destroy-on-close
    @close="closeTaskDrawer"
    @after-open-change="handleOpen"
  >
    <!-- 头部 -->
    <template #title>
      <navbar class="px16" is-back @on-back="closeTaskDrawer">
        <template #content>
          <BSkeleton :loading="isShowHeaderSkeleton" height-class="h32">
            <div class="flex">
              <div class="ss-line-1 text16 pfm">
                {{ state.taskIsError ? state.taskErrorText : state.taskDetail.workItemName }}
              </div>
              <TaskHeaderInfo ref="taskHeaderInfoRef" @on-update-form-item="changeFormItem" />
            </div>
          </BSkeleton>
        </template>
        <template #right>
          <div class="drawer-header-tool flex-row-end">
            <TaskHeaderTool
              v-if="!state.taskIsError"
              ref="taskHeaderToolRef"
              :tab-key="state.tabKey"
              @update-process-success="async () => {
                const r = await getTaskDetail()
                if (r?.currentNode) {
                  state.currentNode = r.currentNode
                  state.currentTemplate = r.currentTemplate
                  // 流程图默认选中节点
                  state.defaultKey = state.currentNode?.flowNodeCode
                }
                nodePanelRef.refresh()
              }"
              @on-refresh-table="handleCloseDrawerAndRefreshTable"
            />
          </div>
        </template>
      </navbar>
    </template>

    <!-- 内容 -->
    <div
      ref="scrollFun"
      class="task-edit-scrollbar"
      @scroll="handleScroll"
    >
      <BLoading :loading="isShowBodyLoading">
        <template v-if="!state.taskIsError">
          <!-- 节点 -->
          <div class="task-node-flow">
            <div class="node-flow-box">
              <NodePanel
                v-if="isShowNodeFlow"
                v-bind="$attrs"
                id="detail"
                ref="nodePanelRef"
                :nodes="templateNodes as unknown as Node[]"
                :connections="workFlow.templateConf.connections"
                :config="{
                  fitCenter: false,
                  nodeHeight: 32,
                  nodePadding: 16,
                  lineWidth: 2,
                  nodeTextSize: 14,
                }"
                :default-key="state.currentNode?.flowNodeCode"
                :restart="state.taskDetail.isRestart"
                :restart-by="state.taskDetail.restartBy"
                status-circle
                select
                legend
                @on-select-node="(val: NodeProp) => {
                  setCurrentTemplate(val.key)
                  state.currentTemplate = currentTemplate
                  // 当前角色 和 值
                  state.currentRole = state.taskDetail.roleOwners!.find(item => item.roleKey === val.owner.ownerRole[0].key)!
                  // 当前日期
                  state.currentNode = state.taskDetail.nodes?.find(item => item.flowNodeCode === val.key)!
                }"
              />
            </div>
          </div>
          <touch-content direction="right" @on-swiper="visible = false">
            <TaskEditNode
              v-if="isShowNodeFlow && state.taskDetail.workItemStatus.key !== TaskStatusKey.COMPLETED"
              v-model:data="state.currentNode"
              :role-owner="state.taskDetail.roleOwners!.find(item => item.roleKey === state.currentNode?.role)! || {}"
              :current-template="state.currentTemplate"
              :space-id="state.spaceId"
              :work-item-id="state.workItemId"
              :work-item-status-key="state.taskDetail.workItemStatus.key"
              :operation-permissions="state.taskDetail.operationPermissions"
              :is-sub-task="state.taskDetail.pid !== '0'"
              @success="getTaskDetail"
            />

            <!-- tab -->
            <div class="task-tab">
              <div v-if="state.isShowCommentReloadBtn && state.tabKey === 'comment'" class="comment-reload-box text13 icon-color animate__animated animate__fadeInDown" @click="getCommentList({ isSort: true, isClear: true })">
                列表有更新
                <svg-icon name="comment-reload" color="BFBFBF" size="13" />
              </div>
              <a-tabs v-model:activeKey="state.tabKey" size="default" @change="changeTaskTab">
                <a-tab-pane key="base" tab="基础信息" />
                <a-tab-pane key="comment">
                  <template #tab>
                    <p class="flex-row-start">
                      评论/备注
                      <span v-if="state.taskDetail.commentNum" class="flex-row-center num ml4" :class="{ unread: isCommentUnread }">
                        {{ isCommentUnread ? state.taskDetail.unreadCommentNum : state.taskDetail.commentNum }}
                      </span>
                      <a-tooltip
                        :title="state.commentSort === 'DESC' ? '按时间倒序' : '按时间升序'"
                        placement="top"
                      >
                        <svg-icon
                          class="ml4"
                          :name="state.commentSort === 'DESC' ? 'task-asc' : 'task-desc'"
                          size="20"
                          color="#333333"
                          @click="changeCommentSort"
                        />
                      </a-tooltip>
                    </p>
                  </template>
                </a-tab-pane>
                <a-tab-pane key="operation" tab="操作日志" />
              </a-tabs>
            </div>
            <!-- 内容 -->
            <div class="task-tab-content">
              <!-- 表单 -->
              <task-edit-form
                v-show="state.tabKey === 'base'"
                ref="taskEditFormRef"
                @on-update-form-item="changeFormItem"
                @on-update-module-name="refreshOnClose = true"
                @on-update-version-name="refreshOnClose = true"
              />

              <!-- 评论/备注 -->
              <TaskComment
                v-if="state.tabKey === 'comment'"
                ref="taskCommentRef"
                v-model:commentNum="state.taskDetail.commentNum"
                v-model:isShowCommentReloadBtn="state.isShowCommentReloadBtn"
                :task-params="taskParams"
                :comment-sort="state.commentSort"
                @add-comment-success="addCommentSuccess"
                @reply-comment="replayComment"
                @edit-comment="editComment"
                @on-scroll="commentScroll"
              />

              <!-- 操作日志 -->
              <TaskOperation
                v-if="state.tabKey === 'operation'"
                ref="taskOperationRef"
                :task-params="taskParams"
              />
            </div>
          </touch-content>
        </template>

        <b-empty
          v-else
          :is-svg="false"
          :desc="state.taskErrorText"
          img-name="no-data-task"
          icon-mb="5px"
          pt="320px"
          desc-color="#999999"
        />
      </BLoading>
    </div>
    <!-- 底部 -->
    <template #footer>
      <div v-show="!state.taskIsError && (state.tabKey !== 'comment' || !state.commentIsEdit)">
        <TaskFooter
          ref="taskEditFooterRef"
          :tab-key="state.tabKey"
          @get-comment-content="getCommentContent"
          @on-refresh-table="handleCloseDrawerAndRefreshTable"
        />
      </div>
      <div v-if="state.isShowTopBtn" class="gotop flex-row-center" @click="commentScroll('top')">
        <svg-icon name="gotop" size="18" color="#fff" />
      </div>
    </template>
  </a-drawer>
  <b-dialog
    v-model:dialogVisible="state.deleteTaskDialog.visible"
    width="480px"
    title="当前任务已被删除"
    title-icon="orange.svg"
    :show-cancel-btn="false"
    confirm-btn-text="我知道了"
    @on-confirm="handleCloseDrawerAndRefreshTable([])"
    @on-cancel="handleCloseDrawerAndRefreshTable([])"
  >
    <p class="desc text14 icon-color">
      1.<span class="primary-color">#{{ state.deleteTaskDialog.workItemName }}</span> 已被 {{ state.deleteTaskDialog.nickName }}<span class="minor-color">({{ state.deleteTaskDialog.userName }})</span>删除 <br>
      2.请点击“我知道了”刷新页面
    </p>
  </b-dialog>
</template>

<style lang="scss" scoped>
@import '../scss/task-edit.scss';
</style>
