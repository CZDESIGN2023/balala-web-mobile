export interface Subject {
  type: string
  data: any
}

export interface ObjectData {
  type: string
  data: any
}

export interface SubObject {
  type: string
  data: any
}

export interface UserData {
  name: string
  nickName: string
  id: number
  avatar: string
}

export interface WorkItemData {
  id: number
  name: string
}

export interface CommentData {
  id: number
  name: string
}

export interface Notification {
  subject?: Subject
  object?: ObjectData
  action: string
  subObject?: SubObject
  describe: string
  date: string
}

export interface NotificationData {
  space: {
    spaceId: number
    spaceName: string
  }
  relation: string[]
  type: number
  typeDesc: string
  notification: Notification
  isPopup: boolean
}

export interface NotificationMessage {
  data: NotificationData
  type: number
}
