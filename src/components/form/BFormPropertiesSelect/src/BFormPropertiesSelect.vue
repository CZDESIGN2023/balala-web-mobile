<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import { Loading3QuartersOutlined } from '@ant-design/icons-vue'
import { deepCopy } from '@/utils'
import { onClickOutside } from '@vueuse/core';

interface Props {
  value: string[]
  options?: any[]
  queryOptions?: Function | (() => Promise<any>)
  type?: string
  canClear?: boolean // 是否可清空选项
  isSingle: boolean // 是否单选
  tagXpadding?: number | string
  tagYpadding?: number | string
  tagWidth?: number | string
  tagMaxWidth?: number | string
  size?: string
  emptyText?: string
}

interface selectItem {
  value: string
  label: string
  pinyin: string
  key: string
  status: string
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  options: () => [],
  queryOptions: () => [],
  spaceId: '',
  type: '',
  canClear: true,
  isSingle: false,
  tagXpadding: '8',
  tagYpadding: '5',
  tagWidth: 0,
  tagMaxWidth: 200,
  size: 'normal',
  emptyText: '',
})

const emits = defineEmits(['update:value', 'change', 'update:options'])

const selectRef = ref()
const searchRef = ref()
const scrollbarRef = ref()

const indicator = h(Loading3QuartersOutlined, {
  style: {
    fontSize: '18px',
  },
  spin: true,
})

const state = reactive({
  selectOptions: [] as selectItem[], // 下拉列表数据
  keyword: '',
  open: false,
  loading: false, // 下拉列表加载状态
  isEmpty: false,
})

const selectOptions = computed(() => {
  return props.options.length > state.selectOptions.length ? props.options : state.selectOptions
})

// 搜索列表
const searchList = computed(() => {
  const list = selectOptions.value.filter((item: any) => {
    return (
      item.label?.toLowerCase().includes(state.keyword.toLowerCase())
      || item.pinyin?.toLowerCase().includes(state.keyword.toLowerCase())
    )
  })
  return list
})

async function getSelectOptions() {
  state.loading = true
  try {
    state.selectOptions = await props.queryOptions()
    if (!state.selectOptions.length) {
      state.isEmpty = true
    }
    else {
      state.isEmpty = false
    }
    emits('update:options', state.selectOptions)
  }
  catch (error) {
    state.isEmpty = true
    console.error('Error occurred while fetching select options:', error)
  }
  finally {
    state.loading = false
  }
}

// 下拉列表的显示隐藏
function handleSelectVisible(isDropDownShow: boolean) {
  if (isDropDownShow) {
    state.open = true
    getSelectOptions()
    setTimeout(() => {
      searchRef.value?.focus()
    }, 200)
  }
  else {
    state.isEmpty = false
  }
}

// 更新选择值
function updateSelectedValue(val: string[]) {
  emits('update:value', val, selectOptions.value)
  emits('change', val)
}

// 选中下拉选择
function chooseItem(item: any) {
  const { value } = item
  const itemId = value
  let copySelectedValue = deepCopy(props.value)
  // 多选
  if (!props.isSingle) {
    const index = copySelectedValue.indexOf(itemId)
    if (index > -1) {
      copySelectedValue.splice(index, 1)
    }
    else {
      copySelectedValue.push(itemId)
    }
  }
  // 单选
  else {
    // 支持清空点击内容
    if (props.canClear) {
      copySelectedValue = copySelectedValue[0] === itemId ? [] : [itemId]
    }
    else {
      copySelectedValue = [itemId]
    }

    if (selectRef.value && props.isSingle)
      selectRef.value.blur()

    state.open = false
  }

  updateSelectedValue(copySelectedValue)
}

// 展示多选选中状态
function showSelectedIcon(searchItem: selectItem) {
  const { value, isSingle } = props

  return value.includes(searchItem.value) && !isSingle
}

// 展示单选选中状态
function showSelectedIconSingle(searchItem: selectItem) {
  const { value, isSingle } = props

  return value.includes(searchItem.value) && isSingle
}

onClickOutside(selectRef, () => {
  if (state.open) {
    state.open = false
  }
})

// defineExpose({
//   refresh: getSelectOptions,
// })
</script>

<template>
  <a-select
    ref="selectRef"
    :value="props.value"
    mode="multiple"
    :open="state.open"
    :show-arrow="true"
    :show-search="false"
    :class="props.size"
    class="filter-select-style"
    :dropdown-match-select-width="200"
    :options="selectOptions"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    :dropdown-align="{ offset: [0, 8] }"
    @dropdown-visible-change="handleSelectVisible"
  >
    <template #suffixIcon>
      <SvgIcon name="select-arrow" size="12" color="#999" />
    </template>
    <template #dropdownRender>
      <a-spin :spinning="state.loading" :indicator="indicator" />
      <el-scrollbar ref="scrollbarRef" class="list-scroll" max-height="280px" always>
        <div v-if="!state.loading" class="choose-list">
          <div
            v-for="(searchItem, index) in searchList" :key="index"
            :class="{ active: showSelectedIconSingle(searchItem) }"
            class="option-item"
            @click="chooseItem(searchItem)"
          >
            <div v-show="showSelectedIcon(searchItem)" class="selected-icon">
              <SvgIcon name="gou" size="12" color="#1D74F5" />
            </div>
            <BProperties
              :id="searchItem.value"
              :key-name="searchItem.key"
              :bg="searchItem.color"
              :font-size="12"
              :width="props.tagWidth"
              :max-width="props.tagMaxWidth"
              :xpadding="props.tagXpadding"
              :ypadding="props.tagYpadding"
              :text="searchItem.label"
            />
            <div class="flow-status">
              {{ searchItem.status === '0' ? '已禁用' : '' }}
            </div>
          </div>
          <div v-if="state.isEmpty && !selectOptions.length" class="empty flex-center h64 text14 minor-color">
            {{ props.emptyText }}
          </div>
        </div>
      </el-scrollbar>
    </template>
    <template #tagRender="{ option }">
      <div @click="state.open = true">
        <BProperties
          v-if="option?.value"
          :id="option?.value"
          :key-name="option?.key"
          :font-size="12"
          :bg="option?.color"
          :width="props.tagWidth"
          :max-width="props.tagMaxWidth"
          :xpadding="props.tagXpadding"
          :ypadding="props.tagYpadding"
          :text="option?.label"
        />
      </div>
    </template>
    <template #maxTagPlaceholder>
      <p class="ml8 mt1 text10">
        +{{ Array.isArray(props.value) && props.value.length - 1 }}
      </p>
    </template>
  </a-select>
</template>

<style lang="scss" scoped>
.ant-spin {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}
.filter-select-style {
  &.normal {
    :deep(.ant-select-selector) {
      height: 30px;
    }
    :deep(.ant-select-selection-placeholder) {
      font-size: $filter-drop-font-size;
    }
    :deep(.ant-select-arrow) {
      inset-inline-end: 2px;
    }
  }
  &.large {
    :deep(.ant-select-selector) {
      height: 40px;
    }
    :deep(.ant-select-arrow) {
      inset-inline-end: 12px;
    }
    :deep(.ant-select-selection-placeholder) {
      font-size: 12px;
    }
  }
  :deep(.ant-select-selector) {
    background-color: $tool-input-normal-bg;
    height: $tool-input-height;
    align-items: center;
    border: none;
    border-radius: $tool-input-radius;
    padding: 0 0 0 6px;
    &:hover {
      background-color: $color-input-hover;
    }
    .ant-select-selection-overflow {
      position: absolute;
      flex-wrap: nowrap;
      span {
        max-width: 100%;
      }
      input {
        cursor: none !important;
      }
    }
    .ant-select-selection-placeholder {
      line-height: 30px;
      inset-inline-start: 6px;
      inset-inline-end: 6px;
      padding-inline-end: 10px;
    }
  }
  :deep(.ant-select-dropdown) {
    width: max-content !important;
    box-shadow: $tool-drop-box-shadow;
    border: 1px solid $tool-drop-box-border;
    padding: 8px 0 8px 8px;
    .rc-virtual-list {
      .rc-virtual-list-scrollbar-thumb {
        width: $tool-drop-scorll-width !important;
        border-radius: $tool-drop-scorll-radius !important;
        background: $tool-drop-scorll-bg !important;
      }
    }
  }
  &.ant-select-focused {
    :deep(.ant-select-selector) {
      background-color: #fff !important;
      box-shadow: 0 0 0 2px #1d74f5 !important;
    }
  }
  .filter-select-tag {
    height: 26px;
    border: 1px solid #f2f3f5;
    padding: 0;
    background: #fff;
    border-radius: 16px;
    .avatar {
      background: #fff;
      flex: none;
    }
  }
  .filter-dropdown-search {
    width: calc(100% - 24px);
    min-height: 40px;
    margin: 8px auto 0;
    display: flex;
    align-items: center;
    border-bottom: 2px solid $color-border-minor;
    transition: border 0.3s;
    .search-icon {
      width: 16px;
      height: 16px;
      margin-left: 4px;
    }
    &.active {
      border-color: $input-search-focus-border-color;
    }
    :deep(.ant-input-affix-wrapper) {
      padding: 0;
    }
    :deep(.ant-input) {
      padding: 0;
      margin-left: 8px;
      caret-color: $color-primary;
      font-size: 14px;
      color: $color-icon;
    }
    .delete-icon {
      width: 14px;
      height: 14px;
      margin-left: 12px;
      border-radius: 100%;
      background: $tool-close-icon-bg;
      color: #fff;
      &:hover {
        background: $tool-close-icon-hover;
      }
    }
  }
  .list-scroll {
    min-height: 40px;
  }
  .choose-list {
    position: relative;
    .option-item {
      height: 32px;
      border-radius: 4px;
      display: flex;
      flex-direction: row;
      align-items: center;
      overflow: hidden;
      margin-right: 8px;
      padding-left: 5px;
      position: relative;
      &.active {
        background: $tool-select-bg;
      }
      &:hover {
        background: $tool-hover-bg;
      }
      .selected-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
      }
      .flow-status {
        flex-shrink: 0;
        font-size: 12px;
        color: #999;
        margin-left: 8px;
        padding-right: 40px;
      }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-right: 8px;
        span {
          color: #fff;
        }
      }
      &.active {
        p {
          color: $color-icon;
          span {
            color: $color-minor;
          }
        }
      }
    }
  }
}
.not-found-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin-top: 92px;
  color: #666;
}
</style>
