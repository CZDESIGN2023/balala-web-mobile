<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { PRIORITY_LIST } from '@/utils/constant'
import type { TableRowData } from '@/views/project/types/table'

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '40px',
  value: '',
  className: '',
  placeholder: '请选择优先级',
  row: () => {
    return {} as TableRowData
  },
})

const emits = defineEmits(['onChange', 'onClose'])

interface Props {
  width?: string
  height?: string
  value?: string
  className?: string
  // placeholder
  placeholder?: string
  row: TableRowData
}

const modelValue = ref<string>('')
const selectRef = ref<HTMLSelectElement | undefined>()
const priorityItem = ref({
  label: '',
  value: '',
  color: '',
})

const state = reactive({
  open: true,
})

/** COMPUTED */
const disabled = computed(() => {
  return !props.row.perm.allowEdit
})

onMounted(() => {
  disabled.value ? (state.open = false) : (state.open = true)
})

watch(
  () => props.row.priority,
  (newVal) => {
    if (newVal) {
      modelValue.value = newVal
      const filterItem = PRIORITY_LIST.filter(item => item.value === newVal)[0]
      priorityItem.value = filterItem
    }
  },
  {
    deep: true,
    immediate: true,
  },
)

// 自定义搜索
function filterOption(input: string, option: any) {
  return option.label.toLowerCase().includes(input.toLowerCase())
}

// 选择
function changeValue(value: string, option: any) {
  priorityItem.value = option
  emits('onChange', value, 'priority', { row: props.row })
  state.open = false
}

function dropdownVisibleChange(open: boolean) {
  if (!open)
    emits('onClose')
}

function close() {
  state.open = false
}

defineExpose({ close })
</script>

<template>
  <div v-if="row.priority" class="b-input-priority flex" :class="className" :style="{ width }">
    <a-select
      ref="selectRef"
      v-model:value="modelValue"
      style="width: 100%"
      :get-popup-container="
        className === 'detail table' ? null : (triggerNode: any) => triggerNode.parentNode
      "
      :filter-option="filterOption"
      :dropdown-align="{ offset: [0, 8] }"
      :list-height="className === 'detail table' ? 296 : 256"
      :popup-class-name="className === 'detail table' ? 'priority-select' : ''"
      :options="PRIORITY_LIST"
      :disabled="disabled"
      :open="state.open"
      :dropdown-style="{ minWidth: '74px' }"
      @dropdown-visible-change="dropdownVisibleChange"
      @change="changeValue"
    >
      <template #option="{ label, color }">
        <div class="priority-item priority-item-option">
          <div
            class="box flex-row-center text14 br4 w48 h24 pfm"
            :style="{ background: color }"
          >
            {{ label }}
          </div>
        </div>
      </template>
    </a-select>
  </div>
</template>

<style lang="scss" scoped>
.b-input-priority {
  box-shadow: 0 0 0 2px #1d74f5 inset;
}
</style>
