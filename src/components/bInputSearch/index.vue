<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import type { TaskNameSearchItem } from '@/api/interface'
import { searchWorkItem } from '@/api/project'
import { debounce, getTextLength } from '@/utils'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  spaceId: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['update:modelValue', 'onChangeValue'])

const inputRef = ref()
const state = reactive({
  placeholder: '待填',
  copyName: '',
  inputIsFocus: false,
  list: [] as TaskNameSearchItem[],
})

const value = computed({
  get: () => props.modelValue,
  set: val => emits('update:modelValue', val),
})

const isShowSearchList = computed(() => {
  return state.list.length && value.value && state.inputIsFocus
})

// 监听输入框获取焦点
function inputFocus() {
  state.inputIsFocus = true
  state.placeholder = '请输入任务名称(2 ~ 200个字符)'
  state.copyName = value.value
}

// 监听输入框失去焦点
function inputBlur() {
  const length = getTextLength(value.value as string)
  state.placeholder = '待填'
  state.list = []
  state.inputIsFocus = false
  if (!(length >= 2 && length <= 200)) {
    return
  }
  // 未改变不做处理
  if (state.copyName.trim() === value.value.trim()) {
    value.value = state.copyName
    return
  }
  emits('update:modelValue', value.value.trim())
  emits('onChangeValue', value.value.trim())
}

// 监听输入框回车
function inputEnter() {
  inputRef.value?.blur()
}

// 监听输入框输入
const inputChange = (function () {
  const fn = debounce((value: string) => {
    state.list = []
    if (props.spaceId && value)
      getList(props.spaceId, value)
  }, 300)
  return function (value: string) {
    emits('update:modelValue', value)
    fn(value)
  }
})()

async function getList(spaceId: string, name: string) {
  if (!spaceId) {
    state.list = []
    return
  }
  const { data } = await searchWorkItem(spaceId, name)
  if (state.inputIsFocus)
    state.list = data.items
}

// 匹配关键字
function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $&表示整个匹配的文本
}

function keyWordContent(text: string, keyword: string) {
  if (!keyword)
    return '' // 如果没有输入关键字，直接返回空字符串

  const escapedKeyword = escapeRegExp(keyword) // 转义关键字中的特殊字符
  const regexp = new RegExp(escapedKeyword, 'g') // 创建全局正则表达式对象
  const htmlContent = text.replace(regexp, `<span class="color-blue">${keyword}</span>`)
  return htmlContent
}
</script>

<template>
  <div class="b-input-search">
    <BInput2
      ref="inputRef"
      :value="value"
      allow-clear
      :placeholder="state.placeholder"
      :disabled="disabled"
      autocomplete="off"
      @focus="inputFocus"
      @blur="inputBlur"
      @press-enter="inputEnter"
      @update:value="inputChange"
    >
      <template #clearIcon>
        <a-tooltip title="清空" effect="dark">
          <img class="delete-icon w16 v-text-bottom" src="@/assets/svg/input-close.svg">
        </a-tooltip>
      </template>
    </BInput2>
    <div v-if="isShowSearchList" class="search-list">
      <div class="search-list-title h32 px8">
        检索相似任务单
      </div>
      <el-scrollbar max-height="192px">
        <div v-for="item in state.list" :key="item.id">
          <div class="ss-line-1 h32 pl8 pr16" v-html="keyWordContent(item.name, value)" />
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-list {
  position: absolute;
  top: 48px;
  width: 100%;
  border-radius: 8px;
  background: #ffffff;
  border: 0.5px solid #e8e9eb;
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
  z-index: 100;
  padding: 8px;
  padding-right: 0;
  font-size: 14px;
  line-height: 32px;
}
.search-list-title {
  color: #a6a6a6;
}
</style>
