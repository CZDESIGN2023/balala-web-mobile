<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide } from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import SocketClient from './socket'
import { useUserStore } from '@/stores/modules/user'
import router from '@/router'

const userStore = useUserStore()
const socketClient = new SocketClient()

const { currentRoute } = router
provide('socketClient', socketClient)

const key = computed(() =>
  currentRoute.value.name === 'project'
    ? `project_${currentRoute.value.params.id}`
    : (currentRoute.value.name as string),
)

onMounted(() => {
  if (socketClient._readyState === 3)
    socketClient.init(userStore.token)
})

onUnmounted(() => {
  socketClient.closeWebsocket()
})
</script>

<template>
  <a-config-provider :auto-insert-space-in-button="false" :locale="zhCN">
    <router-view :key="key" />
  </a-config-provider>
</template>
