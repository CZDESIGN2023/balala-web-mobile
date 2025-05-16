import type {
  Comment,
  CommentData,
  CommentEdit,
  CreateProject,
  CreateProjectModule,
  CreateProjectModuleData,
  CreateProjectResponse,
  CreateProjectTaskWork,
  CreateProjectWork,
  CreateTagResponse,
  EditProjectModuleName,
  ProjectAddMember,
  ProjectEditMemberRole,
  ProjectInfo,
  ProjectInfoData,
  ProjectInfoDesc,
  ProjectInfoFilter,
  ProjectMemberCount,
  ProjectMemberList,
  ProjectModuleCount,
  ProjectModuleList,
  ProjectRemoveMember,
  ProjectTableIdList,
  ProjectTableList,
  SpaceTemplatData,
  SpaceWorkItemOperationPermissions,
  TagList,
  TaskDirectorOrTag,
  TaskFile,
  TaskNameSearchList,
  TaskPlanTimeAt,
  TaskVersionList,
  WorkDetailData,
  WorkItemDetailParam,
  WorkObjectDel,
  WorkObjectDel2,
  WorkVersionCreate,
} from '../interface'
import type { LogList, WorkbenchCount } from '../interface/system'
import type { FilterSort } from '../interface/component'
import type { WorkFlowTemplateData, WorkflowPageListData } from './types'
import http from '@/api'
import { useSharedData } from '@/hooks/useSharedData'

const { fetchData } = useSharedData()

/**
 * @name 创建项目
 * @param data
 */
export function createProject(data: CreateProject) {
  return http.post<CreateProjectResponse>(`/my/space/create`, data)
}

/**
 * @name 设置项目通知
 * @param spaceId 项目 id
 * @param notify 通知 0 不通知 1 通知
 */
export function setProjectNotify(spaceId: string, notify: number) {
  return http.post<any>(`/my/space/set_notify`, { spaceId, notify })
}

/**
 * @name 设置项目评论配置
 * @param spaceId 项目 id
 * @param commentDeletable 通知 0 关闭 1 开启
 */
export function setProjectCommentDeletable(spaceId: string, commentDeletable: number) {
  return http.post<any>(`/my/space/set_comment_deletable`, { spaceId, commentDeletable })
}

/**
 * @name 设置项目工作日
 * @param spaceId 项目 id
 * @param weekDays number[]
 */
export function setProjectWorkingDay(spaceId: string, weekDays: number[]) {
  return http.post<any>(`/my/space/set_working_day`, { spaceId, weekDays })
}

/**
 * @name 修改项目名称
 * @param spaceId 项目 id
 * @param spaceName 项目名称
 */
export function setProjectName(spaceId: string, spaceName: string) {
  return http.post<any>(`/my/space/set/name`, { spaceId, spaceName })
}

/**
 * @name 删除项目
 * @param data
 */
export function deleteProject(spaceId: string, confirmSpaceName: string) {
  return http.post(`/my/space/del`, { spaceId, confirmSpaceName })
}

/**
 * @name 获取项目列表
 * @param data
 */
export function getProjectList() {
  return http.post(`/my/space/list`, {})
}

/**
 * @name 获取项目成员列表
 * @param data
 */
export function getMemberListById(data: ProjectInfo) {
  return http.post<ProjectMemberList>(`/my/space/memeber/list`, data)
}

export function getMemberListByFilter(data: ProjectInfoFilter) {
  return http.post<ProjectMemberList>(`/my/user/list/search`, data)
}

export function getMemberListInfo(data: ProjectInfoFilter) {
  return fetchData<ProjectMemberList>({ url: `/my/user/list/search`, data })
}

export function getMemberMessageById(data: any) {
  return http.post<any>(`/my/space/memeber/by_id`, data)
}

/**
 * @name 获取项目成员列表统计数量
 * @param data
 */
export function getProjectMemberCount(spaceId: string) {
  return http.post<ProjectMemberCount>(`/my/workbench/space/user/count`, { spaceId })
}

/**
 * @name 获取项目基本信息
 * @param data
 */
export function getProjectInfo(data: ProjectInfo) {
  return http.post<ProjectInfoData>(`/my/space/info`, data, { noErrMes: true })
}

/**
 * @name 转移项目所有权
 * @spaceId 项目空间 id
 * @userId 转移所需用户id
 */
export function projectTransferOwnership(spaceId: string, userId: string) {
  return http.post(`/my/space/transfer_ownership`, { spaceId, userId })
}

/**
 * @name 更新项目描述信息
 * @param data
 */
export function editProjectDescribe(data: ProjectInfoDesc) {
  return http.post(`/my/space/set/describe`, data)
}

/**
 * @name 更新项目基本信息
 * @param data
 */
export function editProjectInfo(data: ProjectInfoDesc) {
  return http.post(`/my/space/set/base_info`, data)
}

/**
 * @name 添加项目成员
 * @param data
 */
export function addProjectMember(data: ProjectAddMember) {
  return http.post(`/my/space/memeber/add`, data)
}

/**
 * @name 移除项目成员
 * @param data
 */
export function removeProjectMember(data: ProjectRemoveMember) {
  return http.post(`/my/space/memeber/remove`, data)
}

/**
 * @name 编辑项目成员权限
 * @param data
 */
export function editProjectMemberRole(data: ProjectEditMemberRole) {
  return http.post(`/my/space/memeber/role/set`, data)
}

/**
 * @name 项目创建模块
 * @param data
 */
export function createProjectModule(data: CreateProjectModule) {
  return http.post<CreateProjectModuleData>(`/my/space/work_object/create`, data)
}

/**
 * @name 调整模块排序
 * @param fromIdx 开始索引位置
 * @param toIdx 结束索引位置
 */
export function updateProjectModuleOrder(spaceId: string, list: any[]) {
  return http.post<any>(`/my/space/work_object/ranking/set`, {
    spaceId,
    list,
  })
}

/**
 * 工作模块-删除
 * @param data 参数
 */
export function workObjectDel(data: WorkObjectDel) {
  return http.post(`/my/space/work_object/del`, data)
}

/**
 * 工作模块-删除并转移任务
 * @param data 参数
 */
export function workObjectDelTran(data: WorkObjectDel2) {
  return http.post(`/my/space/work_object/del2`, data)
}

/**
 * @name 项目模块列表
 * @param data
 */
export function getProjectModulelist(data: ProjectInfo) {
  return http.post<ProjectModuleList>(`/my/space/work_object/list`, data)
}

export function getProjectModuleById(data: any) {
  return http.post<ProjectModuleList>(`/my/space/work_object/by_id`, data)
}

/**
 * @name 项目模块列表-数量统计
 * @param spaceId 项目 id
 */
export function getProjectModuleCount(spaceId: string, ids: string[]) {
  return http.post<ProjectModuleCount>(`/v2/my/workbench/space/work_object/count/by_ids`, {
    spaceId,
    ids,
  })
}

/**
 * @name 项目模块编辑名称
 * @param data
 */
export function editProjectModuleName(data: EditProjectModuleName) {
  return http.post(`/my/space/work_object/modify/name`, data)
}

/**
 * @name 创建任务
 * @param data
 */
export function createProjectWork(data: CreateProjectWork) {
  return http.post(`/v2/my/space/work_item/create`, data)
}

/**
 * @name 创建子任务
 * @param data
 */
export function createProjectTaskWork(data: CreateProjectTaskWork) {
  return http.post<any>(`/v2/my/space/work_item/task/create`, data)
}

/**
 * @name 获取任务详情
 */
export function getWorkItemDetail(data: WorkItemDetailParam) {
  return http.post<WorkDetailData>(`/v2/my/space/work_item/detail`, data, { noErrMes: true })
}

/**
 * @name 获取标签列表
 */
export function getProjectTagList(spaceId: string) {
  return http.post<TagList>(`/v2/my/space/tag/list`, { spaceId })
}

/**
 * @name 新建标签
 */
export function createTag(spaceId: string | number, tagName: string) {
  return http.post<CreateTagResponse>(`/my/space/tag/create`, { spaceId, tagName })
}

/**
 * @name 编辑标签
 */
export function editTagName(spaceId: string | number, tagName: string, tagId: string | number) {
  return http.post<any>(`/my/space/tag/modify/name`, { spaceId, tagName, tagId })
}

/**
 * @name 编辑标签
 */
export function delTagName(spaceId: string | number, tagId: string | number) {
  return http.post(`/my/space/tag/del`, { spaceId, tagId })
}

/**
 * @name 工作任务 - 修改模块
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param workItemName 任务名称
 * @returns
 */
export function editWorkObject(spaceId: string | number, workItemId: string | number, workObjectId: string | number) {
  return http.post(`/v2/my/space/work_item/work_object/set`, { spaceId, workItemId, workObjectId })
}

/**
 * @name 工作任务 - 修改名称
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param workItemName 任务名称
 * @returns
 */
export function editWorkName(spaceId: string | number, workItemId: string | number, workItemName?: string) {
  return http.post(`/v2/my/space/work_item/name/modify`, { spaceId, workItemId, workItemName })
}

/**
 * @name 工作任务 - 修改优先级
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param priority 优先级
 * @returns
 */
export function editWorkPriority(spaceId: string, workItemId: string, priority: string) {
  return http.post(`/v2/my/space/work_item/priority/modify`, { spaceId, workItemId, priority })
}

/**
 * @name 工作任务 - 修改进度
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param processRate 进度
 * @returns
 */
export function editWorkProgress(spaceId: string | number, workItemId: string | number, processRate?: string | number) {
  return http.post(`/v2/my/space/work_item/process_rate/modify`, {
    spaceId,
    workItemId,
    processRate,
  })
}

/**
 * @name 工作任务 - 修改进度
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param planTimeAt 时间
 * @returns
 */
export function editWorkPlantime(spaceId: string | number, workItemId: string | number, planTimeAt: TaskPlanTimeAt) {
  return http.post(`/v2/my/space/work_item/plantime/modify`, { spaceId, workItemId, planTimeAt })
}

/**
 * @name 工作任务 - 修改描述
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param describe 描述
 * @returns
 */
export function editWorkDescribe(spaceId: string | number, workItemId: string | number, describe: string, icon_flags: number[]) {
  return http.post(`/v2/my/space/work_item/describe/modify`, {
    spaceId,
    workItemId,
    describe,
    icon_flags,
  })
}

/**
 * @name 工作任务 - 修改备注
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param remark 备注
 * @returns
 */
export function editWorkRemark(spaceId: string | number, workItemId: string | number, remark: string) {
  return http.post(`/my/space/work_item/remark/modify`, {
    spaceId,
    workItemId,
    remark,
  })
}

/**
 * @name 工作任务 - 修改标签
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param tag 标签
 * @returns
 */
export function editWorkTag(spaceId: string | number, workItemId: string | number, tag: TaskDirectorOrTag) {
  return http.post(`/v2/my/space/work_item/tag/set`, { spaceId, workItemId, tag })
}

/**
 * @name 工作任务 - 修改负责人
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param planTimeAt 时间
 * @returns
 */
export function editWorkDirector(spaceId: string | number, workItemId: string | number, role: string, director: TaskDirectorOrTag) {
  return http.post(`/v2/my/space/work_item/director/set`, { spaceId, workItemId, role, director })
}

/**
 * 工作任务 - 节点修改负责人
 * @param spaceId
 * @param workItemId
 * @param workFlowNodeCode
 * @param director
 * @returns
 */
export function workFlowDirectorSet(spaceId: string | number, workItemId: string | number, workFlowNodeCode: string, director: TaskDirectorOrTag) {
  return http.post(`/v2/my/space/work_flow/director/set`, {
    spaceId,
    workItemId,
    workFlowNodeCode,
    director,
  })
}

/**
 * 工作任务 - 节点修改负责人 (子任务)
 * @param spaceId
 * @param workItemId
 * @param director
 * @returns
 */
export function workItemDirectorSet(spaceId: string | number, workItemId: string | number, director: TaskDirectorOrTag) {
  return http.post(`/v2/my/space/work_item/task/director/set`, { spaceId, workItemId, director })
}

/**
 * @name 子任务 - 修改负责人
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param planTimeAt 时间
 * @returns
 */
export function editWorkChildDirector(spaceId: string | number, workItemId: string | number, director?: TaskDirectorOrTag) {
  return http.post(`/v2/my/space/work_item/task/director/set`, {
    spaceId,
    workItemId,
    director,
  })
}

/**
 * @name 工作任务 - 修改状态
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param planTimeAt 时间
 * @returns
 */
export function editWorkStatus(spaceId: string | number, workItemId: string | number, workItemStatus: string | number) {
  return http.post(`/my/space/work_item/status/modify`, { spaceId, workItemId, workItemStatus })
}

/**
 * @name 工作任务 - 修改节点状态
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param nodeState 节点
 * @returns
 */
export function editWorkStateConfirm(spaceId: string, workItemId: string, nodeState: string) {
  return http.post<any>(`/v2/my/space/work_item/nodes/state/confirm`, {
    spaceId,
    workItemId,
    nodeState,
  })
}

/**
 * @name 工作任务终止 - 修改节点状态 - 终止
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param reason 原因
 * @returns
 */
export function editWorkStateTerminate(spaceId: string, workItemId: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/terminate`, {
    spaceId,
    workItemId,
    reason,
  })
}

/**
 * @name 工作任务恢复 - 修改节点状态 - 恢复
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param reason 原因
 * @returns
 */
export function editWorkStateRestore(spaceId: string, workItemId: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/resume`, {
    spaceId,
    workItemId,
    reason,
  })
}

/**
 * @name 工作任务回滚 - 修改节点状态 - 回滚
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param reason 原因
 * @returns
 */
export function editWorkStateRollback(spaceId: string, workItemId: string, nodeCode: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/nodes/state/rollback`, {
    spaceId,
    workItemId,
    nodeCode,
    reason,
  })
}

/**
 * @name 工作任务关闭 - 修改节点状态 - 关闭
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param nodeCode 节点
 * @param reason 原因
 * @returns
 */
export function editWorkStateClose(spaceId: string, workItemId: string, nodeCode: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/close`, {
    spaceId,
    workItemId,
    nodeCode,
    reason,
  })
}

/**
 * @name 工作任务关闭 - 修改节点状态 - 关闭
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param nodeCode 节点
 * @param reason 原因
 * @returns
 */
export function editWorkStateRestart(spaceId: string, workItemId: string, nodeCode: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/restart`, {
    spaceId,
    workItemId,
    nodeCode,
    reason,
  })
}

/**
 * @name 工作任务 - 修改附件
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 * @param file 文件
 * @returns
 */
export function editWorkFile(spaceId: string | number, workItemId: string | number, file: TaskFile) {
  return http.post(`/v2/my/space/work_item/files/set`, { spaceId, workItemId, file })
}

/**
 * @name 下载附件token
 * @param
 */
export function getdownloadFileToken(scene: string, spaceId: string, workItemId: string, id: string) {
  return http.get(`/get_download_token`, { scene, spaceId, workItemId, id })
}

/**
 * @name 下载附件
 */
export function getdownloadFile(scene: string, token: string) {
  return http.get(`/download`, { scene, token }, { responseType: 'blob' })
}

/**
 * @name 删除任务
 * @param spaceId 项目 id
 * @param workItemId 任务 id
 */
export function deleteWork(spaceId: string | number, workItemId: string | number) {
  return http.post(`/v2/my/space/work_item/del`, { spaceId, workItemId })
}

// 获取项目表格模块
export function getProjectTable(spaceId: string | number, conditionGroup: {}, groups?: { field: string }[], sorts?: FilterSort[]) {
  return http.post<ProjectTableList>(`/v2/my/search/space/work_item/group_info`, {
    spaceId,
    pagination: { pageNum: 1, pageSize: 20000 },
    conditionGroup,
    groups,
    sorts,
  })
}

// 获取项目表格模块 - 主任务
export function getProjectTableById(spaceId: string | number, ids: string[] | number[]) {
  return http.post<ProjectTableIdList>(`/v2/my/search/space/work_items/by_id`, {
    spaceId,
    ids,
  })
}

/**
 * @name 项目-数量统计
 * @param spaceId 项目 id
 */
export function getProjectCount(spaceId: string) {
  return http.post<WorkbenchCount>(`/v2/my/workbench/space/count`, { spaceId })
}

/**
 * 上传文件
 * @param data 参数
 */
export function projectFileUpload(spaceId: string, file: FormData, scene: string = 'space_file') {
  return http.post(`/file/upload?scene=${scene}&spaceId=${spaceId}`, file, {
    headers: {
      'Accept': '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 获取工作流模板
 * @param workItemType 参数
 */
export function getSpaceTemplate(workItemType: number) {
  return http.post<any>(`/my/space/templates/workflow`, { workItemType })
}

/**
 * 工作任务-确认问题
 * @param spaceId 参数
 * @param workItemId 参数
 * @param nodeState 参数
 */
export function nodesStateConfirm(spaceId: string, workItemId: string, nodeState: string) {
  return http.post<any>(`/v2/my/space/work_item/nodes/state/confirm`, {
    spaceId,
    workItemId,
    nodeState,
  })
}

/**
 * 工作任务-关闭问题
 * @param spaceId 参数
 * @param workItemId 参数
 * @param nodeState 参数
 * @param reason 参数
 */
export function workItemClose(spaceId: string, workItemId: string, nodeCode: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/close`, { spaceId, workItemId, nodeCode, reason })
}

/**
 * 工作任务-恢复
 * @param spaceId 参数
 * @param workItemId 参数
 * @param reason 参数
 */
export function workItemResume(spaceId: string, workItemId: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/resume`, { spaceId, workItemId, reason })
}

/**
 * 工作任务-重启
 * @param spaceId 参数
 * @param workItemId 参数
 * @param nodeState 参数
 * @param reason 参数
 */
export function workItemRestart(spaceId: string, workItemId: string, nodeCode: string, reason: string) {
  return http.post<any>(`/v2/my/space/work_item/restart`, { spaceId, workItemId, nodeCode, reason })
}

/**
 * 子任务-完成节点
 * @param spaceId 参数
 * @param workItemId 参数
 * @param state 参数
 */
export function taskStateConfirm(spaceId: string, workItemId: string, state: string, reason?: string) {
  return http.post<any>(`/v2/my/space/work_item/task/state/confirm`, {
    spaceId,
    workItemId,
    state,
    reason,
  })
}

/**
 * 任务 评论 发布
 * @param workItemId 参数
 * @param content 内容
 * @param referUserIds array 被@人id
 */
export function taskCommentAdd(workItemId: string, content: string, referUserIds: number[], replyCommentId: number) {
  return http.post<any>(`/my/space/work_item/comment/add`, {
    workItemId,
    content,
    referUserIds,
    replyCommentId,
  })
}

/**
 * 任务 评论 列表
 * @param workItemId 参数
 * @param size 条数
 * @param pos 翻页 id
 * @param order 排序
 */
export function taskCommentList(workItemId: string, size: number = 20, pos: number = 0, order: string, _id: string) {
  return http.post<CommentData>(
    `/my/space/work_item/comment/list`,
    {
      workItemId,
      size,
      pos,
      order,
    },
    { _id },
  )
}

/**
 * 任务 评论 编辑
 * @param id 参数
 * @param content 内容
 * @param referUserIds array 被@人id
 */

export function taskCommentEdit(id: string, content: string, referUserIds: number[]) {
  return http.post<CommentEdit>(`/my/space/work_item/comment/update`, {
    id,
    content,
    referUserIds,
  })
}

/**
 * 任务 评论 删除
 * @param 评论id 参数
 */

export function taskCommentDelete(id: string) {
  return http.post<CommentEdit>(`/my/space/work_item/comment/delete`, {
    id,
  })
}

/**
 * 关注任务
 * @param workItemId 工作任务ID
 * @param unfollow 是否取消关注
 */

export function taskFollow(workItemId: string, unfollow: boolean) {
  return http.post<CommentEdit>(`/my/space/work_item/follow`, {
    workItemId,
    unfollow,
  })
}

/**
 * 版本号-列表
 * @param spaceId 所属空间id
 */

export function workVersionList(spaceId: string) {
  return http.post<TaskVersionList>(`/my/space/work_version/list`, {
    spaceId,
  })
}
export function getWorkVersionById(data: any) {
  return http.post<any>(`/my/space/work_version/by_id`, data)
}

/**
 * 版本号-创建
 * @param versionName 版本名称
 * @param spaceId 所属空间id
 * @param scene 场景: work_item_edit 任务表单修改场景 work_item_create 任务创建场景
 * @param workItemScene 任务表单修改场景专用
 * @param workItemScene.workItemId 	任务id
 */

export function workVersionCreate(data: WorkVersionCreate) {
  return http.post<any>(`/my/space/work_version/create`, data)
}

/**
 * 版本号-编辑名称
 * @param versionName 版本名称
 * @param versionId 版本id
 * @param scene 场景: work_item_edit 任务表单修改场景 work_item_create 任务创建场景
 * @param workItemScene 任务表单修改场景专用
 * @param workItemScene.workItemId 	任务id
 */

export function workVersionModifyName(data: WorkVersionCreate) {
  return http.post<any>(`/my/space/work_version/modify/name`, data)
}

/**
 * 版本号-删除
 * @param versionId 版本Id
 */

export function workVersionDel(versionId: string, toVersionId?: string) {
  return http.post<any>(`/my/space/work_version/del`, {
    versionId,
    toVersionId,
  })
}

/**
 * 版本号-调整顺序
 * @param spaceId 所属空间id
 * @param fromIdx 原索引位置
 * @param toIdx 最终索引位置
 */

export function workVersionSetOrder(spaceId: string, list: any[]) {
  return http.post<any>(`/my/space/work_version/ranking/set`, {
    spaceId,
    list,
  })
}

/**
 * 版本号-获取关联统计数量
 * @param spaceId 所属空间id
 * @param versionId 版本Id
 */

export function workVersionRelationCount(spaceId: string, versionId: string) {
  return http.post<any>(`/my/space/work_version/relation_count`, {
    spaceId,
    versionId,
  })
}

/**
 * 工作任务-修改任务版本
 * @param spaceId 项目空间ID
 * @param versionId 版本id
 * @param workItemId 任务ID
 */

export function workVersionChange(spaceId: string, versionId: string, workItemId: string) {
  return http.post<any>(`/v2/my/space/work_item/version/change`, {
    spaceId,
    versionId,
    workItemId,
  })
}

/**
 * 项目空间-工作台-版本-任务统计
 * @param spaceId 项目空间ID
 */

export function spaceVersionCount(spaceId: string) {
  return http.post<any>(`/my/workbench/space/version/count`, {
    spaceId,
  })
}

/**
 * 创建分组
 * @param spaceId 所属空间id
 * @param categoryName 分组名称
 * @param addUserIds 一组被添加的用户
 */

export function spaceMemberCategoryCreate(spaceId: string, categoryName: string, addUserIds: any[]) {
  return http.post<any>(`/my/space/member_category/create`, {
    spaceId,
    categoryName,
    addUserIds,
  })
}

/**
 * 分组列表(含成员详情)
 * @param spaceId 所属空间id
 */

export function spaceMemberCategoryList(spaceId: string) {
  return http.post<any>(`/my/space/member_category/detail_list`, {
    spaceId,
  })
}

/**
 * 设置分组内的成员
 * @param spaceId 所属空间id
 * @param categoryId 分组Id
 * @param addUserIds 一组被添加的用户id
 * @param removeUserIds 一组被移除的用户id
 * @param categoryName 要修改的分组名称（不修改则为空）
 */

export function spaceMemberCategorySet(spaceId: string, categoryId: number, addUserIds: string[], removeUserIds: string[], categoryName?: string) {
  return http.post<any>(`/my/space/member_category/set_member`, {
    spaceId,
    categoryId,
    addUserIds,
    removeUserIds,
    categoryName,
  })
}

/**
 * 删除分组
 * @param spaceId 所属空间id
 * @param categoryId 分组id
 */

export function spaceMemberCategoryDel(spaceId: string, categoryId: string) {
  return http.post<any>(`/my/space/member_category/del`, {
    spaceId,
    categoryId,
  })
}

/**
 * 项目空间-项目管理员列表
 * @param spaceId 所属空间id
 */

export function spaceManagerList(spaceId: string) {
  return http.post<any>(`/my/space/manager/list`, {
    spaceId,
  })
}

/**
 * 项目空间-添加管理员
 * @param spaceId 所属空间id
 * @param userIds 一组用户id
 */

export function spaceManagerAdd(spaceId: string, userIds: string[]) {
  return http.post<any>(`/my/space/manager/add`, {
    spaceId,
    userIds,
  })
}

/**
 * 项目空间-移除管理员
 * @param spaceId 所属空间id
 * @param userIds 一组用户id
 */

export function spaceManagerRemove(spaceId: string, userIds: string[]) {
  return http.post<any>(`/my/space/manager/remove`, {
    spaceId,
    userIds,
  })
}

/**
 * 项目空间-搜索任务
 * @param spaceId 所属空间id
 * @param keyword 关键字
 */

export function searchWorkItem(spaceId: string, keyword: string) {
  return http.post<TaskNameSearchList>(`/my/space/search/work_item`, {
    spaceId,
    keyword,
  })
}

/**
 * @name 获取项目操作日志列表
 */
export function getSpaceOpLog(spaceId: number, size: number = 20, pos: number = 0, moduleType: number, moduleId: number, _id: string, operId: string | number = 0, scene: string = 'space_sys_log') {
  return http.post<LogList>(
    `/log/space/op/list`,
    {
      spaceId,
      size,
      pos,
      moduleType,
      moduleId,
      operId,
      scene,
    },
    { _id },
  )
}

/**
 * 工作流模版搜索
 */
export function getSpaceTemplateSearch(spaceId: number = 0, workItemType: number = 0) {
  return http.post<SpaceTemplatData>(`/my/space/templates/workflow/search`, {
    spaceId,
    workItemType,
  })
}

// 获取任务流程下拉
export async function getWorkFlowSelectList(spaceId: string = '', status: string = '') {
  let list = []
  const res = await http.post<any>(`/my/space/work_flow/list`, {
    spaceId,
  })
  if (status) {
    list = res.data.list.filter((item: any) => item.status === status)
  }
  else {
    list = res.data.list
  }
  return list
}

export function getWorkFlowsMessageById(data: any) {
  return http.post<any>(`/my/space/work_flow/by_id`, data)
}

// 获取工作流详情信息
export function getWorkFlow(data: { spaceId: string, flowId: string }) {
  return http.post<any>(`/my/space/work_flow`, data)
}

// 获取工作流详情信息
export function getWorkFlowTemplate(data: { spaceId: string, templateId: string }) {
  return http.post<WorkFlowTemplateData>(`/my/space/work_flow/template`, data)
}

// 获取工作流详情信息
export function getWorkFlowTemplateByShared(data: { spaceId: string, templateId: string }) {
  return fetchData<WorkFlowTemplateData>({ url: `/my/space/work_flow/template`, data })
}

// 获取流程列表接口
export function getWorkFlowPageList(spaceId: string = '', status: number) {
  return http.post<WorkflowPageListData>(`/my/space/work_flow/page_list`, {
    spaceId,
    status,
  })
}

/**
 * 工作任务 - 设置节点排期
 */
export function updateSpaceWorkFlowTime(spaceId: string, workItemId: string, workFlowNodeCode: string, planTimeAt: TaskPlanTimeAt) {
  return http.post<any>(`/my/space/work_item/work_flow/plan_time/set`, {
    spaceId,
    workItemId,
    workFlowNodeCode,
    planTimeAt,
  })
}

/**
 * 工作任务 - 催单
 */
export function spaceWorkRemind(spaceId: string, workItemId: string, nodeCode: string) {
  return http.post<any>(`/my/space/work_item/remind`, {
    spaceId,
    workItemId,
    nodeCode,
  })
}

// 工作任务-操作权限详情

export function getSpaceWorkItemOperationPermissions(spaceId: string, workItemId: string = '0', scene: string) {
  return http.post<any>(`/my/space/work_item/operation_permissions`, {
    spaceId,
    workItemId,
    scene,
  })
}

// 保存自定义筛选组
export function setFilterTag(configs: any) {
  return http.post<any>(`/my/set_temp_config`, {
    configs,
  })
}
// 获取自定义筛选组
export function getFilterTag(keys: any) {
  return http.post<any>(`/my/get_temp_config`, {
    keys,
  })
}

export function delFilterTag(keys: any) {
  return http.post<any>(`/my/del_temp_config`, {
    keys,
  })
}
