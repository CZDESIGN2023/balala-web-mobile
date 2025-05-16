<script lang="ts" setup>
import { computed, defineComponent, h, onMounted, reactive, ref, shallowReactive, watch } from 'vue'
import { SvgIcon } from '../SvgIcon'
import { debounce, deepCopy } from '@/utils'

interface TSProps {
  options: any[]
  value: string[]
  placeholder?: string
  isOpen?: boolean
  isIcon?: boolean
  visible?: boolean
  spaceId?: string
}

const props = withDefaults(defineProps<TSProps>(), {
  options: () => [],
  value: () => [],
  placeholder: '',
  isOpen: false,
  isIcon: false,
  spaceId: '',
})
const emits = defineEmits(['update:value', 'change', 'update:isOpen', 'filterOption', 'hideSelf', 'dropdownVisibleChange'])
const searchRef = ref()
const scrollbarRef = ref()
const state = reactive({
  searchFocus: false,
  templateList: [] as any,
})

const keyword = ref<string>('')

const selectOptions = computed(() => {
  const result = props.options
  return result
})

const selectData = computed({
  get() {
    return props.value
  },
  set(value) {
    emits('update:value', value)
    emits('change')
  },
})

function handleVisible(isShow: boolean) {
  if (isShow && keyword.value)
    keyword.value = ''
  if (isShow) {
    updateTemplateList(selectOptions.value)
    setTimeout(() => {
      searchRef.value?.focus()
    }, 200)
  }
  emits('dropdownVisibleChange', isShow)
}

function chooseItem(item: any) {
  if (selectData.value.includes(item.value)) {
    const oindex = selectData.value.findIndex(idItem => item.value === idItem)
    selectData.value.splice(oindex, 1)
  }
  else {
    selectData.value.push(item.value)
  }
  emits('update:value', selectData.value, selectOptions.value)
  emits('change')
}

function handleSearch(e: string) {
  const list = selectOptions.value.filter((item: any) => {
    return (
      item.label?.toLowerCase().includes(e.toLowerCase())
      || item.pinyin?.toLowerCase().includes(e.toLowerCase())
    )
  })
  updateTemplateList(list)
}

function updateTemplateList(list: any) {
  state.templateList = deepCopy(list)
}

const changeKeyword = debounce(async (e: any) => {
  handleSearch(e.target.value)
}, 300)

watch(selectOptions, (newVal) => {
  updateTemplateList(newVal)
})
</script>

<template>
  <a-select
    v-model:value="selectData"
    v-bind="$attrs"
    style="width: 100%"
    :placeholder="props.placeholder"
    :options="props.options"
    :show-search="false"
    :show-arrow="true"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    :dropdown-match-select-width="216"
    :dropdown-align="{ offset: [0, 8] }"
    :list-height="238"
    class="filter-select"
    @dropdown-visible-change="handleVisible"
  >
    <template #suffixIcon>
      <SvgIcon name="select-arrow" size="12" color="#333333" />
    </template>
    <template #dropdownRender>
      <div :class="{ active: state.searchFocus }" class="filter-dropdown-search h40 flex-row-start">
        <div class="w16 ml4">
          <SvgIcon name="filter-search" size="16" color="#333333" />
        </div>
        <a-input
          ref="searchRef"
          v-model:value="keyword"
          allow-clear
          :bordered="false"
          placeholder="搜索成员昵称"
          @keydown="(event: any) => event.stopPropagation()"
          @change="changeKeyword"
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
      <el-scrollbar ref="scrollbarRef" max-height="246px" always>
        <div class="person-list">
          <div v-for="(item, index) in state.templateList" :key="index" class="option-item" @click="chooseItem(item)">
            <div v-show="selectData.includes(item.value)" class="selected-icon">
              <SvgIcon name="gou" size="16" color="#1D74F5" />
            </div>
            <div v-if="item.currentUser" class="avatar w32 h32 mr8 br20">
              <img src="@/assets/icon/default-avatar.png" alt="">
            </div>
            <b-head
              v-else
              :id="item.value"
              class="mr8"
              width="28px"
              :name="item.label"
              :src="item.avatar"
            />
            <div class="maxwi136">
              <p class="nickname text14 title-color">
                <b-ellipsis :content="item.currentUser ? '当前登录用户' : item.label" width="138px" />
              </p>
              <p v-if="!item.currentUser" class="username text12 minor-color">
                <b-ellipsis
                  content-class="username minor-color"
                  width="138px"
                  fs="12"
                  :content="item.username"
                />
              </p>
            </div>
          </div>
          <p v-show="!state.templateList.length" class="minor-color not-fount-content flex-row-center">
            <template v-if="keyword">
              未找到与
              <span class="primary-color">“{{ keyword }}”</span> 相关的成员
            </template>
          </p>
        </div>
      </el-scrollbar>
    </template>
    <template #tagRender="{ closable, onClose, label, value: id, option }">
      <b-avatar-name-tag
        :user-id="id"
        :user-nickname="label"
        :src="option?.avatar || ''"
        :closable
        @close="onClose"
      />
    </template>
    <template #maxTagPlaceholder>
      <p class="ml2 mt1">
        +{{ Array.isArray(selectData) && selectData.length - 1 }}
      </p>
    </template>
  </a-select>
</template>

<style lang="scss" scoped>
.person-list {
  padding: 0 8px 8px;
  .option-item {
    height: 40px;
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-top: 8px;
    overflow: hidden;
    padding-left: 24px;
    position: relative;
    &:first-of-type {
      margin-top: 6px;
    }
    &:hover {
      background: rgba(24, 62, 118, 0.03);
    }
    .selected-icon {
      position: absolute;
      left: 4px;
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
.filter-select {
  padding: 0;
  :deep(.ant-select-dropdown) {
    box-shadow: $tool-drop-box-shadow;
    border: 1px solid $tool-drop-box-border;
    height: $tool-select-search-height;
    .rc-virtual-list {
      .rc-virtual-list-scrollbar-thumb {
        width: $tool-drop-scorll-width !important;
        border-radius: $tool-drop-scorll-radius !important;
        background: $tool-drop-scorll-bg !important;
      }
    }
  }
  &.ant-select-disabled {
    :deep(.ant-select-selector) {
      background: $tool-input-normal-bg;
    }
  }
  :deep(.ant-select-selector) {
    background-color: $tool-input-normal-bg;
    min-height: $tool-input-height;
    align-items: center;
    border: none;
    border-radius: $tool-input-radius;
    padding: 8px;
    &:hover {
      background-color: $color-input-hover;
    }
    .ant-select-selection-placeholder {
      line-height: 32px;
      inset-inline-start: 8px;
      inset-inline-end: 8px;
    }
    .ant-select-selection-overflow {
      gap: 8px 8px;
    }
  }
  :deep(.ant-select-arrow) {
    inset-inline-end: 6px;
  }
  &.ant-select-lg {
    :deep(.ant-select-selector) {
      height: 40px;
      font-size: 14px !important;
    }
    :deep(.ant-select-selection-placeholder),
    :deep(.ant-select-selection-item) {
      line-height: 40px;
    }
    :deep(.ant-select-dropdown) .ant-select-item-option {
      line-height: 32px;
    }
    :deep(.ant-select-selection-overflow-item-rest) {
      .ant-select-selection-item {
        margin: 0;
        border: none;
        background: transparent;
        padding: 0;
        line-height: 30px;
      }
    }
  }
  &.ant-select-focused {
    :deep(.ant-select-selector) {
      box-shadow: none !important;
    }
  }
  &.ant-select-open {
    :deep(.ant-select-selector) {
      background: none;
      box-shadow: 0 0 0 2px #1d74f5 !important;
    }
  }
  :deep(.ant-select-dropdown) {
    padding: 0px;
    .ant-select-item {
      background: none !important;
    }

    .ant-select-item-option-selected {
      background: none;
      font-weight: initial;
    }
  }

  .filter-dropdown-search {
    width: calc(100% - 24px);
    margin: 8px auto 0;
    border-bottom: 2px solid $color-border-minor;
    transition: border 0.3s;
    &.active {
      border-color: $input-search-focus-border-color;
    }
    .list-loading {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
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
      flex: none;
      color: #fff;
      &:hover {
        background: $tool-close-icon-hover;
      }
    }
  }

  .filter-select-option {
    padding: 0 4px;
    border-radius: 4px;
    .avatar {
      flex: none;
    }
    .username {
      margin-top: -5px;
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
      // background: #ff9800;
      flex: none;
    }
  }
  :deep(.rc-virtual-list) {
    padding: 8px 0;
  }
  :deep(.rc-virtual-list-holder-inner) {
    padding: 0 8px;
    .ant-select-item {
      height: 48px;
      padding: 0;
      // margin-bottom: 8px;
      .selected-icon {
        opacity: 0;
      }
    }
    .ant-select-item-option-selected {
      .selected-icon {
        opacity: 1;
      }
    }
    .ant-select-item-option-state {
      display: none;
    }
  }
}
.not-fount-content {
  // height: 296px;
  text-align: center;
  margin-top: 75px;
  flex-wrap: wrap;
}
</style>
