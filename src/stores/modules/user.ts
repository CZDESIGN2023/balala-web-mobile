import { defineStore } from 'pinia'
import piniaPersistConfig from '@/config/piniaPersist'
import { getSystemConfig } from '@/api/system'
import type { SystemConfig } from '@/api/interface/system'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    token: '',
    userInfo: {} as any,
    showNickNameTip: false,
    config: [] as SystemConfig[],
  }),
  getters: {},
  actions: {
    // 设置 token
    setToken(token: string) {
      this.token = token
    },
    // 设置用户信息
    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
    },
    // 设置系统配置
    setConfig(config: SystemConfig[]) {
      this.config = config
    },
    // 获取系统配置
    async getConfig() {
      const { data } = await getSystemConfig()
      this.setConfig(data.config)
      return data.config
    },
    setNickNameTip(statu: boolean) {
      this.showNickNameTip = statu
    },
    reset(isAll: boolean = false) {
      if (isAll)
        this.config = []

      this.token = ''
      this.userInfo = {}
      this.showNickNameTip = false
    },
  },
  persist: piniaPersistConfig('user', ['token', 'userInfo', 'config', 'showNickNameTip']),
})
