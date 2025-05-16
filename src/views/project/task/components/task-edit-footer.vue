<script lang="ts" setup>
import { type Ref, computed, h, inject, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { generateNodeOptions, getCurrentNode } from '../utils/task'
import type { TaskFooterBtn } from '../../types/task'
import taskStatuDialog from './task-statu-dialog.vue'
import {
  editWorkStateClose,
  editWorkStateConfirm,
  editWorkStateRestart,
  editWorkStateRestore,
  editWorkStateRollback,
} from '@/api/project'
import type { CommentItem, WorkDetailData } from '@/api/interface'
import type { SelectOptions } from '@/api/interface/common'
import type { Workflow } from '@/views/flowNode/types'
import useFlowTemplate from '@/hooks/useFlowTemplate'
import { NodeStatus } from '@/enum/NodeStatus'
import type { BtnPermission, TaskPermission } from '@/hooks/useTaskPermission'

defineProps({
  tabKey: {
    type: String,
    default: 'base',
  },
})

const emits = defineEmits(['getCommentContent', 'onRefreshTable'])

const { initFlowTemplate, flowTemplateInfo, currentNode: currentNodeTemplate, loading, setCurrentTemplate } = useFlowTemplate()
const taskPermissions = inject('taskPermissions') as Ref<TaskPermission>
const taskBtnPermissions = inject('taskBtnPermissions') as Ref<BtnPermission>
const commentRef = ref()
const taskStatuDialogRef = ref()

const nodeOptions = ref<SelectOptions[]>([])

const state = reactive({
  taskStatuDialogVisible: false,
  workItemId: '',
  spaceId: '',
  workItemName: '',
  isMainTask: true,
  isShowCommentBox: false,
  footerBtns: [] as TaskFooterBtn[],
  closeTaskDialogData: {
    value: null,
    label: '',
    text: '',
    isShowErrorTip: false,
    check: false,
  },
})

// 关闭任务是否已选原因
const closeTaskReason = computed(() => {
  const { value, label, text } = state.closeTaskDialogData
  return {
    value: !(value === 'other' ? text : label),
    label: value === 'other' ? text : label,
  }
})

// 抛出事件获取所需数据
async function setData(data: WorkDetailData, workflow: Workflow) {
  state.spaceId = data.spaceId as string
  state.workItemId = data.id as string
  state.isMainTask = data?.pid === '0'
  state.workItemName = data.workItemName as string

  // 获取当前节点
  nodeOptions.value = generateNodeOptions(workflow)
  const currentNode = getCurrentNode(data)
  await initFlowTemplate(data.spaceId, data.template.templateId, currentNode?.flowNodeCode)
  if (currentNode?.flowNodeCode)
    setCurrentTemplate(currentNode!.flowNodeCode)

  // 渲染底部
  renderFooterBtns()
}

// 渲染底部按钮
function renderFooterBtns() {
  const nodeTemplate = currentNodeTemplate.value

  // 检查是否显示按钮
  const shouldShowButton = (condition: boolean): boolean => {
    return condition
  }

  // 生成按钮配置
  const createButton = (
    handle: string,
    text: string,
    type: string,
    showCondition: boolean,
    className: string = 'btn confirm-btn',
  ) => {
    return {
      handle,
      text,
      type,
      show: shouldShowButton(showCondition),
      class: className,
      size: 'default',
    }
  }

  // 主任务底部按钮
  const renderMainFooter = () => {
    // 生成按钮
    const btns: TaskFooterBtn[] = [
      createButton('close', '关闭', 'popover', taskBtnPermissions.value.showClose),
      createButton('rollback', '回滚', 'default', taskBtnPermissions.value.showRollBack, 'btn cancel-btn'),
      createButton('default', nodeTemplate?.doneOperationDisplayName || '', 'primary', taskBtnPermissions.value.showTemplate),
      createButton('restartSuccess', '重启', 'primary', taskBtnPermissions.value.showCompleteRestart),
      createButton('restart', '重启', 'primary', taskBtnPermissions.value.showCloseRestart),
      createButton('restore', '恢复', 'primary', taskBtnPermissions.value.showResume),
    ]

    return btns.filter(item => item.show)
  }

  state.footerBtns = renderMainFooter()
}

// 监听关闭任务原因输入
function changeReasonTextarea() {
  if (state.closeTaskDialogData.text)
    state.closeTaskDialogData.isShowErrorTip = false
  else
    state.closeTaskDialogData.isShowErrorTip = true
}

// 更改任务状态
async function changeTaskStatu(handle: string) {
  const taskStatuDialog = {
    type: '',
    title: '',
  }

  if (handle === 'default') {
    handleTaskProgress()
    return
  }
  switch (handle) {
    case 'rollback':
      taskStatuDialog.type = 'rollback'
      taskStatuDialog.title = '回滚'
      break
    case 'restartSuccess':
      taskStatuDialog.type = 'restartSuccess'
      taskStatuDialog.title = '重启'
      break
    case 'restart':
      taskStatuDialog.type = 'restart'
      taskStatuDialog.title = '重启'
      break
    case 'restore':
      taskStatuDialog.type = 'restore'
      taskStatuDialog.title = '恢复'
      break
  }
  state.taskStatuDialogVisible = true
  taskStatuDialogRef.value?.setData(taskStatuDialog, nodeOptions.value)
}

// 任务进行
async function handleTaskProgress() {
  try {
    const { data } = await editWorkStateConfirm(
      state.spaceId,
      state.workItemId,
      currentNodeTemplate.value.key || '',
    )
    if (currentNodeTemplate.value.doneOperationDisplayName === '确认问题') {
      message.success(
        {
          content: h('div', {
            innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已确认</div>`,
          }),
        },
        2,
      )
    }
    else {
      message.success('任务状态修改成功', 2)
    }
    emits('onRefreshTable', data.ids)
  }
  catch (error) {}
}

// 任务回滚
async function handleTaskRollBack(reason: string) {
  try {
    const { data } = await editWorkStateRollback(
      state.spaceId,
      state.workItemId,
      currentNodeTemplate.value.key || '',
      reason,
    )
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已回滚</div>`,
        }),
      },
      2,
    )
    state.taskStatuDialogVisible = false
    emits('onRefreshTable', data.ids)
  }
  catch (error) {}
}

// 已完成任务重启
async function handleTaskRestartInComplete(node: string, reason: string) {
  try {
    const { data } = await editWorkStateRestart(state.spaceId, state.workItemId, node, reason)
    const labels = nodeOptions.value.filter((item: any) => item.value === node)[0].label
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已${labels}</div>`,
        }),
      },
      2,
    )
    state.taskStatuDialogVisible = false
    emits('onRefreshTable', data.ids)
  }
  catch (error) {
  }
}

// 已关闭任务重启
async function handleTaskRestartInClose(reason: string) {
  try {
    const { data } = await editWorkStateRestart(state.spaceId, state.workItemId, '', reason)
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已重启</div>`,
        }),
      },
      2,
    )
    state.taskStatuDialogVisible = false
    emits('onRefreshTable', data.ids)
  }
  catch (error) {
  }
}

// 恢复任务
async function handleTaskRestore(reason: string) {
  try {
    const { data } = await editWorkStateRestore(state.spaceId, state.workItemId, reason)
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已恢复</div>`,
        }),
      },
      2,
    )
    state.taskStatuDialogVisible = false
    emits('onRefreshTable', data.ids)
  }
  catch (error) {
  }
}

// 关闭任务
async function handleConfirmTaskClose() {
  if (closeTaskReason.value.label === '') {
    state.closeTaskDialogData.isShowErrorTip = true
    return
  }
  try {
    const { data } = await editWorkStateClose(
      state.spaceId,
      state.workItemId,
      currentNodeTemplate.value.key || '',
      closeTaskReason.value.label,
    )
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已关闭</div>`,
        }),
      },
      2,
    )
    handleCancelTaskClose()
    emits('onRefreshTable', data.ids)
  }
  catch (error) {
  }
}

// 取消关闭任务
function handleCancelTaskClose() {
  state.closeTaskDialogData.label = ''
  state.closeTaskDialogData.value = null
  state.closeTaskDialogData.text = ''
  state.closeTaskDialogData.isShowErrorTip = false
}

// 获取评论内容
async function getCommentContent(describe: string, userIds: number[], replyCommentId: number) {
  emits('getCommentContent', describe, userIds, replyCommentId)
}

// 打开评论框
function openCommentEditor(item: any) {
  commentRef.value?.openCommentEditor(item)
}

// 显示评论
function changeCommentMode(open: boolean) {
  state.isShowCommentBox = !!open
}

defineExpose({
  setData,
  openCommentEditor,
})
</script>

<template>
  <div
    class="drawer-footer flex-row-between pr16 pl16 gap12"
    :class="{ showComment: state.isShowCommentBox }"
  >
    <!-- 评论区域 -->
    <div class="commnet-box">
      <div v-if="taskPermissions.allowComment" class="default-mode flex-row-start">
        <b-editor
          v-if="state.workItemId"
          ref="commentRef"
          is-foot-btn
          mode="comment"
          placeholder="评论"
          read-content="评论..."
          :resize="false"
          :min-height="140"
          :max-height="436"
          :mode-key="`${state.workItemId}comment`"
          comment-style="short"
          :space-id="state.spaceId"
          @editor-blur="
            (describe: string, userIds: number[], replyCommentId: number) => getCommentContent(describe, userIds, replyCommentId)
          "
          @change-mode="changeCommentMode"
        />
      </div>
    </div>
    <!-- 节点流转按钮区域 -->
    <div class="btn-box flex-row-center gap12">
      <div v-for="item in state.footerBtns" :key="item.handle">
        <b-table-popover
          v-if="item.handle === 'close'"
          is-close
          :align="{ offset: [0, -20] }"
          confirm-text="关闭"
          :is-check="closeTaskReason.value"
          @on-change="handleCancelTaskClose"
          @on-confirm="handleConfirmTaskClose"
        >
          <template #title>
            <p class="text16 title-color">
              请选择关闭任务原因
            </p>
          </template>
          <template #content>
            <div class="confirm-popover-wrap w310 pt20">
              <div class="pt5">
                <BBaseSelect
                  v-model:value="state.closeTaskDialogData.value"
                  v-model:label="state.closeTaskDialogData.label"
                  size="large"
                  placeholder="请选择原因"
                  :options="currentNodeTemplate.closeReasonList"
                  @change="state.closeTaskDialogData.isShowErrorTip = false"
                />
                <div v-if="state.closeTaskDialogData.value === 'other'" class="reason-box pt8 flex">
                  <p v-if="!state.closeTaskDialogData.text">
                    *
                  </p>
                  <a-textarea
                    v-model:value="state.closeTaskDialogData.text"
                    :bordered="false"
                    placeholder="请输入关闭任务原因"
                    :auto-size="{ minRows: 3, maxRows: 3 }"
                    @change="changeReasonTextarea"
                  />
                </div>
                <div
                  v-if="state.closeTaskDialogData.isShowErrorTip"
                  class="tip error-color text12 mt10"
                >
                  请选择/输入关闭任务原因
                </div>
              </div>
            </div>
          </template>
          <a-button class="btn cancel-btn h32" size="default" plain>
            关闭
          </a-button>
        </b-table-popover>
        <a-button
          v-else
          class="h32"
          :class="item.class"
          :size="item.size"
          :plain="item.isPlain"
          :type="item.type"
          @click="changeTaskStatu(item.handle)"
        >
          {{ item.text }}
        </a-button>
      </div>
    </div>
  </div>
  <!-- 任务状态变更弹框 -->
  <taskStatuDialog
    v-if="!loading"
    ref="taskStatuDialogRef"
    v-model:dialogVisible="state.taskStatuDialogVisible"
    :terminated-reason="flowTemplateInfo.templateConf.terminatedReasonList"
    :restore-reason="flowTemplateInfo.templateConf.rebootReasonList"
    :resume-reason="flowTemplateInfo.templateConf.resumeReasonList"
    :current-node-restore-reason="currentNodeTemplate.restartReasonList"
    :rollback-reason="currentNodeTemplate.rollbackReasonList"
    @on-roll-back="handleTaskRollBack"
    @on-restore="handleTaskRestore"
    @on-restart-in-complete="handleTaskRestartInComplete"
    @on-restart-in-close="handleTaskRestartInClose"
  />
</template>

<style lang="scss" scoped>
.drawer-footer {
  width: 100%;
  min-height: 52px;
  background: #fff;
  border-top: 1px solid $color-border-main;
  gap: 12px;
  &.showComment {
    .btn-box {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
  }
  .btn {
    border-radius: 4px;
    padding: 0px 16px;
    font-size: 14px;
  }
  &.hide {
    height: 0;
  }
}
</style>
