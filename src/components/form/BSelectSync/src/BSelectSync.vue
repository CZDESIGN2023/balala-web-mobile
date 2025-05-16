<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface Props {
  value: any
  queryOptions: Function | (() => Promise<any>)
}
const props = withDefaults(defineProps<Props>(), {
  value: null,
  queryOptions: () => [],
})

const emit = defineEmits(['update:value'])

const options = ref([])
let t: any

onMounted(async () => {
  getOptions()
})

onUnmounted(() => {
  if (t)
    clearTimeout(t)
})

function getOptions() {
  const r = props.queryOptions()
  if (r.then) {
    r.then((val: any) => {
      options.value = val
    })
  }
  else {
    if (typeof r === 'string')
      t = setTimeout(getOptions, 100)

    else
      options.value = r
  }
}

function setOptions(val: any) {
  options.value = val
}

function onUpdateValue(val: any) {
  emit('update:value', val, options.value)
}

defineExpose({ setOptions })
</script>

<template>
  <b-select v-bind="$attrs" :value="value" :options="options" @update:value="onUpdateValue">
    <template v-if="$slots.clearIcon" #clearIcon>
      <slot name="clearIcon" />
    </template>

    <template v-if="$slots.dropdownRender" #dropdownRender="scope">
      <slot name="dropdownRender" v-bind="scope" />
    </template>

    <template v-if="$slots.menuItemSelectedIcon" #menuItemSelectedIcon>
      <slot name="menuItemSelectedIcon" />
    </template>

    <template v-if="$slots.notFoundContent" #notFoundContent>
      <slot name="notFoundContent" />
    </template>

    <template v-if="$slots.option" #option="scope">
      <slot name="option" v-bind="scope" />
    </template>

    <template v-if="$slots.placeholder" #placeholder>
      <slot name="placeholder" />
    </template>

    <template v-if="$slots.removeIcon" #removeIcon>
      <slot name="removeIcon" />
    </template>

    <template v-if="$slots.suffixIcon" #suffixIcon>
      <slot name="suffixIcon" />
    </template>
  </b-select>
</template>
