<script lang="ts" setup>
import { markRaw, reactive, ref, shallowRef } from 'vue'
import projectAdmin from './userManage/projectAdmin.vue'

const emits = defineEmits(['handleLoading'])

const loadingEnd = ref<boolean>(false)
function handleLoading(val: boolean) {
  emits('handleLoading', val)
  loadingEnd.value = !val
}
const currentComponent = shallowRef(projectAdmin)
</script>

<template>
  <div class="project-user-module">
    <div v-show="loadingEnd" class="main">
      <component :is="currentComponent" @handle-loading="handleLoading" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-user-module {
  display: flex;
  height: calc(100vh - 66px);

  .menu {
    width: 208px;
    height: 100%;
    border-right: 1px solid $color-border-main;
    padding: 24px 16px 24px 0px;
  }

  .menu-item {
    width: 192px;
    height: 40px;
    line-height: 40px;
    padding: 0 12px;
    border-radius: 6px;
    color: #333333;
  }

  .curry-item {
    background: rgba(29, 116, 245, 0.08);
  }

  .main {
    width: 100%;
  }
}
</style>
