<script setup lang="ts">
import { inject, ref } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  popupClassName: '',
})

interface Props {
  popupClassName?: string
}

const selectRef = ref()
const view = inject('view', false)

function focus() {
  selectRef.value?.focus()
}

function blur() {
  selectRef.value?.blur()
}

defineExpose({ focus, blur })
</script>

<template>
  <a-select
    ref="selectRef"
    v-bind="$attrs"
    :class="{ 'b-select-view': view }"
    :popup-class-name="`b-select-popup ${props.popupClassName}`"
    class="b-select"
  >
    <template #suffixIcon>
      <svg-icon name="select-arrow" size="16" color="#999" />
    </template>
    <template #clearIcon>
      <a-tooltip title="清空" effect="dark">
        <img class="v-text-bottom" src="@/assets/svg/input-close.svg">
      </a-tooltip>
    </template>

    <template v-if="$slots.dropdownRender" #dropdownRender="scoped">
      <slot name="dropdownRender" v-bind="scoped" />
    </template>

    <template v-if="$slots.menuItemSelectedIcon" #menuItemSelectedIcon="scoped">
      <slot name="menuItemSelectedIcon" v-bind="scoped" />
    </template>

    <template v-if="$slots.notFoundContent" #notFoundContent>
      <slot name="notFoundContent" />
    </template>

    <template v-if="$slots.option" #option="scoped">
      <slot name="option" v-bind="scoped" />
    </template>

    <template v-if="$slots.placeholder" #placeholder="scoped">
      <slot name="placeholder" v-bind="scoped" />
    </template>

    <template v-if="$slots.removeIcon" #removeIcon="scoped">
      <slot name="removeIcon" v-bind="scoped" />
    </template>

    <template v-if="$slots.tagRender" #tagRender="scoped">
      <slot name="tagRender" v-bind="scoped" />
    </template>

    <template v-if="$slots.maxTagPlaceholder" #maxTagPlaceholder="scoped">
      <slot name="maxTagPlaceholder" v-bind="scoped" />
    </template>
  </a-select>
</template>

<style lang="scss">
.b-select-popup {
  border: 1px solid $tool-drop-box-border;
  box-shadow: $tool-drop-box-shadow;
  .rc-virtual-list-scrollbar {
    width: 6px !important;
    .rc-virtual-list-scrollbar-thumb {
      background: rgba(24, 62, 118, 0.12) !important;
    }
  }
  &.ant-select-dropdown {
    .ant-select-item {
      color: #333;
    }
  }
}
.b-select {
  // large 尺寸重置
  &.ant-select-lg {
    font-size: 14px;
    &.ant-select-single {
      .ant-select-selector {
        .ant-select-selection-item,
        .ant-select-selection-placeholder {
          line-height: 40px;
        }
      }
    }
    &.ant-select-multiple {
      &.ant-select-show-arrow,
      &.ant-select-allow-clear {
        .ant-select-selector {
          padding-inline-end: 36px;
        }
      }
      .ant-select-selector {
        padding: 1px 4px;
        border-radius: 6px;
      }
    }
    .ant-select-clear {
      width: 16px;
      height: 15px;
      // top: calc(50% - 15px / 2); 居中
      top: 13.5px;
      margin-top: 0;
      img {
        width: 15px !important;
      }
    }
  }
  &.ant-select-single {
    &:not(.ant-select-customize-input) .ant-select-selector {
      height: 36px;
    }
    .ant-select-selector {
      font-size: 14px;
    }
  }
  &.ant-select .ant-select-arrow {
    inset-inline-end: 8px;
  }
}
</style>

<style lang="scss" scoped>
.ant-select-single {
  :deep(.ant-select-selector) {
    color: #333;
  }
  &.ant-select-open {
    :deep(.ant-select-selection-item) {
      color: #333;
    }
  }
}

.b-select {
  &:focus,
  &.ant-select-focused.ant-select:not(.ant-select-disabled):not(
      .ant-select-customize-input
    ):not(.ant-pagination-size-changer) {
    :deep(.ant-select-selector) {
      box-shadow: 0 0 0 2px #1d74f5 inset;
      background-color: white;
    }
    :deep(.ant-select-clear) {
      opacity: 1;
      pointer-events: initial;
    }
  }
  &.ant-select-status-error {
    :deep(.ant-select-selector) {
      box-shadow: 0 0 0 2px $color-error inset !important;
    }
  }
  :deep(.ant-select-clear) {
    opacity: 0;
    transition: 0.2s;
    pointer-events: none;
    display: flex;
    align-items: center;
    margin-right: 1.5px;
    img {
      width: 13.33px;
    }
  }
  &.ant-select-lg {
    :deep(.ant-select-arrow) {
      inset-inline-end: 12px;
    }
  }
  &.ant-select-disabled.ant-select-multiple.ant-select:not(
      .ant-select-customize-input
    )
    :deep(.ant-select-selector),
  :deep(.ant-select-selector) {
    background-color: #f7f8fa;
    border: none;
    padding: 1px 8px;
    border-radius: 4px;
    &:hover {
      background-color: #f1f4f7;
    }
    .ant-select-selection-overflow-item-rest .ant-select-selection-item {
      background: none;
      border: 0;
      color: #999;
      font-size: 14px;
      padding-inline-start: 0;
      padding-inline-end: 0;
      margin: 0;
      margin-left: 8px;
    }
  }

  &.ant-select-disabled.ant-select-multiple.ant-select:not(
      .ant-select-customize-input
    ).b-select-view,
  &.b-select-view {
    &:hover {
      :deep(.ant-select-selector) {
        background-color: #f1f4f7;
      }
      :deep(.ant-select-arrow) {
        opacity: 1;
      }
    }
    :deep(.ant-select-selector) {
      background-color: transparent;
    }
    :deep(.ant-select-arrow) {
      transition: 0.2s;
      opacity: 0;
    }
    &.ant-select-focused {
      :deep(.ant-select-arrow) {
        opacity: 1;
      }
    }
  }
  &.ant-select-disabled {
    :deep(.ant-select-selector) {
      color: #333;
    }
  }
}
</style>
