<script lang="ts" setup>
import { computed } from 'vue'
import { buttonEmits, buttonProps } from './button'
import { createNameSpace } from '@/cz-design/utils/createBEM'
import '../styles'

defineOptions({ name: 'CZButton' })

const props = defineProps(buttonProps)
const emit = defineEmits(buttonEmits)

const ns = createNameSpace('button')

const buttonClass = computed(() => [
  ns.b(),
  ns.m(props.type),
  ns.m(props.size),
  ns.is('disabled', props.disabled),
  ns.is('loading', props.loading),
  ns.is('plain', props.plain),
  ns.is('round', props.round),
  ns.is('circle', props.circle),
])

function handleClick(evt: MouseEvent) {
  emit('click', evt)
}
</script>

<template>
  <component
    :is="props.tag"
    :class="buttonClass"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <template v-if="props.loading">
      <slot v-if="$slots.loading" name="loading" />
      <el-icon v-else :class="ns.is('loading', true)">
        <component :is="props.loadingIcon" />
      </el-icon>
    </template>
    <el-icon v-else-if="props.icon || $slots.icon">
      <component :is="props.icon" v-if="props.icon" />
      <slot v-else name="icon" />
    </el-icon>
    <slot />
  </component>
</template>

<style lang="scss" scoped>
</style>
