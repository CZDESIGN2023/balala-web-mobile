<script setup lang="ts">
import pinyin from 'pinyin'
import { onMounted, reactive, ref, watch } from 'vue'
import { getWorkFlowSelectList } from '@/api/project'
import { getBadgeColor } from '@/utils/color'
import router from '@/router'

interface Props {
  value: string[]
  spaceId: string
  status: string
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  spaceId: '',
  string: '', // 0:禁用,1:启用
})

const emits = defineEmits(['update:value'])

const bFormPropertiesSelectRef = ref()
const state = reactive({
  options: [] as any,
})

async function onQueryOptions() {
  const spaceId = props.spaceId || router.currentRoute.value.params.id as string
  const list = await getWorkFlowSelectList(spaceId, props.status)

  const sortedData = list.sort((a: any, b: any) => Number.parseInt(b.ranking) - Number.parseInt(a.ranking))
  return sortedData.map((item: any) => ({
    value: item.id,
    label: item.name,
    key: item.key,
    status: item.status,
    pinyin: pinyin(item.name, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    color: getBadgeColor(item.name),
    ranking: item.ranking,
    templateId: item.templateId,
  }))
}

onMounted(async () => {
  state.options = await onQueryOptions()
})

defineExpose({
  refresh: async () => {
    state.options = await onQueryOptions()
  },
})
</script>

<template>
  <BFormPropertiesSelect
    ref="bFormPropertiesSelectRef"
    v-bind="$attrs"
    v-model:options="state.options"
    :value="props.value"
    empty-text="无可用任务流程"
    :query-options="onQueryOptions"
    @update:value="(val: string[], options: any[]) => {
      emits('update:value', val, options)
    }"
  />
</template>

<style lang="scss" scoped>
</style>
