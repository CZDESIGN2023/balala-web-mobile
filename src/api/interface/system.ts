import type { FilterParams } from '@/api/interface/component'
import type { QueryConditionGroup } from '@/components/BSearchFilter/interface'

export interface SystemConfig {
  id: string
  configName: string
  configKey: string
  configValue: string
}

export interface SystemData {
  config: SystemConfig[]
}

export interface WorkbenchCount {
  completeRate?: string
  completed: string
  processing: string
  total?: string
  weekProcessing?: string
  weekCompleted?: string
  doneConditionGroup?: FilterParams
  processingConditionGroup?: FilterParams
  followedConditionGroup?: FilterParams
  weekProcessingConditionGroup?: FilterParams
  followed?: string
  processingAndExpiredRate?: string
}

export interface UserWorkbenchCount {
  completed: string
  doneConditionGroup?: QueryConditionGroup
  followed: string
  followedConditionGroup?: QueryConditionGroup
  processingConditionGroup?: QueryConditionGroup
  processing: string
  weekCompleted: string
  weekDoneConditionGroup?: QueryConditionGroup
  weekProcessingConditionGroup?: QueryConditionGroup
  weekProcessing: string
  created: string
  createdConditionGroup?: QueryConditionGroup
  participatedProcessing: string
  participatedProcessingConditionGroup?: QueryConditionGroup
}

export interface UserWorkbenchCountItem {
  type: string
  count: string
  condition?: QueryConditionGroup
  label: string
  tip: string
}

export interface LoginItemInfo {
  id: string
  loginUserId: string
  loginUserName: string
  loginUserNickname: string
  ipaddr: string
  loginLocation: string
  browser: string
  os: string
  status: number
  msg: string
  loginAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

export interface LogItemInfo {
  id: string
  title: string
  businessType: number
  method: string
  requestMethod: string
  moduleType: number
  moduleId: string
  operatorType: number
  operId: string
  operName: string
  operNickname: string
  operUrl: string
  operIp: string
  operLocation: string
  operParam: string
  operMsg: string
  operTimeAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  spaceId: string
}

export interface LoginItem {
  info: LoginItemInfo
}

export interface LogItem {
  info: LogItemInfo
}

export interface LoginList {
  items: Array<LoginItem>
  hasNext: boolean
  nextPos: string
}

export interface LogList {
  items: Array<LogItem>
  hasNext: boolean
  nextPos: string
}

export interface LoginLog {
  data: LoginList
}
