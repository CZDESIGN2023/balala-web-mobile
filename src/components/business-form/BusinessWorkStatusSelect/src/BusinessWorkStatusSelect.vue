<script setup lang="ts">
import pinyin from 'pinyin'
import { onMounted, reactive, watch } from 'vue'
import { getWorkItemStatusList } from '@/api/workflow'
import router from '@/router'

interface Props {
  value: string[]
  spaceId: string
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  spaceId: '',
})

const emits = defineEmits(['update:value'])

const state = reactive({
  options: [] as any,
})

async function onQueryOptions() {
  const spaceId = props.spaceId || router.currentRoute.value.params.id as string
  const { data } = await getWorkItemStatusList({ spaceId })
  return data.list.map((item: any) => ({
    value: item.val,
    label: item.name,
    pinyin: pinyin(item.name, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    key: item.key,
  }))
}

onMounted(async () => {
  state.options = await onQueryOptions()
})
</script>

<template>
  <BFormPropertiesSelect
    v-bind="$attrs"
    :value="props.value"
    :options="state.options"
    :query-options="onQueryOptions"
    @update:value="(val: string[]) => {
      emits('update:value', val)
    }"
  />
</template>

<style lang="scss" scoped>
</style>
