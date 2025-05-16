<script lang="ts" setup>
import { type Ref, computed, ref, watchEffect } from 'vue'
import { message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { useProjectStore } from '@/stores/modules/project'
import { areArraysEqual, compareArrays, containsField, debounce, deepCopy, getTextLength, throttle } from '@/utils'
import { createTag } from '@/api/project'
import { useMatchKeyword } from '@/hooks/useMatchKeyword'

defineOptions({ name: 'TagSelect' })

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '100%',
  spaceId: '',
  tagIds: () => [],
  disabled: false,
  enableCreate: false,
  enableEdit: false,
})

const emits = defineEmits(['onChange', 'update:tagIds'])

interface TypeSelectItem {
  label: string
  value: string
  // tagRelationNum: string
}

interface Props {
  width?: string
  height?: string
  spaceId?: string
  tagIds?: string[]
  disabled?: boolean
  enableCreate?: boolean
  enableEdit?: boolean
}
/** STORE */
const projectStore = useProjectStore()

const selectDom = ref()
const timer = ref()
const visibleDropDown = ref(false)
const searchText = ref<string>('')
const templateList = ref<TypeSelectItem[]>([]) // 临时展示的列表,根据搜索条件过滤
const placeholder = ref<string>('请选择标签')
const rawTagIds = ref() as Ref<string[]>
const searchIdArr = computed({
  get() {
    return props.tagIds
  },
  set(value) {
    emits('update:tagIds', value)
  },
})
// 选项数据
const selectOptions = computed(() => {
  const result = projectStore.projectTagList.map((item) => {
    return {
      label: item.tagName,
      value: item.id,
    }
  })
  return result
})

watchEffect(() => {
  templateList.value = deepCopy(selectOptions.value)
})

// 点击标签显示下拉框
function handleTagClickShowSelect() {
  visibleDropDown.value = true
}

// 监听下拉框是否显示
function dropdownVisibleChange(visible: boolean) {
  if (visible) {
    initSelecOptionList()
    visibleDropDown.value = true
  }
}

// 获取绑定标签
async function initSelecOptionList() {
  await projectStore.getProjectTagList(props.spaceId, [], true)
}
// 选中标签
function chooseItem(item: TypeSelectItem) {
  handleSearch('') // 选中标签, 清空状态
  if (searchIdArr.value.includes(item.value as string)) {
    const oindex = searchIdArr.value.findIndex(idItem => item.value === idItem)
    searchIdArr.value.splice(oindex, 1)
  }
  else {
    searchIdArr.value.push(item.value as string)
  }
  setTimeout(() => {
    selectDom.value?.focus()
  }, 0)
}
// 搜索过滤标签
function handleSearch(e: string) {
  searchText.value = e
  const list = selectOptions.value.filter((item) => {
    return useMatchKeyword(item.label, e)
  })
  templateList.value = deepCopy(list)
}
function vaildText(text: string) {
  const length = getTextLength(text)
  if (!(length >= 2 && length <= 12)) {
    return {
      isVaild: true,
      msg: '您所输入的 “标签名称”已超出有效格式，请重新输入',
    }
  }
}
// 回车
function handleKeydown(e: KeyboardEvent) {
  // clearTimeout(timer.value)
  // timer.value = setTimeout(() => {
  //   if (e.code === 'Enter' && searchText.value && searchText.value.length && props.enableCreate) {
  //     const length = getTextLength(searchText.value)
  //     if (!(length >= 2 && length <= 12)) {
  //       message.error('请输入有效格式(2 ~ 12个字符)', 2)
  //       return
  //     }
  //     if (searchText.value.includes('\''))
  //       return

  //     const isTo = containsField(selectOptions.value, searchText.value, 'tagName')
  //     if (isTo)
  //       cheateTag(searchText.value)
  //   }
  // }, 300)
}
// async function cheateTag(tagName: string) {
//   try {
//     const { data } = await createTag(props.spaceId, tagName)
//     searchText.value = ''
//     message.success('标签创建成功', 2)
//     await initSelecOptionList()
//     searchIdArr.value.push(data.id)
//   }
//   catch (error) {}
// }
// 获取焦点
function selectFocus() {
  rawTagIds.value = deepCopy(searchIdArr.value)
  if (!templateList.value.length)
    placeholder.value = '请输入内容'
  else
    placeholder.value = '请选择标签'
}
// 失去焦点
function selectBlur() {
  handleSearch('') // 选中标签, 清空状态
  visibleDropDown.value = false
  placeholder.value = '请选择标签'
  const defaultIds = rawTagIds.value
  const nowIds = searchIdArr.value
  const isEqual = areArraysEqual(defaultIds, nowIds) // 判断数组是否相等
  if (isEqual)
    return
  const compareData = compareArrays(defaultIds, nowIds)
  emits('onChange', compareData)
}

// 将选择好的值传回父组件
function changeValue(selectedValue: string[]) {
  searchIdArr.value = searchIdArr.value.filter((item) => {
    return selectedValue.includes(String(item))
  })
}

function changeInput(e: any) {
  searchText.value = e.target.value
  if (e.isComposing)
    return
  handleSearch(e.target.value)
}
</script>

<template>
  <div class="b-custom-input-tag-class flex" :style="{ width, height }">
    <b-select
      v-bind="$attrs"
      ref="selectDom"
      v-model:value="searchIdArr"
      mode="multiple"
      allow-clear
      auto-clear-search-value
      :class="{ 'no-options': !selectOptions.length && !searchText }"
      :search-value="searchText"
      :dropdown-align="{ offset: [0, 8] }"
      popup-class-name="custom-input-tag-drop-down-class"
      :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
      :options="selectOptions"
      :placeholder="placeholder"
      :disabled="disabled"
      option-label-prop="label"
      :open="visibleDropDown"
      @search="handleSearch"
      @input-key-down="handleKeydown"
      @dropdown-visible-change="dropdownVisibleChange"
      @focus="selectFocus"
      @blur="selectBlur"
      @change="changeValue"
      @input="changeInput"
    >
      <!-- 自定义箭头样式 -->
      <template #suffixIcon>
        <svg-icon name="select-arrow" size="16" color="#666666" />
      </template>
      <!-- 自定义select中选中的标签样式 -->
      <template #tagRender="{ label, closable, onClose }">
        <a-tag
          class="option-item tag-option-item"
          :closable="closable"
          style="margin-right: 0"
          @click="handleTagClickShowSelect"
          @close="onClose"
        >
          <p class="flex-row-center text14 title-color">
            {{ label }}
            <!-- <span v-if="tagRelationNum > 0" class="num text12 minor-color ml4">{{
              Number(tagRelationNum) > 99 ? '99+' : tagRelationNum
            }}</span> -->
          </p>
          <template #closeIcon>
            <svg-icon
              name="close"
              class="close-icon transition pointer mt5"
              size="20"
              color="#666666"
            />
          </template>
        </a-tag>
      </template>
      <template #dropdownRender>
        <el-scrollbar max-height="166px" always>
          <div
            v-if="templateList.length"
            class="tag-list flex-row-start flex-wrap gap8 pt10 pb10 pl16 pr8"
          >
            <div
              v-for="item in templateList"
              :key="item.value"
              class="option-item mb2 mt2"
              :class="{ active: searchIdArr.includes(String(item.value)) }"
              @click="chooseItem(item)"
            >
              <p class="flex-row-center text14 title-color">
                {{ item.label }}
                <!-- <span v-if="Number(item.tagRelationNum) > 0" class="num text12 minor-color ml4">{{
                  Number(item.tagRelationNum) > 99 ? '99+' : item.tagRelationNum
                }}</span> -->
              </p>
            </div>
          </div>
          <template v-if="!templateList.length && searchText">
            <p class="main-color h70 flex-row-center pl12 pr12">
              <b style="font-weight: normal; text-align: center;">
                <span>
                  <span v-if="enableCreate">
                    未找到与<span class="primary-color" style="word-break: break-all;">“{{ searchText }}”</span>相关的标签</span>
                  <span v-else> 权限不足，无法新建标签 </span>
                </span>
              </b>
            </p>
          </template>
        </el-scrollbar>
      </template>
      <template #notFoundContent />
    </b-select>
  </div>
</template>

<style lang="scss">
/* 自定义下拉框的一写样式 */
.custom-input-tag-drop-down-class {
  .option-item {
    height: 28px;
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 12px;
    background: #ffffff;
    border: 1px solid $color-border-main;
    cursor: pointer;
    &:hover {
      background-color: #f6f6f6;
      border-color: transparent;
    }
    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e2e3e5;
    }
    &.active {
      background: $color-sub;
      border: 1px solid $color-sub;
      p {
        color: $color-primary;
        span {
          color: $color-primary;
        }
      }
    }
  }
  .ant-select-item-option-selected {
    background-color: $color-bg-hover;
  }
  .ant-select-item {
    display: flex;
    white-space: normal;
  }
  span.ant-select-item-option-state {
    display: none;
  }
}
.b-custom-input-tag-class {
  position: relative;
  .ant-tag a:hover {
    color: red; /* 设置悬停时的文本颜色为红色 */
    text-decoration: underline; /* 设置悬停时添加下划线 */
  }
  .no-options {
    .ant-select-dropdown {
      display: none !important;
    }
  }
  .ant-tag-close-icon {
    width: 0px;
    margin-inline-start: 0;
    opacity: 0;
    pointer-events: none;
  }
  .ant-select-focused .ant-tag-close-icon {
    width: 20px;

    margin-inline-start: 3px;
    opacity: 1;
    pointer-events: auto;
  }
  .option-item {
    height: 28px;
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 8px;
    background: #ffffff;
    border: 1px solid $color-border-main;
    cursor: pointer;
    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e2e3e5;
    }
    &.active {
      background: $color-sub;
      border: 1px solid $color-sub;
      p {
        color: $color-primary;
        span {
          color: $color-primary;
        }
      }
    }
  }
  .tag-option-item {
    .close-icon {
      &:hover {
        transform: scale(1.2);
      }
    }
  }
  .ant-select {
    .ant-select-selector {
      width: 100%;
      min-height: 36px;
      background: $color-input;
      border: 0;
      border-radius: 6px;
      &:hover {
        background: $color-input-hover;
      }
      .ant-select-selection-search {
        .ant-select-selection-search-input {
          font-size: 14px;
          height: 100%;
          caret-color: $color-primary;
        }
      }
      .ant-select-selection-placeholder {
        color: $color-minor;
        font-size: 14px;
      }
      .ant-select-selection-overflow {
        gap: 4px 8px;
        padding: 4px 2px;
        .ant-select-selection-overflow-item-suffix {
          flex: 1;
        }
        .ant-select-selection-search {
          margin-inline-start: 0;
          width: 100% !important;
        }
      }
    }
    .ant-select-clear {
      width: 16px;
      height: 16px;
      margin-top: -8px;
      background: none;
      top: 20px;
    }
    &.ant-select-focused {
      .ant-select-selector {
        background: #fff;
        border: none !important;
        box-sizing: border-box;
        box-shadow: 0 0 0 1.6px $color-primary inset !important;
      }
    }
    .ant-select-dropdown {
      padding: 4px 0px;
      border: 1px solid $color-border-minor;
      box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
      .rc-virtual-list-holder-inner {
        flex-direction: row !important;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 0 7px 4px;
        .ant-select-item {
          padding: 0;
          cursor: pointer;
        }
        .ant-select-item-option-active {
          background-color: transparent;
        }
        .ant-select-item-option-state {
          opacity: 0;
          width: 0;
        }
        .ant-select-item-option-selected {
          background-color: transparent;
          .ant-select-item-option-content {
            .option-item {
              background: #e3f2ff;
              border: 1px solid #e3f2ff;
              font-weight: initial;
              p {
                color: #333;
                span {
                  color: #666;
                }
              }
            }
          }
        }
      }
    }
  }

  &.detail {
    .ant-select {
      .ant-select-selector {
        background: none;
        &:hover {
          background: $color-input-hover;
        }
      }
      &.ant-select-focused {
        .ant-select-selector {
          &:hover {
            background: none;
          }
        }
      }
    }
  }
}
</style>
