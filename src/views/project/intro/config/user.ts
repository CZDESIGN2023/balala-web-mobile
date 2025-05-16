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
        title: '成员',
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
        slots: {
          default: 'processing_default',
        },
      },
      {
        field: 'total',
        title: '任务总数',
        align: 'center',
        slots: {
          default: 'total_default',
        },
      },
      {
        field: 'auth',
        title: '权限管理',
        align: 'center',
        width: 92,
        visible: false,
        slots: {
          default: 'auth_default',
        },
      },

      {
        field: 'tool',
        title: '',
        visible: false,
        align: 'center',
        width: 64,
        slots: {
          default: 'tool_default',
        },
      },
    ],
  })
  return obj
}

export const getProjectOptions: any = (showTool: boolean) => {
  const obj = reactive<VxeGridProps<any>>({
    // 是否显示边框线
    border: false,
    // 内容过长时显示为省略号
    showOverflow: true,
    // 当表头内容过长时显示为省略号
    showHeaderOverflow: false,
    loading: false,
    rowConfig: {
      useKey: true,
      isHover: true,
    },
    maxHeight: 'auto',
    minHeight: '48',
    columnConfig: {
      resizable: false,
      useKey: true,
    },
    columns: [
      {
        field: 'name',
        title: '成员',
        slots: {
          header: 'name_header',
          default: 'name_default',
        },
      },
      {
        field: 'auth',
        title: '权限管理',
        align: 'center',
        width: 92,
        slots: {
          default: 'auth_default',
        },
      },

      {
        field: 'tool',
        title: '操作',
        align: 'center',
        width: 64,
        visible: showTool,
        slots: {
          default: 'tool_default',
        },
      },
    ],
  })
  return obj
}

export const getMemberOptions: any = (showTool: boolean) => {
  const obj = reactive<VxeGridProps<any>>({
    // 是否显示边框线
    border: false,
    // 内容过长时显示为省略号
    showOverflow: true,
    // 当表头内容过长时显示为省略号
    showHeaderOverflow: false,
    loading: false,
    rowConfig: {
      useKey: true,
      isHover: true,
    },
    maxHeight: 'auto',
    minHeight: '48',
    columnConfig: {
      resizable: false,
      useKey: true,
    },
    columns: [
      {
        field: 'name',
        title: '成员',
        slots: {
          header: 'name_header',
          default: 'name_default',
        },
      },

      {
        field: 'tool',
        title: '操作',
        align: 'center',
        width: 64,
        visible: showTool,
        slots: {
          default: 'tool_default',
        },
      },
    ],
  })
  return obj
}
