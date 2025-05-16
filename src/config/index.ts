// 首页地址（默认）
export const HOME_URL: string = '/home'

// 登录页地址（默认）
export const LOGIN_URL: string = '/login'

// 路由白名单地址（必须是本地存在的路由 staticRouter.ts 中）
export const ROUTER_WHITE_LIST: string[] = ['/500']

interface AuthList {
  [index: number]: {
    id: number
    title: string
    desc: string
  }
}

export const AUTH_LIST: AuthList = {
  3: {
    id: 3,
    title: '可查看',
    desc: '拥有查看/执行任务的权限'
  },
  2: {
    id: 2,
    title: '可编辑',
    desc: '拥有新建/编辑任务的权限'
  },
  1: {
    id: 1,
    title: '可管理',
    desc: '拥有管理任务的权限'
  }
}
