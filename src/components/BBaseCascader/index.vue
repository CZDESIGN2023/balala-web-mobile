<script lang="ts" setup>
defineOptions({ name: 'BBaseCascader' })

const props = withDefaults(defineProps<TSProps>(), {
  options: () => [],
  value: '',
  placeholder: '',
})

const emit = defineEmits(['update:value', 'change'])

interface TSProps {
  options: {
    value: string
    label: string
    children?: {
      value: string
      label: string
    }[]
  }[]
  value: string | null | string[]
  placeholder: string
}

function handleChange(val: string[]) {
  emit('change', val)
  emit('update:value', val)
}
</script>

<template>
  <a-cascader
    :value="props.value"
    :placeholder="props.placeholder"
    :options="props.options"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    :dropdown-align="{ offset: [0, 8] }"
    class="head-select"
    @change="handleChange"
  >
    <template #suffixIcon>
      <svg-icon name="select-arrow" size="12" color="#333" />
    </template>
    <template #expandIcon>
      <svg-icon name="arrow-r" size="12" color="#999" />
    </template>
  </a-cascader>
</template>

<style lang="scss" scoped>
.head-select {
  :deep(.ant-select-selector) {
    height: 30px;
    background: $tool-input-normal-bg;
    border: none;
    padding: 0 0 0 8px;
    border-radius: 4px;
    align-items: center;
    .ant-select-selection-search {
      input {
        font-size: 14px;
      }
    }
    .ant-select-selection-placeholder {
      line-height: $tool-input-height;
      position: absolute;
      inset-inline-start: 6px;
      inset-inline-end: 6px;
      padding-inline-end: 10px;
      padding-inline-end: 10px;
      font-size: $filter-drop-font-size;
    }
    .ant-select-selection-item {
      display: inline-block !important;
      max-width: 80px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      font-size: $filter-drop-font-size;
      .two-sub-icon {
        span {
          margin-left: 0 !important;
        }
        svg {
          display: none !important;
        }
      }
    }
    &:hover {
      background-color: $color-input-hover;
    }
  }
  :deep(.ant-select-arrow) {
    inset-inline-end: 2px;
  }
  :deep(.ant-cascader-menu) {
    padding: 0 8px;
  }
  :deep(.ant-cascader-menu:not(:last-child)) {
    padding-left: 8px;
  }

  :deep(.ant-cascader-menu-item) {
    justify-content: space-between;
    width: 176px;
    min-height: 32px;
    padding: 0 8px;
    .ant-cascader-menu-item-content {
      text-overflow: ellipsis;
      overflow: hidden;
    }
    &.ant-cascader-menu-item-active {
      font-weight: initial;
      background-color: rgba(29, 116, 245, 0.08);
    }
    &:hover {
      background-color: $tool-hover-bg;
    }
  }
  :deep(.ant-cascader-menu-item-expand-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &.ant-select-lg {
    :deep(.ant-select-selector) {
      height: 40px;
      font-size: 14px !important;
    }
    :deep(.ant-select-selection-placeholder),
    :deep(.ant-select-selection-item) {
      line-height: 40px;
      span {
        svg {
          display: none;
        }
      }
    }
    :deep(.ant-select-dropdown) .ant-select-item-option {
      line-height: 32px;
    }
  }
  &.ant-select-focused {
    :deep(.ant-select-selector) {
      box-shadow: none !important;
    }
  }
  &.ant-select-open {
    :deep(.ant-select-selector) {
      background: none;
      box-shadow: 0 0 0 2px #1d74f5 !important;
    }
  }
  :deep(.ant-select-dropdown) {
    padding-right: 2px;
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow;
    .ant-cascader-menu {
      width: 120px;
      height: 272px;
      padding: 8px;
      border-inline-end: 0;
      transition: all 0.2s;
      font-size: $filter-drop-font-size;
      &:nth-of-type(2) {
        width: 120px;
        border-left: 1px solid #edeef0;
        margin-left: 2px;
      }
    }
    .ant-select-item-option-selected {
      background: rgba(0, 0, 0, 0.04);
      font-weight: initial;
    }
  }
}
</style>
