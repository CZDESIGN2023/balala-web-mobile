import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { message } from 'ant-design-vue'
import { checkStatus } from './helper/checkStatus'
import { baseUrl } from './config'
import { showFullScreenLoading, tryHideFullScreenLoading } from '@/config/serviceLoading'
import type { ResultData } from '@/api/interface'
import { ResultEnum } from '@/enum/httpEnum'
import { useUserStore } from '@/stores/modules/user'
import router from '@/router'
import { LOGIN_URL } from '@/config'
import { useNoticeStore } from '@/stores/modules/notice'
import { useProjectStore } from '@/stores/modules/project'

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _id?: any
  noLoading?: boolean
  noErrMes?: boolean
}
export interface CustomAxiosResponse extends AxiosResponse {
  config: CustomAxiosRequestConfig
  _id?: any
}
const axiosConfig = {
  // 默认地址请求地址
  baseURL: baseUrl,
  // 超时时间
  timeout: ResultEnum.TIMEOUT as number,
  // 跨域时候允许携带凭证
  withCredentials: false,
}

class RequestHttp {
  service: AxiosInstance
  public constructor(config: AxiosRequestConfig) {
    this.service = axios.create(config)
    /**
     * @description 请求拦截器
     * 客户端发送请求 -> [请求拦截器] -> 服务器
     * token校验(JWT) : 接受服务器返回的 token,存储到 vuex/pinia/本地储存当中
     */
    this.service.interceptors.request.use(
      (config: CustomAxiosRequestConfig) => {
        config.noLoading = true
        const userStore = useUserStore()
        if (!config.noLoading)
          config.noLoading = false

        // 当前请求不需要显示 loading，在 api 服务中通过指定的第三个参数: { noLoading: true } 来控制
        config.noLoading || showFullScreenLoading()
        // 设置 token
        if (
          config.headers
          && typeof config.headers.set === 'function'
          && userStore.token
        )
          config.headers.set('Authorization', `Bearer ${userStore.token}`)

        return config
      },
      (error: AxiosError) => {
        message.error(error.message, 2)
        return Promise.reject(error)
      },
    )

    /**
     * @description 响应拦截器
     *  服务器换返回信息 -> [拦截统一处理] -> 客户端JS获取到信息
     */
    this.service.interceptors.response.use(
      (response: CustomAxiosResponse) => {
        const { data } = response
        data._id = response.config._id
        const userStore = useUserStore()
        const useNotice = useNoticeStore()
        const projectStore = useProjectStore()
        tryHideFullScreenLoading()
        if (data.error) {
          // 全局错误信息拦截 返回 error 直接提示错误信息
          !response.config.noErrMes && message.error(data.error.message, 3)
          // 登录失效
          if (data.code === 401 || data.error.code === 304009) {
            userStore.setToken('')
            router.replace(LOGIN_URL)
            userStore.reset()
            projectStore.$reset()
            useNotice.reset(false)
            // localStorage.clear()
          }
          return Promise.reject(data.error)
        }
        // 请求成功
        return data
      },
      async (error: AxiosError) => {
        const { response }: { response?: AxiosResponse } = error
        const userStore = useUserStore()
        const useNotice = useNoticeStore()
        const projectStore = useProjectStore()
        if (response?.data.code === 401) {
          userStore.reset()
          projectStore.$reset()
          useNotice.reset(false)
          // localStorage.clear()
        }
        tryHideFullScreenLoading()
        // 请求超时 && 网络错误单独判断，没有 response
        if (error.message.includes('timeout'))
          message.error('请求超时！请您稍后重试', 3)
        if (error.message.includes('Network Error'))
          message.error('网络错误！请您稍后重试', 3)
        // 根据服务器响应的错误状态码，做不同的处理
        if (response)
          checkStatus(response.status)
        // 服务器结果都没有返回(可能服务器错误可能客户端断网)，断网处理:可以跳转到断网页面
        // 暂时没有 500 页面，会导致跳不过去造成死循环
        // if (!window.navigator.onLine)
        //   router.replace('/500')
        return Promise.reject(error)
      },
    )
  }

  /**
   * @description 常用请求方法封装
   */
  get<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.get(url, { params, ..._object })
  }

  post<T>(url: string, params?: object | string, _object = {}): Promise<ResultData<T>> {
    return this.service.post(url, params, _object)
  }

  put<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.put(url, params, _object)
  }

  delete<T>(url: string, params?: any, _object = {}): Promise<ResultData<T>> {
    return this.service.delete(url, { params, ..._object })
  }

  download(url: string, params?: object, _object = {}): Promise<BlobPart> {
    return this.service.post(url, params, { ..._object, responseType: 'blob' })
  }
}

export default new RequestHttp(axiosConfig)
