import type { PlanTime } from '@/api/interface'

export interface Owner {
  type: 'role' | 'user'
  value: string
}

export interface OwnerRole {
  id: string | null
  key: string
}

export interface OwnerConfig {
  // 是否必须需要负责人 固定 true
  forceOwner: boolean
  // 负责人分配方式 none 不指定 appointed 指定负责人
  usageMode: 'none' | 'appointed'
  // 存储一些特别条件的信息，比如默认指定负责人
  value: {
    // 不指定，默认填充填充成员
    // type值: 用户: user, 其它角色: role
    fillOwner: Owner[]
    // 指定时: 可选成员范围
    appointedOwner: Owner[]
  }
  // 关联角色
  ownerRole: [OwnerRole]
}

export interface NodeProp {
  planTime: PlanTime
  key: string
  name: string
  owner: OwnerConfig
  $owner: string[] // 非接口数据
  $isDelay?: boolean // 是否延期
  $flowNodeStatus: any
  // 节点被激活模式 pre_node_all_done 前置节点均完成
  startMode: 'pre_node_all_done' // 固定值
  // 流程开始的第一个节点 "started"
  belongStatus: 'started' // 固定值
  // 节点完成方式 是否需要指定负责人
  needDoneOperator: true // 固定值
  // 节点完成方式可操作的相关角色 _node_owner 节点负责人 _space_manager 空间管理员 _creator 任务创建人 _space_editor 空间编辑人员   ["_node_owner", "_space_manager", "_creator", "_space_editor"]
  doneOperationRole: [] // 固定值
  // 流转按钮名称
  doneOperationDisplayName: string
  // 节点完成模式 auto_confirm 自动完成[忽略角色，直接完成] single_user_confirm 单人完成(需配合角色控制) all_user_confirm 多人确认完成(所有节点负责人)
  // 开始和完成节点固定写 auto_confirm，其它固定写 single_user_confirm
  passMode: 'auto_confirm' | 'single_user_confirm'
  // 是否支持回滚
  enableRollback: boolean
  enableRollbackReasonOtherOption: boolean
  enableCloseReasonOtherOption: boolean
  enableRestartReasonOtherOption: boolean
  // 重启原因
  restartReasonOptions: string[]
  // 回滚原因选项
  rollbackReasonOptions: string[]
  // 是否可关闭/重启
  enableClose: boolean
  // 关闭原因选项
  closeReasonOptions: string[]
  onReach: [{
    condition: string
    targetSubState: {
      id: string
      key: string
      val: string
    }
  }]
}

export interface TemplateConf {
  enableTerminatedReasonOtherOption: boolean
  enableResumeReasonOtherOption: boolean
  enableRebootReasonOtherOption: boolean
  resumeReasonOptions: string[]
  formFields: { name: string, value: string }[]
  rebootReasonOptions: string[]
  terminatedReasonOptions: string[]
  nodes: NodeProp[]
  connections: any[]
}

export interface Workflow {
  id: string
  flowId: string
  status: number
  name: string
  spaceId: string
  version: string
  flowConf: { [key: string]: any[] }
  templateConf: TemplateConf
}
