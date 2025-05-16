<script setup lang="ts">
import { type Ref, inject, ref } from 'vue'
import { filterObjectByKeys } from '@/utils/object'

interface Props {
  value: string | number
  allowClear?: boolean
}

const props = withDefaults(defineProps<Props>(), { value: '', allowClear: false })
const emit = defineEmits(['update:value', 'change', 'blur', 'focus'])

const view = inject('view', false)
const inputRef = ref()
const rawValue = ref('') as unknown as Ref< string | number>

function onFocus() {
  rawValue.value = props.value
  emit('focus')
}

function onBlur() {
  if (rawValue.value !== props.value) {
    emit('change', props.value)
  }
  emit('blur')
}

function focus() {
  inputRef.value?.focus()
}

function blur() {
  inputRef.value?.blur()
}

function rollback() {
  emit('update:value', rawValue.value)
}

defineExpose({ focus, blur, rollback })
</script>

<template>
  <a-input
    ref="inputRef"
    v-bind="filterObjectByKeys($attrs, ['onFocus', 'onBlur'])"
    :value="value"
    :allow-clear="allowClear"
    :class="{ 'b-input2-view': view }"
    class="b-input2"
    @update:value="$emit('update:value', $event)"
    @focus="onFocus"
    @blur="onBlur"
  >
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template #clearIcon>
      <a-tooltip title="清空" effect="dark">
        <img :style="{ display: value.toString().length > 0 ? '' : 'none' }" class="v-text-bottom" src="@/assets/svg/input-close.svg">
      </a-tooltip>
    </template>
  </a-input>
</template>

<style lang="scss" scoped>
.b-input2 {
  background-color: #f7f8fa;
  border: none;
  padding: 7.001px 8px;
  font-size: 14px;
  line-height: 1.5719;

  :deep(.ant-input) {
    background-color: #f7f8fa;
    font-size: 14px;
    line-height: 1.5719;
  }
  :deep(.ant-input-clear-icon) {
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
  :deep(.ant-input-clear-icon-hidden) {
    visibility: initial;
  }
  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0px 1000px #f7f8fa inset;
  }
  // 这里用来解决密码自动填充带来的背景问题
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #f1f4f7 inset !important;
    background-clip: content-box !important;
  }
  &:hover {
    background-color: #f1f4f7;
    :deep(.ant-input) {
      background-color: #f1f4f7;
    }
  }
  &.ant-input-affix-wrapper-focused,
  &:focus {
    box-shadow: 0 0 0 2px #1d74f5 inset;
    background-color: white;
    :deep(.ant-input) {
      background-color: white;
    }
    &:hover {
      :deep(.ant-input-clear-icon) {
        opacity: 1;
        pointer-events: initial;
      }
    }
  }
  &.ant-input-affix-wrapper-status-error,
  &.ant-input-status-error {
    box-shadow: 0 0 0 2px $color-error inset !important;
  }
  // large 尺寸重置
  &.ant-input-affix-wrapper-lg,
  &.ant-input-lg {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.7145;
    :deep(.ant-input) {
      font-size: 14px;
    }
    :deep(.ant-input-clear-icon) {
      img {
        width: 15px;
      }
    }
  }
  // 查看模式
  &.b-input2-view {
    background-color: transparent;
    :deep(.ant-input) {
      background-color: transparent;
    }
    &:hover {
      background-color: #f1f4f7;
      :deep(.ant-input) {
        background-color: #f1f4f7;
      }
    }

    &.ant-input-affix-wrapper-focused,
    &:focus {
      background-color: transparent;
      :deep(.ant-input) {
        background-color: transparent;
      }
    }
  }
  &.ant-input-affix-wrapper-disabled {
    :deep(.ant-input) {
      color: #333;
    }
  }
}
</style>
