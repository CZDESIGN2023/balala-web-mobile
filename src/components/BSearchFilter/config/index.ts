import type { FilterOneOptions } from '../interface'
import { FilterEnum } from '@/enum'
import { PRIORITY_LIST, TASK_STATUS } from '@/utils/constant'

// 且或集合
export const bondList = [
  {
    value: 'AND',
    label: '且',
  },
  {
    value: 'OR',
    label: '或',
  },
]

// 筛选项
export const oneList: FilterOneOptions[] = [
  {
    value: 'work_object_id',
    label: '所属模块',
    icon: 'filter-module',
    twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
  },
  {
    value: 'directors',
    label: '当前负责人',
    icon: 'filter-creator',
    twoOptions: [
      FilterEnum.IN,
      FilterEnum.NOT_IN,
      FilterEnum.INCLUDE,
      FilterEnum.NOT_INCLUDE,
      FilterEnum.EQ,
      FilterEnum.NOT_EQ,
    ],
  },
  {
    value: 'user_id',
    label: '创建人',
    icon: 'filter-creator',
    twoOptions: [
      FilterEnum.IN,
      FilterEnum.NOT_IN,
      // FilterEnum.INCLUDE,
      // FilterEnum.NOT_INCLUDE,
      FilterEnum.EQ,
      FilterEnum.NOT_EQ,
    ],
  },
  {
    value: 'participators',
    label: '参与人',
    icon: 'filter-creator',
    twoOptions: [
      FilterEnum.IN,
      FilterEnum.NOT_IN,
      FilterEnum.INCLUDE,
      FilterEnum.NOT_INCLUDE,
      FilterEnum.EQ,
      FilterEnum.NOT_EQ,
    ],
  },
  {
    value: 'priority',
    label: '优先级',
    icon: 'filter-priority',
    twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
    thirdOptions: PRIORITY_LIST,
  },
  {
    value: 'work_item_status',
    label: '任务状态',
    icon: 'filter-status',
    twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
  },
  {
    value: 'work_item_flow_id',
    label: '任务流程',
    icon: 'filter-type',
    twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
  },
  {
    value: 'version_id',
    label: '版本规划',
    icon: 'version-black',
    twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
  },
  {
    value: 'plan_time',
    label: '总排期',
    icon: 'filter-date',
    twoOptions: [FilterEnum.BETWEEN],
  },
  {
    value: 'followers',
    label: '是否已关注',
    icon: '',
    disabled: true,
    twoOptions: [FilterEnum.IN],
  },
]

// 工作台 筛选项 所有项目
export const oneAllList: FilterOneOptions[] = [
  {
    value: 'directors',
    label: '当前负责人',
    icon: 'filter-creator',
    twoOptions: [
      FilterEnum.IN,
      FilterEnum.NOT_IN,
      FilterEnum.INCLUDE,
      FilterEnum.NOT_INCLUDE,
      FilterEnum.EQ,
      FilterEnum.NOT_EQ,
    ],
  },
  {
    value: 'participators',
    label: '参与人',
    icon: 'filter-creator',
    twoOptions: [
      FilterEnum.IN,
      FilterEnum.NOT_IN,
      FilterEnum.INCLUDE,
      FilterEnum.NOT_INCLUDE,
      FilterEnum.EQ,
      FilterEnum.NOT_EQ,
    ],
  },
  {
    value: 'priority',
    label: '优先级',
    icon: 'filter-priority',
    twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
    thirdOptions: PRIORITY_LIST,
  },
  // {
  //   value: 'work_item_status',
  //   label: '任务状态',
  //   icon: 'filter-status',
  //   twoOptions: [FilterEnum.IN, FilterEnum.NOT_IN, FilterEnum.EQ, FilterEnum.NOT_EQ],
  //   thirdOptions: TASK_STATUS,
  // },
  {
    value: 'plan_time',
    label: '总排期',
    icon: 'filter-date',
    twoOptions: [FilterEnum.BETWEEN],
  },
]

// 运算符
export const twoList = [
  {
    value: FilterEnum.IN,
    label: '存在选项属于',
  },
  {
    value: FilterEnum.NOT_IN,
    label: '全部选项均不属于',
  },
  {
    value: FilterEnum.EQ,
    label: '等于',
  },
  {
    value: FilterEnum.NOT_EQ,
    label: '不等于',
  },
  {
    value: FilterEnum.INCLUDE,
    label: '包含',
  },
  {
    value: FilterEnum.NOT_INCLUDE,
    label: '不包含',
  },
  {
    value: FilterEnum.BETWEEN,
    label: '在区间',
  },
]

export const filterTag = [
  {
    id: '1',
    name: '未完成任务',
    conditionData: {},
  },
  {
    id: '3',
    name: '我的任务',
    conditionData: {},
  },
  {
    id: '4',
    name: '本周待办',
    conditionData: {},
  },
]
