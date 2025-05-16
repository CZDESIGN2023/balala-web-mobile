import type {
  LogList,
  LoginList,
  SystemData,
  UserWorkbenchCount,
  WorkbenchCount,
} from '../interface/system'
import http from '@/api'

/**
 * @name 我的工作台-数量统计
 * @param data
 */
export function getWorkbenchCount() {
  return http.post<UserWorkbenchCount>(`/v2/my/workbench/count`, {})
}

/**
 * @name 获取系统基础配置
 * @param data
 */
export function getSystemConfig() {
  return http.post<SystemData>(`/config/site`, {})
}

export function getUserMenus() {
  return http.get(`/api/v1/system/user/getUserMenus`)
}

/**
 * @name 获取登录日志列表
 * @param content 内容
 * @param referUserIds array 被@人id
 */
export function getLoginLog(size: number = 20, pos: number = 0) {
  return http.post<LoginList>(`/log/login/list`, {
    size,
    pos,
  })
}

/**
 * @name 获取登录日志列表
 * @param content 内容
 * @param referUserIds array 被@人id
 */
export function getOpLog(spaceId: number, size: number = 20, pos: number = 0, moduleType: number, moduleId: number, _id: string, operId: string | number = 0) {
  return http.post<LogList>(
    `/log/op/list`,
    {
      spaceId,
      size,
      pos,
      moduleType,
      moduleId,
      operId,
    },
    { _id },
  )
}

/**
 * 用户列表
 */
export function adminUserList(keyword?: string, size: number = 20, pos: number = 0) {
  return http.post<any>(`/admin/search_user`, {
    keyword,
    pos,
    size,
  })
}

/**
 * 设置系统角色
 */
export function setRole(userId: string, role: string) {
  return http.post<any>(`/admin/set_role`, {
    userId,
    role,
  })
}

/**
 * 重置密码
 */
export function userResetPwd(userId: string) {
  return http.post<any>(`/admin/reset_pwd`, {
    userId,
  })
}

/**
 * 系统管理 - 新增用户
 */

export function addUser(data: any) {
  return http.post<any>(`/admin/add_user`, data)
}

/**
 * 系统管理 - 新增用户
 */

export function editUserNickname(data: any) {
  return http.post<any>(`/admin/set_nickname`, data)
}
