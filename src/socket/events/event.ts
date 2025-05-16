class Event {
  // 一个静态只读属性，表示一个空的 Event 对象
  static readonly EMPTY: Readonly<Event> = new Event()

  // 一个静态只读属性，表示空事件的类型字符串
  static readonly EVENT_EMPTY = 'eventempty'

  // 事件的类型
  type: string

  // 事件的目标
  target: any

  // 事件的当前目标
  currentTarget: any

  constructor() {
    // 将 type 属性的初始值设置为 EVENT_EMPTY
    this.type = Event.EVENT_EMPTY
  }

  /**
   * 设置事件对象的类型、当前目标和目标属性。
   * 返回修改后的事件对象。
   * @param type - 事件的类型
   * @param currentTarget - 事件的当前目标
   * @param target - 事件的目标
   * @returns 修改后的事件对象
   */
  setTo(type: string, currentTarget: any, target: any): Event {
    this.type = type
    this.currentTarget = currentTarget
    this.target = target
    return this
  }
}

export default Event
