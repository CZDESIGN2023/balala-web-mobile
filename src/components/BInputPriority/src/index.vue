<script lang="ts" setup>
import { ref, watch } from 'vue'
import { PRIORITY_LIST } from '@/utils/constant'

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '40px',
  value: '',
  className: '',
  placeholder: '请选择优先级',
})

const emits = defineEmits(['onChange', 'onClose'])

interface Props {
  width?: string
  height?: string
  value?: string
  className?: string
  // placeholder
  placeholder?: string
  disabled?: boolean
}

const modelValue = ref<string>('')
const selectRef = ref<HTMLSelectElement | undefined>()
const priorityItem = ref({
  label: '',
  value: '',
  color: '',
})

watch(
  props,
  (newVal) => {
    if (newVal.value) {
      modelValue.value = newVal.value
      const filterItem = PRIORITY_LIST.filter(item => item.value === newVal.value)[0]
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
  selectRef.value && selectRef.value.blur()
  emits('onChange', value)
}

function dropdownVisibleChange(open: boolean) {
  if (!open)
    emits('onClose')
}
</script>

<template>
  <div class="b-input-priority flex" :class="className" :style="{ width }">
    <div class="select-box flex-row-between">
      <div>
        <div
          v-if="priorityItem.label"
          class="box flex-row-center text12 title-color pointer br4 pfm"
          :style="{ background: priorityItem.color }"
        >
          {{ priorityItem.label }}
        </div>
        <span v-else class="box flex-row-center text12 minor-color full-auto">{{
          placeholder
        }}</span>
      </div>
    </div>
    <b-select
      ref="selectRef"
      v-model:value="modelValue"
      style="width: 100%"
      :get-popup-container="
        className === 'detail table-style' ? null : (triggerNode: any) => triggerNode.parentNode
      "
      :filter-option="filterOption"
      :virtual="false"
      :dropdown-align="{ offset: [0, 8] }"
      :popup-class-name="className === 'detail table-style' ? 'priority-select' : ''"
      :options="PRIORITY_LIST"
      :disabled="props.disabled"
      @dropdown-visible-change="dropdownVisibleChange"
      @change="changeValue"
    >
      <template #suffixIcon>
        <svg-icon name="select-arrow" size="16" color="#666666" />
      </template>

      <template #option="{ label, color }">
        <div class="priority-item priority-item-option">
          <div
            class="box flex-row-center text12 title-color br4 pfm"
            :style="{ background: color }"
          >
            {{ label }}
          </div>
        </div>
      </template>
    </b-select>
  </div>
</template>

<style lang="scss">
$tool-select-normal-height: 70.51282vw;
.b-input-priority {
  position: relative;
  .ant-select-dropdown {
    max-height: $tool-select-normal-height;
    height: $tool-select-normal-height;
    .rc-virtual-list {
      .rc-virtual-list-holder {
        height: $tool-select-normal-height;
        max-height: $tool-select-normal-height !important;
        &::-webkit-scrollbar {
          //整体样式
          background-color: transparent;
          // display: none;
          width: $tool-drop-scorll-width;
          border-left: 0px solid $color-border-main;
        }
        &::-webkit-scrollbar-thumb {
          //滑动滑块条样式
          border-radius: $tool-drop-scorll-radius;
          background-color: $tool-drop-scorll-bg;
        }
      }
      // .rc-virtual-list-scrollbar {
      //   display: none !important;
      // }
      .rc-virtual-list-scrollbar-thumb {
        width: $tool-drop-scorll-width !important;
        border-radius: $tool-drop-scorll-radius !important;
        background: $tool-drop-scorll-bg !important;
      }
      // &:hover {
      //   .rc-virtual-list-scrollbar {
      //     display: block !important;
      //   }
      // }
    }
  }
  .select-box {
    position: absolute;
    left: 11px;
    z-index: 10;
    top: 7.5px;
    pointer-events: none;
  }
  .priority-item {
    width: 100%;
    line-height: normal;
    display: flex;
    border-radius: 4px;
    cursor: pointer;
    font-weight: initial;
  }
  .priority-item-option {
    padding: 8px 12px;
    &:hover,
    &.active {
      background: $tool-hover-bg;
    }
  }
  .box {
    width: 40px;
    height: 21px;
    font-weight: initial;
  }

  // antd
  .ant-select {
    .ant-select-selector {
      width: 100%;
      height: 40px;
      background: $color-input;
      border: 0;
      border-radius: 6px;
      &:hover {
        background: $color-input-hover !important;
      }
      .ant-select-selection-item {
        display: flex;
        align-items: center;
        opacity: 0;
        font-size: $filter-drop-font-size;
      }
      .ant-select-selection-placeholder {
        color: $color-minor;
        font-size: 14px;
        display: flex;
        align-items: center;
      }
      .ant-select-selection-overflow {
        gap: 4px 8px;
        padding: 4px 8px;
        .ant-select-selection-search {
          margin-inline-start: 0;
        }
      }
      .ant-select-selection-search-input {
        height: 40px;
      }
    }
    .ant-select-dropdown {
      padding: 8px 0;
      border: 1px solid $color-border-minor;
      box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
      .rc-virtual-list-holder-inner {
        .ant-select-item {
          padding: 0;
          border-radius: 0;
          cursor: pointer;
        }
        .ant-select-item-option-active {
          background-color: transparent;
        }
        .ant-select-item-option-state {
          opacity: 0;
          width: 0;
        }
        .ant-select-item-option-selected {
          background-color: $tool-select-bg !important;
          .ant-select-item-option-content {
            .option-item {
              background: #1d74f5;
              border: 1px solid #1d74f5;
              font-weight: initial;
              p {
                color: #fff;
              }
            }
          }
        }
      }
    }
  }
  &.detail {
    .ant-select {
      .ant-select-selector {
        background: none;
      }
      .ant-select-arrow {
        opacity: 0;
      }
    }
  }
  &.table-style {
    .ant-select {
      .ant-select-selector {
        background: none;
      }
      .ant-select-arrow {
        opacity: 0;
      }
    }
    &:hover {
      .ant-select {
        .ant-select-selector {
          background: none;
        }
        .ant-select-arrow {
          opacity: 0;
        }
      }
    }
  }
  &:hover {
    .ant-select {
      .ant-select-arrow {
        opacity: 1;
      }
    }
  }
}
</style>
