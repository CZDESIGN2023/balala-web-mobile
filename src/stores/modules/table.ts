import { defineStore } from 'pinia'

export const useTableStore = defineStore({
  id: 'table',
  state: () => ({
    expandIds: [] as string[],
  }),
  actions: {
    setExpandIds(val: string) {
      this.expandIds.push(val)
    },
    removeExpandIds(val: string) {
      this.expandIds = this.expandIds.filter(item => item !== val)
    },
  },
})
