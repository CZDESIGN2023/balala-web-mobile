<script lang="ts" setup>
import { computed } from 'vue'
import { ConfigKey } from '@/enum'
import { getConfigDomain } from '@/utils'

const siteLogo = computed(() => {
  if (getConfigDomain(ConfigKey.LOGO)) {
    return `${getConfigDomain(ConfigKey.SPACE_FILE_DOMAIN)}${getConfigDomain(ConfigKey.LOGO)}`
  }
  else {
    return import.meta.env.VITE_LOGO_URL
  }
})
const siteTitle = computed(() => {
  return `${getConfigDomain(ConfigKey.TITLE)}` || 'Balala'
})
</script>

<template>
  <!-- 标题 -->
  <div class="login-wrap-top flex-row-start mb32">
    <div class="login-title">
      <img class="w32 mr8 br8" :src="siteLogo" alt="">
      <p class="flex-row-center">
        <span class="text16 pfm font-smoothing">{{ siteTitle }}</span>
        <span class="line ml12 mr12 h16" />
        <span class="text16 pfr font-smoothing">协作效率标准化管理工具</span>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .login-wrap-top {
  width: 100%;
  height: 44px;
  .login-title {
    display: flex;
    align-items: center;
    color: #333;
    position: relative;
    z-index: 100;
    .line {
      background: #333;
      display: inline-flex;
      width: 1px;
    }
  }
}
</style>
