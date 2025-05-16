import { ref } from 'vue'

export default function useEvents() {
  const visible = ref(false)

  async function openTaskDrawer() {
    visible.value = true
  }
  // 关闭任务弹框
  function closeTaskDrawer() {
    visible.value = false
  }
  return {
    visible,
    openTaskDrawer,
    closeTaskDrawer,
  }
}
