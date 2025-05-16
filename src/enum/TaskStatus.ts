// 工作任务状态枚举, 系统预设
export enum TaskStatus {
  PROGRESSING = '1', // 进行中
  COMPLETED = '2', // 完成
  TERMINATED = '3', // 终止
  CLOSE = '8', // 已关闭
}

export enum TaskStatusKey {
  COMPLETED = 'completed', // 完成 1
  TERMINATED = 'terminated', // 终止
  CLOSE = 'close', // 已关闭
  PROGRESSING = 'progressing', // 进行中：子任务专用
}

// 待办任务状态列表 TODO: 待办状态列表现在如何获取？
export function progressTaskStatusList() {
  return [
    TaskStatus.PROGRESSING,
    // TaskStatus.TESTING,
    // TaskStatus.CHECKING,
    // TaskStatus.WAIT_CONFIRM,
    // TaskStatus.DESIGNING,
    // TaskStatus.PLANNING,
  ]
}

// 快速完成状态列表 TODO: 快速完成列表现在如何判断？
export function quickTaskStatusList() {
  return [
    TaskStatus.PROGRESSING,
    // TaskStatus.TESTING,
    // TaskStatus.CHECKING,
    // TaskStatus.WAIT_CONFIRM,
    // TaskStatus.DESIGNING,
    // TaskStatus.PLANNING,
  ]
}

export function archivedTaskStatusList() {
  return [TaskStatusKey.COMPLETED, TaskStatusKey.TERMINATED, TaskStatusKey.CLOSE]
}

export function archivedTaskStatusListId() {
  return [TaskStatus.COMPLETED, TaskStatus.TERMINATED, TaskStatus.CLOSE]
}

export const archivedTaskStatus = [
  TaskStatus.COMPLETED,
  TaskStatus.TERMINATED,
  TaskStatus.CLOSE,
]

export enum WorkItemStatusType {
  PROCESS = '2', // 过程
  ARCHIVED = '3', // 归档
}
