// 下拉选项
export interface SelectOptions {
  label: string
  value: string | number
}

// 流程原因
export interface CustomFlowReason {
  terminatedReasonList: SelectOptions[]
  rebootReasonList: SelectOptions[]
  resumeReasonList: SelectOptions[]
}

// 流程节点原因
export interface CustomflowNodeReason {
  closeReasonList: SelectOptions[]
  restartReasonList: SelectOptions[]
  rollbackReasonList: SelectOptions[]
}

// 权限
export interface Permissions {
  [key: string]: boolean
}
