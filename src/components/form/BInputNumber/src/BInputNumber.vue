<script setup lang="ts">
import { type Ref, computed, nextTick, ref } from 'vue'
import { filterObjectByKeys } from '@/utils/object'

const props = defineProps({
  value: {
    type: Number,
    default: null,
  },
  suffix: { type: String, default: '' },
  inputSuffix: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  focusPlaceholder: { type: String, default: '' },
  clearRestore: { type: Boolean, default: false },
})
const emit = defineEmits(['focus', 'change', 'blur', 'update:value'])

const inputRef = ref()
const rawValue = ref(null) as unknown as Ref< null | number>
const isFocus = ref(false)

const nowPlaceholder = computed(() => {
  return isFocus.value ? props.focusPlaceholder : props.placeholder
})

function onFocus() {
  isFocus.value = true
  rawValue.value = props.value
  emit('focus')
  clearInput()
}

function onBlur() {
  isFocus.value = false
  if (props.clearRestore && [null, '', undefined].includes(props.value as any)) {
    emit('update:value', rawValue.value)
  }
  else if (rawValue.value !== props.value) {
    emit('change', props.value)
  }
  emit('blur')
  clearInput()
}

function focus() {
  inputRef.value?.focus()
}

function blur() {
  inputRef.value?.blur()
}

function progressInput(val: number) {
  if (Number.isNaN(val)) {
    return emit('update:value', null)
  }
  else if (val > 100) {
    emit('update:value', 100)
  }
  else {
    return emit('update:value', val)
  }
}

function clearInput() {
  nextTick(() => {
    const inputDom = inputRef.value.$el.querySelector('input')
    if (/\D/.test(inputDom.value)) {
      emit('update:value', '')
      inputDom.value = ''
    }
  })
}

defineExpose({ focus, blur })
</script>

<template>
  <b-input2
    ref="inputRef"
    v-bind="filterObjectByKeys($attrs, ['onFo cus', 'onBlur', 'suffix'])"
    v-input-limit
    :value="isFocus ? value : (value || value === 0 ? `${value}${inputSuffix}` : '')"
    :suffix="inputSuffix ? (isFocus ? suffix : '') : suffix"
    :bordered="false"
    :placeholder="nowPlaceholder"
    class="b-input-number"
    autocomplete="off"
    @update:value="(val: string) => progressInput(parseFloat(val))"
    @press-enter="inputRef.blur()"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>
