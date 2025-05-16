// 项目 模块 管理
import { defineStore } from 'pinia'
import type { UserItemInfo, UserItemStats } from '@/api/project/intro/types'
import { getProjectUserCount, getProjectUserList } from '@/api/project/intro/user'

export const useProjectUserStore = defineStore({
  id: 'projectUser',
  state: () => ({
    // 模块列表，初始为空数组
    list: [] as UserItemInfo[],
    stats: [] as UserItemStats[],
  }),
  actions: {
    // 获取模块列表
    async fetchUserList(data: { spaceId: string }): Promise<UserItemInfo[]> {
      const { spaceId } = data

      try {
        const { data } = await getProjectUserList(spaceId)
        this.list = data.list
        return data.list
      }
      catch (error) {
        return []
      }
    },
    // 获取模块统计数据
    async fetchUserStats(spaceId: string, ids: string[], startTime: string, endTime: string): Promise<UserItemStats[]> {
      try {
        // 获取模块数量统计
        const { data } = await getProjectUserCount({
          spaceId,
          ids,
          startTime,
          endTime,
        })

        this.stats = data.list
        return this.stats
      }
      catch (error) {
        return []
      }
    },
  },
})
