import type {
  AvatarSetParam,
  LoginData,
  LoginParam,
  MemberInfoParam,
  MemberInfoRes,
  PwdParam,
  RegisterParam,
  SpaceQuitParam,
  UserInfoResponse,
  UserList,
  UserListParam,
  WorkCount,
  WorkItemCountParam,
} from '../interface'
import http from '@/api'

/**
 * @name 注册
 * @param data
 */
export function userRegister(data: RegisterParam) {
  return http.post(`/user/reg`, data, { withCredentials: true })
}

/**
 * @name 登录
 * @param data
 */
export function userLogin(data: LoginParam) {
  return http.post<LoginData>(`/login`, data, { withCredentials: true })
}

/**
 * @name 退出登录
 * @param data
 */
export function userLogout() {
  return http.post(`/logout`, {})
}

/**
 * @name 获取用户列表
 * @param data
 */
export function getUserListBySearch(data: UserListParam) {
  return http.post<UserList>(`/my/user/list/search`, data, { noLoading: true })
}

/**
 * 修改密码
 * @param data 参数
 */
export function userPwdChange(data: PwdParam) {
  return http.post(`/my/pwd/change`, data)
}

/**
 * 上传文件-用户头像
 * @param data 参数
 */
export function userFileUpload(data: any) {
  return http.post(`/file/upload`, data)
}

/**
 * 设置头像
 * @param data 参数
 */
export function userAvatarSet(data: AvatarSetParam) {
  return http.post(`/my/avatar/set`, data)
}

/**
 * 项目空间-成员关联任务统计
 * @param data 参数
 */
export function userWorkItemCount(data: WorkItemCountParam) {
  return http.post<WorkCount>(`/my/space/member/work_item_count`, data)
}

/**
 * 权限信息
 * @param data 参数
 */
export function userMemberInfo(data: MemberInfoParam, noErrMes = false) {
  return http.post<MemberInfoRes>(`/my/space_memeber/info`, data, { noErrMes })
}

/**
 * 离开项目
 * @param data 参数
 */
export function userSpaceQuit(data: SpaceQuitParam) {
  return http.post(`/my/space/quit`, data)
}

/**
 * 修改昵称
 * @param data 参数
 */
export function userNickNameSet(nickName: string) {
  return http.post(`/my/nickname/set`, { nickName })
}

/**
 * 用户名检查
 * @param data 参数
 */
export function userCheckName(name: string) {
  return http.post(`/user/check_name`, { name }, { noErrMes: true })
}

/**
 * 获取用户信息
 */
export function getMyInfo() {
  return http.post<UserInfoResponse>(`/my/info`, {})
}
/**
 * 获取人机校验码
 */
export function getLoginVaildCode() {
  return http.post<any>(`/get_login_vaild_code`, {}, { withCredentials: true })
}

/**
 * 设置通知
 */
export function setSpaceNotify(spaceId: string, notify: number) {
  return http.post<any>(`/my/set_space_notify`, {
    spaceId,
    notify,
  })
}

/**
 * 账号绑定
 */
export function myBind(type: number, key: string, name: string, userId: string, account: string) {
  return http.post<any>(`/my/bind`, {
    type,
    key,
    name,
    userId,
    account,
  })
}

/**
 * 账号解绑
 */
export function myUnbind(type: number) {
  return http.post<any>(`/my/unbind`, {
    type,
  })
}

/**
 * 账号注销
 */
export function myCancel() {
  return http.post<any>(`/my/cancel`, {}, { noErrMes: true })
}

/* 调整项目列表顺序
 *  * @param fromIdx 开始索引位置
 *  * @param toIdx 最终索引位置
 */
export function setSpaceOrder(fromIdx: number, toIdx: number) {
  return http.post<any>(`/my/set_space_order`, {
    fromIdx,
    toIdx,
  })
}

/**
 * 待办列表
 */
export function myPendingWork() {
  return http.post<any>(`/my/pending_work_item`, {})
}

/**
 * 评论通知列表-id
 * @param pos 开始位置，第一次传0
 * @param size 数量
 */
export function relatedCommentIds() {
  return http.post<any>(`/my/related_comment_ids`, {})
}

/**
 * 评论通知列表-详情
 * @param ids id 列表
 */
export function relatedCommentByIds(ids: string[]) {
  return http.post<any>(`/my/related_comment_by_ids`, { ids })
}

/**
 * 通知计数
 */
export function notifyCount() {
  return http.post<any>(`/my/notify_count`, {})
}

/**
 * 修改系统配置
 * @param key
 * @param value
 */
export function changeSystemConfig(key: string, value: string) {
  return http.post<any>(`/config/update`, {
    key,
    value,
  })
}
