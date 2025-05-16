// 项目权限
export enum Perm {
  // 项目信息
  AddSpaceSuperManager = 'ADD_SPACE_SUPER_MANAGER', // 添加项目管理员
  RemoveSpaceSuperManager = 'REMOVE_SPACE_SUPER_MANAGER', // 移除项目管理员
  TransferSpaceCreator = 'TRANSFER_SPACE_CREATER', // 转让项目创建者
  CreateSpaceWorkItem = 'CREATE_SPACE_WORK_ITEM', // 创建任务
  ModifySpaceName = 'MODIFY_SPACE_NAME', // 修改项目名称
  ModifySpaceDesc = 'MODIFY_SPACE_DESC', // 修改项目描述
  ModifySpaceNotify = 'MODIFY_SPACE_NOTIFY', // 修改消息推送设置
  ModifySpaceComment = 'MODIFY_SPACE_COMMENT', // 修改评论配置
  ModifyUserPermission = 'MODIFY_USER_PERMISSION', // 修改成员权限
  ModifySpaceWorkingDay = 'MODIFY_SPACE_WORKING_DAY', // 修改工作日周期
  QuitSpace = 'QUIT_SPACE', // 离开项目
  DeleteSpace = 'DELETE_SPACE', // 删除项目
  // 模块管理
  CreateSpaceWorkObject = 'CREATE_SPACE_WORK_OBJECT', // 添加模块
  ModifySpaceWorkObject = 'MODIFY_SPACE_WORK_OBJECT', // 编辑模块
  DeleteSpaceWorkObject = 'DELETE_SPACE_WORK_OBJECT', // 删除模块
  DragSpaceWorkObject = 'DRAG_SPACE_WORK_OBJECT', // 拖拽模块
  // 版本管理
  CreateSpaceWorkVersion = 'CREATE_SPACE_WORK_VERSION', // 添加版本
  ModifySpaceWorkVersion = 'MODIFY_SPACE_WORK_VERSION', // 编辑版本
  DeleteSpaceWorkVersion = 'DELETE_SPACE_WORK_VERSION', // 删除版本
  DragSpaceWorkVersion = 'DRAG_SPACE_WORK_VERSION', // 拖拽版本
  // 成员管理
  AddSpaceMember = 'ADD_SPACE_MEMBER', // 添加成员
  RemoveSpaceMember = 'REMOVE_SPACE_MEMBER', // 移除成员
  ModifySpaceMember = 'MODIFY_SPACE_MEMBER', // 修改成员
  // 标签管理
  CreateSpaceTag = 'CREATE_SPACE_TAG', // 创建标签
  ModifySpaceTag = 'MODIFY_SPACE_TAG', // 编辑标签
  DeleteSpaceTag = 'DELETE_SPACE_TAG', // 删除标签
  // 流程管理 - 角色管理
  CreateWorkFlowRole = 'CREATE_WORK_FLOW_ROLE', // 添加角色
  ModifyWorkFlowRole = 'MODIFY_WORK_FLOW_ROLE', // 编辑角色
  DeleteWorkFlowRole = 'DELETE_WORK_FLOW_ROLE', // 删除角色
  DragWorkFlowRole = 'DRAG_WORK_FLOW_ROLE', // 拖拽角色
  // 流程管理 - 状态管理
  CreateWorkFlowStatus = 'CREATE_WORK_FLOW_STATUS', // 添加状态
  ModifyWorkFlowStatus = 'MODIFY_WORK_FLOW_STATUS', // 编辑状态
  DeleteWorkFlowStatus = 'DELETE_WORK_FLOW_STATUS', // 删除状态
  DragWorkFlowStatus = 'DRAG_WORK_FLOW_STATUS', // 拖拽状态
  // 流程管理 - 其他
  CreateSpaceWorkFlow = 'CREATE_SPACE_WORK_FLOW', // 新建流程
  WatchSpaceWorkFlow = 'WATCH_SPACE_WORK_FLOW', // 查看流程
  ModifySpaceWorkFlow = 'MODIFY_SPACE_WORK_FLOW', // 编辑流程
  UpdateSpaceWorkFlow = 'UPDATE_SPACE_WORK_FLOW', // 流程升级
  UpdateSpaceWorkFlowStatus = 'UPDATE_SPACE_WORK_FLOW_STATU', // 流程禁用
  CopySpaceWorkFlow = 'COPY_SPACE_WORK_FLOW', // 流程复制
  DeleteSpaceWorkFlow = 'DELETE_SPACE_WORK_FLOW', // 流程删除
  // 操作日志
  SpaceOperationLogRouter = 'SPACE_OPERATION_LOG_ROUTER', // 路由权限

  // 评论
  DeleteWorkItemComment = 'DELETE_WORK_ITEM_COMMENT', // 删除评论
}
