import { computed, reactive } from 'vue'
import type { VxeGridProps } from 'balala-vxe-table'
import type { TableTaskItem } from '@/api/interface'

export function gridOptions() {
  const obj = reactive<VxeGridProps<TableTaskItem>>({
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
      isCurrent: true,
    },
    columnConfig: {
      resizable: false,
      useKey: true,
    },
    scrollY: {
      enabled: true,
      gt: 0,
    },
    scrollX: {
      enabled: false,
    },
    columns: [
      { type: 'seq', width: 40, slots: {
        header: 'seq_header',
        default: 'seq_default',
      } },
      {
        field: 'nickName',
        title: 'AccessKey ID / Secret',
        slots: {
          header: 'user_header',
          default: 'nick_name',
        },
      },
      {
        field: 'nickName',
        title: '平台名称',
        slots: {
          header: 'user_header',
          default: 'nick_name',
        },
      },
      {
        field: 'loginTime',
        title: '创建时间',
        width: 400,
        slots: {
          header: 'time_header',
          default: 'login_time',
        },
      },
      {
        field: 'operate',
        title: '接口开关',
        align: 'center',
        width: 64,
        slots: {
          header: 'operate_header',
          default: 'operate',
        },
      },
      {
        field: 'operate',
        title: '操作',
        align: 'center',
        width: 64,
        slots: {
          header: 'operate_header',
          default: 'operate',
        },
      },
    ],
  })
  return obj
}
