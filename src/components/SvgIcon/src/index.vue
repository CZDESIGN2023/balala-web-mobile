<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps({
  prefix: { type: String, default: 'icon' },
  name: { type: String, default: '' },
  color: { type: String, default: '' },
  size: { type: [Number, String], default: 24 },
  spin: { type: Boolean, default: false },
})

const symbolId = computed(() => `#${props.prefix}-${props.name}`) // Generate a unique id for the svg symbol. This is not a class property and can be used as a unique id for
const getStyle = computed((): CSSProperties => {
  const s = props.size.toString().endsWith('vw') ? props.size : `${Number.parseFloat(props.size.toString().replace('px', '')) / 3.9}vw`
  return {
    width: s,
    height: s,
    color: `${props.color}!important`,
  }
})
</script>

<template>
  <svg aria-hidden="true" class="svg-icon" :class="[spin && 'svg-icon-spin']" :style="getStyle">
    <use :xlink:href="symbolId" :fill="color" />
  </svg>
</template>

<style scoped>
.svg-icon {
  display: inline-block;
  overflow: hidden;
  vertical-align: -0.15em;
  fill: currentColor;
}
.svg-icon-spin {
  animation: loadingCircle 1s infinite linear;
}

/* 旋转动画 */
@keyframes loadingCircle {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
