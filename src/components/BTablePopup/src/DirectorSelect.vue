<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { TaskCompare } from '@/api/interface/common'
import type { TableRowData } from '@/views/project/types/table'

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  rawValue: () => [],
  row: () => {
    return {} as TableRowData
  },
})

const emits = defineEmits([
  'onChange',
  'onSelect',
  'onDeselect',
  'onChoose',
  'onClose',
  'removeItem',
])

interface Props {
  value?: any
  rawValue?: any
  row: TableRowData
}

const modelValue = ref<string[]>([])
const personSelectRef = ref()
const displayRange = ref([])

onMounted(() => {
  modelValue.value = props.value.map((item: any) => item.userId || '')
  personSelectRef.value?.open()
  // 选择范围限制
  try {
    const ownerValue = JSON.parse(props.row.flowNode.owner.value)
    displayRange.value = props.row.flowNode.owner.usageMode === 'appointed' ? ownerValue.appointedOwner.map((item: any) => item.value) : []
  }
  catch (error) {

  }
})

function onChange(data: TaskCompare) {
  emits('onClose', data, 'director', { row: props.row })
  emits('removeItem')
}
</script>

<template>
  <div class="director-select-cpn">
    <BusinessPersonSelect
      ref="personSelectRef"
      v-model:value="modelValue"
      :space-id="row.spaceId"
      :display-range
      size="large"
      @change="onChange"
      @hide="$emit('removeItem')"
    />
  </div>
</template>

<style lang="scss" scoped>
.director-select-cpn {
  min-height: 100%;
  display: flex;
  align-items: center;
  align-self: flex-start;
  background-color: white;
  box-shadow: 0 0 0 2px #1d74f5 inset;
  :deep(.b-form-person-select) {
    .ant-select-selector {
      width: 362px;
      background-color: transparent !important;
      padding: 0 8px !important;
    }
  }
  :deep(.ant-select-focused) {
    .ant-select-selector {
      box-shadow: none !important;
    }
  }
}
</style>
