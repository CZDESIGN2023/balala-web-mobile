import { isEmptyObject } from '.'
import type { TaskStatusKey } from '@/enum/TaskStatus'
import { archivedTaskStatusList } from '@/enum/TaskStatus'

// 是否是归档任务
export function taskIsArchived(workItemStatusKey: TaskStatusKey): boolean {
  return archivedTaskStatusList().includes(workItemStatusKey)
}

// 是否有权限
function hasPermission(permissionData: Record<string, boolean>, key: string): boolean {
  return !isEmptyObject(permissionData) && permissionData[key]
}

// 检查是否有权限并且是否是归档任务
export function permCheckIsArchived(permissionData: Record<string, boolean>, key: string, workItemStatus?: TaskStatusKey): boolean {
  return hasPermission(permissionData, key) && !taskIsArchived(workItemStatus!)
}
// 查是否有权限
export function permCheck(permissionData: Record<string, boolean>, key: string): boolean {
  return hasPermission(permissionData, key)
}
