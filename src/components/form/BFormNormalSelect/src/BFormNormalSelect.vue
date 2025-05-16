<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import { Loading3QuartersOutlined } from '@ant-design/icons-vue'
import { onClickOutside } from '@vueuse/core'
import { deepCopy } from '@/utils'

interface optionItem {
  label: string
  value: string
  pinying: string
}

interface Props {
  value: string[]
  options?: optionItem[]
  queryOptions?: Function | (() => Promise<any>)
  isSingle?: boolean // 是否单选
  size?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  options: () => [],
  queryOptions: () => [],
  isSingle: false,
  size: 'normal',
})

const emits = defineEmits(['update:value', 'change'])

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
  open: false,
  selectOptions: [] as optionItem[], // 下拉列表数据
  keyword: '',
  loading: false, // 下拉列表加载状态
  isEmpty: false,
})

const selectOptions = computed(() => {
  return props.options.length > state.selectOptions.length ? props.options : state.selectOptions
})

// 搜索列表
const searchList = computed(() => {
  const list = state.selectOptions.filter((item: any) => {
    return (
      item.name?.toLowerCase().includes(state.keyword.toLowerCase())
      || item.pinyin?.toLowerCase().includes(state.keyword.toLowerCase())
    )
  })
  return list
})

onClickOutside(selectRef, () => {
  if (state.open) {
    state.open = false
  }
})

// 获取下拉选项列表
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
    // state.open = false
    state.isEmpty = false
  }
}

// 更新选择值
function updateSelectedValue(val: string[]) {
  emits('update:value', val)
  emits('change', val)
}

// 选中下拉选择
function chooseItem(id: string) {
  let copySelectedValue = deepCopy(props.value)
  // 区分单选 多选
  if (!props.isSingle) {
    const index = copySelectedValue.indexOf(id)
    if (index > -1) {
      copySelectedValue.splice(index, 1)
    }
    else {
      copySelectedValue.push(id)
    }
  }
  else {
    copySelectedValue = copySelectedValue[0] === id ? [] : [id]
    state.open = false
    if (selectRef.value && props.isSingle)
      selectRef.value.blur()
  }

  updateSelectedValue(copySelectedValue)
}

function onClose(id: string) {
  const copySelectedValue = deepCopy(props.value)
  const index = copySelectedValue.indexOf(id)
  copySelectedValue.splice(index, 1)
  updateSelectedValue(copySelectedValue)
}
</script>

<template>
  <a-select
    ref="selectRef"
    style="width: 100%"
    :value="props.value"
    mode="multiple"
    :open="state.open"
    :class="props.size"
    class="filter-select-style"
    :show-arrow="true"
    :options="selectOptions"
    :show-search="false"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    :dropdown-align="{ offset: [0, 8] }"
    @dropdown-visible-change="handleSelectVisible"
  >
    <template #suffixIcon>
      <SvgIcon name="select-arrow" size="12" color="#333333" />
    </template>
    <template #dropdownRender>
      <a-spin :spinning="state.loading" :indicator="indicator" />
      <el-scrollbar ref="scrollbarRef" class="list-scroll" max-height="224px" always>
        <div v-if="!state.loading" class="choose-list">
          <div v-for="(searchItem, index) in searchList" :key="index" class="option-item" @click="chooseItem(searchItem.value)">
            <div v-show="props.value.includes(searchItem.value)" class="selected-icon">
              <SvgIcon name="gou" size="12" color="#1D74F5" />
            </div>
            {{ searchItem.label }}
          </div>
        </div>
        <b-empty
          v-if="state.isEmpty && !selectOptions.length"
          img-name="no-data-search.svg"
          :is-svg="false"
          pt="61px"
          pb="36px"
          img-height="30px"
          img-width="30px"
          icon-mb="2px"
          desc="无内容"
          desc-color="#999"
        />
      </el-scrollbar>
    </template>
    <template #tagRender="{ option }">
      <a-tag v-if="option && option.value" class="filter-select-tag flex-row-start" @click="state.open = true" @close="onClose(option?.value)">
        <p class="text12 line11 title-color ss-line-1 maxwi45 mr1">
          {{ option?.label }}
        </p>
        <template #closeIcon>
          <SvgIcon
            name="filter-close"
            class="close-icon transition pointer mt5 mr8"
            size="11"
            color="#999"
          />
        </template>
      </a-tag>
    </template>
    <template #maxTagPlaceholder>
      <p class="mt1 ml6 text10">
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
      input {
        cursor: none !important;
      }
    }
    .ant-select-selection-placeholder {
      line-height: 32px;
      inset-inline-start: 6px;
      inset-inline-end: 6px;
      font-size: $filter-drop-font-size;
      padding-inline-end: 10px;
    }
  }
  :deep(.ant-select-dropdown) {
    box-shadow: $tool-drop-box-shadow;
    border: 1px solid $tool-drop-box-border;
    min-width: $filter-drop-down-min-width !important;
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
  &.ant-select-disabled.ant-select-multiple.ant-select {
    :deep(.ant-select-selector) {
      background-color: $tool-input-normal-bg;
    }
  }
  .filter-select-tag {
    max-width: 50px;
    margin-inline-end: 0;
    height: 22px;
    border: 1px solid #f2f3f5;
    padding: 1px 8px 1px 8px;
    background: #fff;
    border-radius: 16px;
  }
  .filter-dropdown-search {
    width: calc(100% - 24px);
    min-height: 32px;
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
    min-height: 32px;
  }
  .choose-list {
    position: relative;
    .option-item {
      height: 32px;
      line-height: 32px;
      border-radius: 4px;
      padding-left: 12px;
      padding-right: 25px;
      position: relative;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      margin-right: 8px;
      font-size: $filter-drop-font-size;
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
