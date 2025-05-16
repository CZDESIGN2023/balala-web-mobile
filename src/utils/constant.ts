import { SpaceRole } from '@/enum'

/** 优先级 */
export const PRIORITY_LIST = [
  { label: 'P0', value: 'P0', color: '#FFD4D1', minorColor: '#FFE2DD' },
  { label: 'P1', value: 'P1', color: '#FFE6C4', minorColor: '#FADDC9' },
  { label: 'P2', value: 'P2', color: '#E0FAD9', minorColor: '#FDEDC8' },
  { label: 'P3', value: 'P3', color: '#D6F1F7', minorColor: '#DBEEE8' },
  { label: 'P4', value: 'P4', color: '#FAE4FA', minorColor: '#E8DEEE' },
  // 暂未启用
  // { label: 'P5', value: 'P5', color: '#F9F0D5', minorColor: '' },
  // { label: 'P6', value: 'P6', color: '#F0E8FF', minorColor: '' },
  // { label: 'P7', value: 'P7', color: '#FAE4F3', minorColor: '' },
  // { label: 'P8', value: 'P8', color: '#DFF7F2', minorColor: '' },
  // { label: 'P9', value: 'P9', color: '#E9F7DF', minorColor: '' },
  { label: '待定', value: 'PENDING', color: '#DBEAFF', minorColor: '#E8DEEE' },
  { label: '暂定', value: 'SUSPEND', color: '#E6E7EB', minorColor: '#E2E3E5' },
]

/** 任务状态 */
export const TASK_STATUS = [
  {
    label: '进行中',
    value: '1',
    color: '#D4E5FF',
    node: '开发',
  },
  {
    label: '策划中',
    value: '9',
    color: '#D4E5FF',
    node: '策划',
  },
  {
    label: '设计中',
    value: '10',
    color: '#F1E5F9',
    node: '设计',
  },
  {
    label: '待确认',
    value: '6',
    color: '#FFE6C4',
    node: '审查',
  },
  {
    label: '测试中',
    value: '4',
    color: '#FAE4FA',
    node: '测试',
  },
  {
    label: '验收中',
    value: '5',
    color: '#D6F1F7',
    node: '验收',
  },
  {
    label: '已完成',
    value: '2',
    color: '#CCF3CC',
    node: '',
  },
  {
    label: '已终止',
    value: '3',
    color: '#E6E7EB',
    node: '',
  },
  {
    label: '已关闭',
    value: '8',
    color: '#E6E7EB',
    node: '',
  },
]

/** 任务状态 */
export const TASK_TYPES = [
  {
    label: '设计',
    value: '4',
    color: '#FFE6C4',
  },
  {
    label: '需求',
    value: '1',
    color: '#D6F1F7',
  },
  {
    label: 'BUG',
    value: '2',
    color: '#FFD4D1',
  },
  {
    label: '走查',
    value: '3',
    color: '#FAE4FA',
  },
]

/** 恢复任务原因 */
export const RESTORE_REASON = [
  {
    label: '任务需要继续进行',
    value: 1,
  },
  {
    label: '误操作',
    value: 2,
  },
  {
    label: '其他',
    value: 'other',
  },
]

export const RANDOM_COLOR = [
  'radial-gradient(77% 77% at 10% 13%, #6BA7FF 0%, #1D74F5 100%)',
  'radial-gradient(77% 77% at 10% 13%, #7A6BFF 0%, #331DF5 100%)',
  'radial-gradient(77% 77% at 10% 13%, #FFAB6B 0%, #F57B1D 100%)',
  'radial-gradient(77% 77% at 10% 13%, #C46BFF 0%, #9F1DF5 100%)',
]

export const TAG_RANDOM_COLOR = [
  '#FFD4D1',
  '#FFE6C4',
  '#E0FAD9',
  '#D6F1F7',
  '#FAE4FA',
  '#F9F0D5',
  '#F0E8FF',
  '#FAE4F3',
  '#DFF7F2',
  '#E9F7DF',
  '#DBEAFF',
  '#E6E7EB',
]

export const TAG_DEFAULT_COLOR: { [key: string]: string } = {
  design: '#FFE6C4',
  xuqiu: '#D6F1F7',
  bug: '#FFD4D1',
  zoucha: '#FAE4FA',
  progressing: '#D4E5FF',
  completed: '#CCF3CC',
  terminated: '#E6E7EB',
  reboot: '#E6E7EB',
  close: '#E6E7EB',
}

// 预设任务流程颜色
export const preset_flow_color: { [key: string]: string } = {
  design: '#FFE6C4', // 设计
  xuqiu: '#D6F1F7', // 需求
  bug: '#FFD4D1', // bug
  zoucha: '#FAE4FA', // 走查
}

// 预设任务状态颜色
export const preset_status_color: { [key: string]: string } = {
  progressing: '#D4E5FF', // 进行中
  completed: '#CCF3CC', // 已完成
  terminated: '#E6E7EB', // 已终止
  testing: '#FAE4FA', // 测试中
  checking: '#D6F1F7', // 验收中
  wait_confirm: '#FFE6C4', // 待确认
  close: '#E6E7EB', // 已关闭
  reboot: '#E6E7EB', // 已重启
  planning: '#D4E5FF', // 策划中
  designing: '#F1E5F9', // 设计中
}

// 随机颜色范围
export const default_random_color = [
  '#FFD4D1',
  '#FFE6C4',
  '#E0FAD9',
  '#D6F1F7',
  '#FAE4FA',
  '#F9F0D5',
  '#F0E8FF',
  '#FAE4F3',
  '#DFF7F2',
  '#E9F7DF',
  '#DBEAFF',
  '#E6E7EB',
]
