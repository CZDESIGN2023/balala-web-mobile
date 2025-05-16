import type { App } from 'vue'
import { SpaceRole } from '@/enum'
import { Perm } from '@/enum/permission'
import { useSpaceStore } from '@/stores/modules/space'

type Role = SpaceRole.CREATOR | SpaceRole.SUPER_MANAGER | SpaceRole.MANAGER | SpaceRole.EDITOR | SpaceRole.WATCHER

// 定义角色层次结构，将每个角色映射到层次结构中低于它的所有角色。
const roleHierarchy: Record<Role, Role[]> = {
  [SpaceRole.CREATOR]: [SpaceRole.SUPER_MANAGER],
  [SpaceRole.SUPER_MANAGER]: [SpaceRole.MANAGER],
  [SpaceRole.MANAGER]: [SpaceRole.EDITOR],
  [SpaceRole.EDITOR]: [SpaceRole.WATCHER],
  [SpaceRole.WATCHER]: [],
}

// 角色角色权限
const rolePermissions: Record<Role, Perm[]> = {
  [SpaceRole.CREATOR]: [
    Perm.DeleteSpace,
    Perm.AddSpaceSuperManager,
    Perm.RemoveSpaceSuperManager,
    Perm.TransferSpaceCreator,
    Perm.ModifyUserPermission,
  ],
  [SpaceRole.SUPER_MANAGER]: [
    Perm.ModifySpaceNotify,
    Perm.ModifySpaceComment,
    Perm.ModifySpaceWorkingDay,
    Perm.CreateWorkFlowRole,
    Perm.ModifyWorkFlowRole,
    Perm.DeleteWorkFlowRole,
    Perm.DragWorkFlowRole,
    Perm.CreateWorkFlowStatus,
    Perm.ModifyUserPermission,
    Perm.ModifyWorkFlowStatus,
    Perm.DeleteWorkFlowStatus,
    Perm.DragWorkFlowStatus,
    Perm.CreateSpaceWorkFlow,
    Perm.ModifySpaceWorkFlow,
    Perm.UpdateSpaceWorkFlow,
    Perm.UpdateSpaceWorkFlowStatus,
    Perm.CopySpaceWorkFlow,
    Perm.DeleteSpaceWorkFlow,
    Perm.SpaceOperationLogRouter,
    Perm.DeleteWorkItemComment,
  ],
  [SpaceRole.MANAGER]: [
    Perm.ModifySpaceName,
    Perm.ModifySpaceDesc,
    Perm.CreateSpaceWorkObject,
    Perm.ModifySpaceWorkObject,
    Perm.DeleteSpaceWorkObject,
    Perm.DragSpaceWorkObject,
    Perm.CreateSpaceWorkVersion,
    Perm.ModifySpaceWorkVersion,
    Perm.DeleteSpaceWorkVersion,
    Perm.DragSpaceWorkVersion,
    Perm.AddSpaceMember,
    Perm.ModifySpaceMember,
    Perm.RemoveSpaceMember,
  ],
  [SpaceRole.EDITOR]: [
    Perm.CreateSpaceWorkItem,
    Perm.CreateSpaceTag,
    Perm.ModifySpaceTag,
    Perm.DeleteSpaceTag,
  ],
  [SpaceRole.WATCHER]: [
    Perm.QuitSpace,
    Perm.WatchSpaceWorkFlow,
  ],
}

// 预计算角色层次结构的传递闭包。
function transitiveRoleHierarchy(role: Role): Role[] {
  const roles: Role[] = [role]
  for (const childRole of roleHierarchy[role]) {
    roles.push(...transitiveRoleHierarchy(childRole))
  }
  return roles
}

// 预计算每个角色的权限，包括所有较低角色的权限。
const computedPermissions: Record<Role, Perm[]> = Object.fromEntries(
  Object.keys(rolePermissions).map((role) => {
    const roles = transitiveRoleHierarchy(role as unknown as Role)
    const permissions = roles.flatMap(r => rolePermissions[r])
    return [role, permissions]
  }),
) as Record<Role, Perm[]>

export function usePermission() {
  const spaceStore = useSpaceStore()

  const checkPerm = (action: Perm): boolean => {
    const userRole = spaceStore.userRole as Role
    if (!userRole)
      return false
    return computedPermissions[userRole].includes(action)
  }

  return {
    checkPerm,
  }
}
