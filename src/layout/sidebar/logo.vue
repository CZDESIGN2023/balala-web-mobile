<script lang="ts" setup>
import { computed } from 'vue'
import { ConfigKey } from '@/enum'
import { getConfigDomain } from '@/utils'
import { useAppStore } from '@/stores/modules/app'
import router from '@/router'

withDefaults(defineProps<Props>(), {
  isCollapse: false,
})

const appStore = useAppStore()

const siteLogo = computed(() => {
  if (getConfigDomain(ConfigKey.LOGO)) {
    return `${getConfigDomain(ConfigKey.SPACE_FILE_DOMAIN)}${getConfigDomain(ConfigKey.LOGO)}`
  }
  else {
    return import.meta.env.VITE_LOGO_URL
  }
})

function jump() {
  router.push('/home')
  appStore.setSideBarExpanded(false)
}

interface Props {
  isCollapse?: boolean
}
</script>

<template>
  <div
    class="app-sidebar-logo"
    :class="isCollapse ? 'flex-row-center' : 'pl4 flex-row-start'"
    @click="jump"
  >
    <img :src="siteLogo" :class="isCollapse ? '' : 'mr8'" alt="">
    <span v-if="!isCollapse" class="pfm">项目管理系统</span>
  </div>
</template>

<style lang="scss" scoped>
.app-sidebar-logo {
  width: 100%;
  height: 44px;
  margin-bottom: 24px;
  img {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    display: block;
  }
  span {
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0em;
    font-variation-settings: 'opsz' auto;
    color: $color-title;
    -webkit-font-smoothing: antialiased;
  }
}
</style>
