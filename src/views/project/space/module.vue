<script lang="ts" setup>
import { ref } from 'vue'
import spaceModule from '../intro/module.vue'

const emits = defineEmits(['handleLoading'])
const loadingEnd = ref<boolean>(false)
function handleLoading(val: boolean) {
  emits('handleLoading', val)
  loadingEnd.value = !val
}
</script>

<template>
  <div v-show="loadingEnd" class="project-space-module">
    <space-module
      max-height="auto"
      :scrolltop="177"
      :show-chart="false"
      scroll-max-height="calc(100% - 203px)"
      @handle-loading="handleLoading"
    />
  </div>
</template>

<style lang="scss" scoped>
.project-space-module {
  height: calc(100% - 5px);
  padding-top: 0px;
  padding-right: 24px;
  padding-bottom: 0px;
  padding-left: 24px;
}
</style>
