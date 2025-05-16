<script lang="ts" setup>
import { ref } from 'vue'
import versionModule from '../intro/version.vue'

const emits = defineEmits(['handleLoading'])
const loadingEnd = ref<boolean>(false)
function handleLoading(val: boolean) {
  emits('handleLoading', val)
  loadingEnd.value = !val
}
</script>

<template>
  <div v-show="loadingEnd" class="project-version-module">
    <version-module
      max-height="auto"
      :scrolltop="177"
      scroll-max-height="calc(100% - 203px)"
      @handle-loading="handleLoading"
    />
  </div>
</template>

<style lang="scss" scoped>
.project-version-module {
  height: calc(100% - 5px);
  padding-top: 0px;
  padding-right: 24px;
  padding-bottom: 0px;
  padding-left: 24px;
}
</style>
