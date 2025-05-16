<script setup lang="ts">
import { computed } from 'vue'
import { getTextLength } from '@/utils'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  name: { type: String, default: '' },
  otherOptions: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const data = computed(() => {
  return props.modelValue.map((item) => { return { label: item, value: Math.random(), default: false } })
})

function onAfterClose(val: any[]) {
  const newVal = val.filter(item => !item.default).map(item => item.label)
  if (JSON.stringify(newVal) === JSON.stringify(props.modelValue))
    return
  emit('update:modelValue', newVal)
}
</script>

<template>
  <ModalListEdit
    :model-value="data"
    :title="`${name}原因`"
    :after-close="onAfterClose(data)"
    :placeholder="`请输入 ${name} 原因，回车确认`"
    add-text="添加原因"
    search-placeholder="搜索原因"
    :delete-msg="`是否确认删除${name}原因`"
    :repeat-msg="`${name}原因重复`"
    :validate="(text:string) => {
      const length = getTextLength(text)
      if (!text || length < 2 || length > 40) {
        return '请输入2 ~ 40个字符'
      }
      return ''
    }"
    :other-options="props.otherOptions"
    name="内容"
    @update:model-value="(val:any) => onAfterClose(val)"
  />
</template>
