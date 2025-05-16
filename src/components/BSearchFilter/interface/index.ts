// 第二个的下拉项
export interface TSTwoItem {
  value: string
  label: string
}

// 日期
export interface TSDate {
  start: string
  complete: string
  end?: string
}

// 第二个的下拉项
export interface TSThirdItem {
  // 任务状态的下拉value和选择值为number
  value: string | number
  label: string
  // 任务状态 (没用)
  color?: string
}

// 第一个的下拉项
export interface FilterOneOptions {
  value: string
  label: string
  icon?: string
  twoOptions: string[]
  disabled?: boolean
  field?: string
  thirdOptions?: any
}

// 选择项
export interface FilterSelectOptions {
  // 第一个的选择值
  oneSelectVal: string | null | string[]
  // 第二个的下拉集合
  twoOptions: TSTwoItem[]
  // 第二个的选择值
  twoSelectVal: string | null
  // 第三个的选择值 (可能为多选的结果, 可能是任务状态 - number, 可能是日期 - {})
  thirdSelectVal: string | null | string[] | number | number[] | TSDate
  // 第二个的选择值 (更新前的值)
  // 项目的选择值
  projectVal?: string
  // 是否聚焦
  isOpen?: boolean
  hover?: boolean
  groups?: FilterSelectOptions[]
}

export interface Condition {
  // 第一个的选择值
  oneSelectVal: string | null | string[]
  // 第二个的下拉集合
  twoOptions: TSTwoItem[]
  // 第二个的选择值
  twoSelectVal: string | null
  // 第三个的选择值 (可能为多选的结果, 可能是任务状态 - number, 可能是日期 - {})
  thirdSelectVal: string | null | string[] | number | number[] | TSDate
  // 第二个的选择值 (更新前的值)
  // 项目的选择值
  projectVal?: string
  filterText?: string
  // 是否聚焦
  isOpen?: boolean
  hover?: boolean
  groups?: FilterSelectOptions[]
  spaceId?: string
  field?: string
  operator?: string
  values?: string[]
}

export interface ConditionGroup {
  conjunction: string // condition的关系且/或
  conditions: Condition[]
  conditionGroup?: ConditionGroup[]
  id?: number
}

export interface QueryConditionGroup {
  conjunction: string // condition的关系且/或
  conditions: QueryCondition[]
  conditionGroup?: QueryConditionGroup[]
  id?: number
}

export interface QueryCondition {
  field: string
  operator: string
  spaceId?: string
  values: string[]
}

// 项目项
export interface FilterProjectOptions {
  // projectList => id
  value: string
  // projectList => spaceName
  label: string
  children?: FilterProjectOptions[]
}
