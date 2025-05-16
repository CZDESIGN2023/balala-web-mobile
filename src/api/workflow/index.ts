import { number } from 'echarts'
import type { CreateWorkFlowResponse } from './type'
import http from '@/api'

/**
 * @name 创建流程
 * @param spaceId string
 * @param name string
 */
export function createWorkFlow({ spaceId, name }: { spaceId: string, name: string }) {
  return http.post<CreateWorkFlowResponse>(`/my/space/work_flow/create`, { spaceId, name })
}

/**
 * @name 获取流程详情
 * @param spaceId string
 * @param flow_id string
 */
export function getWorkFlow({ spaceId, flowId }: { spaceId: string, flowId: string }) {
  return http.post<any>(`/my/space/work_flow`, { spaceId, flowId })
}

/**
 * @name 保存流程
 */
export function postWorkFlow(data: any) {
  return http.post<any>('/my/space/work_flow/template_config/save', data)
}

/**
 * @name 删除流程
 * @param spaceId string
 * @param flow_id string
 */
export function delWorkFlow({ spaceId, flow_id }: { spaceId: string, flow_id: string }) {
  return http.post<any>(`/my/space/work_flow/del`, { spaceId, flow_id })
}

// 禁用,启用 流程
export function setWorkFlowStatus({ spaceId, flow_id, status }: { spaceId: string, flow_id: string, status: number }) {
  return http.post<any>(`/my/space/work_flow/status/set`, { spaceId, flow_id, status })
}

// 复制流程
export function setWorkFlowCopy({ spaceId, flow_id }: { spaceId: string, flow_id: string }) {
  return http.post<any>(`/my/space/work_flow/copy`, { spaceId, flow_id })
}

// 流程排序
export function setWorkFlowRanking({ spaceId, list }: { spaceId: string, list: any[] }) {
  return http.post<any>(`/my/space/work_flow/ranking/set`, { spaceId, list })
}

/**
 * 任务状态 列表相关
 */
// 任务状态 列表获取
export function getWorkItemStatusList({ spaceId }: { spaceId: string }) {
  return http.post<any>('/my/space/work_item_status/list', { spaceId })
}

export function getWorkStatusMessageById(data: any) {
  return http.post<any>(`/my/space/work_item_status/by_id`, data)
}

// 修改列表名称
export function setWorkFlowName({ spaceId, flow_id, name }: { spaceId: string, flow_id: string, name: string }) {
  return http.post<any>('/my/space/work_flow/name/set', { spaceId, flow_id, name })
}

// 任务状态 删除
export function workItemStatusDel(data: { spaceId: string, id: string }) {
  return http.post<any>('/my/space/work_item_status/del', data, { noErrMes: true })
}

// 任务状态 创建
export function workItemStatusCreate(data: { spaceId: string, name: string }) {
  return http.post<any>('/my/space/work_item_status/create', data)
}

// 任务状态 名称修改
export function workItemStatusNameSet(data: { spaceId: string, id: string, name: string }) {
  return http.post<any>('/my/space/work_item_status/name/set', data)
}

// 角色 名称修改
export function workItemStatusRankingSet(data: { spaceId: string, list: { id: number, ranking: number }[] }) {
  return http.post<any>('/my/space/work_item_status/ranking/set', data)
}

/**
 * 角色管理 列表相关
 */
export function getWorkItemRoleList({ spaceId }: { spaceId: string }) {
  return http.post<any>('/my/space/work_item_role/list', { spaceId })
}

// 角色 删除
export function workItemRoleDel(data: { spaceId: string, id: string }) {
  return http.post<any>('/my/space/work_item_role/del', data, { noErrMes: true })
}

// 角色 创建
export function workItemRoleCreate(data: { spaceId: string, name: string }) {
  return http.post<any>('/my/space/work_item_role/create', data)
}

// 角色 名称修改
export function workItemRoleNameSet(data: { spaceId: string, id: string, name: string }) {
  return http.post<any>('/my/space/work_item_role/name/set', data)
}

// 角色 名称修改
export function workItemRoleRankingSet(data: { spaceId: string, list: { id: number, ranking: number }[] }) {
  return http.post<any>('/my/space/work_item_role/ranking/set', data)
}

export function workItemUpdate(data: any) {
  return http.post<any>('/my/space/work_item/work_flow/upgrade', data)
}
// 获取升级任务id总数
export function getAllWorkItemId(data: { spaceId: string, flowId: string }) {
  return http.post<any>('/my/space/work_item/work_flow/bat_upgrade/prepar', data)
}

// 批量升级全部任务
export function workItemUpdateAll(data: any) {
  return http.post<any>('/my/space/work_item/work_flow/bat_upgrade/by_id', data, { noErrMes: true })
}

// 获取流程关联任务总数
export function getWorkFlowRelationCount(data: { spaceId: string, id: string, scene: string }) {
  return http.post<any>('/my/space/work_flow/work_item_relation_count', data)
}

// 获取当前任务角色 被关联的流程模版设置数量
export function getWorkRoleRelationCount(data: { spaceId: string, id: string }) {
  return http.post<any>('/my/space/work_item_role/template_relation_count', data)
}

// 获取当前任务状态  被关联的流程模版设置数量
export function getWorkStatusRelationCount(data: { spaceId: string, id: string }) {
  return http.post<any>('/my/space/work_item_status/template_relation_count', data)
}

// 获取负责人关联流程
export function getWorkFlowRelationUser(data: { spaceId: string, ownerUid: string }) {
  return http.post<any>('/my/space/work_flow/template/owner_rule_relation', data)
}
