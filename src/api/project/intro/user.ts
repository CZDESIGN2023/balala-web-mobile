import type { TaskUserList, UserItemStats, UserStatsParams } from './types'
import http from '@/api'

/**
 * 版本号-列表
 * @param spaceId 所属空间id
 */

export function getProjectUserList(spaceId: string) {
  return http.post<TaskUserList>(`/my/space/memeber/list`, {
    spaceId,
  })
}

export function getProjectUserCount(data: UserStatsParams) {
  return http.post<any>(`/my/workbench/space/user/count`, data)
}

export function getMemberWitem(data: any) {
  return http.post<any>(`/v1/my/rpt/space/member_witem`, data)
}
