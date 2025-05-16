<script lang="ts" setup>
import { type Ref, h, inject, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { TaskFooterBtn } from '../../types/task'
import taskStatuDialog from './task-statu-dialog.vue'
import { TaskStatusKey, WorkItemStatusType } from '@/enum/TaskStatus'
import { taskStateConfirm } from '@/api/project'
import type { CommentItem, WorkDetailData } from '@/api/interface'
import type { BtnPermission, TaskPermission } from '@/hooks/useTaskPermission'

defineProps({
  tabKey: {
    type: String,
    default: 'base',
  },
})

const emits = defineEmits(['getCommentContent', 'onRefreshTable'])

// 权限
const commentRef = ref()
const taskStatuDialogRef = ref()
const taskPermissions = inject('taskPermissions') as Ref<TaskPermission>
const taskBtnPermissions = inject('taskBtnPermissions') as Ref<BtnPermission>

const state = reactive({
  taskStatuDialogVisible: false,
  workItemName: '',
  workItemId: '',
  spaceId: '',
  isMainTask: true,
  isShowCommentBox: false,
  footerBtns: [] as TaskFooterBtn[],
})

// 渲染底部按钮
function renderFooterBtns() {
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

  // 子任务底部按钮
  const renderSubFooter = () => {
    // 生成按钮
    const btns: TaskFooterBtn[] = [
      createButton('complete', '提交完成', 'primary', taskBtnPermissions.value.showSubmit),
      createButton('restartChild', '重启', 'primary', taskBtnPermissions.value.showRestart),
    ]

    return btns.filter(item => item.show)
  }

  state.footerBtns = renderSubFooter()
}

// 更改任务状态
async function changeTaskStatu(handle: string) {
  const taskStatuDialog = {
    type: '',
    title: '',
  }

  if (handle === 'complete') {
    handleTaskComplete()
    return
  }
  switch (handle) {
    case 'restartChild':
      taskStatuDialog.type = 'restartChild'
      taskStatuDialog.title = '重启'
      break
  }
  state.taskStatuDialogVisible = true
  taskStatuDialogRef.value?.setData(taskStatuDialog)
}

// 子任务提交完成
async function handleTaskComplete() {
  try {
    await taskStateConfirm(state.spaceId, state.workItemId, TaskStatusKey.COMPLETED, '')
    message.success(
      {
        content: '任务状态切换成功',
      },
      2,
    )
    emits('onRefreshTable')
  }
  catch (error) {}
}

// 子任务重启
async function handleChildTaskRestart(reason: string) {
  try {
    await taskStateConfirm(state.spaceId, state.workItemId, TaskStatusKey.PROGRESSING, reason)
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已重启</div>`,
        }),
      },
      2,
    )
    state.taskStatuDialogVisible = false
    emits('onRefreshTable')
  }
  catch (error) {}
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

function setData(data: WorkDetailData) {
  const { spaceId, id, workItemName, pid } = data
  state.spaceId = spaceId
  state.workItemId = id
  state.workItemName = workItemName
  state.isMainTask = pid === '0'

  // 渲染底部
  renderFooterBtns()
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
      <div
        v-for="item in state.footerBtns"
        :key="item.handle"
        @click="changeTaskStatu(item.handle)"
      >
        <a-button :class="item.class" :size="item.size" :plain="item.isPlain" :type="item.type">
          {{
            item.text
          }}
        </a-button>
      </div>
    </div>
  </div>
  <!-- 任务状态变更弹框 -->
  <taskStatuDialog
    ref="taskStatuDialogRef"
    v-model:dialogVisible="state.taskStatuDialogVisible"
    @on-restart-in-child="handleChildTaskRestart"
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
  }
  &.hide {
    height: 0;
  }
}
</style>
