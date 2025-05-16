import { h } from 'vue'
import type { NotificationData } from './type'
import { ObjectType, RelationType, TypeDesc } from './enum'
import { BHead } from '@/components/BHead'
import BNoticeIcon from '@/components/BNoticeIcon/index.vue'

// 渲染头像
export function renderIcon(data: NotificationData) {
  const { type, notification, relation } = data

  if (type === TypeDesc.AddCommentEvent) {
    return renderUserAvatar(notification.subject?.data.nickName, notification.subject?.data.avatar)
  }
  if (type === TypeDesc.WorkItemExpired) {
    return renderDangerIcon()
  }

  if (type === TypeDesc.RestartWorkItem && !relation.includes(RelationType.WORK_ITEM_FOLLOWER)) {
    return renderRestartIcon()
  }

  if (notification.object?.type === ObjectType.WORK_ITEM) {
    const src = relation.includes(RelationType.WORK_ITEM_FOLLOWER) ? 'follow.png' : 'task.png'
    return renderNoticeIcon(src)
  }

  return renderNoticeIcon('project.png')
}

// 用户头像
function renderUserAvatar(name: string, src: string) {
  return h(
    'div',
    {},
    h(BHead, {
      name,
      fs: 'text14',
      src,
    }),
  )
}

// 逾期头像
function renderDangerIcon() {
  return h(
    'div',
    {},
    h(BNoticeIcon, {
      src: 'danger.png',
      custom: 'notice',
    }),
  )
}

// 任务头像
function renderNoticeIcon(src: string) {
  return h(
    'div',
    {},
    h(BNoticeIcon, {
      src,
      custom: 'notice',
    }),
  )
}

// 重启头像
function renderRestartIcon() {
  return h(
    'div',
    {},
    h(BNoticeIcon, {
      src: 'reset.png',
      custom: 'notice',
    }),
  )
}
