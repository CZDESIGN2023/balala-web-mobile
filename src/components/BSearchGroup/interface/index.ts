// 第一个的下拉项
export interface GroupOneOptions {
  value: string
  label: string
  icon?: string
}

// 选择项
export interface GroupSelectOptions {
  // 第一个的选择值
  oneSelectVal: string | null
  // 是否聚焦
  isOpen?: boolean
  hover?: boolean
}
