// import { btnPermMap } from '@/utils/constant'
import { defineStore } from 'pinia'

export const useAppStore = defineStore({
  id: 'app',
  state: () => ({
    isSidebarExpanded: false,
  }),
  actions: {
    setSideBarExpanded(expanded: boolean) {
      this.isSidebarExpanded = expanded
    },
  },
})
