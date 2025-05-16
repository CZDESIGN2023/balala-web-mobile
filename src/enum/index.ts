/**
 * @description：文件后缀 类型
 */
export enum FileSuffix {
  TXT = 'txt',
  ZIP = 'zip',
  EXCEL = 'excel',
  WORD = 'word',
  PPT = 'ppt',
  VIDEO = 'video',
  MUSIC = 'music',
  UNKOWN = 'unkown',
  PIC = 'pic',
  PDF = 'pdf',
}

export enum FilterEnum {
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  EQ = 'EQ',
  NOT_EQ = 'NOT_EQ',
  INCLUDE = 'INCLUDE',
  NOT_INCLUDE = 'NOT_INCLUDE',
  BETWEEN = 'BETWEEN',
}

export enum SpaceRole {
  // 项目创建者
  CREATOR = 999,
  // 超级管理员
  SUPER_MANAGER = 99,
  // 可管理
  MANAGER = 1,
  // 可编辑
  EDITOR = 2,
  // 可查看
  WATCHER = 3,
}

export enum SpaceAction {
  CREATE_TASK = 'create_task',
  MANAGER_PROJECT = 'manager_project',
}

export enum WorkItemPerm {
  // 任务创建
  WORK_ITEM_CREATE = 'work_item.create',
  // 任务编辑
  WORK_ITEM_MODIFY = 'work_item.modify',
  // 任务删除
  WORK_ITEM_DELETE = 'work_item.delete',
  // 任务状态变更
  WORK_ITEM_CHANGE_STATE = 'work_item.change_state',
  // 任务节点修改
  FLOW_NODE_MODIFY = 'flow_node.modify',
  // 任务节点流转
  FLOW_NODE_CONFIRM_STATE = 'flow_node.confirm_state',
  // 任务模块创建
  OBJECT_CREATE = 'object.create',
  // 任务模块修改
  OBJECT_MODIFY = 'object.modify',
  // 任务版本创建
  VERSION_CREATE = 'version.create',
  // 任务版本修改
  VERSION_MODIFY = 'version.modify',
  // 任务标签创建
  TAG_CREATE = 'tag.create',
  // 是否可评论
  COMMENT = 'comment',
  // 是否可提醒
  REMIND = 'remind',
  // 子任务创建
  TASK_CHILD_CREATE = 'task.create',
  // 任务流程升级
  FLOW_UPGRADE = 'flow.upgrade',
}

// 模块新增编辑枚举
export enum Scene {
  WORK_ITEM_CREATE = 'work_item_create',
  WORK_ITEM_EDIT = 'work_item_edit',
}

export enum TaskDrawerOpenType {
  DASHBOARD = 'dashboard',
  PROJECT = 'project',
  DETAIL = 'detail',
  CHILD_DETAIL = 'child_detail',
}

export enum ConfigKey {
  NOTIFY_REDIRECT_DOMAIN = 'notify.redirect.domain',
  SPACE_FILE_DOMAIN = 'space.file.domain',
  USER_AVATAR_DOMAIN = 'user.avatar.domain',
  ASSECT_DOMIN = 'balala.assect.domain',
  LOGO = 'balala.logo',
  TITLE = 'balala.title',
  REGISTER_ENTRY = 'balala.register.entry',
  BG = 'balala.bg',
  ATTACH = 'balala.attach',
}

export enum TaskType {
  DEMAND = 1,
  BUG = 2,
  UI = 3,
  DESIGN = 4,
}
