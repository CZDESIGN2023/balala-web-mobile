export enum TypeDesc {
  AddMember = 1, // 添加成员
  RemoveMember = 2, // 移除成员
  QuitSpace = 3, // 离开空间
  ChangeRole = 4, // 权限变更
  ChangeSpaceName = 5, // 空间名称变更
  ChangeSpaceDescribe = 6, // 空间描述变更
  DeleteSpace = 7, // 删除空间
  TransferSpace = 8, // 转让空间
  ChangeSpaceNotify = 9, // 修改项目通知
  RollbackWorkItem = 10, // 回滚工作项
  CloseWorkItem = 11, // 关闭工作项
  TerminateWorkItem = 12, // 终止工作项
  CompleteWorkItem = 13, // 完成工作项
  RestartWorkItem = 14, // 重启工作项
  AddCommentEvent = 15, // 添加评论
  ResumeWorkItem = 17, // 恢复工作项
  DeleteWorkItem = 18, // 删除工作项
  TransferWorkItem = 19, // 转移工作项
  DeleteComment = 20, // 删除评论
  UpdateComment = 21, // 更新评论
  DeleteTag = 23, // 删除标签

  ChangeWorkItemField = 102, // 工作项名称变更
  ChangeWorkItemDirector = 104, // 工作项负责人变更
  ChangeWorkItemTag = 107, // 工作项标签变更
  CreateChildWorkItem = 112, // 创建子工作项
  SetWorkItemFile = 113, // 删除工作项附件
  ChangeWorkItemFlowNode = 114, // 工作项流程节点变更
  SetSpaceNotify = 117, // 设置空间通知
  SetSpaceWorkingDay = 118, // 设置空间工作日
  SpaceAbnormal = 120, // 空间异常
  RemindWork = 121, // 催单通知 提醒工作项负责人
  ChangeWorkFlowNodePlanTime = 122, // 修改工作流节点计划时间
  SetCommentDeletable = 123, // 设置评论删除权限
  AddSpaceManager = 130, // 添加空间管理员
  RemoveSpaceManager = 131, // 移除空间管理员
  CreateMemberCategory = 140, // 创建自定义用户组
  DeleteMemberCategory = 141, // 移除自定义用户组

  CreateWorkFlow = 150, // 创建流程
  DeleteWorkFlow = 151, // 删除流程
  ChangeWorkFlowField = 152, // 修改流程字段
  SaveWorkFlowTemplate = 153, // 保存流程模板
  DisableWorkFlow = 154, // 禁用任务流程
  UpgradeWorkFlow = 155, // 升级任务流程

  WorkItemExpired = 200, // 工作项过期
}

// 操作者类型
export enum SubjectType {
  USER = 'USER',
}

// 被操作对象类型
export enum ObjectType {
  SPACE = 'SPACE',
  WORK_ITEM = 'WORK_ITEM',
  WORK_FLOW = 'WORK_FLOW',
  COMMENT = 'COMMENT',
  USER = 'USER',
}

// 操作行为类型
export enum ActionType {
  ADD = 'ADD',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
}

// 被通知人与被操作对象的关系
export enum RelationType {
  WORK_ITEM_FOLLOWER = 'WORK_ITEM_FOLLOWER',
  WORK_ITEM_DIRECTOR = 'WORK_ITEM_DIRECTOR',
  COMMENT_AT = 'COMMENT_AT',
  WORK_ITEM_OWNER = 'WORK_ITEM_OWNER',
  WORK_ITEM_TODO = 'WORK_ITEM_TODO',
}
