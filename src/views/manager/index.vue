<script lang="ts" setup>
import { computed, reactive } from 'vue'
import ManagerUser from './user.vue'
import ManagerSystem from './system.vue'
import ManagerOpen from './open.vue'
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

const roleBasedHide = computed(() => Number(userStore.userInfo.role) < 100)

// state
const state = reactive({
  activeTab: 'user',
  tabList: [{
    label: '用户管理',
    key: 'user',
    hide: false,
    icon: 'manager-user',
  }, {
    label: '系统设置',
    hide: roleBasedHide,
    key: 'system',
    icon: 'manager-system',
  }, {
    label: '开放设置',
    hide: true,
    key: 'open',
    icon: 'manager-system',
  }],
})

const activeComponent = computed(() => {
  switch (state.activeTab) {
    case 'open':
      return ManagerOpen
    case 'system':
      return ManagerSystem
    default:
      return ManagerUser
  }
})

function changeTab(key: string) {
  if (state.activeTab === key)
    return
  state.activeTab = key
}
</script>

<template>
  <div class="manager-wrap">
    <div class="manager-head single-title-header flex-row-start">
      <p class="title pfm flex-row-start">
        管理系统
      </p>
      <div class="b-tab gap12 flex-row-start">
        <div
          v-for="item in state.tabList"
          :key="item.key"
          :class="{
            active: state.activeTab === item.key,
            hide: item.hide,
          }"
          class="item flex-row-center"
          @click="changeTab(item.key)"
        >
          <svg-icon :name="item.icon" color="#666666" size="16" />
          <p class="label">
            {{ item.label }}
          </p>
        </div>
      </div>
    </div>
    <div class="manager-body">
      <component :is="activeComponent" />
    </div>
  </div>
</template>

<style lang="scss">
  .manager-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  .manager-head {
    width: 100%;
    height: 84px;
    .title {
      font-size: 20px;
      -webkit-font-smoothing: antialiased;
      &::after {
        content: '';
        display: block;
        width: 0px;
        height: 16px;
        border-left: 1px solid $color-border-main;
        margin-left: 20px;
        margin-right: 12px;
      }
    }
    .b-tab {
      .item {
        min-width: 93px;
        height: 32px;
        border-radius: 6px;
        padding: 0px 8px;
        gap: 4px;
        cursor: pointer;
        .label {
          font-size: 14px;
          color: $color-icon;
        }
        &:hover {
          background: $color-default-hover;
        }
        &:active {
          background: $color-default-active;
        }
        &.active {
          background: $color-primary-active;
          .svg-icon {
            use {
              fill: $color-primary;
            }
          }
          .label {
            color: $color-primary;
          }
        }
        &.hide {
          display: none;
        }
      }
    }
  }
  .manager-body {
    height: calc(100% - 84px);
  }
}
</style>
