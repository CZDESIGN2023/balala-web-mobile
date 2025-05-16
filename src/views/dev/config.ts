import type { RouteRecordRaw } from 'vue-router'

const menuArr = [
  {
    title: '组件文档',
    name: 'index',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/Index.vue'),
  },

  { title: 'Form 表单组件' },
  {
    title: 'BForm 高级表单',
    name: 'BForm',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/basic/BFormDemo.vue'),
  },
  {
    title: 'BFormPersonSelect 成员选择',
    name: 'BFormPersonSelect',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/form/BFormPersonSelectDemo.vue'),
  },
  {
    title: 'BInput2 输入框',
    name: 'BInput2',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/basic/BInput2Demo.vue'),
  },
  {
    title: 'BInputNumber 数字输入框',
    name: 'BInputNumber',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/form/BInputNumberDemo.vue'),
  },
  {
    title: 'BRangePicker 日期范围选择器',
    name: 'BRangePicker',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/form/BRangePickerDemo.vue'),
  },
  {
    title: 'BSelect 选择器',
    name: 'BSelect',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/basic/BSelectDemo.vue'),
  },
  {
    title: 'BSelectSync 异步下拉',
    name: 'BSelectSync',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/basic/BSelectSyncDemo.vue'),
  },
  {
    title: 'BSelectSyncEdit 异步下拉+编辑',
    name: 'BSelectSyncEdit',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/basic/BSelectSyncEditDemo.vue'),
  },
  {
    title: 'BSwitch 开关',
    name: 'BSwitch',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/form/BSwitchDemo.vue'),
  },

  { title: 'Data 数据展示' },
  {
    title: 'AvatarNameTag 头像昵称',
    name: 'AvatarNameTag',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/basic/AvatarNameTagDemo.vue'),
  },

  { title: 'Feedback 反馈组件' },
  {
    title: 'ModalListEdit 弹窗列表编辑',
    name: 'ModalListEdit',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/feedback/ModalListEditDemo.vue'),
  },
  {
    title: 'Msgbox 消息弹窗',
    name: 'Msgbox',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/feedback/MsgboxDemo.vue'),
  },

  { title: 'Business Form 业务表单组件' },
  {
    title: 'BusinessPersonSelect 人员选择',
    name: 'BusinessPersonSelect',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/business-form/BusinessPersonSelectDemo.vue'),
  },
  {
    title: 'SelectStatus 任务状态下拉',
    name: 'SelectStatus',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/business/SelectStatusDemo.vue'),
  },
  { title: 'Business Data 业务数据展示' },
  {
    title: 'StatusOperations 表格列状态操作',
    name: 'StatusOperations',
    compontent: () => import(/* webpackChunkName: "dev" */'@/views/dev/business/StatusOperationsDemo.vue'),
  },
]

export const menus = menuArr.map((item) => {
  return {
    title: item.title,
    name: item.name,
    path: `/dev/${item.name}`,
    component: item.compontent,
  }
})

export default [
  {
    path: '/dev',
    name: 'dev-layout',
    component: () => import('@/views/dev/Layout.vue'),
    redirect: '/dev/index',
    children: menus.filter(item => item.name),
  },
] as RouteRecordRaw[]
