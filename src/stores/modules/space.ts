// import { btnPermMap } from '@/utils/constant'
import { defineStore } from 'pinia'

export const useSpaceStore = defineStore({
  id: 'space',
  state: () => ({
    userRole: 0,
  }),
  actions: {
    setUserStatus(val: number) {
      this.userRole = val
    },
  },
})
