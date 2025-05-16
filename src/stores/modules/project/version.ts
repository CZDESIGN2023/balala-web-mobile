// 项目 模块 管理
import { defineStore } from 'pinia'
import type { VersionItemInfo, VersionItemStats } from '@/api/project/intro/types'
import { getProjectVersionCount, getProjectVersionList } from '@/api/project/intro/version'

export const useProjectVersionStore = defineStore({
  id: 'projectVersion',
  state: () => ({
    // 模块列表，初始为空数组
    list: [] as VersionItemInfo[],
    aa: '',
    stats: [] as VersionItemStats[],
  }),
  actions: {
    // 获取模块列表
    async fetchVersionList(data: { spaceId: string }): Promise<VersionItemInfo[]> {
      const { spaceId } = data

      try {
        const { data } = await getProjectVersionList(spaceId)
        this.list = data.list
        return data.list
      }
      catch (error) {
        return []
      }
    },
    // 获取模块统计数据
    async fetchVersionStats(spaceId: string, ids: string[], startTime: string, endTime: string): Promise<VersionItemStats[]> {
      try {
        // 获取模块数量统计
        const { data } = await getProjectVersionCount({
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
