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
    <div v-if="loading" class="loading">
      <b-table-loading />
    </div>
    <slot v-else />
  </div>
</template>

<style lang="scss" scoped>
.b-skeleton {
  width: 100%;
}
</style>
