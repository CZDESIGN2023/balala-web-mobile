<script lang="ts" setup>
import { computed, ref } from 'vue'
import { PRIORITY_LIST } from '@/utils/constant'

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  value: '',
  className: '',
  hoverEllipsis: false,
})

defineEmits(['mouseOverBack'])

interface Props {
  width?: string
  value?: string
  className?: string
  disabled?: boolean
  hoverEllipsis?: boolean
}

const overing = ref(false)

const item = computed(() => {
  return PRIORITY_LIST.find(item => item.value === props.value)
})
</script>

<template>
  <div
    :class="{ 'not-allowed': disabled, className }"
    :style="{ width }"
    class="b-table-priority flex pointer"
    @mouseover="overing = true"
    @mouseout="overing = false"
  >
    <div class="select-box flex-row-between">
      <div
        v-if="item"
        :style="{ background: item.color }"
        class="box flex-row-center br4 h24"
      >
        <b-ellipsis
          :content="(overing && hoverEllipsis && !disabled) ? '...' : item.label"
          parent-class="text14"
          content-class="pfm"
          @mouse-over-back="(e: MouseEvent) => $emit('mouseOverBack', e, item?.label)"
        />
        <div class="svg-container flex-row-center">
          <svg-icon v-if="!disabled" name="arrow-b-out" size="16" color="rgba(0, 0, 0, 0.6)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.b-table-priority {
  position: relative;
  height: 40px;
  max-width: 100%;
  &.not-allowed {
    cursor: not-allowed;
  }
  .select-box {
    max-width: 100%;
    width: 100%;
  }
  .box {
    max-width: 56px;
    min-width: 40px;
    width: 100%;
    padding: 0 8px;
    height: 24px;
    font-weight: initial;
    color: rgba(0, 0, 0, 0.8);
  }
}
.svg-container {
  max-width: 11px;
  pointer-events: none;
}
.svg-icon {
  margin-right: -5px;
  transition: 0.2s;
  width: 0 !important;
}
</style>
