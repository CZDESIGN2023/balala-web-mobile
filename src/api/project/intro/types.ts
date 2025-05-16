// 模块基础信息
export interface ModuleItemInfo {
  id: string
  spaceId: string
  userId: string
  workObjectGuid: string
  workObjectName: string
  workObjectStatus: number
  ranking: string
  createdAt: string
  updatedAt: string
}

// 模块统计信息
export interface ModuleItemStats {
  id: string
  completed: string
  processing: string
  expired: string
  closedOrTerminated: string
  completeRate: string
  weekProcessing: string
  total: string
  none: any
  priorityInfos: {
    priority: string
    count: string
  }[]
}

// 获取模块列表统计入参
export interface ModuleStatsParams {
  spaceId: string
  ids: string[]
  startTime?: string
  endTime?: string
}

// 模块自定义信息
export interface ModuleItemCustom {
  stats: ModuleItemStats
}

export type ModuleItem = ModuleItemInfo & ModuleItemStats & ModuleItemCustom

export interface ModuleList {
  list: ModuleItem[]
}

export interface ModuleStatsList {
  list: ModuleItemStats[]
}

// 版本基础信息
export interface VersionItemInfo {
  createdAt: string
  deletedAt: string
  id: string
  ranking: string
  remark: string
  spaceId: string
  updatedAt: string
  versionKey: string
  versionName: string
  versionStatus: string
}

// 版本统计信息
export interface VersionItemStats {
  completeRate: string
  id: string
  processing: string
  total: string
  weekProcessing: string
  completed: string
  expired: string
  closedOrTerminated: string
  priorityInfos: {
    priority: string
    count: string
  }[]
}

// 版本自定义信息
export interface VersionItemCustom {
  stats: VersionItemStats
}

export interface TaskVersionList {
  list: VersionItemInfo[]
}

export type VersionItem = VersionItemInfo & VersionItemStats & VersionItemCustom

export interface VersionStatsParams {
  spaceId: string
  ids: string[]
  startTime: string
  endTime: string
}

// 用户基础信息
export interface UserItemInfo {
  [x: string]: any
  avatar?: string
  id: string
  memberId: string
  mobile?: string
  roleId: number
  spaceId: string
  userId: string
  userName: string
  userNickname: string
  userPinyin?: string
  userStatus: number
  active?: boolean
  disabled?: boolean
  value?: string
  label?: string
  isCreator?: string
  processing?: string
  total?: string
  weekProcessing?: string
  popVisible?: boolean
}

export interface TaskUserList {
  list: UserItemInfo[]
}

export interface UserItemStats {
  id: string
  completeRate: string
  userId: string
  processing: string
  total: string
  weekProcessing: string
  completed: string
  expired: string
  closedOrTerminated: string
  priorityInfos: {
    priority: string
    count: string
  }[]
}

export interface UserItemCustom {
  stats: UserItemStats
}

export interface UserStatsParams {
  spaceId: string
  ids: string[]
  startTime: string
  endTime: string
}

export interface CreateProjectUsers {
  userId: string
  roleId: number | undefined
}

export type UserItem = UserItemInfo & UserItemStats & UserItemCustom
