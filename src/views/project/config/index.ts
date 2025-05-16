
function sharedOnCell(item: any) {
  if (item.level === 'level-1') {
    return { colSpan: 0 }
  }
}

export function columns(type?: string) {
  return [
    {
      title: '任务流程',
      dataIndex: 'type',
      key: 'type',
      width: 77,
      fixed: 'left',
      customCell: (item: any) => {
        return {
          colSpan: item.level === 'level-1' ? (type === 'home' ? 11 : 10) : 1,
        }
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 84,
      fixed: 'left',
      customCell: sharedOnCell,
    },
    {
      title: '任务名称',
      dataIndex: 'displayName',
      key: 'displayName',
      ellipsis: true,
      customCell: sharedOnCell,
    },
    {
      title: '当前负责人',
      dataIndex: 'director',
      key: 'director',
      width: 160,
      customCell: sharedOnCell,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 126,
      customCell: sharedOnCell,
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      key: 'status',
      width: 144,
      customCell: sharedOnCell,
    },
    {
      title: '进度与排期',
      width: 270,
      children: [
        {
          title: '参与人',
          key: 'attendee',
          dataIndex: 'attendee',
          width: 70,
          fixed: type === 'home' ? false : 'right',
          customCell: sharedOnCell,
        },
        {
          title: '进度',
          key: 'processRate',
          dataIndex: 'processRate',
          width: 80,
          fixed: type === 'home' ? false : 'right',
          customCell: sharedOnCell,
        },
        {
          title: '排期',
          key: 'time',
          dataIndex: 'time',
          width: 120,
          fixed: type === 'home' ? false : 'right',
          customCell: sharedOnCell,
        },
      ],
      customCell: sharedOnCell,
    },
  ]
}

const projectColumns = [
  {
    title: '',
    dataIndex: 'checkbox',
    key: 'checkbox',
    width: 48,
    fixed: 'left',
    customCell: sharedOnCell,
  },
  ...columns(),
]

const homeColumns = [
  {
    title: '',
    dataIndex: 'checkbox',
    key: 'checkbox',
    width: 48,
    fixed: 'left',
    customCell: sharedOnCell,
  },
  ...columns('home'),
  {
    title: '所属项目',
    dataIndex: 'project',
    key: 'project',
    width: 164,
    ellipsis: true,
    fixed: 'right',
    customCell: sharedOnCell,
  },
]

export function projectColumn(type?: string) {
  if (type === 'home') {
    return homeColumns
  }
  else {
    return projectColumns
  }
}

// export const tabNames = [
//   {
//     name: '概览',
//     key: 'intro',
//     icon: require('@/assets/icon/intro.png'),
//   },
//   {
//     name: '表格',
//     key: 'table',
//     icon: require('@/assets/icon/table.png'),
//   },
//   {
//     name: '关注',
//     key: 'follow',
//     icon: require('@/assets/icon/task.png'),
//   },
// ]

export const tabNames = [
  {
    name: '概览',
    key: 'intro',
    iconName: 'intro_change',
    iconColor: '#1D74F5',
  },
  {
    name: '表格',
    key: 'table',
    iconName: 'table_change',
    iconColor: '#28BCA4',
  },
  {
    name: '关注',
    key: 'follow',
    iconName: 'follow_change',
    iconColor: '#FF9800',
  },
]
