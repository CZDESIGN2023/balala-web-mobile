import { createRouter, createWebHashHistory } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/modules/user'
import { useNoticeStore } from '@/stores/modules/notice'
import { useProjectStore } from '@/stores/modules/project'
import { LOGIN_URL, ROUTER_WHITE_LIST } from '@/config'
import { errorRouter, staticRouter } from '@/router/modules/staticRouter'
import devRouter from '@/views/dev/config'
import NProgress from '@/config/nprogress'
import { useSpaceStore } from '@/stores/modules/space'
import { userMemberInfo } from '@/api/user'
import { getWorkItemDetail } from '@/api/project'
import { changeFavicon, getConfigDomain } from '@/utils'
import { ConfigKey } from '@/enum'

/** 移除页面loading */
function removeLoading() {
  const loadingDom = document.getElementById('app-loading')
  loadingDom && loadingDom.remove()
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...staticRouter, ...devRouter, ...errorRouter],
  strict: false,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// let spaceStore: any

/**
 * @description 路由拦截 beforeEach
 */
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  userStore.getConfig() // 刷新系统配置
  const projectStore = useProjectStore()
  const noticeStore = useNoticeStore()
  const favicon = getConfigDomain(ConfigKey.LOGO) ? `${getConfigDomain(ConfigKey.SPACE_FILE_DOMAIN)}${getConfigDomain(ConfigKey.LOGO)}` : import.meta.env.VITE_FAVICON_URL
  const headTitle = getConfigDomain(ConfigKey.TITLE) || import.meta.env.VITE_GLOBAL_APP_TITLE
  if (!from.name)
    noticeStore.setShowNotice(false)

  // 1.NProgress 开始
  NProgress.start()

  // 2.动态设置标题
  document.title = to.meta.title
    ? `${to.meta.title} - ${headTitle}项目管理系统 - 协作效率标准化`
    : `${headTitle}项目管理系统 - 协作效率标准化`

  // 动态修改浏览器图标
  changeFavicon(favicon)

  // 3.判断是访问登陆页，有 Token 就在当前页面，没有 Token 重置路由到登陆页
  if (to.path.toLocaleLowerCase() === LOGIN_URL) {
    if (to.query.nextPath?.includes('spaceId'))
      message.warning('您无权访问该页面，请登录/注册后加入项目查看', 2)

    if (userStore.token)
      return next(from.fullPath)

    // resetRouter()
    return next()
  }

  // 4.判断访问页面是否在路由白名单地址(静态路由)中，如果存在直接放行
  if (ROUTER_WHITE_LIST.includes(to.path))
    return next()

  // 5.判断是否有 Token，没有重定向到 login 页面
  if (!userStore.token) {
    return next({
      path: LOGIN_URL,
      replace: true,
      query: {
        nextPath: to.fullPath,
      },
    })
  }

  if (to.name === 'manager') {
    if (Number(userStore.userInfo.role) >= 50)
      next()
    else
      next('/')
  }
  // console.log('to', to, to.params.id, to.query.spaceId)
  if ((to.name === 'project' || to.name === 'home') && to.query.spaceId) {
    try {
      // const { data } = await userMemberInfo(
      //   {
      //     spaceId: (to.params.id as string) || (to.query.spaceId as string),
      //   },
      //   true,
      // )
      await userMemberInfo(
        {
          spaceId: (to.params.id as string) || (to.query.spaceId as string),
        },
        true,
      )

      // if (to.name === 'project') {
      //   if (!spaceStore)
      //     spaceStore = useSpaceStore()
      //   spaceStore.setUserStatus(Number(data.roleId))
      // }

      if (to.query.workItemId) {
        try {
          await getWorkItemDetail({
            spaceId: (to.params.id as string) || (to.query.spaceId as string),
            workItemId: to.query.workItemId as string,
          })
        }
        catch (err) {
          message.warning('任务已删除', 2)

          if (to.name === 'project')
            return next('/home')
        }
      }
    }
    catch (err: any) {
      err.code === 306002 && message.warning('您无权访问该页面，请联系项目管理员添加', 2)
      if (from.name === 'login')
        return next('/home')

      if (to.name === 'project')
        return next(from.fullPath)
    }
  }

  await projectStore.getList()
  await projectStore.getMemberList()

  // 8.正常访问页面
  next()
})

/**
 * @description 重置路由
 */
export function resetRouter() {
  // const authStore = useAuthStore()
  // authStore.flatMenuListGet.forEach((route) => {
  //   const { name } = route
  //   if (name && router.hasRoute(name)) router.removeRoute(name)
  // })
}

/**
 * @description 路由跳转错误
 */
router.onError((error) => {
  NProgress.done()
  removeLoading()
  console.warn('路由错误', error.message)
})

/**
 * @description 路由跳转结束
 */
router.afterEach(async (to) => {
  NProgress.done()
  const favicon = getConfigDomain(ConfigKey.LOGO) ? `${getConfigDomain(ConfigKey.SPACE_FILE_DOMAIN)}${getConfigDomain(ConfigKey.LOGO)}` : import.meta.env.VITE_FAVICON_URL
  const headTitle = getConfigDomain(ConfigKey.TITLE) || import.meta.env.VITE_GLOBAL_APP_TITLE
  // 2.动态设置标题
  document.title = to.meta.title
    ? `${to.meta.title} - ${headTitle}项目管理系统 - 协作效率标准化`
    : `${headTitle}项目管理系统 - 协作效率标准化`

  // 动态修改浏览器图标
  changeFavicon(favicon)
  removeLoading()
})

export default router
