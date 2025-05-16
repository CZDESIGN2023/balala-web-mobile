import EventDispatcher from './events'

/**
 * 长连接管理器
 *
 * author wangq
 */
class SocketClient extends EventDispatcher {
  /** 连接中 */
  static CONNECTING = 0
  /** 已连接 */
  static OPEN = 1
  /** 关闭中 */
  static CLOSING = 2
  /** 已关闭 */
  static CLOSED = 3
  /** 连接失败 */
  static ERROR = 4

  /** 网络切换更新事件 */
  static socketConnectStatusChange = 'socketConnectStatusChange'
  /** 连接建立 */
  static eventSocketOpen = 'eventSocketOpen'
  /** 连接关闭 */
  static eventSocketClose = 'eventSocketClose'
  /** 连接错误 */
  static eventSocketError = 'eventSocketError'

  static eventSocketMessage = 'eventSocketMessage'

  /** WebSocket */
  _socket?: WebSocket
  /** token */
  _token?: string
  _connectPath?: string
  // NodeJS.Timeout 30000
  _initTimer?: ReturnType<typeof setTimeout> | null = null
  _initTime: number = 100
  _socketTimer?: ReturnType<typeof setTimeout> | null = null
  _socketTime: number = 1000
  _pingTimer?: ReturnType<typeof setTimeout> | null = null

  /** 网络是否可用 */
  _hasNetwork: boolean = true
  // eslint-disable-next-line accessor-pairs
  set hasNetwork(value: boolean) {
    if (this._hasNetwork == value)
      return
    this._hasNetwork = value
    if (this._socketTimer)
      clearTimeout(this._socketTimer)
    this._socketTimer = setTimeout(() => {
      if (!this._hasNetwork) {
        this.closeWebsocket()
        this._setConnectStatus(SocketClient.CLOSED, false)
      }
      else {
        this.initWebSocket()
      }
    }, this._socketTime)
  }

  /** 连接状态 */
  _readyState: number = SocketClient.CLOSED
  _setConnectStatus(value: number, needEvent: boolean = true) {
    if (this._readyState == value)
      return
    this._readyState = value
    if (needEvent)
      this.event(SocketClient.socketConnectStatusChange)
  }

  /** 长连接管理器 */
  constructor() {
    super()
  }

  /** 清理数据 */
  clearData() {
    this._socket = undefined
    this._token = undefined
    this._setConnectStatus(SocketClient.CLOSED)
  }

  /** 初始化 */
  async init(token: string) {
    this._token = token
    this._connectPath = buildWebsocketUrl()
    if (!this._token)
      return
    // this.initWebSocket()
  }

  /** 检测并初始化 */
  checkReInit(newToken?: string) {
    if (newToken == this._token)
      return
    if (newToken != null)
      this._token = newToken

    if (!this._token || !this._socket)
      return
    this.init(this._token)
  }

  /** 初始化WebSocket */
  initWebSocket() {
    if (!this._token)
      return
    if (this._readyState == SocketClient.OPEN || this._readyState == SocketClient.CONNECTING)
      return
    this.closeWebsocket()
    this._setConnectStatus(SocketClient.CLOSED)
    if (this._initTimer)
      clearTimeout(this._initTimer)
    this._initTimer = setTimeout(() => {
      if (!this._hasNetwork)
        return
      const wsServer = `${this._connectPath}?token=${this._token}`
      this._socket = new WebSocket(wsServer)
      this._socket.onopen = (ev: Event) => {
        this.onOpen(ev)
      }
      this._socket.onerror = (ev: Event) => {
        this.onError(ev)
      }
      this._socket.onclose = (ev: CloseEvent) => {
        this.onClose(ev)
      }
      this._socket.onmessage = (ev: MessageEvent) => {
        this.onMessage(ev)
      }
      this._setConnectStatus(SocketClient.CONNECTING)
    }, this._initTime)
  }

  /** 关闭WebSocket */
  closeWebsocket() {
    if (!this._socket)
      return
    if (this._readyState == SocketClient.CLOSED || this._readyState == SocketClient.CLOSING)
      return
    if (this._pingTimer)
      clearInterval(this._pingTimer)
    this._socket.close()
    this.clearData()
  }

  /** 连接成功 */
  async onOpen(ev: Event) {
    this._setConnectStatus(SocketClient.OPEN)
    this.event(SocketClient.eventSocketOpen)
    if (this._readyState == SocketClient.OPEN) {
      if (this._pingTimer)
        clearInterval(this._pingTimer)
      this._pingTimer = setInterval(() => {
        if (this._readyState != SocketClient.OPEN)
          return
        this._socket?.send('ping')
      }, 5000)
    }
  }

  /** 连接关闭 */
  onClose(ev: CloseEvent) {
    if (ev.target !== this._socket)
      return

    this._setConnectStatus(SocketClient.CLOSED)
    this.event(SocketClient.eventSocketClose)
    if (this._pingTimer)
      clearInterval(this._pingTimer)
    if (this._initTimer)
      clearTimeout(this._initTimer)
    if (this._socketTimer)
      clearTimeout(this._socketTimer)
    this._socketTimer = setTimeout(() => {
      this.initWebSocket()
    }, this._socketTime)
  }

  /** 连接失败 */
  onError(ev: Event) {
    console.log(this, 'WebSocket连接失败', ev)
    // console.log(e)
    if (ev.target !== this._socket) {
      console.log('重复')
      return
    }
    this._setConnectStatus(SocketClient.ERROR)
    this.event(SocketClient.eventSocketError)
    if (this._pingTimer)
      clearInterval(this._pingTimer)
    if (this._initTimer)
      clearTimeout(this._initTimer)
    if (this._socketTimer)
      clearTimeout(this._socketTimer)
    this._socketTimer = setTimeout(() => {
      this.initWebSocket()
    }, this._socketTime)
  }

  /** 连接信息 */
  async onMessage(ev: MessageEvent) {
    let response
    if (ev.data) {
      // console.log(this, 'WebSocket收到消息', ev.data)
      response = JSON.parse(ev.data)
      this.event(SocketClient.eventSocketMessage, response)
    }
  }
}

function buildWebsocketUrl() {
  const rawUrl = import.meta.env.VITE_SOCKET_URL
  if (rawUrl.startsWith('ws://') || rawUrl.startsWith('wss://'))
    return rawUrl

  const { protocol, hostname, port } = window.location
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${hostname}:${port}${rawUrl}`
}

export default SocketClient
