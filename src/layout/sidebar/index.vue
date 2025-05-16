<script lang="ts" setup>
import { computed, ref } from 'vue'
import Logo from './logo.vue'
import Menu from './menu.vue'
import Foot from './foot.vue'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()
const visible = computed(() => {
  return appStore.isSidebarExpanded
})
</script>

<template>
  <touch-content @on-swiper="appStore.setSideBarExpanded(false)">
    <van-popup
      v-model:show="visible"
      duration="0.2"
      position="left"
      :style="{ width: '71.79487vw', height: '100%' }"
      @click-overlay="appStore.setSideBarExpanded(false)"
    >
      <div class="app-sidebar">
        <Logo />
        <Menu />
        <Foot />
      </div>
    </van-popup>
  </touch-content>
</template>

<style lang="scss" scoped>
.app-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  padding-left: 12px;
  padding-right: 12px;
  .app-sidebar-menu {
    flex: 1;
  }
}
</style>
