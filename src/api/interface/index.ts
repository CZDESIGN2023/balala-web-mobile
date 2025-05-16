import type { NodeStatus } from '@/enum/NodeStatus'
import type { TaskStatus, TaskStatusKey, WorkItemStatusType } from '@/enum/TaskStatus'

// 请求响应参数（包含data）
export interface ResultData<T = any> {
  _id: string
  data: T
}

export interface RegisterParam {
  userName: string
  nickName: string
  password: string
  confirmPassword?: string
  way: number
  pfToken: string
  avatar?: string
}

export interface LoginParam {
  userName: string
  password: string
  way: number
  pfToken: string
}

// 登录响应数据
export interface LoginData {
  token?: string
  jwtToken: string
  user: LoginUserInfo
  needRegister?: boolean
  needUpdatePwd?: string
  pfUserInfo?: string
}

export interface LoginUserInfo {
  id: string
  userName: string
  mobile: string
  userNickname: string
  userPinyin: string
  userPassword: string
  userSalt: string
  userStatus: number
  userEmail: string
  sex: number
  avatar: string
  remark: string
  describe: string
  lastLoginIp: string
  lastLoginTime: string
  createdAt: string
  updatedAt: string
  deletedAt: string
}

// 创建项目入参
export interface CreateProject {
  space_name: string
  describe?: string
  users?: CreateProjectUsers[]
}

export interface CreateProjectUsers {
  userId: string
  roleId: number | undefined
}

// 创建项目响应数据
export interface CreateProjectResponse {
  id: string
  userId: string
  spaceGuid: string
  spaceName: string
  spaceStatus: number
  remark: string
  describe: string
  createdAt: number
  updatedAt: number
  deletedAt: number
}

// 用户列表搜索入参
export interface UserListParam {
  py: string
}

// 用户列表响应数据
export interface UserList {
  list: UserListItem[]
}

export interface UserListItem {
  id: string
  userName: string
  mobile: string
  userNickname: string
  userPinyin: string
  userStatus: number
  userEmail: string
  sex: number
  avatar: string
  remark: string
  describe: string
  lastLoginIp: string
  lastLoginTime: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  active?: boolean
  dropdown?: boolean
  roleId?: number
  disabled?: boolean
  userId?: string | undefined
  spaceId?: string
  isCreator?: number
  popVisible?: boolean
}

// 个人信息修改密码入参
export interface EditPassword {
  password: string
  newPassword: string
  confirmPassword: string
}

// 获取项目基本信息入参
export interface ProjectInfo {
  spaceId: string | undefined
  userName?: string
}

export interface ProjectInfoFilter {
  userIds?: string[]
  spaceIds: string[]
  userName?: string
}

// 项目基本信息响应数据
export interface ProjectInfoData {
  id?: string
  userId?: string
  roleId?: string
  notify?: string
  commentDeletable?: string
  spaceGuid?: string
  spaceName?: string
  spaceStatus?: number
  workingDay?: string
  remark?: string
  describe?: string
  createdAt?: number
  updatedAt?: number
  deletedAt?: number
}

// 修改项目基本信息入参
export interface ProjectInfoDesc {
  spaceId: string | undefined
  spaceName?: string
  describe: string | undefined
}

// 项目成员列表响应数据
export interface ProjectMemberList {
  list: ProjectMemberListItem[]
}

export interface ProjectMemberCount {
  list: ProjectMemberCountItem[]
}

export interface ProjectMemberCountItem {
  id: string
  processing: string
  weekProcessing: string
  total: string
}

export interface ProjectMemberListItem {
  [x: string]: any
  avatar?: string
  id: string
  memberId: string
  mobile?: string
  roleId: number
  spaceId: string
  userId: string
  userName: string
  userNickname: string
  userPinyin?: string
  userStatus: number
  active?: boolean
  disabled?: boolean
  value?: string
  label?: string
  isCreator?: string
  processing?: string
  total?: string
  weekProcessing?: string
  popVisible?: boolean
}

// 添加项目成员入参
export interface ProjectAddMember {
  spaceId: string | undefined
  users: CreateProjectUsers[]
}

// 添加移除成员入参
export interface ProjectRemoveMember {
  spaceId: string | undefined
  // users: CreateProjectUsers[] | number
  userId: string | undefined
  targetUserId: string
}

// 添加移除成员入参
export interface ProjectEditMemberRole {
  spaceId: string | undefined
  userId: string | undefined
  roleId: number | undefined
}

// 项目模块创建入参
export interface CreateProjectModule {
  workObjectName: string
  describe?: string
  spaceId: string
  scene?: string
  workItemScene?: {
    workItemId?: number
  }
}

// 项目模块创建响应
export interface CreateProjectModuleItemData {
  id: string
  spaceId: string
  userId: string
  workObjectGuid: string
  workObjectName: string
  workObjectStatus: number
  remark: string
  describe: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  contenteditable?: boolean
}

export interface CreateProjectModuleData {
  data: CreateProjectModuleItemData
}

// 项目模块列表响应
export interface ProjectModuleList {
  list: ProjectModuleListItem[]
}

export interface ProjectModuleListItem {
  id: string
  spaceId: string
  userId: string
  workObjectGuid: string
  workObjectName: string
  workObjectStatus: number
  remark: string
  describe: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  contenteditable?: boolean
  completeRate?: string
  completed?: string
  processing?: string
  weekProcessing?: string
  priorityInfos?: PriorityInfos[]
  total?: string
  value?: string
  label?: string
}

export interface VersionModuleListItem {
  createdAt: string
  deletedAt: string
  id: string
  ranking?: string
  remark: string
  spaceId: string
  updatedAt: string
  value?: string
  versionKey?: string
  versionName: string
  versionStatus?: string
  _X_ROW_KEY?: string
  disabledName?: boolean
  contenteditable?: boolean
  completeRate?: string
  describe?: string
  processing?: string
  total?: string
  userId?: string
  weekProcessing?: string
  workObjectGuid?: string
  workObjectStatus?: string | number
}

export interface PriorityInfos {
  priority: string
  count: string
}

// 项目模块数量响应
export interface ProjectModuleCount {
  list: ProjectModuleCountItem[]
}

export interface ProjectModuleCountItem {
  id: string
  completeRate: string
  completed: string
  processing: string
  total: string
  weekProcessing: string
  priorityInfos: PriorityInfos[]
}

// 修改项目模块名称
export interface EditProjectModuleName {
  spaceId: string
  workObjectId: string
  workObjectName: string
  scene?: string
  workItemScene?: {
    workItemId?: number
  }
}

// 创建任务入参
export interface CreateProjectWork {
  spaceId: string | null
  workObjectId: string
  workItemType: string
  flowId: string | null
  workItemId?: string
  itemName: string
  describe: string
  progressRate: number | null
  priority: string
  tag?: TaskDirectorOrTag
  curOwner?: string[]
  planTimeAt: TaskPlanTimeAt
  time?: string
  task?: TaskChildren[]
  file?: TaskFile
  icon_flags?: number[]
  remark?: string
  workVersionId?: string
  owner: any[]
}

// 创建子任务入参
export interface CreateProjectTaskWork {
  spaceId: string
  workItemId?: number | string
  itemName: string
  progressRate: string
  planTimeAt: TaskPlanTimeAt
  director: TaskDirectorOrTag
}

export interface TaskOwner {
  label: string
  roleKey: string
  roleName: string
  directorIds: string[]
}

export interface TaskChildren {
  isCheck?: boolean
  info?: any
  taskName?: string
  director?: TaskDirectorOrTag
  planTimeAt?: TaskPlanTimeAt
  progressRate?: string
  contenteditable?: boolean
  isDel?: boolean
  delOperation?: boolean
  operationPermissions?: any
  isTaskNameTipVal?: string
  isTaskNameTip?: boolean
  isDirectorTipVal?: string
  isDirectorTip?: boolean
  isTimeTipVal?: string
  isTimeTip?: boolean
  allowEdit?: boolean
  allowDel?: boolean
  allowChangeState?: boolean
}

export interface TaskPlanTimeAt {
  start?: string
  complete?: string
  planStartAt?: string
  planCompleteAt?: string
}

export interface TaskDirectorOrTag {
  new?: string[]
  add?: string[]
  remove?: string[]
}

export interface TaskFile {
  add?: string[]
  remove?: string[]
}

// 获取任务详情入参
export interface WorkItemDetailParam {
  spaceId: string | number | undefined
  workItemId: string | number
}

// 任务详情响应
export interface WorkDetailInfo {
  workObjectName?: string
  id?: string
  pid?: string
  spaceId?: string
  userId?: string
  workItemType?: number
  workObjectId?: string
  workItemGuid?: string
  workItemName?: string
  workItemStatus?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  doc?: string
  flowMode?: string
  flowModeVersion?: string
  flowModeCode?: string
  planStartAt?: string
  planCompleteAt?: string
  start?: string
  complete?: string
  priority?: string
  processRate?: string
  spaceName?: string
  restartAt?: string
  isRestart?: number
  iconFlags?: number[]
  spaceRoleId?: string
  lastStatusAt?: string
  resumeAt?: string
  unreadCommentNum?: number
  parentStatus?: number
  followed?: boolean
  versionId?: string
  versionName?: string
}

export interface WorkDetailSubInfo {
  planStartAt: string
  planCompleteAt: string
  processRate: number
  describe: string
  remark: string
  priority: string
  participators: string[]
}

export interface WorkDetailCreator {
  id?: string
  spaceId?: string
  workObjectId?: string
  workItemId?: string
  workTaskId?: string
  userId?: string
  userName?: string
  userNickname?: string
  userPinyin?: string
  userStatus?: number
  avatar?: string
  workFlowNodeId?: string
}

export interface WorkDetailNode {
  owner?: WorkDetailCreator
  director?: WorkDetailCreator[]
  flowNodeCode: string
  flowNodeStatus: NodeStatus
  role: string
}

export interface WorkDetailNodesInfo {
  id?: string
  workItemId?: string
  flowNodeUuid?: string
  flowNodeStatus?: number
  flowNodeCode?: string
  flowNodePassed?: number
  flowNodeReached?: number
  flowMode?: string
  flowModeVersion?: string
  flowModeCode?: string
  startAt?: string
  finishAt?: string
  directors?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  planCompleteAt?: string
}

export interface WorkDetailOwnersCreator {
  id?: string
  spaceId?: string
  workObjectId?: string
  workItemId?: string
  workTaskId?: string
  userId?: string
  userName?: string
  userNickname?: string
  userPinyin?: string
  userStatus?: number
  avatar?: string
  workFlowNodeId?: string
}

export interface WorkDetailOwners {
  userId: string
  role?: string
  director?: Array<WorkDetailOwnersCreator>
}

export interface WorkDetailTag {
  id: string
  spaceId: string
  workItemId: string
  tagGuid: string
  tagName: string
  tagStatus: number
  createdAt: string
  updatedAt: string
}

export interface WorkDetailDirector {
  showDirector?: boolean
  id: string
  spaceId: string
  workObjectId: string
  workItemId: string
  workTaskId: string
  userId: string
  userName: string
  userNickname: string
  userPinyin: string
  userStatus: number
  avatar: string
}

export interface WorkItemStatus {
  last: { updatedAt: string }
  id: string
  name: string
  val: TaskStatus
  key: TaskStatusKey
  type: WorkItemStatusType
}

export interface RoleOwner {
  directorIds: string[]
  owners: any[]
  roleId: string
  roleKey: string
  roleName: string
}

export interface PlanTime { completeAt: string, startAt: string, planCompleteAt: string, planStartAt: string }
export interface WorkDetailData {
  $creator?: string[] // 非接口数据：表单使用字段
  commentNum?: number
  createdAt: string
  creator: WorkDetailCreator
  describe: string
  director?: WorkDetailDirector[]
  files?: TaskFile
  followed?: boolean
  flowNode: any
  id: string
  isRestart: boolean
  nodes?: WorkDetailNode[]
  operationPermissions?: string
  owner: TaskOwner[] // 非接口数据
  owners?: WorkDetailOwners[]
  parentWorkItem: { status: WorkItemStatus }
  participator?: WorkDetailTaskDirector[]
  parentStatus?: number
  permSubFuncRole?: string[]
  restartUser?: {
    userName: string
    userNickname: string
  }
  roleOwners?: RoleOwner[]
  pid: string
  planTime: PlanTime
  priority: string
  processRate: number | undefined
  remark: string
  restartAt: string
  restartBy: string | null
  resumeAt: string
  spaceId: string
  subInfo: WorkDetailSubInfo
  subTasks?: WorkDetailTask[]
  tags?: TagItem[]
  tagIds: string[] // 非接口数据
  template: {
    workFlowName: string
    workFlowKey: string
    workFlowId: string
    templateId: string
  }
  unreadCommentNum?: number
  versionId: string
  workFlowTemplate?: WorkFlowTemplate
  workItemName: string
  workItemStatus: WorkItemStatus
  workObjectId: string
  [key: string]: any
}

interface OnReach$1Type {
  eventType: string
  condition: string
  targetSubStage: string
}

interface Owner$2Type {
  forceOwner: boolean
  usageMode: string
  value: string
  ownerRole: Array<unknown>
}

interface Nodes$3Type {
  name: string
  code: string
  startMode: string
  belongStatus: string
  needDoneOperator: boolean
  doneOperationDisplayName: string
  doneOperationRole: Array<unknown>
  passMode: string
  onReach: Array<OnReach$1Type>
  onPass: Array<unknown>
  enableRollback: boolean
  enableClose: boolean
  owner: Owner$2Type
}

interface Connections$4Type {
  start: string
  end: string
}

export interface WorkFlowTemplate {
  mode?: string
  name?: string
  code?: string
  version?: string
  workItemType?: number
  nodes?: Array<Nodes$3Type>
  connections?: Array<Connections$4Type>
  flowNode?: {
    code?: string
    doneOperationDisplayName?: string
    enableClose?: boolean
  }
}

export interface WorkTaskInfo {
  workFlowName: string
  id?: string
  pid?: string
  spaceId?: string
  createdAt?: string
  restartAt?: string
  isRestart?: boolean
  lastStatusAt?: string
  workItemName?: string
  rawWorkItemName?: string
  title?: string
  flowMode?: string
  workItemStatus?: WorkItemStatus
  workItemType: number | string
  workObjectId?: string
  planCompleteAt?: string
  planStartAt?: string
  priority?: string
  processRate?: number
  describe?: string
  owners?: WorkTaskInfoOwner[]
  curOwners?: string[]
  creator?: string
  creatorId?: string
  creatorAvatar?: string
  tags?: TagItem[]
  task?: WorkDetailTask[]
  file?: TaskFile
  nodes?: WorkDetailNode[]
  workFlowTemplate?: WorkFlowTemplate
  commentNum?: number
  unreadCommentNum?: number
  permSubFuncRole?: string[]
  operationPermissions?: string
  resumeAt?: string
  parentStatus?: number
  followed?: boolean
  remark?: string
  versionId?: string
  restartUser?: {
    userName: string
    userNickname: string
  }
  tabKey?: string
}

export interface TaskFormData {
  workObjectId: string
  spaceId: string
  pid: number
  workItemId: string
  workItemStatus: string
  workItemStatusKey: TaskStatusKey
  workItemType: number
  priority: string
  itemName: string
  owner: TaskFormDataOwner[]
  rawOwner: TaskFormDataOwner[]
  curOwner: string[]
  rawCurOwner: string[]
  creator: {
    userNickname: string
    id: string
    avatar: string
  }
  tags: string[]
  rawTags: string[]
  processRate: string
  rawProcessRate: string
  workVersionId: string
  describe: string
  remark: string
  file: {
    createdAt: string
    fileInfoId: string
    fileName: string
    fileSize: string
    fileUri: string
    id: string
    spaceId: string
  }
  planTimeAt: {
    planStartAt: string
    planCompleteAt: string
  }
}

export interface TaskFormDataOwner {
  role: string
  label: string
  directorId: string[]
}

export interface WorkTaskInfoOwner {
  id?: string
  role?: string
  director?: string[]
}

export interface WorkTaskInfoOwnerItem {
  avatar?: string
  id?: string
  spaceId?: string
  userId?: string
  userName?: string
  userNickname?: string
  userPinyin?: string
  userStatus?: number
  workFlowNodeId?: string
  workItemId?: string
  workObjectId?: string
  workTaskId?: string
}

export interface WorkDetail {
  data: WorkDetailData
}

export interface WorkDetailTask {
  id: string
  pid: string
  spaceId: string
  userId: string
  workItemType: string
  workObjectId: string
  workItemGuid: string
  workItemName: string
  workItemStatus: WorkItemStatus
  processRate: number
  priority: string
  planStartAt: string
  planCompleteAt: string
  creator: null
  owners: WorkDetailTaskOwner[]
  operationPermissions: string
}

export interface WorkDetailChildTask {
  id: string
  pid: string
  spaceId: string
  userId: string
  workItemType: string
  workObjectId: string
  workItemGuid: string
  workItemName: string
  rawWorkItemName: string
  workItemStatus: WorkItemStatus
  processRate: string
  rawProcessRate: number
  priority: string
  planStartAt: string
  planCompleteAt: string
  planTimeAt: TaskPlanTimeAt
  creator: null
  owners: WorkDetailTaskOwner[]
  director: TaskDirectorOrTag
  curOwner: string[]
  rawCurOwner: string[]
  operationPermissions: string
  contenteditable: boolean
  isShowNameErrorTip: boolean
  nameTip: string
  isShowOwnerErrorTip: boolean
  isShowDateErrorTip: boolean
  isAddRow: boolean
  isShowDeleteOperation: boolean
  hasEditPerm: boolean
  hasChangeNodePerm: boolean
  hasDeletePerm: boolean
  isComplete: boolean
}

export interface WorkDetailTaskOwner {
  id: string
  userId: string
  userName: string
  userNickname: string
  avatar: string
}

export interface WorkDetailTaskInfo {
  id?: string
  spaceId?: string
  userId?: string
  workObjectId?: string
  workItemGuid?: string
  workItemName?: string
  workItemStatus?: number
  planStartAt?: string
  planCompleteAt?: string
  processRate?: number
  remark?: string
  describe?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  priority?: string
  pid?: string
}

export interface WorkDetailTaskDirector {
  id?: string
  spaceId?: string
  workObjectId?: string
  workItemId?: string
  workTaskId?: string
  userId?: string
  userName?: string
  userNickname?: string
  userPinyin?: string
  userStatus?: number
  avatar?: string
  showDirector?: boolean
}

// 标签列表响应
export interface TagList {
  list: TagItem[]
}

export interface TagItem {
  id: string
  spaceId?: string
  tagGuid?: string
  tagName: string
  tagStatus?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  readonly?: boolean
  focus?: boolean
  error?: boolean
  tagRelationNum?: string
  workItemId?: string
  active?: boolean
  index?: number
  isIntersecting?: boolean
}

// 创建标签响应
export interface CreateTagResponse {
  createdAt: string
  deletedAt: string
  id: string
  spaceId: string
  tagGuid: string
  tagName: string
  tagStatus: number
  updatedAt: string
}

/** -- 表格 ------------------------- */
export interface TableItemWorkItem {
  workItemId: string
  workItems: TableItemWorkItem[]
  info?: any
}

export interface TableItemGroupInfo {
  total: number
  parentId: any
  id: any
  workItems: TableItemWorkItem[]
  fieldId: string | undefined
  fieldKey: string
  displayName: string
}

export interface TableListItem {
  groupInfo: TableItemGroupInfo[]
  workItems: TableItemWorkItem[]
}

export interface ProjectTableList {
  list: TableListItem[]
  totalNum: number
}

export interface ProjectTableIdList {
  list: WorkDetailData[]
}

export interface TableTaskItem {
  fieldKey?: string
  total?: any
  workItemId?: string
  parentId?: number
  id?: number
  isGroup?: boolean
  index?: number
  attendee?: number | string
  checked?: boolean
  director?: WorkDetailTaskDirector[]
  memberList?: ProjectMemberListItem[]
  showDirector?: boolean
  displayName?: string
  copyDisplayName?: string
  disabledName?: boolean
  key?: string
  childKey?: string
  pid?: string
  priority?: string
  processRate?: number | string
  copyProcessRate?: number | string
  disabledRate?: boolean
  project?: string
  status?: number | string
  type?: number
  time?: string
  formatTime?: string
  timeObj?: {
    planStartAt?: string
    planCompleteAt?: string
  }
  creator?: TableTaskItemCreator
  restartAt?: string
  workItems?: TableItemWorkItem[]
  children?: TableTaskItem[]
  spaceId?: string
  isLast?: boolean
  hasChildren?: boolean
  level?: string
  code?: string
  doneOperationDisplayName?: string
  enableClose?: boolean
  createdAt?: string
  iconFlags?: number[]
  allowEdit?: boolean
  allowNode?: boolean
  allowChangeState?: boolean
  operationPermissions?: any
  restartUser?: {
    userName?: string
    userNickname?: string
  }
  participator: WorkDetailTaskDirector[]
  lastStatusAt?: string
  unreadCommentNum: number
  owner?: any
  parentStatus?: number
  isExpanded?: boolean
  followed?: boolean
  updatedAt?: string
  versionName?: string
  versionId?: string
  nodeTime?: string
  workObjectName?: string
}

export interface TableTaskItemCreator {
  id?: string
  spaceId?: string
  userId?: string
  userName?: string
  userNickname?: string
  userPinyin?: string
  userStatus?: number
  workItemId?: string
  workObjectId?: string
  workTaskId?: string
}

export interface PwdParam {
  type?: number
  pwd?: string
  newPwd?: string
  comfirmPwd?: string
  username?: string
}

export interface WorkObjectDel {
  spaceId: string
  workObjectId: string
}

export interface WorkObjectDel2 {
  spaceId: string
  workObjectId: string
  toWorkObjectId: string
}

export interface WorkCount {
  COUNT: number
}

export interface AvatarSetParam {
  avatar: string
}

export interface WorkItemCountParam {
  userId: string
  spaceId: string
}

export interface MemberInfoParam {
  spaceId: string
}

export interface MemberInfoRes {
  roleId: number
}

export interface SpaceQuitParam {
  spaceId: string
  targetUserId?: string
}

export interface UserInfoResponse {
  id: string
  userName: string
  mobile: string
  userNickname: string
  userPinyin: string
  userStatus: number
  userEmail: string
  sex: number
  avatar: string
  remark: string
  describe: string
  lastLoginIp: string
  lastLoginTime: number
  createdAt: string
  updatedAt: string
  deletedAt: string
  bindAccounts: bindAccountsTyp[]
}

// 第三方
export interface bindAccountsTyp {
  id: string
  pfCode: number
  pfUserName: string
  pfUserId: string
  pfUserAccount: string
}

// 评论
export interface CommentItemUser {
  userId: string
  userName: string
  userNickname: string
  avatar: string
}

export interface CommentItem {
  id: string
  content: string
  replyComment: CommentItem
  replyCommentId: number
  createdAt: string
  updatedAt: string
  updatedAtTip?: string
  user: CommentItemUser
  tools: CommentItemTool[]
}

export interface CommentItemTool {
  type: string
  show: boolean
  icon: string
}

export interface CommentData {
  value?: CommentData
  items: Array<CommentItem>
  hasNext: boolean
  nextPos: string
  total: number
}

export interface Comment {
  data: CommentData
  _id?: string
}

export interface CommentEdit {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface WorkVersionCreate {
  versionName: string
  spaceId?: string
  versionId?: string
  scene?: string
  workItemScene?: {
    workItemId: string
  }
}

interface OnReach$1Type {
  eventType: string
  condition: string
  targetSubStage: string
}

interface Owner$2Type {
  forceOwner: boolean
  usageMode: string
  value: string
  ownerRole: Array<unknown>
}

interface Nodes$3Type {
  name: string
  code: string
  startMode: string
  belongStatus: string
  needDoneOperator: boolean
  doneOperationRole: Array<unknown>
  passMode: string
  onReach: Array<OnReach$1Type>
  onPass: Array<unknown>
  enableRollback: boolean
  owner: Owner$2Type
  doneOperationDisplayName: string
  enableClose: boolean
  startAt: string
}

interface Connections$4Type {
  start: string
  end: string
}

// interface Template$5Type {
//   mode: string
//   name: string
//   code: string
//   version: string
//   workItemType: number
//   nodes: Array<Nodes$3Type>
//   connections: Array<Connections$4Type>
// }

export interface SpaceTemplatList {
  id: string
  name: string
  status: string
  templateId: string
  // workItemType: string
  // workItemTypeName: string
  // workItemTypeCode: string
  // ranking: string
  // template: Template$5Type
}

export interface TypeSelectItem {
  value: string
  label: string
}

export interface SpaceTemplatData {
  list: Array<SpaceTemplatList>
}

export interface SpaceWorkItemOperationPermissions {
  data: string
}

// 任务名称搜索相似列表

export interface TaskNameSearchItem {
  id: string
  name: string
}
export interface TaskNameSearchList {
  items: TaskNameSearchItem[]
}

// 任务版本列表下拉
export interface TaskVersionItem {
  createdAt: string
  deletedAt: string
  id: string
  ranking: string
  remark: string
  spaceId: string
  updatedAt: string
  versionKey: string
  versionName: string
  versionStatus: string
}

export interface TaskVersionList {
  list: TaskVersionItem[]
}

export interface ColumnConfig {
  rowIndex: number
  columnIndex: number
  resizeWidth: number
  field: string
}
