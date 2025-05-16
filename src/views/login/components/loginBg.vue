<script lang="ts" setup>
import { computed } from 'vue'
import { ConfigKey } from '@/enum'
import { getConfigDomain } from '@/utils'

import defaultBg from '@/assets/svg/login_bg.svg'

const loginBg = computed(() => {
  if (getConfigDomain(ConfigKey.BG)) {
    return `${getConfigDomain(ConfigKey.SPACE_FILE_DOMAIN)}${getConfigDomain(ConfigKey.BG)}`
  }
  else {
    return ''
  }
})
</script>

<template>
  <div class="login-bg" :class="{ custom: loginBg }" :style="{ backgroundImage: `url(${loginBg || defaultBg})` }" />
</template>

<style lang="scss" scoped>
.login-bg {
  background: url('@/assets/svg/login_bg.svg') no-repeat;
  background-size: cover;
  width: 100%;
  // height: 390px;
  padding-bottom: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 0;
}
</style>
