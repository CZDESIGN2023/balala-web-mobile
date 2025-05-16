export interface DataList {
  createdAt: string
  deletedAt: string
  id: string
  ranking?: string
  remark: string
  spaceId: string
  updatedAt: string
  value?: string
  versionKey?: string
  versionName: string
  versionStatus?: string
  _X_ROW_KEY?: string
  disabledName?: boolean
  contenteditable?: boolean
  completeRate?: string
  describe?: string
  processing?: string
  total?: string
  userId?: string
  weekProcessing?: string
  workObjectGuid?: string
  workObjectStatus?: string | number
}

export interface Options {
  label: string
  value: string
}

export interface CountList {
  completeRate: string
  id: string
  processing: string
  total: string
  weekProcessing: string
}

export interface Params {
  spaceId?: string
  versionId?: string
  versionName: string
}
