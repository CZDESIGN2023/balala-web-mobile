export interface FilterParams {
  conjunction: string
  conditions: FilterConditionItem[]
  conditionGroup?: FilterParams[]
}

export interface FilterConditionItem {
  field: string
  values: string[]
  operator: string
  spaceId: number
}

export interface FilterSort {
  field?: string
  order?: string
  field_type?: string
}
