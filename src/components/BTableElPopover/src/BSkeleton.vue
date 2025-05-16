<script setup lang="ts">
interface Props {
  loading: boolean
}
withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="b-skeleton">
    <div v-if="loading" class="loading" />
    <slot v-else />
  </div>
</template>

<style lang="scss" scoped>
.loading {
  background-color: #f7f8fa;
  border-radius: 4px;
  width: calc(100% - 10px);
  height: 34px;
  margin-left: 5px;
}
</style>
