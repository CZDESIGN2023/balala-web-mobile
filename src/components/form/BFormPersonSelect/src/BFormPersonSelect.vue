<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { Loading3QuartersOutlined } from '@ant-design/icons-vue'
import { cloneDeep } from 'lodash'
import { onClickOutside } from '@vueuse/core'
import { deepCopy } from '@/utils'
import { useMatchKeyword } from '@/hooks/useMatchKeyword'
import DirectorTooltip from '@/components/BTableElPopover/src/directorTooltip.vue'
import type { User } from '@/views/project/types/table'

const props = withDefaults(defineProps<Props>(), {
  queryOptions: () => [],
  value: () => [],
  displayRange: () => [],
  single: false,
  disabled: false,
  closable: false,
  clearNotRestore: false, // 清空数据后 不 恢复原数据
  contentDirection: 'row',
  scrollMaxHeight: 242,
})

const emit = defineEmits(['update:value', 'change', 'hide', 'open'])

interface Props {
  queryOptions: Function | (() => Promise<any>)
  value: string[]
  displayRange?: string[]
  single?: boolean // 是否单选
  disabled?: boolean
  closable?: boolean
  clearNotRestore?: boolean
  contentDirection?: string
  scrollMaxHeight?: number | string
}

interface personSelectItem {
  value: string
  label: string
  avatar: string
  description: string
}

const selectRef = ref()
const searchRef = ref()
const scrollbarRef = ref()
const indicator = h(Loading3QuartersOutlined, {
  style: {
    fontSize: '24px',
  },
  spin: true,
})
let rawValue: any[]
const state = reactive({
  selectOptions: [] as personSelectItem[], // 下拉列表数据
  keyword: '',
  loading: false, // 下拉列表加载状态
  searchFocus: false,
  open: false,
})

onClickOutside(selectRef, () => {
  if (state.open) {
    selectRef.value?.focus()
    state.open = false
    selectRef.value?.blur()
  }
})

const displayList = computed(() => {
  if (props.displayRange.length > 0)
    return state.selectOptions.filter(item => props.displayRange.includes(item.value))
  else
    return state.selectOptions
})

// 搜索列表
const searchList = computed(() => {
  if (state.keyword) {
    return displayList.value.filter((item: any) => {
      return useMatchKeyword(item.label, state.keyword)
    })
  }
  else {
    return displayList.value
  }
})

watch(() => state.open, (n) => {
  if (n) {
    getSelectOptions()
    setTimeout(() => {
      rawValue = cloneDeep(props.value)
      // searchRef.value?.focus()
    }, 200)
    emit('open')
  }
  else {
    const add: string[] = props.value.filter((item: any) => !rawValue.find((ele: any) => ele.value === item.value))
    const remove: string[] = rawValue.filter((item: any) => !props.value.find((ele: any) => ele.value === item.value))
    if ((add.length > 0 || remove.length > 0) && props.value.length > 0)
      emit('change', { add, remove }, props.value)
    else if (!props.clearNotRestore)
      emit('update:value', rawValue)
    emit('hide')
  }
})

// 获取下拉选项列表
async function getSelectOptions() {
  // if (state.selectOptions.length)
  //   return

  state.loading = true
  try {
    state.selectOptions = await props.queryOptions()
  }
  catch (error) {
    console.error('Error occurred while fetching select options:', error)
  }
  finally {
    state.loading = false
  }
}

// 更新选择值
function updateSelectedValue(val: string[]) {
  emit('update:value', val)
}

function findItem(value: string) {
  let index
  const item: any = props.value.find((ele: any, i) => {
    const r = typeof ele === 'string' ? ele === value : ele.value === value
    if (r)
      index = i
    return r
  })
  return { item, index }
}

/**
 * 选中下拉选择
 * 选择逻辑：单选：覆盖；多选：已存在？移除：增加
 */
function chooseItem(item: any) {
  const newItem = { label: item.label, value: item.value, avatar: item.avatar }
  let newVal = []
  if (!props.single) {
    const { index } = findItem(newItem.value)
    if (index || index === 0) {
      newVal = cloneDeep(props.value)
      newVal.splice(index!, 1)
      console.log('移除一项', props.value, newVal, index)
    }
    else {
      newVal = [...props.value, newItem]
    }
  }
  else {
    newVal = props.value[0] === item ? [] : [item]
    if (selectRef.value && props.single)
      selectRef.value.blur()
  }
  updateSelectedValue(newVal)
}

function onClose(id: string) {
  const { index, item } = findItem(id)
  if (item) {
    const copySelectedValue = deepCopy(props.value)
    copySelectedValue.splice(index, 1)
    updateSelectedValue(copySelectedValue)
  }
}

function dropVisibleChange(open: boolean) {
  if (open) {
    state.open = true
  }
  else {
    setTimeout(() => {
      state.keyword = ''
    }, 10)
  }
}

function open() {
  state.open = true
}

defineExpose({ open })
</script>

<template>
  <b-select
    ref="selectRef"
    v-bind="$attrs"
    :value="props.value"
    :options="state.selectOptions"
    :show-search="false"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    :dropdown-align="{ offset: [0, 8] }"
    :open="state.open"
    :disabled
    class="b-form-person-select"
    mode="multiple"
    label-in-value
    @dropdown-visible-change="dropVisibleChange"
    @update:value="$emit('update:value', $event)"
  >
    <template #suffixIcon>
      <SvgIcon name="select-arrow" size="12" color="#333333" />
    </template>
    <template #dropdownRender>
      <div :class="{ active: state.searchFocus }" class="filter-dropdown-search">
        <div class="search-icon">
          <SvgIcon name="filter-search" size="16" color="#333333" />
        </div>
        <a-input
          ref="searchRef"
          v-model:value="state.keyword"
          allow-clear
          :bordered="false"
          placeholder="搜索成员昵称"
          @keydown="(event: any) => event.stopPropagation()"
          @focus="state.searchFocus = true"
          @blur="state.searchFocus = false"
        >
          <template #clearIcon>
            <a-tooltip title="清空" effect="dark">
              <div class="delete-icon flex-row-center pointer">
                <SvgIcon name="close" size="16" />
              </div>
            </a-tooltip>
          </template>
        </a-input>
      </div>
      <el-scrollbar ref="scrollbarRef" class="list-scroll" :max-height="props.scrollMaxHeight" always>
        <div v-if="state.loading" class=" flex justify-items-center py-16">
          <a-spin :indicator="indicator" />
        </div>
        <div v-else class="choose-list">
          <div v-for="(searchItem, index) in searchList" :key="index" class="option-item" @click="chooseItem(searchItem)">
            <b-head
              :id="searchItem.value"
              class="mr8"
              width="32px"
              :name="searchItem.label"
              :src="searchItem.avatar"
            />
            <div :class="{ [`userinfo-${props.contentDirection}`]: true }" class="userinfo min-h-full whitespace-nowrap">
              <p class="nickname text14 title-color max-w-full">
                {{ searchItem.label }}
              </p>
              <div class="h4 w4" />
              <p class="username text12 minor-color max-w-full">
                {{ searchItem.description }}
              </p>
            </div>
            <div v-show="findItem(searchItem.value).item" class="selected-icon">
              <SvgIcon name="gou" size="16" color="#1D74F5" />
            </div>
          </div>
          <p v-show="!searchList.length && state.keyword" class="not-found-content">
            未找到与<span class="primary-color">“{{ state.keyword }}”</span> 相关的成员
          </p>
        </div>
      </el-scrollbar>
    </template>
    <template #tagRender="{ label, value: val }">
      <b-avatar-name-tag
        v-if="label"
        :user-id="val"
        :user-nickname="label"
        :closable="(state.open || closable) ? true : false"
        :src="findItem(val).item?.avatar"
        :show-all="label === '任务创建人'"
        class="ml4 mr4"
        @click="!disabled && (state.open = true)"
        @close="onClose(val)"
      />
    </template>
    <template #maxTagPlaceholder>
      <DirectorTooltip :data="props.value.map((item:any) => ({ userId: item.value, userNickname: item.label, avatar: item.avatar })) as User[]">
        <p class="text12" style="line-height: 6.66667vw; " v-text="`+${Array.isArray(props.value) && props.value.length - 1}`" />
      </DirectorTooltip>
    </template>
  </b-select>
</template>

<style lang="scss">
.b-form-person-select {
  &.ant-select-multiple {
    font-size: 14px;
    .ant-select-selection-placeholder {
      inset-inline-start: 8px;
      inset-inline-end: 8px;
    }
    .ant-select-selector {
      &:after {
        line-height: 30px;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.b-form-person-select {
  min-width: 122px;

  // 尺寸适配
  &.ant-select-lg {
    :deep(.ant-select-selection-overflow) {
      // padding-top: 7px;
    }
    :deep(.ant-select-selection-overflow-item) {
      margin-bottom: 7px;
    }
    :deep(.ant-select-selector) {
      min-height: 40px;
    }
    &.ant-select-disabled.ant-select-multiple.ant-select:not(
        .ant-select-customize-input
      )
      :deep(.ant-select-selector),
    :deep(.ant-select-selector) {
      padding: 0 11px;
    }
  }

  :deep(.ant-select-dropdown) {
    padding: 8px 0;
  }

  &.ant-select-multiple.ant-select-lg {
    :deep(.ant-select-selector) {
      padding: 0 11px;
    }
  }
  :deep(.director-box) {
    margin: 0 !important;
  }
  :deep(.ant-select-selection-search-input) {
    height: 26px;
  }
  :deep(.ant-select-selection-overflow) {
    gap: 0 8px;
    padding-top: 4px;
  }
  :deep(.ant-select-selection-overflow-item) {
    margin-bottom: 4px;
  }
  :deep(.ant-select-selection-search) {
    height: 0;
    width: 0;
    input {
      height: 0;
    }
  }
  :deep(.ant-select-selection-overflow-item-rest) {
    margin-bottom: 0 !important;
    align-self: auto;
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
    min-height: 40px;
    margin: 0 12px;
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
      border-radius: 100%;
      background: $tool-close-icon-bg;
      color: #fff;
      &:hover {
        background: $tool-close-icon-hover;
      }
    }
  }
  .choose-list {
    padding: 0 8px;
    position: relative;
    .option-item {
      height: 44px;
      border-radius: 4px;
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-top: 4px;
      overflow: hidden;
      position: relative;
      padding: 0 8px;
      &:first-of-type {
        margin-top: 6px;
      }
      &:hover {
        background: rgba(24, 62, 118, 0.03);
      }
      .userinfo {
        &.userinfo-column {
          flex-direction: column;
          justify-content: center;
        }
        &.userinfo-row {
          flex-direction: row;
          align-items: center;
        }
        display: flex;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        .nickname,
        .username {
          line-height: 1;
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
  margin: 40px 0;
  color: #666;
}
</style>
