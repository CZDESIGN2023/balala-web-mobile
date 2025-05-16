<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue'
import { message } from 'ant-design-vue'
import pinyin from 'pinyin'
import { deepCopy, getAssetsFile, getTextLength } from '@/utils'

const props = withDefaults(defineProps<Props>(), {
  name: '',
  modelValue: null,
  create: false,
  createText: '',
  edit: false,
  editPlaceholder: '',
  searchPlaceholder: '',
  addFn: Function,
  editFn: Function,
  queryOptions: () => [],
  validator: (name: string) => {
    const regex = /^[A-Z0-9\u4E00-\u9FA5]+$/i
    const length = getTextLength(name)
    let msg = ''
    if (!name || !(length >= 2 && length <= 8) || !regex.test(name))
      msg = '请输入2 ~ 8个字符，支持中英文、数字'

    if (msg) {
      message.error(msg)
      return false
    }

    return true
  },
})

const emits = defineEmits(['update:modelValue'])

// 编辑情况下输入框焦点状态
enum InputFocus {
  BLUR = 'blur',
  FOCUS = 'focus',
}

/** PROPS */
interface Props {
  name: string
  modelValue: string | null
  create?: boolean
  createText?: string
  edit?: boolean
  editPlaceholder?: string
  searchPlaceholder?: string
  addFn?: Function | ((label: string) => Promise<any>)
  editFn?: Function | ((item: any) => Promise<any>)
  queryOptions: Function | (() => Promise<any>)
  validator?: Function
}

interface Option {
  label: string
  value: string
  default?: boolean
}

const options = ref<Option[]>([])
let t: any

const addInputRef = ref()
const selectRef = ref()
const searchRef = ref()

const nameInputRefs = ref<{ [key: string]: HTMLInputElement }>({})

const state = reactive({
  contentEdit: false,
  newLabel: '',
  currentModuleItem: {} as Option,
  currentModuleId: '',
  inputError: false,
  searchKeyword: '',
  open: false,
})

const moduleList = computed(() => {
  if (!state.searchKeyword)
    return options.value

  const searchPinyin = pinyin(state.searchKeyword, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('')
  return options.value.filter((item) => {
    const itemNamePinyin = pinyin(item.label, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join('')
    return itemNamePinyin.includes(searchPinyin)
  })
})

const { contentEdit, newLabel, currentModuleItem, currentModuleId, inputError } = toRefs(state)

const value = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value, moduleList.value)
  },
})

onMounted(async () => {
  getOptions()
})

onUnmounted(() => {
  if (t)
    clearTimeout(t)
})

function getOptions() {
  const r = props.queryOptions()
  if (r.then) {
    r.then((val: any) => {
      options.value = val
    })
  }
  else {
    if (typeof r === 'string')
      t = setTimeout(getOptions, 100)

    else
      options.value = r
  }
}

// 点击添加模块
function onAdd() {
  if (currentModuleId.value)
    return
  contentEdit.value = !contentEdit.value
  requestAnimationFrame(() => {
    addInputRef.value?.focus()
  })
}

/**
 * @description 点击编辑当前模块
 */
function onEdit(item: Option) {
  if (contentEdit.value)
    return
  currentModuleId.value = item.value
  inputError.value = false
  currentModuleItem.value = deepCopy(item)
  changeModuleItemInputFocus(item.value, InputFocus.FOCUS)
}

// 更改编辑状态下模块输入框焦点状态
function changeModuleItemInputFocus(id: string, focus: InputFocus) {
  if (focus === InputFocus.BLUR) {
    nextTick(() => {
      const input = nameInputRefs.value[id]
      if (input)
        input.blur()
    })
  }
  else {
    nextTick(() => {
      const input = nameInputRefs.value[id]
      if (input)
        input.focus()
    })
  }
}

async function addInputBlur() {
  try {
    if (validate({ label: newLabel.value })) {
      await props.addFn(newLabel.value)
      newLabel.value = ''
      contentEdit.value = false
      getOptions()
    }
  }
  catch (err) {
    inputError.value = true
    newLabel.value = newLabel.value.replace(/\s+/g, '')
    setTimeout(() => {
      addInputRef.value?.focus()
    }, 100)
  }
}

async function editInputBlur(currentModuleItem: any, item: any) {
  try {
    if (validate(currentModuleItem, item)) {
      await props.editFn(currentModuleItem)
      currentModuleId.value = ''
      getOptions()
    }
  }
  catch (error) {
    inputError.value = true
    newLabel.value = newLabel.value.replace(/\s+/g, '')
    setTimeout(() => {
      nameInputRefs.value[item.value]?.focus()
    }, 100)
  }
}

// 点击选择模块
function onSelect(item: Option) {
  // 暂时处理无法关闭的问题
  setTimeout(() => {
    selectRef.value?.focus()
    selectRef.value?.blur()
  }, 100)
  // 传递值
  if (value.value === item.value)
    return
  emits('update:modelValue', item.value, moduleList.value)
}

// 文字高亮
function highlightSearch(text: string) {
  if (!state.searchKeyword)
    return text

  const regex = new RegExp(state.searchKeyword, 'gi')
  return text.replace(regex, (match) => {
    return `<span class="highlight">${match}</span>`
  })
}

// 展开下拉菜单的回调
function dropdownVisibleChange(open: boolean) {
  inputError.value = false
  if (open) {
    setTimeout(() => {
      searchRef.value?.focus()
    }, 600)
  }
  else {
    selectRef.value?.focus()
    selectRef.value?.blur()
    setTimeout(() => {
      contentEdit.value = false
      newLabel.value = ''
      state.searchKeyword = ''
      currentModuleId.value = ''
    }, 200)
  }
  state.open = open
}

function validate(item: any, oldItem?: any) {
  // 新增
  if (contentEdit.value) {
    if (!item.label) {
      contentEdit.value = false
      inputError.value = false
      return false
    }
    if (!props.validator(item.label)) {
      inputError.value = true
      setTimeout(() => {
        if (state.open)
          addInputRef.value?.focus()
      }, 100)
      return false
    }
  }
  // 编辑
  else if (currentModuleId.value) {
    let r = true
    if (item.label === oldItem.label) {
      currentModuleId.value = ''
      inputError.value = false
      r = false
    }
    // if (!props.validator(item.label)) {
    //   inputError.value = true
    //   r = false
    // }
    // if (r) {
    //   // currentModuleId.value = ''
    // }
    // else {
    //   console.log('foucus2')
    //   setTimeout(() => {
    //     nameInputRefs.value[item.value]?.focus()
    //   }, 100)
    // }
    return r
  }
  else {
    return false
  }
  return true
}

function setOptions(val: any) {
  options.value = val
}

defineExpose({ setOptions, refresh: getOptions })
</script>

<template>
  <b-select
    v-bind="$attrs"
    ref="selectRef"
    v-model:value="value"
    popup-class-name="biz-module-select b-select-sync-edit"
    :open="state.open"
    :options="moduleList"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    @dropdown-visible-change="dropdownVisibleChange"
  >
    <template #suffixIcon>
      <svg-icon name="select-arrow" size="16" color="#666666" />
    </template>
    <template #dropdownRender>
      <div class="biz-module-dropdown b-select-sync-edit_dropdown">
        <div class="pl16 pr16 mb12 mt8">
          <a-form-item name="search-input">
            <b-input2
              ref="searchRef"
              v-model:value="state.searchKeyword"
              :placeholder="searchPlaceholder"
              class="h36 search-input px8"
            >
              <template #suffix>
                <SvgIcon class="search-icon" name="search3" color="999" size="16" />
              </template>
            </b-input2>
          </a-form-item>
        </div>
        <el-scrollbar max-height="216px" always class="list" :class="{ enableCreate: create, empty: !moduleList.length }">
          <div v-for="item in moduleList" :key="item.value" class="item">
            <div
              v-if="item.value !== currentModuleId"
              class="wrap flex-row-between"
              :class="{ active: item.value === value }"
            >
              <p class="ss-line-1" @mousedown="onSelect(item)" v-html="highlightSearch(item.label)" />
              <button
                v-if="edit && !item.default"
                class="edit-btn"
                @click="onEdit(item)"
              >
                <svg-icon name="edit" size="16.64px" color="#333333" />
              </button>
              <div v-else-if="item.default" class="preset">
                预设
              </div>
            </div>
            <div
              v-else
              class="input-box flex-row-between"
              :class="{ 'error-border': inputError }"
            >
              <input
                :ref="
                  (el: any) => {
                    if (el) nameInputRefs[item.value] = el
                  }
                "
                v-model="currentModuleItem.label"
                :placeholder="editPlaceholder"
                @keyup.enter="() => nameInputRefs[item.value]?.blur()"
                @blur="editInputBlur(currentModuleItem, item)"
              >
            </div>
          </div>
        </el-scrollbar>
        <div v-if="create && !state.searchKeyword" class="add">
          <button
            v-if="!contentEdit"
            class="btn gap4 pl8 flex-row-start mb8"
            @click="onAdd"
          >
            <img :src="getAssetsFile('add-primary.svg')" alt=""> {{ createText || '添加项目' }}
          </button>
          <div v-else class="input-box flex-row-between" :class="{ 'error-border': inputError }">
            <input
              ref="addInputRef"
              v-model="newLabel"
              :placeholder="editPlaceholder"
              @keyup.enter="() => addInputRef?.blur()"
              @blur="addInputBlur"
            >
          </div>
        </div>
        <div v-else-if="!create && !moduleList.length || !moduleList.length" class="h53 flex-row-center px16 break-all text-center text14 minor-color">
          <p v-if="!create && !moduleList.length">
            请联系&nbsp;<span class="icon-color">项目管理员</span>&nbsp;添加
          </p>
          <p v-else>
            未找到与<span style="color:#1D74F5"> “{{ state.searchKeyword }}” </span>相关的{{ props.name }}
          </p>
        </div>
      </div>
    </template>
  </b-select>
</template>

<style lang="scss">
@import 'src/components/biz/moduleSelect/index.scss';
.b-select-sync-edit {
  padding-top: 8px !important;
  .search-input {
    border-radius: 4px;
    &.ant-input-affix-wrapper-focused {
      box-shadow: none;
      background: rgba(24, 62, 118, 0.03) !important;
    }
    .ant-input {
      background-color: transparent !important;
    }
  }
  .b-select-sync-edit_dropdown {
    .search-box {
      background: rgba(24, 62, 118, 0.03);
      border-radius: 4px;
      height: 36px;
      border-bottom: 0;
    }
    .el-scrollbar.list {
      padding-left: 16px;
      padding-right: 16px;
      padding-top: 0;
      .item {
        height: 36px;
      }
    }
    .add {
      padding: 0 16px !important;
      height: 36px;
    }
  }
}
</style>

<style lang="scss" scoped>
.b-select-sync-edit {
  .ant-form-item {
    margin-bottom: 0 !important;
  }
}
</style>
