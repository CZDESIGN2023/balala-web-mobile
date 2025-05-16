// 第二个的下拉项
export interface OrderTwoItem {
  value: string
  front: string
  after: string
  label: string
}

// 第一个的下拉项
export interface OrderOneOptions {
  value: string
  label: string
  icon?: string
  twoOptions: OrderTwoItem[]
}

// 选择项
export interface OrderSelectOptions {
  // 第二个的下拉集合
  twoOptions: OrderTwoItem[]
  // 第一个的选择值
  oneSelectVal: string | null
  // 第二个的选择值
  twoSelectVal: string
  // 是否聚焦
  isOpen?: boolean
  hover?: boolean
}
