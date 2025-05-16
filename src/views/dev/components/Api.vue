<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  p: { type: String, default: '' },
  default: { type: Boolean, default: false },
})

const columns = [{ field: 'a', title: '名称' }, { field: 'b', title: '说明' }, { field: 'c', title: '类型' }]

const r = computed(() => {
  const r: any[] = []
  props.data.forEach((item: any) => {
    r.push({ a: item[0], b: item[1], c: item[2], d: props.default ? item[3] : '' })
  })
  return r
})
</script>

<template>
  <h3>{{ $attrs.title }}</h3>
  <p v-if="p">
    {{ p }}
  </p>
  <vxe-grid
    v-if="data.length > 0"
    :columns="props.default ? [...columns, { field: 'd', title: '默认值' }] : columns"
    :data="r"
    :params="{ isGroup: false }"
    min-height="0px"
    size="mini"
  />
</template>
