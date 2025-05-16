import { ref } from 'vue'
import { useProjectUserStore } from '@/stores/modules/project/user'
import { mergeArraysByKeyWithSeparateObject } from '@/utils/array'
import type { UserItem, UserItemInfo, UserItemStats } from '@/api/project/intro/types'

const userList = ref<UserItem[]>([])

export function useUser() {
  const projectUserStore = useProjectUserStore()
  // 获取模块列表
  async function getUserList(spaceId: string, isGetStats: boolean = false, startTime: string = '', endTime: string = ''): Promise<UserItem[] | UserItemInfo[]> {
    const users = await projectUserStore.fetchUserList({ spaceId })

    // 是否需要获取统计数据
    if (!isGetStats)
      return users
    if (!users) {
      return []
    }

    const stats = await getUserStats(spaceId, users.map(item => item.userId), startTime, endTime)

    const newStast = stats.map((item: any) => {
      const { id, ...otherProps } = item
      return { userId: id, ...otherProps }
    })

    const mergedArray = mergeArraysByKeyWithSeparateObject<UserItemInfo, UserItemStats, 'userId', UserItem>(
      users,
      newStast,
      'userId',
      'stats',
    )

    userList.value = mergedArray
    return mergedArray
  }

  // 获取模块统计数据
  async function getUserStats(spaceId: string, userIds: string[], startTime: string, endTime: string) {
    const data = await projectUserStore.fetchUserStats(spaceId, userIds, startTime, endTime)
    if (!data) {
      throw new Error('No data received')
    }

    const dataMap = new Map(data.map(item => [item.id, item]))
    const result = userIds.map((userId) => {
      const findItem = dataMap.get(userId)
      return findItem || {
        closedOrTerminated: '0',
        completeRate: '0',
        completed: '0',
        expired: '0',
        id: userId,
        processing: '0',
        total: '0',
        weekProcessing: '0',
        priorityInfos:
        [
          {
            priority: 'P0',
            count: '0',
          },
          {
            priority: 'P1',
            count: '0',
          },
          {
            priority: 'P2',
            count: '0',
          },
          {
            priority: 'P3',
            count: '0',
          },
          {
            priority: 'P4',
            count: '0',
          },
          {
            priority: 'PENDING',
            count: '0',
          },
          {
            priority: 'SUSPEND',
            count: '0',
          },
        ],
      }
    })
    return result
  }

  return {
    userList,
    getUserList,
  }
}
