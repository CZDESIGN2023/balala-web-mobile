import type { TaskDialogInfoParams } from '@/views/project/types/task'

export interface SelectOptions {
  value?: string
  label?: string
}

export interface TaskDrawerProps {
  openType: string
  taskTabKey?: string
  taskParams?: TaskDialogInfoParams
}

export interface TaskCompare {
  add: string[]
  remove: string[]
}
