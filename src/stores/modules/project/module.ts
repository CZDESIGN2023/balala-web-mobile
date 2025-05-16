// 项目 模块 管理
import { defineStore } from 'pinia'
import { getProjectModuleCount, getProjectModuleList } from '@/api/project/intro/module'
import type { ModuleItemInfo, ModuleItemStats } from '@/api/project/intro/types'

export const useProjectModuleStore = defineStore({
  id: 'projectModule',
  state: () => ({
    // 模块列表，初始为空数组
    list: [] as ModuleItemInfo[],
    stats: [] as ModuleItemStats[],
  }),
  actions: {
    // 获取模块列表
    async fetchModuleList(data: { spaceId: string, moduleId: string[] }): Promise<ModuleItemInfo[]> {
      const { spaceId, moduleId } = data

      // 如果传入了moduleId数组，并且缓存中有全部的moduleId对应的模块，直接返回缓存中的列表
      if (moduleId.length && this.list.every(item => moduleId.includes(item.id))) {
        return this.list
      }

      try {
        const { data } = await getProjectModuleList(spaceId)
        this.list = data.list
        return data.list
      }
      catch (error) {
        return []
      }
    },
    // 获取模块统计数据
    async fetchModuleStats(spaceId: string, ids: string[], startTime: string, endTime: string): Promise<ModuleItemStats[]> {
      try {
        // 获取模块数量统计
        const { data } = await getProjectModuleCount({
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
