import type { Ref } from 'vue'
import { ref } from 'vue'
import type { AxiosRequestConfig } from 'axios'
import http from '@/api'
import type { ResultData } from '@/api/interface'

interface RequestConfig extends AxiosRequestConfig {
  url: string
}

class DataService {
  private cache: Map<string, any> = new Map()
  private pendingPromises: Map<string, Promise<any>> = new Map()

  private createCacheKey(config: RequestConfig): string {
    const { url, params, data } = config
    const sortedParams = params ? JSON.stringify(Object.entries(params).sort()) : ''
    const sortedData = data ? JSON.stringify(Object.entries(data).sort()) : ''
    return `${url}:${sortedParams}:${sortedData}`
  }

  async getData<T>(config: RequestConfig): Promise<ResultData<T>> {
    const cacheKey = this.createCacheKey(config)

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ResultData<T>
    }

    if (this.pendingPromises.has(cacheKey)) {
      return this.pendingPromises.get(cacheKey) as Promise<ResultData<T>>
    }

    const promise = this.fetchData<T>(config)
    this.pendingPromises.set(cacheKey, promise)

    try {
      const data = await promise
      this.cache.set(cacheKey, data)
      return data
    }
    finally {
      this.pendingPromises.delete(cacheKey)
    }
  }

  private async fetchData<T>(config: RequestConfig): Promise< ResultData<T>> {
    const response: ResultData<T> = await http.post(config.url, config.data)
    return response
  }
}

const dataService = new DataService()

interface UseSharedDataReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  fetchData: <R = T>(config: RequestConfig) => Promise<ResultData<R>>
}

export function useSharedData<T>(): UseSharedDataReturn<T> {
  const data: Ref<T | null> = ref(null)
  const loading = ref(false)
  const error: Ref<Error | null> = ref(null)

  const fetchData = async <R = T>(config: RequestConfig): Promise<ResultData<R>> => {
    loading.value = true
    error.value = null

    try {
      const result = await dataService.getData<R>(config)
      // 只有当 R 与 T 类型相同时，才更新 data
      if (typeof result === typeof data.value) {
        data.value = result as T
      }
      return result
    }
    catch (e) {
      error.value = e instanceof Error ? e : new Error('An unknown error occurred')
      throw error.value
    }
    finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
}
