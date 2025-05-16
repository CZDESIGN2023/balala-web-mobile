import { LOGIN_URL } from '@/config'
import router from '@/router'
import { useUserStore } from '@/stores/modules/user'
import { message } from 'ant-design-vue'

/**
 * @description: 校验网络请求状态码
 * @param {Number} status
 * @return void
 */
export const checkStatus = (status: number) => {
  switch (status) {
    case 400:
      message.error('请求失败！请您稍后重试', 2)
      break
    case 401:
      const userStore = useUserStore()
      message.error('登录失效！请您重新登录', 2)
      userStore.setToken('')
      router.replace(LOGIN_URL)
      break
    case 403:
      message.error('当前账号无权限访问！', 2)
      break
    case 404:
      message.error('你所访问的资源不存在！', 2)
      break
    case 405:
      message.error('请求方式错误！请您稍后重试', 2)
      break
    case 408:
      message.error('请求超时！请您稍后重试', 2)
      break
    case 500:
      message.error('服务异常！', 2)
      break
    case 502:
      message.error('网关错误！', 2)
      break
    case 503:
      message.error('服务不可用！', 2)
      break
    case 504:
      message.error('网关超时！', 2)
      break
    default:
      message.error('请求失败！', 2)
  }
}
