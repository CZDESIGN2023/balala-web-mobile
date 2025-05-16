declare module 'mitt' {
  type Emitter = {
    on(type: string, handler: Function): void
    off(type: string, handler: Function): void
    emit(type: string, event?: any): void
  }

  function mitt(): Emitter

  export default mitt
}
