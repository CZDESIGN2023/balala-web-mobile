import type { Ref } from 'vue'

export default function useProxyExpose<T extends object>(
  instanceRef: Ref<T | null>,
  methodsToForward: readonly (keyof T)[],
) {
  type MethodName = typeof methodsToForward[number]
  type ProxyMethods = { [K in MethodName]: T[K] }

  const methodProxy = methodsToForward.reduce((acc, method) => {
    acc[method] = ((...args: any[]) => {
      if (instanceRef.value && typeof instanceRef.value[method] === 'function') {
        return (instanceRef.value[method] as Function)(...args)
      }
    }) as T[typeof method]
    return acc
  }, {} as ProxyMethods)

  return methodProxy
}
