<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  sort?: string
  reverse?: boolean
}>(), {
  sort: undefined,
  reverse: false,
})

defineEmits(['asc', 'desc'])

const newSort = computed(() => {
  if (!props.reverse)
    return props.sort
  switch (props.sort) {
    case 'ASC':
      return 'DESC'
    case 'DESC':
      return 'ASC'
    default:
      return ''
  }
})
</script>

<template>
  <p
    :class="{
      ascending: newSort === 'ASC',
      descending: newSort === 'DESC',
    }"
    class="b-table-sort inline-flex flex-col w13 h-full top-0 justify-center absolute cursor-pointer text-gray-400 px4"
  >
    <span class="w8 h6 flex-row-center asc-icon hover:text-gray-700 duration-300" @click.stop="reverse ? $emit('desc') : $emit('asc')">
      <b-icon name="icon-up" size="8" />
    </span>
    <span class="w8 h6 flex-row-center desc-icon hover:text-gray-700 duration-300" @click.stop="reverse ? $emit('asc') : $emit('desc')">
      <b-icon name="icon-down" size="8" />
    </span>
  </p>
</template>

<style lang="scss">
.b-table-sort {
  &.ascending .asc-icon,
  &.descending .desc-icon {
    --uno: text-gray-700;
  }
}
</style>
