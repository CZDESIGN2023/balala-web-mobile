<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import loginTitle from './components/loginTitle.vue'
import loginBg from './components/loginBg.vue'
import loginFooter from './components/loginFooter.vue'
import loginForm from './components/loginForm.vue'
import thirdForm from './components/thirdForm.vue'
import { useGetThirdToken } from '@/hooks/useGetThirdToken'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()

const activeForm = computed(() => {
  const { im_token } = useGetThirdToken()
  if (im_token.value)
    return thirdForm
  return loginForm
})

onMounted(() => {
  appStore.setSideBarExpanded(false)
})
</script>

<template>
  <div class="login-wrap">
    <login-bg />
    <div class="content">
      <login-title />
      <component :is="activeForm" />
    </div>
    <login-footer />
  </div>
</template>

<style lang="scss">
@import './index.scss';
.login-wrap {
  width: 100vw;
  // height: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 16px;
  .content {
    width: 100%;
    display: flex;
    flex: 1;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 2;
    padding-top: 32px;
    padding-left: 32px;
    padding-right: 32px;
  }
}

.welcome-info {
  width: auto;
  min-width: 270px;
}

.login-btn {
  width: 100%;
  height: $login-btn-height;
  border-radius: $login-btn-radius;
  font-size: 16px;
}
</style>
