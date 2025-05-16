<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue'
import { filterObjectByKeys, getValueByPath } from '@/utils/object'

export interface ItemProps {
  placeholder?: string
  field?: string
  type: string
  label?: string
  options?: any
  rules?: any[]
  tips?: string
  labelRight?: string
  show?: boolean
  readonly?: boolean
  width?: string
  hideLabel?: boolean
  labelCol?: any
  disabled?: boolean
  highlight?: boolean
  [key: string]: any
}

interface Props {
  modelValue: { [key: string]: any }
  items: ItemProps[] | Record<string, ItemProps>
  view?: boolean
  column?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => { return {} },
  items: () => [] as ItemProps[],
  view: false,
  column: false,
})

const emit = defineEmits(['input', 'change', 'focus', 'blur', 'changeData'])

const formRef = ref()
const toView = toRef(() => props.view)
provide('view', toView)

const itemsArray = computed(() => {
  if (!Array.isArray(props.items))
    return Object.values(props.items)

  return props.items
})

// 通过变量路径获取值
function $getValueByPath(path: string) {
  return getValueByPath(props.modelValue, path)
}

// 通过变量路径赋值
function onUpdateModelValue(item: ItemProps, value: any, options?: any): void {
  const keys = item.field!.split('.')
  function recursive(obj: any, keys: string[], value: any): void {
    const key = keys.shift()
    if (key === undefined)
      throw new Error('Invalid path')
    // 如果是最后一个键，赋值
    if (keys.length === 0) {
      obj[key] = value
    }
    else {
      // 否则，递归调用
      if (!Object.prototype.hasOwnProperty.call(obj, key) || typeof obj[key] !== 'object')
        obj[key] = {} // 创建嵌套对象

      recursive(obj[key], keys, value)
    }
  }
  if (!item.readonly || item.readonly === undefined)
    recursive(props.modelValue, keys, value)

  emit('input', item.field, value, options)
  // 提交 change 事件的类型
  if (['module', 'priority', 'version', 'editor'].includes(item.type)) {
    onChange(item.field!, value, options)
  }
  // 触发校验
  if (item.rules?.find(item => item.trigger?.includes('change')))
    formRef.value?.validate([item.field!.split('.')])
}

function onChange(field: string, val: any, options?: any) {
  emit('change', field, val, options)
}

function onChangeDate(item: any, val: string[]) {
  onChange(item.field, { start: val[0], complete: val[1] })
  onUpdateModelValue(item, { start: val[0], complete: val[1] })
  formRef.value.validateFields([item.field.split('.')])
}

function validate() {
  return formRef.value?.validate()
}

function clearValidate() {
  return formRef.value?.clearValidate()
}

function clearHighlight(currentField: string) {
  if (Array.isArray(props.items)) {
    props.items.forEach((item: ItemProps) => {
      if (currentField !== item.field)
        item.highlight = false
    })
  }
}

function resetFields(name?: string) {
  return formRef.value?.resetFields(name)
}

defineExpose({ validate, clearValidate, clearHighlight, resetFields })
</script>

<template>
  <a-config-provider
    :theme="{
      token: { colorPrimary: '#1D74F5', fontSize: 13, colorText: '#333' },
      components: {
        Select: { paddingXXS: '8px' },
        Switch: { colorPrimary: '#1D74F5' },
      },
    }"
  >
    <a-form
      ref="formRef"
      v-bind="$attrs"
      :model="modelValue"
      :layout="$attrs.layout || (column ? 'inline' : undefined)"
      :class="{ 'b-form-view': view, 'b-form-column': column }"
      class="b-form"
    >
      <div v-for="d in itemsArray" :key="d.field" :style="{ width: d.width }">
        <div v-if="d.type === 'group'" class="group pfm">
          {{ d.label }}
          <a-tooltip v-if="d.tips" placement="top" overlay-class-name="b-form-tooltip">
            <template #title>
              {{ d.tips }}
            </template>
            <svg-icon name="tips-icon" size="14" color="rgba(0, 0, 0, 0.65)" class="tips pointer" style="position: static !important;" />
          </a-tooltip>
        </div>
        <div v-else-if="d.type === 'line'" class="line mb8" />
        <div v-else-if="d.type === 'placeholder'" v-bind="$attrs" />
        <a-form-item
          v-else-if="(d.show === undefined || d.show) && d.field"
          :name="d.field.includes('.') ? d.field.split('.') : d.field"
          :rules="d?.rules"
          html-for=""
          :class="{
            'b-form-item-tips': d.tips,
            'hide-label': d?.hideLabel,
            'highlight': d?.highlight,
          }"
          :label-col="d.labelCol"
          class="b-form_item"
        >
          <template v-if="$slots[`${d.field!.replace(/\./g, '-')}-label`]" #label>
            <slot :name="`${d.field!.replace(/\./g, '-')}-label`" />
          </template>

          <template v-else #label>
            <div style="position: relative">
              <a-tooltip v-if="d.tips" placement="top" overlay-class-name="b-form-tooltip">
                <template #title>
                  {{ d.tips }}
                </template>
                <svg-icon name="tips-icon" size="14" color="rgba(0, 0, 0, 0.65)" class="tips pointer" />
              </a-tooltip>
              <div class="label-text">
                {{ d.label }}
              </div>
            </div>
            <div class="label-right" @click.prevent="">
              <template v-if="d.labelRight">
                {{ d.labelRight }}
              </template>
              <slot :name="`${d.field.replace(/\./g, '-')}-label-right`" />
            </div>
          </template>

          <b-input2
            v-if="d.type === 'input'"
            v-bind="d"
            autocomplete="off"
            :value="$getValueByPath(d.field!)"
            @focus="$emit('focus', d.field)"
            @blur="$emit('blur', d.field)"
            @update:value="(val: string) => onUpdateModelValue(d, val?.trim())"
            @change="onChange(d.field, $event)"
          />

          <b-input-number
            v-if="d.type === 'input-number'"
            v-bind="d"
            :value="$getValueByPath(d.field)"
            class="w-full"
            @focus="$emit('focus', d.field)"
            @blur="$emit('blur', d.field)"
            @update:value="(val: string) => onUpdateModelValue(d, val)"
            @change="onChange(d.field, $event)"
          />

          <b-select
            v-else-if="d.type === 'select'"
            v-bind="d"
            :value="$getValueByPath(d.field)"
            @update:value="(val: string) => onUpdateModelValue(d, val)"
          />

          <a-switch v-else-if="d.type === 'switch'" v-bind="d" :checked="$getValueByPath(d.field)" @update:checked="(val: string) => onUpdateModelValue(d, val)" />

          <b-select-sync
            v-else-if="d.type === 'select-sync'"
            v-bind="d"
            :value="$getValueByPath(d.field)"
            @update:value="(val: string, options: any[]) => onUpdateModelValue(d, val, options)"
          />

          <b-range-picker
            v-else-if="d.type === 'range-picker'"
            v-bind="d"
            :value="$getValueByPath(d.field)"
            @update:value="(val: string) => onUpdateModelValue(d, val)"
          />

          <select-status
            v-else-if="d.type === 'select-status'"
            v-bind="d"
            :model-value="$getValueByPath(d.field)"
            name="状态"
            @update:model-value="(val: string, options: any[]) => onUpdateModelValue(d, val, options)"
          />

          <select-role
            v-else-if="d.type === 'select-role'"
            v-bind="d"
            name="角色"
            :model-value="$getValueByPath(d.field)"
            @update:model-value="(val: string, options: any[]) => onUpdateModelValue(d, val, options)"
          />

          <b-input-search
            v-else-if="d.type === 'workItemName'"
            v-bind="d"
            :model-value="$getValueByPath(d.field)"
            class="detail"
            @update:model-value="(val: string, options: any[]) => onUpdateModelValue(d, val, options)"
            @on-change-value="onChange(d.field, $event)"
          />

          <biz-module-select
            v-else-if="d.type === 'module'"
            v-bind="d"
            :model-value="$getValueByPath(d.field)"
            @update:model-value="(val: string, options: any[]) => onUpdateModelValue(d, val, options)"
            @on-update-module-name="$emit('changeData', d.field)"
          />

          <b-input-priority
            v-else-if="d.type === 'priority'"
            v-bind="filterObjectByKeys(d, ['width'])"
            :value="$getValueByPath(d.field)"
            width="100%"
            @on-change="(val: string) => onUpdateModelValue(d, val)"
          />
          <BusinessPersonSelect
            v-else-if="d.type === 'personSelect'"
            v-bind="d"
            :value="$getValueByPath(d.field)"
            @update:value="(val: string) => onUpdateModelValue(d, val)"
            @change="(val: any, selected: string[]) => onChange(d.field!, val, selected)"
            @focus="$emit('focus', d.field, d)"
          />

          <b-range-picker
            v-else-if="d.type === 'dateRange'"
            v-bind="d"
            width="100%"
            :value="$getValueByPath(d.field) ? [$getValueByPath(d.field).planStartAt, $getValueByPath(d.field).planCompleteAt] : null"
            @update:value="(planTime:string[]) => onChangeDate(d, planTime)"
          />

          <biz-version-select
            v-else-if="d.type === 'version'"
            v-bind="d"
            :model-value="$getValueByPath(d.field)"
            @update:model-value="(val: string) => onUpdateModelValue(d, val)"
            @on-update-version-name="$emit('changeData', d.field)"
          />

          <biz-tag-select
            v-else-if="d.type === 'tag'"
            v-bind="d"
            :tag-ids="$getValueByPath(d.field)"
            @update:tag-ids="(val: string) => onUpdateModelValue(d, val)"
            @on-change="(val: any) => onChange(d.field!, val)"
          />

          <b-editor
            v-else-if="d.type === 'editor'"
            v-bind="d"
            :value="$getValueByPath(d.field)"
            @editor-blur="(val: any) => onChange(d.field!, val)"
          />
          <b-form-upload
            v-else-if="d.type === 'upload'"
            v-bind="d"
            :key="$getValueByPath(d.field)"
            :value="$getValueByPath(d.field)"
            @on-upload="(val: any) => onChange(d.field!, val)"
          />

          <slot v-else-if="d.type === 'slot'" :name="d.field.replace(/\./g, '-')" v-bind="d" />
          <slot :name="`${d.field.replace(/\./g, '-')}-append`" />
        </a-form-item>
      </div>
    </a-form>
  </a-config-provider>
</template>

<style lang="scss">
@media (max-width: 575px) {
  .b-form .ant-form-item .ant-form-item-label {
    flex: none;
  }
  .b-form .ant-form-item .ant-form-item-control {
    flex: auto;
  }
  .b-form .ant-form-item .ant-form-item-label {
    padding: 0;
  }
}
.b-form_item {
  &.b-form-item-tips {
    .ant-form-item-required {
      padding-right: 20px;
      .tips {
        right: -30px;
      }
    }
    label {
      padding-right: 19px;
    }
  }
  &.hide-label {
    > .ant-form-row {
      > .ant-form-item-label {
        display: none;
      }
    }
  }
  .ant-form-item-label {
    line-height: 14px;
    flex-shrink: 0;
    margin-right: 12px;
    > label {
      height: 36px;
      font-size: 14px;
      color: #666;
      &.ant-form-item-required:not(
          .ant-form-item-required-mark-optional
        )::before {
        font-size: 14px;
      }
    }
    .ant-form-item-required::before {
      margin-inline-end: 0 !important;
    }
    .label-right {
      .ant-switch-small {
        min-width: 26px;
        height: 14px;
        &.ant-switch-checked {
          .ant-switch-handle {
            inset-inline-start: calc(100% - 12px);
          }
        }
        .ant-switch-handle {
          width: 10px;
          height: 10px;
        }
      }
    }
  }
}
.b-form-tooltip {
  max-width: 303px;
}
</style>

<style lang="scss" scoped>
.b-form {
  &.ant-form-vertical {
    :deep(.ant-form-item-label) {
      width: 100%;
      overflow: initial;
      margin-right: 0;
      label {
        justify-content: flex-end;
        width: 100%;
      }
    }
    :deep(.ant-form-item-control-input) {
      min-height: 0;
    }
  }
  // large 尺寸样式重置
  &.ant-form-large {
    :deep(.ant-form-item) {
      margin-bottom: 12px !important;
      .tips {
        right: -32px;
      }
    }
    :deep(.ant-form-item-label) {
      .ant-form-item-required::before,
      .label-text {
        font-size: 14px;
      }
      .tips {
        width: 16px !important;
        height: 16px !important;
        margin-top: -1px;
      }
    }
  }
  &.b-form-column {
    justify-content: space-between;
    :deep(.ant-form-item) {
      margin-right: 0;
      .ant-form-row {
        flex-flow: row nowrap;
      }
    }
  }
  &.ant-form-large {
    :deep(.ant-form-item-label) {
      .ant-form-item-required::before,
      .label-text {
        font-size: 14px;
      }
      .tips {
        width: 16px !important;
        height: 16px !important;
        margin-top: -1px;
      }
    }
  }
  &.b-form-column {
    :deep(.ant-form-item) {
      margin-right: 0;
    }
  }
  :deep(.ant-form-item) {
    margin-bottom: 8px !important;
  }
  :deep(.ant-form-item-label) {
    label {
      flex-direction: row-reverse;
    }
    .tips {
      pointer-events: auto;
    }
  }
  :deep(.ant-form-item-control) {
    min-width: 0;
  }
  // tooltip 颜色设置
  :deep(.svg-icon.tips) {
    &:hover {
      use {
        fill: #000;
        transition: 0.5s;
      }
    }
  }
  > .group:first-child {
    margin-top: 17.5px;
  }
  .tips {
    position: absolute;
    right: -18px;
  }
  .group {
    font-size: 13px;
    line-height: 1;
    color: #333;
    margin: 25.5px 0;
    border-left: 2px solid $color-primary;
    padding-left: 6px;
  }
  .line {
    border-bottom: 1px solid #edeef0;
  }
  .label-right {
    position: absolute;
    right: 0;
    font-size: 12px;
    color: #999;
    pointer-events: auto;
  }
  .ant-form-item {
    &.highlight {
      :deep(.ant-select-selector) {
        background: rgba(29, 116, 245, 0.08);
      }
    }
  }
}
</style>
