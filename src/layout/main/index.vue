<script lang="ts" setup>
import { getCurrentInstance, inject, onMounted, onUnmounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import NotificationTemplate from '@/socket/notification'
import { useNoticeStore } from '@/stores/modules/notice'
import { useUserStore } from '@/stores/modules/user'
import { parseToJsx } from '@/utils/htmlTojsx'
import { RelationType, SubjectType, TypeDesc } from '@/socket/notification/enum'
import { getMyInfo } from '@/api/user'
import type { NotificationData, NotificationMessage } from '@/socket/notification/type'
import TaskDrawer from '@/views/project/task/index.vue'
import FlowDrawer from '@/views/flowNode/index.vue'
import type { TaskDrawerProps } from '@/api/interface/common'
import { useProjectStore } from '@/stores/modules/project'

withDefaults(defineProps<Props>(), {
  isCollapse: false,
})

const { proxy } = getCurrentInstance() as any
const projectStore = useProjectStore()

interface Props {
  isCollapse?: boolean
}

const taskDrawerRef = ref()
const flowDrawerRef = ref()
const noticeStore = useNoticeStore()
const userStore = useUserStore()
const socketClient: any = inject('socketClient')

// 接收任务通知
function getMessage(data: NotificationMessage) {
  switch (data.type) {
    case 1:
      handleNotice(data.data)
      break
    case 2:
      handleCollaborate(data.data)
      break
  }
}

// 处理通知
function handleNotice(data: NotificationData) {
  const { relation, notification, type } = data
  const { subject } = notification
  if (subject?.type === SubjectType.USER && Number(userStore.userInfo.id) !== subject.data?.id) {
    const notificationTemplate = new NotificationTemplate(data)
    const notificationInfo = notificationTemplate.renderNotification()

    // 获取评论数，消息红点
    if (type === TypeDesc.AddCommentEvent) {
      noticeStore.setUserNoticeCounts(1, 'comment')
    }
    else {
      // 设置系统红点
      noticeStore.addNotice(notificationInfo.data)
      noticeStore.setUserNoticeCounts(1, 'system')
    }
    // 右上角弹窗
    if (notificationInfo.isPopup) {
      ElNotification({
        dangerouslyUseHTMLString: true,
        icon: notificationInfo.icon,
        message: parseToJsx(notificationInfo.description) as any,
        customClass: 'el-notification-notice',
        duration: 3000,
        offset: 48,
      })
    }
  }
  if (relation.includes(RelationType.WORK_ITEM_TODO)) {
  // 设置待办红点
    noticeStore.setUserNoticeCounts(1, 'todo')
  }
}

// 处理协作
function handleCollaborate(collaborateData: any) {
  const { type, data } = collaborateData
  if (Number(userStore.userInfo.id) === Number(data.operator.id)) {
    return
  }
  switch (type) {
    case TypeDesc.DeleteWorkItem:
      // 任务被删除
      proxy.mittBus.emit('openDeleteItemDialog', data)
      break
    case TypeDesc.DeleteTag:
      // 标签被删除
      proxy.mittBus.emit('tagDelete', data)
      break
    case TypeDesc.AddCommentEvent:
    case TypeDesc.UpdateComment:
    case TypeDesc.DeleteComment:
      // 评论添加/更新/删除
      proxy.mittBus.emit('commentUpdate', data)
      break
    case TypeDesc.AddMember:
      // 添加成员
      projectStore.getList()
      noticeStore.setJoinTooltip(true, data.space.id)
      break
    case TypeDesc.RemoveMember:
      // 移除成员
      projectStore.getList()
      noticeStore.setJoinTooltip(false)
      break
    case TypeDesc.DeleteWorkFlow:
      // 删除流程
      proxy.mittBus.emit('deleteWorkFlow', data)
      break
    case TypeDesc.DisableWorkFlow:
      // 禁用流程
      proxy.mittBus.emit('disableWorkFlow', data)
      break
    case TypeDesc.UpgradeWorkFlow:
      // 升级流程
      proxy.mittBus.emit('upgradeWorkFlow', data)
      break
    case TypeDesc.CloseWorkItem:
    case TypeDesc.TerminateWorkItem:
    case TypeDesc.CompleteWorkItem:
      // 任务归档：正在查看时，提醒
      proxy.mittBus.emit('archivedWorkItem', data)
      break
  }
}

// 获取用户信息
async function getUserInfo() {
  const { data } = await getMyInfo()
  userStore.setUserInfo(data)
}

// 配置任务弹窗打开
function openTaskDrawer(data: TaskDrawerProps) {
  taskDrawerRef.value?.openDrawer(data)
}

// 配置流程节点弹窗打开
function openFlowDrawer(data: { spaceId: string, flowId: string, isCreating: boolean }) {
  flowDrawerRef.value?.openDrawer(data)
}

onMounted(() => {
  getUserInfo()
  socketClient.initWebSocket()
  socketClient.on('eventSocketMessage', getMessage)
  // 监听任务侧边栏弹窗点击打开
  proxy.mittBus.on('openTaskDialog', openTaskDrawer)
  // 监听流程侧边栏弹窗点击打开
  proxy.mittBus.on('openFlowDialog', openFlowDrawer)
})

onUnmounted(() => {
  socketClient.off('eventSocketMessage', getMessage)
  proxy.mittBus.off('openTaskDialog', openTaskDrawer)
  proxy.mittBus.off('openFlowDialog', openFlowDrawer)
})
</script>

<template>
  <div class="app-main">
    <router-view />
    <TaskDrawer ref="taskDrawerRef" />
    <FlowDrawer ref="flowDrawerRef" />
  </div>
</template>

<style lang="scss" scoped>
.app-main {
  height: 100%;
  padding: 0 16px 16px 16px;
}
</style>
