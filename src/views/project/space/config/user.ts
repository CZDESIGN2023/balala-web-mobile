import type { VxeGridProps } from 'balala-vxe-table'
import { reactive } from 'vue'
import { compareUserNickName } from '@/utils/array'
import type { Column } from '@/components/data/BTable/src/BTable.vue'

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
        width: 92,
        slots: {
          default: 'week_default',
        },
      },
      {
        field: 'processing',
        title: '待办总数',
        align: 'center',
        width: 92,
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
        title: '',
        visible: showTool,
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
        width: 88,
        slots: {
          default: 'auth_default',
        },
      },

      {
        field: 'tool',
        title: '操作',
        align: 'center',
        width: 32,
        visible: showTool,
        slots: {
          default: 'tool_default',
        },
      },
    ],
  })
  return obj
}

function sortByProp(a: any, b: any, prop: string): number {
  const totalA = Number.parseInt(a.stats[prop])
  const totalB = Number.parseInt(b.stats[prop])

  if (totalA !== totalB)
    return totalA - totalB // 升序排列
  return compareUserNickName(a.userNickname || '', b.userNickname || '')
}

export const getMemberOptions: any = (showTool: boolean) => {
  const obj = reactive<{ columns: Column[] }>({
    columns: [
      {
        prop: 'name',
        label: '成员',
      },
      // {
      //   prop: 'stats.expired',
      //   label: '逾期任务',
      //   align: 'center',
      //   sortable: true,
      //   sortMethod: (a: any, b: any) => sortByProp(a, b, 'expired'),
      //   width: 85,
      // },
      // {
      //   prop: 'stats.weekProcessing',
      //   label: '本周待办',
      //   align: 'center',
      //   sortable: true,
      //   sortMethod: (a: any, b: any) => sortByProp(a, b, 'weekProcessing'),
      //   width: 85,
      // },
      // {
      //   prop: 'stats.processing',
      //   label: '待办任务',
      //   align: 'center',
      //   sortable: true,
      //   sortMethod: (a: any, b: any) => sortByProp(a, b, 'processing'),
      //   width: 85,
      // },
      // {
      //   prop: 'stats.total',
      //   label: '任务总数',
      //   align: 'center',
      //   sortable: true,
      //   sortMethod: (a: any, b: any) => sortByProp(a, b, 'total'),
      //   width: 85,
      // },
      // {
      //   prop: 'rate',
      //   label: '成员进度',
      //   align: 'center',
      //   width: 85,
      //   sortable: true,
      //   sortMethod: (a: any, b: any) => sortByProp(a, b, 'completeRate'),
      // },
      {
        prop: 'perm',
        label: '权限',
        align: 'center',
        width: 88,
      },
      {
        prop: 'tool',
        label: '',
        align: 'center',
        width: 32,
        visible: showTool,
      },
    ],
  })
  return obj
}
