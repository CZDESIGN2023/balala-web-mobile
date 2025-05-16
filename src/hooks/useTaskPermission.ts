import { type Ref, reactive, ref } from 'vue'
import type { WorkItemStatus } from '@/api/interface'
import { WorkItemPerm } from '@/enum'
import { TaskStatusKey, WorkItemStatusType } from '@/enum/TaskStatus'
import type { Permissions } from '@/typings/common'
import type { NodeProp } from '@/views/flowNode/types'
import type { TemplateConfNode } from '@/api/project/types'

enum PermissionKey {
  AllowEdit = 'allowEdit',
  AllowNode = 'allowNode',
  AllowChangeState = 'allowChangeState',
  AllowNodeEdit = 'allowNodeEdit',
  AllowComment = 'allowComment',
  AllowRemind = 'allowRemind',
  AllowDelete = 'allowDelete',
  AllowObjectCreate = 'allowObjectCreate',
  AllowObjectEdit = 'allowObjectEdit',
  AllowVersionCreate = 'allowVersionCreate',
  AllowVersionEdit = 'allowVersionEdit',
  AllowTagCreate = 'allowTagCreate',
  AllowChildCreate = 'allowChildCreate',
}

export type TaskPermission = {
  [key in PermissionKey]: boolean
}

interface TaskPermissionParams {
  workItemStatus: WorkItemStatus
  operationPermissions: any
}

// 任务权限
export function useTaskPermission({ workItemStatus, operationPermissions }: TaskPermissionParams) {
  const isArchived = workItemStatus.type === WorkItemStatusType.ARCHIVED // 是否归档

  // 权限检查函数
  const hasPermission = (key: keyof Permissions) =>
    operationPermissions && operationPermissions[key] === true

  const permissionMap = new Map<keyof Permissions, string>([
    [WorkItemPerm.WORK_ITEM_MODIFY, PermissionKey.AllowEdit],
    [WorkItemPerm.FLOW_NODE_CONFIRM_STATE, PermissionKey.AllowNode], // 不受isArchived影响
    [WorkItemPerm.WORK_ITEM_CHANGE_STATE, PermissionKey.AllowChangeState],
    [WorkItemPerm.FLOW_NODE_MODIFY, PermissionKey.AllowNodeEdit],
    [WorkItemPerm.COMMENT, PermissionKey.AllowComment],
    [WorkItemPerm.REMIND, PermissionKey.AllowRemind],
    [WorkItemPerm.WORK_ITEM_DELETE, PermissionKey.AllowDelete],
    [WorkItemPerm.OBJECT_CREATE, PermissionKey.AllowObjectCreate],
    [WorkItemPerm.OBJECT_MODIFY, PermissionKey.AllowObjectEdit],
    [WorkItemPerm.VERSION_CREATE, PermissionKey.AllowVersionCreate],
    [WorkItemPerm.VERSION_MODIFY, PermissionKey.AllowVersionEdit],
    [WorkItemPerm.TAG_CREATE, PermissionKey.AllowTagCreate],
    [WorkItemPerm.TASK_CHILD_CREATE, PermissionKey.AllowChildCreate],
  ])

  // 定义不需要判断isArchived的权限
  const permissionsExemptFromArchived = [PermissionKey.AllowNode, PermissionKey.AllowChangeState, PermissionKey.AllowComment]

  // 根据映射动态构建perms对象
  const perms = Array.from(permissionMap.entries()).reduce((acc: { [key: string]: boolean }, [permKey, permName]) => {
    // 特殊处理不需要判断isArchived的权限
    acc[permName] = permissionsExemptFromArchived.includes(permName as PermissionKey) ? hasPermission(permKey) : hasPermission(permKey) && !isArchived
    return acc
  }, {}) as TaskPermission
  return {
    perms,
    isArchived,
  }
}

interface FormPermissionParams extends TaskPermissionParams {
  parentWorkItemStatus?: WorkItemStatus
  currentNode?: TemplateConfNode
}

export interface BtnPermission {
  showClose: boolean
  showCloseRestart: boolean
  showRollBack: boolean
  showCompleteRestart: boolean
  showResume: boolean
  showTemplate: boolean
  showSubmit: boolean
  showRestart: boolean
}

export function useFormPermission() {
  const perms = ref({}) as Ref<TaskPermission>
  const isArchived = ref(true) as Ref<boolean>
  const btns = ref({
    showClose: false,
    showCloseRestart: false,
    showRollBack: false,
    showCompleteRestart: false,
    showResume: false,
    showTemplate: false,
    showSubmit: false,
    showRestart: false,
  })

  function initFormPermission({ parentWorkItemStatus, currentNode, workItemStatus, operationPermissions }: FormPermissionParams) {
    const { perms: taskPerms, isArchived: taskIsArchived } = useTaskPermission({ workItemStatus, operationPermissions })
    perms.value = taskPerms
    isArchived.value = taskIsArchived

    const parentArchived = parentWorkItemStatus?.type === WorkItemStatusType.ARCHIVED
    const isClose = workItemStatus.key === TaskStatusKey.CLOSE
    const isTerminated = workItemStatus.key === TaskStatusKey.TERMINATED
    const isComplete = workItemStatus.key === TaskStatusKey.COMPLETED

    btns.value = {
      // 关闭、重启(关闭后的重启)
      showClose: taskPerms.allowNode && !taskIsArchived && Boolean(currentNode?.enableClose),
      showCloseRestart: taskPerms.allowNode && isClose,
      // 回滚
      showRollBack: taskPerms.allowNode && !taskIsArchived && Boolean(currentNode?.enableRollback),
      // 已完成 重启
      showCompleteRestart: taskPerms.allowChangeState && isComplete,
      // 恢复
      showResume: taskPerms.allowChangeState && isTerminated,
      // 流转
      showTemplate: taskPerms.allowNode && !taskIsArchived,
      // 子任务完成
      showSubmit: taskPerms.allowChangeState && !parentArchived && !taskIsArchived,
      showRestart: taskPerms.allowChangeState && !parentArchived && isComplete,
    }
  }

  return {
    perms,
    isArchived,
    btns,
    initFormPermission,
  }
}
