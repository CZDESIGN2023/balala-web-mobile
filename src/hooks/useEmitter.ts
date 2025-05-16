// useEmitter.ts

import { getCurrentInstance, onUnmounted, ref } from 'vue'

type UpdateHandler<T> = (value: T) => void

// 用于发射事件
export function useEmitter<T>(eventName: string, updateMethod?: UpdateHandler<T>) {
  const { proxy } = getCurrentInstance() as any
  const emitter = proxy.mittBus

  // 如果没有提供 updateMethod，则提供一个默认的空函数
  const defaultUpdateMethod: UpdateHandler<T> = () => {}

  // 使用提供的 updateMethod 或者默认的空函数
  const handleUpdate: UpdateHandler<T> = updateMethod || defaultUpdateMethod

  emitter.on(eventName, handleUpdate)

  onUnmounted(() => {
    emitter.off(eventName, handleUpdate)
  })

  // 返回一个函数，用于发射事件
  const emitUpdate = (value: T) => {
    emitter.emit(eventName, { type: eventName, content: value })
  }

  return { emitUpdate }
}
