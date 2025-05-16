import type { RouteRecordRaw } from 'vue-router'
import { HOME_URL, LOGIN_URL } from '@/config'

/**
 * staticRouter (静态路由)
 */
export const staticRouter: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: HOME_URL,
  },
  {
    path: LOGIN_URL,
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '',
    },
  },
  {
    path: '/flownode',
    name: 'flownode',
    component: () => import('@/views/flowNode/index.vue'),
    meta: {
      title: '流程节点',
    },
  },
  {
    path: '/layout',
    name: 'layout',
    component: () => import('@/layout/index.vue'),
    redirect: HOME_URL,
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('@/views/home/index.vue'),
        meta: {
          title: '工作台',
        },
      },
      {
        path: '/project/:id',
        name: 'project',
        component: () => import('@/views/project/index.vue'),
        props: route => ({ id: route.params.id }),
        meta: {
          title: '项目',
        },
      },
      {
        path: '/project/add',
        name: 'projectAdd',
        component: () => import('@/views/project/add.vue'),
        meta: {
          title: '创建项目',
        },
      },
      {
        path: '/my',
        name: 'my',
        component: () => import('@/views/my/index.vue'),
        meta: {
          title: '个人设置',
        },
      },
      {
        path: '/system',
        name: 'system',
        component: () => import('@/views/system/index.vue'),
        meta: {
          title: '系统设置',
        },
      },
      {
        path: '/manager',
        name: 'manager',
        component: () => import('@/views/manager/index.vue'),
        meta: {
          title: '管理系统',
        },
      },
      {
        path: '/notice',
        name: 'notice',
        component: () => import('@/views/notice/index.vue'),
        meta: {
          title: '待办通知',
        },
      },
      {
        path: '/test',
        name: 'test',
        component: () => import('@/views/test/index.vue'),
        meta: {
          title: '测试',
        },
      },
    ],
  },
]

/**
 * errorRouter (错误页面路由)
 */
export const errorRouter = [
  {
    path: '/401',
    name: '401',
    component: () => import('@/views/error/401.vue'),
    meta: {
      title: '401页面',
    },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '404页面',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/404.vue'),
  },
]
