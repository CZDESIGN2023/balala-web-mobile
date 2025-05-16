import { SpaceRole } from '@/enum'
import { useSpaceStore } from '@/stores/modules/space'
import { AUTH_LIST } from '@/config'

// 成员权限映射表
export const userRoleMap = new Map()
userRoleMap.set(SpaceRole.CREATOR, [
  SpaceRole.SUPER_MANAGER,
  SpaceRole.MANAGER,
  SpaceRole.EDITOR,
  SpaceRole.WATCHER,
])
userRoleMap.set(SpaceRole.SUPER_MANAGER, [SpaceRole.MANAGER, SpaceRole.EDITOR, SpaceRole.WATCHER])
userRoleMap.set(SpaceRole.MANAGER, [SpaceRole.EDITOR, SpaceRole.WATCHER])
userRoleMap.set(SpaceRole.EDITOR, [])
userRoleMap.set(SpaceRole.WATCHER, [])

export function userAuth(roleId: number) {
  const spaceStore = useSpaceStore()
  const role = userRoleMap.get(spaceStore.userRole) || []
  return role.includes(roleId)
}

export function getUserPermSelect(roleId: number) {
  const spaceStore = useSpaceStore()
  const roles = userAuth(roleId)
  const list = []
  if (!roles || spaceStore.userRole === 0)
    list.push(AUTH_LIST[1], AUTH_LIST[2], AUTH_LIST[3])

  if (roles.length === 0)
    return []

  switch (spaceStore.userRole) {
    case SpaceRole.CREATOR:
      if (roleId === SpaceRole.SUPER_MANAGER) {
        list.push({
          id: 99,
          title: '转移创建者',
          desc: '拥有项目空间所有权限',
        })
      }
      else {
        list.push(AUTH_LIST[1], AUTH_LIST[2], AUTH_LIST[3])
      }
      break
    case SpaceRole.SUPER_MANAGER:
      list.push(AUTH_LIST[1], AUTH_LIST[2], AUTH_LIST[3])
      break
    case SpaceRole.MANAGER:
      list.push(AUTH_LIST[2], AUTH_LIST[3])
      break
  }
  return list
}

// ['项目创建者'] = {
//   ['项目管理员'] => ['转项目'],
//   ['可管理'] => ['转管理','转编辑','转查看'],
//   ['可编辑'] => ['转管理','转编辑','转查看'],
//   ['可查看'] => ['转管理','转编辑','转查看'],
// }
// ['项目管理员'] = {
//   ['可管理'] => ['转管理','转编辑','转查看'],
//   ['可编辑'] => ['转管理','转编辑','转查看'],
//   ['可查看'] => ['转管理','转编辑','转查看'],
// }

// ['可管理'] = {
//   ['可编辑'] => ['转管理','转编辑','转查看'],
//   ['可查看'] => ['转管理','转编辑','转查看'],
// }
