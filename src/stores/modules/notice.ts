import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import piniaPersistConfig from '@/config/piniaPersist'

interface MessageState {
  [userId: string]: any[]
}

export const useNoticeStore = defineStore({
  id: 'notice',
  state: () => ({
    messages: {} as MessageState,
    noticeList: [] as any[],
    userNoticeCounts: {} as {
      [userId: string]: {
        commentIndex: number // 评论数量
        sysIndex: number // 系统数量
        todoIndex: number // 代办数量
      }
    },
    // 是否显示通知面板
    showNotice: false as boolean,
    // 是否显示已加入新项目的提示框
    isShowJoinTooltip: false,
    joinSpaceId: '',
  }),
  actions: {
    addNotice(item: any) {
      const { userInfo } = useUserStore()
      if (!this.messages[userInfo.id])
        this.messages[userInfo.id] = []

      this.messages[userInfo.id].unshift(item)
      // this.noticeList.unshift(item)
    },
    // 获取特定用户的消息列表x Z
    getMessagesForUser(userId: string) {
      return this.messages[userId] || []
    },
    // 清除特定用户的消息列表（用户退出登录时调用）
    clearMessagesForUser(userId: string) {
      if (this.messages[userId])
        delete this.messages[userId]
    },
    clearNoticeList() {
      this.messages[useUserStore().userInfo.id] = []
    },
    removeNoticeItem(index: number) {
      this.messages[useUserStore().userInfo.id].splice(index, 1)
    },
    // 设置通知面板
    setShowNotice(isShow?: boolean) {
      if (isShow === undefined)
        this.showNotice = !this.showNotice
      else
        this.showNotice = isShow
    },
    // 控制 通知栏数量
    setUserNoticeCounts(index: number, type: string) {
      const { userInfo } = useUserStore()
      if (!this.userNoticeCounts[userInfo.id]) {
        this.userNoticeCounts[userInfo.id] = {
          commentIndex: 0,
          sysIndex: 0,
          todoIndex: 0,
        }
      }
      if (type === 'comment') {
        this.userNoticeCounts[userInfo.id].commentIndex += index
        if (index === 0)
          this.userNoticeCounts[userInfo.id].commentIndex = 0
      }
      if (type === 'system') {
        this.userNoticeCounts[userInfo.id].sysIndex += index
        if (index === 0)
          this.userNoticeCounts[userInfo.id].sysIndex = 0
      }
      if (type === 'todo') {
        this.userNoticeCounts[userInfo.id].todoIndex += index
        if (index === 0)
          this.userNoticeCounts[userInfo.id].todoIndex = 0
      }
    },
    // 设置已加入新项目的提示框
    setJoinTooltip(isShow: boolean, spaceId?: string) {
      this.isShowJoinTooltip = isShow
      this.joinSpaceId = spaceId as string
      if (!isShow)
        this.joinSpaceId = ''
    },
    reset(isAll: boolean = false) {
      if (isAll)
        this.messages = {}

      this.isShowJoinTooltip = false
      this.showNotice = false
    },
  },
  persist: piniaPersistConfig('notice', ['joinSpaceId', 'isShowJoinTooltip', 'messages', 'noticeList', 'showNotice', 'userNoticeCounts']),
})
