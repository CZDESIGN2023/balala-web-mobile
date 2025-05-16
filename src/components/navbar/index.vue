<script lang="ts" setup>
import { computed, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/modules/app'
import { useUserStore } from '@/stores/modules/user'
import { useNoticeStore } from '@/stores/modules/notice'
import router from '@/router'

defineOptions({ name: 'Navbar' })

const props = withDefaults(defineProps<Props>(), {
  isBack: false,
  title: '工作台',
  contentAlign: 'left',
})

const emit = defineEmits(['onBack'])

interface Props {
  isBack?: false
  title?: string
  contentAlign?: 'left' | 'center' | 'right'
}

const appStore = useAppStore()
const useNotice = useNoticeStore()

function openSideBar() {
  appStore.setSideBarExpanded(true)
}

const isShowDot = computed(() => {
  const { userInfo } = useUserStore()
  const userNoticeCounts = useNotice.userNoticeCounts[userInfo.id]
  if (!userNoticeCounts)
    return false

  return (
    userNoticeCounts.sysIndex > 0
    || userNoticeCounts.commentIndex > 0
    || userNoticeCounts.todoIndex > 0
  )
})

function handleClickBack() {
  emit('onBack', () => {
    router.back()
  })
}
</script>

<template>
  <div class="navbar">
    <div class="left flex-row-center">
      <slot name="left">
        <div v-if="props.isBack" class="back w24 h24" @click="handleClickBack">
          <svg-icon name="navbar-back" size="24" color="#333" />
        </div>
        <div v-else class="menu" @click="openSideBar">
          <svg-icon name="navbar-menu" size="24" color="#333" />
          <div v-if="isShowDot" class="red-icon" />
        </div>
      </slot>
    </div>
    <div class="content" :class="props.contentAlign">
      <slot name="content" />
    </div>
    <div class="right flex-row-center">
      <slot name="right">
        <p class="default-title pfm font-smoothing">
          {{ title }}
        </p>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  min-height: 42px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  background: #fff;
  .left {
    height: 100%;
    flex-shrink: 0;
  }
  .content {
    height: 100%;
    padding: 0 12px;
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
    &.left {
      justify-content: flex-start;
    }
    &.center {
      justify-content: center;
    }
    &.right {
      justify-content: flex-end;
    }
  }
  .right {
    height: 100%;
    flex-shrink: 0;
    .default-title {
      color: $color-icon;
      font-size: 16px;
    }
  }
  .menu {
    width: 24px;
    height: 24px;
    position: relative;
    .red-icon {
      position: absolute;
      right: -4px;
      top: -4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      background: $color-error;
      color: #fff;
      font-size: 12px;
    }
  }
}
</style>
