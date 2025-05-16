/* UserState */
export interface UserState {
  token: string
  userInfo: { name: string }
}

// 路由缓存列表
export interface KeepAliveNamesState {
  keepAliveNames: string[]
  cachedViews: string[]
}

// 路由列表
export interface RoutesListState {
  routesList: string[]
  isColumnsMenuHover: Boolean
  isColumnsNavHover: Boolean
}

// 用户信息
export interface UserInfosState {
  id: number
  authBtnList: string[]
  avatar: string
  roles: string[]
  time: number
  userName: string
  userNickname: string
}
export interface UserInfosStates {
  userInfos: UserInfosState
  permissions: string[]
}

// TagsView 路由列表
export interface TagsViewRoutesState {
  tagsViewRoutes: string[]
  isTagsViewCurrenFull: Boolean
}

// 后端返回原始路由(未处理时)
export interface RequestOldRoutesState {
  requestOldRoutes: string[]
}

// 布局配置
export interface AppConfigState {
  isRequestRoutes: boolean
  envData: {
    socketUrl: String
    adminUrl: String
    uploadUrl: String
  }
}
