<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, provide, reactive, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { TaskDialogInfoParams } from '../types/task'
import TaskHeaderInfo from './components/task-edit-header-info.vue'
import TaskComment from './components/task-comment.vue'
import TaskOperation from './components/task-operation.vue'
import ChildTaskHeaderTool from './components/task-edit-header-tool-child.vue'
import ChildTaskEditForm from './components/task-edit-form-child.vue'
import ChildTaskFooter from './components/task-edit-footer-child.vue'
import useTaskCoolaborate from './hooks/useTaskCollaborate'
import { isEmptyObject } from '@/utils'
import { getWorkItemDetail, taskCommentAdd } from '@/api/project'
import type { WorkDetailData, WorkTaskInfo } from '@/api/interface'
import { useUserStore } from '@/stores/modules/user'
import { useProjectStore } from '@/stores/modules/project'
import { useFormPermission } from '@/hooks/useTaskPermission'

/** PROPS */
interface Props {
  openType?: string
  taskTabKey?: string
  taskParams?: TaskDialogInfoParams
}
const props = withDefaults(defineProps<Props>(), {
  openType: 'child_detail',
  taskTabKey: 'base',
  taskParams: () => ({}),
})

const emits = defineEmits(['onCloseDrawer'])

const { proxy } = getCurrentInstance() as any
provide('view', true)

/** STORE */
const { currentRoute } = useRouter()
const { userInfo } = useUserStore()
const projectStore = useProjectStore()
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
  tabKey: props.taskTabKey,
  taskDetail: {} as WorkDetailData,
  spaceId: currentRoute.value.params.id as string,
  workItemId: props.taskParams.workItemId || '',
  commentSort: 'ASC',
  commentNum: 0,
  // 任务footer
  taskFooter: {},
  deleteTaskDialog: {
    visible: false,
    workItemName: '',
    nickName: '',
    userName: '',
  },
  isShowTopBtn: false,
  isShowCommentReloadBtn: false,
  commentRedStatus: true,
})

useTaskCoolaborate({ proxy, callback: getTaskDetail, taskDetail: toRef(state, 'taskDetail') })

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
  return Number(state.taskDetail.unreadCommentNum) > 0 && state.commentRedStatus
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
    initFormPermission({ parentWorkItemStatus: state.taskDetail.parentWorkItem.status, workItemStatus: state.taskDetail.workItemStatus, operationPermissions: JSON.parse(state.taskDetail.operationPermissions || '') })
    await fetchAndSetProjectRelatedData(taskDetail)
    await renderHeader(taskDetail)
    await renderForm(taskDetail)
    await renderFooter(taskDetail)
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
  return data
}

// 获取任务详情所需的列表数据
async function fetchAndSetProjectRelatedData(data: WorkDetailData) {
  const { tags, spaceId, workObjectId, versionId } = data
  // const { participators } = data.subInfo
  await projectStore.getProjectModuleList(spaceId, false, [workObjectId])
  await projectStore.getProjectVersionList(spaceId, [versionId])
  await projectStore.getProjectTagList(spaceId, tags?.map(item => item.id))
  // if (participators)
  //   await projectStore.getProjectMemberList(spaceId, '', participators)
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
  taskEditFormRef.value?.setFormData(data)
}

// 渲染底部
function renderFooter(data: WorkDetailData) {
  taskEditFooterRef.value?.setData(data)
}

function editComment(isEdit: boolean) {
  state.commentIsEdit = isEdit
}

// 打开任务弹框
function handleOpen(open: boolean) {
  if (open) {
    state.spaceId = props.taskParams.spaceId || (currentRoute.value.params.id as string)
    nextTick(async () => {
      await getTaskDetail()
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

  else { emits('onCloseDrawer') }
}

// 修改表单数据
function changeFormItem() {
  getTaskDetail()
}

// 关闭任务弹框
function handleClose() {
  handleRefreshTable()
}

// 关闭并且刷新表格
function handleRefreshTable(workIds?: string[]) {
  state.dialogVisible = false
  if (state.taskIsError)
    proxy.mittBus.emit('onRefreshTable', [])
  else
    proxy.mittBus.emit('onRefreshTable', workIds || [state.workItemId])
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

async function openChildTaskDrawer() {
  state.dialogVisible = true
}
function closeTaskDrawer() {
  state.dialogVisible = false
}

defineExpose({
  openChildTaskDrawer,
  closeTaskDrawer,
})
</script>

<template>
  <a-drawer
    v-model:open="state.dialogVisible"
    class="task-edit-drawer"
    root-class-name="project-task-drawer"
    :mask-style="{ backgroundColor: 'transparent' }"
    :closable="false"
    :push="{
      distance: 0,
    }"
    :z-index="2001"
    destroy-on-close
    @close="handleClose"
    @after-open-change="handleOpen"
  >
    <!-- 头部 -->
    <template #title>
      <navbar class="px16" is-back @on-back="handleClose">
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
            <ChildTaskHeaderTool
              v-if="!state.taskIsError"
              ref="taskHeaderToolRef"
              :tab-key="state.tabKey"
              @on-refresh-table="handleRefreshTable"
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
      <touch-content direction="right" @on-swiper="state.dialogVisible = false">
        <BLoading :loading="isShowBodyLoading">
          <template v-if="!state.taskIsError">
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
              <ChildTaskEditForm
                v-show="state.tabKey === 'base'"
                ref="taskEditFormRef"
                @on-update-form-item="changeFormItem"
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
          </template>
          <b-empty
            v-else
            img-name="no-data-task"
            :is-svg="false"
            icon-mb="5px"
            :desc="state.taskErrorText"
            pt="320px"
            desc-color="#999999"
          />
        </BLoading>
      </touch-content>
    </div>
    <!-- 底部 -->
    <template #footer>
      <div v-show="!state.taskIsError && (state.tabKey !== 'comment' || !state.commentIsEdit)">
        <ChildTaskFooter
          ref="taskEditFooterRef"
          :tab-key="state.tabKey"
          @get-comment-content="getCommentContent"
          @on-refresh-table="handleRefreshTable"
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
    @on-confirm="handleRefreshTable([])"
    @on-cancel="handleRefreshTable([])"
  >
    <p class="desc text14 icon-color">
      1.<span class="primary-color">#{{ state.deleteTaskDialog.workItemName }}</span> 已被 {{ state.deleteTaskDialog.nickName }}<span class="minor-color">({{ state.deleteTaskDialog.userName }})</span>删除 <br>
      2.请点击“我知道了”刷新页面
    </p>
  </b-dialog>
</template>

<style lang="scss">
@import '../scss/task-edit.scss';
</style>
