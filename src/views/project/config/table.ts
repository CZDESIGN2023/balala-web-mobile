import { computed, reactive } from 'vue'
import type { VxeGridProps } from 'balala-vxe-table'
import type { TableTaskItem } from '@/api/interface'

export const gridOptions: any = (_mode: string) => {
  const obj = reactive<VxeGridProps<TableTaskItem>>({
    // 是否显示边框线
    loading: false,
    rowConfig: {
      useKey: true,
      isHover: true,
      isCurrent: true,
    },
    showOverflow: '',
    maxHeight: '100%',
    columnConfig: {
      // resizable: true,
      useKey: true,
    },
    scrollY: {
      enabled: true,
      oSize: navigator.userAgent.includes('Chrome') ? 40 : 0,
      gt: 0,
    },
    scrollX: {
      enabled: false,
    },
    columns: [
      // {
      //   field: 'checkbox',
      //   title: '',
      //   width: 50,
      //   resizable: false,
      //   type: 'seq',
      //   align: 'center',
      //   slots: {
      //     header: 'checkbox_header',
      //     default: 'checkbox_default',
      //   },
      // },
      // {
      //   field: 'versionName',
      //   title: '版本规划',
      //   width: 84,
      //   minWidth: 57,
      //   type: 'seq',
      //   slots: {
      //     header: 'table_header',
      //     default: 'versionName_default',
      //   },
      // },
      // {
      //   field: 'type',
      //   title: '任务流程',
      //   width: 71,
      //   minWidth: 57,
      //   slots: {
      //     header: 'table_header',
      //     default: 'type_default',
      //   },
      // },
      // {
      //   field: 'priority',
      //   title: '优先级',
      //   width: 73,
      //   minWidth: 57,
      //   slots: {
      //     header: 'table_header',
      //     default: 'priority_default',
      //   },
      // },
      {
        field: 'displayName',
        title: '任务名称',
        treeNode: true,
        width: '61%',
        slots: {
          // header: 'table_header',
          default: 'displayName_default',
        },
      },
      {
        field: 'director',
        title: '负责人',
        width: '15%',
        align: 'center',
        slots: {
          // header: 'table_header',
          default: 'director_default',
        },
      },

      {
        field: 'time',
        title: '总排期',
        width: '24%',
        align: 'right',
        slots: {
          // header: 'table_header',
          default: 'time_default',
        },
      },
      // {
      //   field: 'creator',
      //   title: '创建人',
      //   width: 110,
      //   minWidth: 57,
      //   slots: {
      //     header: 'table_header',
      //     default: 'creator_default',
      //   },
      // },
      // {
      //   field: 'status',
      //   title: '任务状态',
      //   width: 151,
      //   minWidth: 57,
      //   slots: {
      //     header: 'table_header',
      //     default: 'status_default',
      //   },
      // },
      // {
      //   field: 'workObject',
      //   title: '所属模块',
      //   width: 74,
      //   minWidth: 57,
      //   slots: {
      //     header: 'table_header',
      //     default: 'workObject_default',
      //   },
      // },
      // {
      //   title: '进度与总排期',
      //   width: 27,
      //   align: 'center',
      //   children: [
      //     {
      //       field: 'attendee',
      //       title: '参与人',
      //       width: 57,
      //       minWidth: 57,
      //       slots: {
      //         header: 'table_header',
      //         default: 'attendee_default',
      //       },
      //     },
      //     {
      //       field: 'processRate',
      //       title: '进度',
      //       width: 64,
      //       minWidth: 57,
      //       slots: {
      //         default: 'processRate_default',
      //       },
      //     },
      //     {
      //       field: 'time',
      //       title: '总排期',
      //       width: 120,
      //       minWidth: 57,
      //       slots: {
      //         header: 'table_header',
      //         default: 'time_default',
      //       },
      //     },
      //   ],
      // },
      // {
      //   field: 'project',
      //   title: '所属项目',
      //   width: 131,
      //   minWidth: 57,
      //   visible: mode === 'home',
      //   slots: {
      //     header: 'table_header',
      //     default: 'project_default',
      //   },
      // },
    ],
  })
  return obj
}
