import type { VxeGridProps } from 'balala-vxe-table'
import { reactive } from 'vue'

// 模块表格配置信息
export const gridOptions: any = (maxHeight: string | number, showTool: boolean) => {
  const obj = reactive<VxeGridProps<any>>({
    // 是否显示边框线
    border: true,
    // 内容过长时显示为省略号
    showOverflow: true,
    // 当表头内容过长时显示为省略号
    showHeaderOverflow: false,
    loading: false,
    rowConfig: {
      useKey: true,
      isHover: true,
    },
    maxHeight,
    minHeight: '48',
    columnConfig: {
      resizable: false,
      useKey: true,
    },
    columns: [
      {
        field: 'name',
        title: '模块名称',
        slots: {
          header: 'name_header',
          default: 'name_default',
        },
      },
      {
        field: 'weekProcessing',
        title: '本周待办',
        align: 'center',
        slots: {
          default: 'week_default',
        },
      },
      {
        field: 'processing',
        title: '待办总数',
        align: 'center',
        visible: false,
        slots: {
          default: 'processing_default',
        },
      },
      {
        field: 'total',
        title: '任务总数',
        align: 'center',
        width: 92,
        slots: {
          default: 'total_default',
        },
      },
      {
        field: 'priority',
        title: '待办任务优先级',
        align: 'center',
        width: 430,
        visible: false,
        slots: {
          default: 'priority_default',
        },
      },
      {
        field: 'rate',
        title: '模块进度',
        align: 'center',
        slots: {
          default: 'rate_default',
        },
      },

      {
        field: 'tool',
        title: '',
        align: 'center',
        visible: false,
        width: 64,
        slots: {
          default: 'tool_default',
        },
      },
    ],
  })
  return obj
}

// 模块初始数据
export const recordRow = {
  contenteditable: true,
  createdAt: '',
  deletedAt: '',
  describe: '',
  id: '0',
  remark: '',
  spaceId: '',
  updatedAt: '',
  userId: '',
  workObjectGuid: '',
  workObjectName: '',
  workObjectStatus: 1,
  completeRate: '0',
  weekProcessing: '0',
  processing: '0',
  total: '0',
  priorityInfos: [
    {
      priority: 'P0',
      count: '0',
    },
    {
      priority: 'P1',
      count: '0',
    },
    {
      priority: 'P2',
      count: '0',
    },
    {
      priority: 'P3',
      count: '0',
    },
    {
      priority: 'P4',
      count: '0',
    },
    {
      priority: 'PENDING',
      count: '0',
    },
    {
      priority: 'SUSPEND',
      count: '0',
    },
  ],
}

// 模块表格配置信息
export const gridVersionOptions: any = (maxHeight: string | number, showTool: boolean) => {
  const obj = reactive<VxeGridProps<any>>({
    // 是否显示边框线
    border: true,
    // 内容过长时显示为省略号
    showOverflow: true,
    // 当表头内容过长时显示为省略号
    showHeaderOverflow: false,
    loading: false,
    rowConfig: {
      useKey: true,
      isHover: true,
    },
    maxHeight,
    minHeight: '48',
    columnConfig: {
      resizable: false,
      useKey: true,
    },
    columns: [
      {
        field: 'versionName',
        title: '版本',
        slots: {
          header: 'versionName_header',
          default: 'versionName_default',
        },
      },
      {
        field: 'weekProcessing',
        title: '本周待办',
        align: 'center',
        slots: {
          default: 'week_default',
        },
      },
      {
        field: 'processing',
        title: '待办总数',
        align: 'center',
        slots: {
          default: 'processing_default',
        },
      },
      {
        field: 'total',
        title: '任务总数',
        align: 'center',
        width: 92,
        visible: false,
        slots: {
          default: 'total_default',
        },
      },

      {
        field: 'completeRate',
        title: '版本进度',
        align: 'center',
        slots: {
          default: 'rate_default',
        },
      },

      {
        field: 'tool',
        title: '',
        align: 'center',
        width: 64,
        visible: false,
        slots: {
          default: 'tool_default',
        },
      },
    ],
  })
  return obj
}

// 模块初始数据
export const recordVersionRow = {
  contenteditable: true,
  createdAt: '',
  deletedAt: '',
  describe: '',
  id: '0',
  remark: '',
  spaceId: '',
  updatedAt: '',
  userId: '',
  workObjectGuid: '',
  versionName: '',
  workObjectStatus: 1,
  completeRate: '0',
  weekProcessing: '0',
  processing: '0',
  total: '0',
}
