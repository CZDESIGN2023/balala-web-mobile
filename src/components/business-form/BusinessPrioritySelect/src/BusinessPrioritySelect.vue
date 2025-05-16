<script setup lang="ts">
import pinyin from 'pinyin'
import { reactive, watch } from 'vue'
import { oneList } from '@/components/BSearchFilter/config'

interface Props {
  value: string[]
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
})

const emits = defineEmits(['update:value'])

const state = reactive({
  options: [] as any,
})

watch(() => props.value, () => {
  getTagInfo()
}, {
  immediate: true,
})

async function onQueryOptions() {
  const options = oneList.find(item => item.value === 'priority')?.thirdOptions || []
  return options.map((item: any) => ({
    value: item.value,
    label: item.label,
    pinyin: pinyin(item.name, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    color: item.color,
  }))
}

async function getTagInfo() {
  state.options = await onQueryOptions()
}
</script>

<template>
  <BFormPropertiesSelect
    v-bind="$attrs"
    :value="props.value"
    tag-width="40"
    :options="state.options"
    tag-xpadding="19"
    :query-options="onQueryOptions"
    @update:value="(val: string[]) => {
      emits('update:value', val)
    }"
  />
</template>

<style lang="scss" scoped>
</style>
