<script setup lang="ts">
import pinyin from 'pinyin'
import { onMounted, reactive, ref, watch } from 'vue'
import router from '@/router'
import { workVersionList } from '@/api/project'

interface Props {
  value: string[]
  spaceId: string
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  spaceId: '',
})

const emits = defineEmits(['update:value'])

const bFormPropertiesSelectRef = ref()
const state = reactive({
  options: [] as any,
})

async function onQueryOptions() {
  const spaceId = props.spaceId || router.currentRoute.value.params.id as string
  const { data } = await workVersionList(spaceId)
  return data.list.map((item: any) => ({
    value: item.id,
    pinyin: pinyin(item.versionName, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    label: item.versionName,
  }))
}

onMounted(async () => {
  state.options = await onQueryOptions()
})
</script>

<template>
  <BFormNormalSelect
    ref="bFormPropertiesSelectRef"
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
