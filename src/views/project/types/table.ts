import type { WorkItemStatus } from 'src/api/interface/index'
import type { CustomflowNodeReason, SelectOptions } from '@/typings/common'

export interface CommentItemUser {
  userId?: string
  userName?: string
  userNickname?: string
  avatar?: string
}

export interface CommentItem {
  id?: string
  content?: string
  createdAt?: string
  updatedAt?: string
  user?: CommentItemUser
}

export interface CommentHoverData {
  loading: boolean
  commentSkeleton: boolean
  data: CommentItem
  renderValue: number
  key: string
}

export interface ConfirmPopoverData {
  value: string
  select: null | number | string
  reason: null | string
}

// 服务端任务数据
export interface ServerWorkItem {
  id: string
  spaceId: string
  userId: string
  workObjectId: string
  workObjectName: string
  workItemName: string
  planTime: {
    startAt: string
    completeAt: string
  }
  processRate: number
  createdAt: string
  updatedAt: string
  deletedAt: string
  priority: string
  pid: string
  spaceName: string
  flowId: string // 任务流程 id
  flowKey: string // 任务流程 key
  flowName: string // 任务流程名称
  workFlowTemplateId: string
  lastStatusAt: string // 状态最后修改时间
  lastStatus: string
  iconFlags: Array< number >
  spaceRoleId: string // 当前用户在这条任务所属项目的权限
  isRestart: number
  restartAt: string
  restartUserId: string
  restartUser: User | null
  unreadCommentNum: number
  resumeAt: string // 恢复时间
  parentStatus: WorkItemStatus | null // 父级任务状态
  followed: boolean
  versionId: string
  versionName: string
  directors: Array<User>
  creator: User
  flowNode: WorkFlowNode
  participators: Array<User> // 参与人
  workItemStatus: WorkItemStatus
}

// 自定义任务数据
export interface CustomRowFields {
  key: string
  rowKey: string
  children: TableRowData[]
  isGroup: boolean // 是否是分组行
  parentId: number
  displayName: string // 分组名称
  fieldKey: string // 分组 key
  total: number //  总任务条数（主任务+子任务）
  perm: {
    allowEdit: boolean
    allowNode: boolean
    allowChangeState: boolean
  }
  loading: boolean // 是否展示骨架信息
  isExpanded: boolean // 树结构表格是否是展开
  formatPlanTime: string // 排期时间
  formatStatusTime: string // 节点时间
  flowColor: string // 任务流程颜色
  statuColor: string // 任务状态颜色
}

// 表格行数据
export type TableRowData = ServerWorkItem & CustomRowFields

export interface User {
  avatar: string
  id: string
  userId: string
  userName: string
  userNickname: string
}

export interface WorkFlowNode extends CustomflowNodeReason {
  name: string
  key: string
  startMode: string
  belongStatus: string
  needDoneOperator: boolean
  doneOperationRole: Array<string>
  passMode: string
  onReach: Array<OnReachType>
  onPass: Array<unknown>
  enableRollback: boolean
  owner: OwnerType
  doneOperationDisplayName: string
  enableClose: boolean
  startAt: string
  enableCloseReasonOtherOption: boolean
  enableRestartReasonOtherOption: boolean
  enableRollbackReasonOtherOption: boolean
  rollbackReasonOptions: Array<string>
  restartReasonOptions: Array<string>
  closeReasonOptions: Array<string>
}

// 分组信息
export interface WorkGroupItem {
  id: string | number
  parentId: string | number
  workItemId: string | number
  workItems: WorkGroupItem[]
}

export interface WorkGroupInfo {
  total: number
  parentId: any
  id: any
  workItems: WorkGroupItem[]
  fieldId: string | undefined
  fieldKey: string
  displayName: string
}

export interface WorkGroup {
  groupInfo: WorkGroupInfo[]
  workItems: WorkGroupItem[]
}

interface TargetSubStateType {
  id: string
  key: string
  uuid: string
  val: string
}

interface OnReachType {
  eventType: string
  condition: string
  targetSubState: TargetSubStateType
}

interface OwnerRoleType {
  id: string
  key: string
  uuid: string
}

interface OwnerType {
  forceOwner: boolean
  usageMode: string
  value: string
  ownerRole: Array<OwnerRoleType>
}
