import type { StringChain } from 'lodash'
import type { CustomFlowReason, CustomflowNodeReason, SelectOptions } from '@/typings/common'
import type { NodeStatus } from '@/enum/NodeStatus'

export interface Node {
  name: string
  key: string
}

export interface Connection {
  startNode: string
  endNode: string
}

export interface WorkFlowConf {
  nodes: Node[]
  connections: Connection[]
}

export interface WorkflowPageListData {
  id: string
  name: string
  status: string
  version: string
  templateId: string
  spaceId: string
  createdAt: string
  updatedAt: string
  userId: string
  ranking: number
  workFlowConf: WorkFlowConf
  list: any[]
}

// 流程模板

export interface WorkFlowTemplateData {
  id: string
  workItemTypeId: string
  spaceId: string
  name: string
  ranking: string
  version: number
  createdAt: string
  updatedAt: string
  flowMode: string
  status: number
  templateId: string
  templateConf: TemplateConf
}

export interface TemplateConf extends CustomFlowReason {
  resumeReasonOptions: string[]
  enableResumeReasonOtherOption: boolean
  enableTerminatedReasonOtherOption: boolean
  enableRebootReasonOtherOption: boolean
  rebootReasonOptions: string[]
  terminatedReasonOptions: string[]
  uuid: string
  version: string
  key: string
  nodes: TemplateConfNode[]
  connections: TemplateConfConnection[]
  formFields: { name: string, value: string }[]
}

export interface TemplateConfNode extends CustomflowNodeReason {
  $isDelay: boolean
  $flowNodeStatus: NodeStatus
  $owner: any
  name: string
  key: string
  startMode: string
  belongStatus: string
  needDoneOperator: boolean
  doneOperationRole: string[]
  passMode: string
  onReach: any
  onPass: any
  enableRollback: boolean
  owner: Owner
  doneOperationDisplayName: string
  enableClose: boolean
  startAt: StringChain
  enableCloseReasonOtherOption: boolean
  enableRestartReasonOtherOption: boolean
  enableRollbackReasonOtherOption: boolean
  closeReasonOptions: string[]
  restartReasonOptions: string[]
  rollbackReasonOptions: string[]
}

interface Owner {
  forceOwner: boolean
  usageMode: string
  value: string
  ownerRole: OwnerRole[]
}

interface OwnerRole {
  id: string
  key: string
  uuid: string
}

export interface TemplateConfConnection {
  startNode: string
  endNode: string
}
