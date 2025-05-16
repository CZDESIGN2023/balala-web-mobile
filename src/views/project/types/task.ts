import type { WorkDetailNodesInfo, WorkDetailTaskDirector } from '@/api/interface'

interface OnReach$1 {
  eventType: string
  condition: string
  targetSubStage: string
}

interface Owner$2 {
  forceOwner: boolean
  usageMode: string
  value: string
  ownerRole: Array<string>
}

interface Info$3 {
  id: string
  workItemId: string
  flowNodeUuid: string
  flowNodeStatus: number
  flowNodeCode: string
  flowNodePassed: number
  flowNodeReached: number
  flowMode: string
  flowModeVersion: string
  flowModeCode: string
  startAt: string
  finishAt: string
  directors: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  spaceId: string
  planStartAt: string
  planCompleteAt: string
}

interface Director$4 {
  id: string
  userId: string
  userName: string
  userNickname: string
  avatar: string
}

export interface NodeInfo {
  name: string
  code: string
  startMode: string
  belongStatus: string
  needDoneOperator: boolean
  doneOperationRole: Array<string>
  passMode: string
  onReach: Array<OnReach$1>
  onPass: Array<unknown>
  enableRollback: boolean
  owner: Owner$2
  doneOperationDisplayName: string
  enableClose: boolean
  startAt: string
  Info: Info$3
  director: Array<Director$4>
  color: string
  isDelay: boolean
  isRestart: boolean
  restartUser: null
}

export interface TaskFooter {
  btnData: TaskFooterBtn
  isShowAdd: boolean
  isShowEdit: boolean
  isShowComment: boolean
}

export interface TaskFooterBtn {
  isShowComment?: boolean
  isShowRollBack?: boolean
  isShowClose?: boolean
  isShowTemplate?: boolean
  isShowCompleteRestart?: boolean
  isShowCloseRestart?: boolean
  isShowResume?: boolean
  isShowSubmit?: boolean
  isShowChildRestart?: boolean
  isShowConfirmBtn?: boolean
  isShowCancelBtn?: boolean
}

export interface Permissions {
  'comment'?: boolean
  'flow_node.confirm_state'?: boolean
  'flow_node.modify'?: boolean
  'object.create'?: boolean
  'object.modify'?: boolean
  'remind'?: boolean
  'tag.create'?: boolean
  'task.create'?: boolean
  'version.create'?: boolean
  'version.modify'?: boolean
  'work_item.create'?: boolean
  'work_item.delete'?: boolean
  'work_item.modify'?: boolean
  'work_item.change_state'?: boolean
}

export interface TaskDialogInfo {
  dialogVisible: boolean
  origin: 'HOME' | 'PROJECT'
  type: 'ADD' | 'EDIT'
  params?: TaskDialogInfoParams
}

export interface TaskDialogInfoParams {
  spaceId?: string
  workItemId?: string
}

export interface TaskFooterBtn {
  handle: string
  text: string
  size: string
  class: string
  isPlain?: boolean
  type?: string
  show: boolean
}

export interface CurrentNode {
  director: WorkDetailTaskDirector[]
  rawDirector: WorkDetailTaskDirector[]
  directorIds: string[]
  role: string
}
