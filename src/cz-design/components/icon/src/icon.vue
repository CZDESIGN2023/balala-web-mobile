<script lang="ts" setup>
import { type CSSProperties, computed } from 'vue'
import { iconProps } from './icon'
import { createNameSpace } from '@/cz-design/utils'

defineOptions({
  name: 'CZIcon',
  inheritAttrs: false,
})
// const props = defineProps(iconProps)
const ns = createNameSpace('icon')
</script>

<template>
  <i :class="ns.b()" v-bind="$attrs">
    <slot />
  </i>
</template>
