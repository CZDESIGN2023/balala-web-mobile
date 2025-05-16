// 子任务表格 配置
export const childTaskTableColumn = [
  {
    title: '任务名称',
    dataIndex: 'workItemName',
    key: 'workItemName'
  },
  {
    title: '负责人',
    dataIndex: 'owner',
    key: 'owner',
    width: 185
  },
  {
    title: '排期',
    dataIndex: 'planTimeAt',
    key: 'planTimeAt',
    width: 126
  },
  {
    title: '进度',
    dataIndex: 'processRate',
    key: 'processRate',
    width: 56
  },
  {
    title: '',
    dataIndex: 'operation',
    width: 40
  }
]
