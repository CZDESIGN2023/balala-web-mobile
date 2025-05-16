<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useProjectStore } from '@/stores/modules/project'
import { areArraysEqual, compareArrays, deepCopy, getTextLength, truncateText } from '@/utils'
import type { ProjectMemberListItem } from '@/api/interface'
import { useBrowser } from '@/utils/browser'
import { useUserStore } from '@/stores/modules/user'

defineOptions({ name: 'BizPersonSelect' })

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '100%',
  spaceId: '',
  personType: '对应的',
  ownerValues: () => [],
  value: () => [],
  disabled: false,
  dropdownMatchSelectWidth: true,
  maxTagCount: 10000,
  tagNameMaxWidth: 300,
})

const emits = defineEmits(['onChange', 'update:ownerValues', 'update:placeholder', 'hide'])

interface Props {
  width?: string
  height?: string
  spaceId?: string
  personType?: string
  ownerValues?: string[]
  value?: string[]
  disabled?: boolean
  dropdownMatchSelectWidth?: boolean | number
  maxTagCount?: number
  tagNameMaxWidth?: number
}

interface Option {
  [key: string]: string
}

const projectStore = useProjectStore()
const browser = useBrowser()
const { userInfo } = useUserStore()
const searchRef = ref()
const selectDom = ref()
const lock = ref(false)

const state = reactive({
  visibleDropDown: false,
  searchText: '',
  searchFocus: false,
  templateList: [] as ProjectMemberListItem[], // 临时展示的列表,根据搜索条件过滤
})

const placeholder = computed({
  get() {
    return `请选择 ${props.personType} 负责人`
  },
  set(value) {
    emits('update:placeholder', value)
  },
})

const selectOptions = computed(() => {
  const result: Option[] = projectStore.projectMemberList.map((item) => {
    return {
      label: item.userNickname as string,
      userPinyin: item.userPinyin as string,
      userName: item.userName as string,
      value: item.userId as string,
      avatar: item.avatar || '',
    }
  })
  updateTemplateList(result)
  return result
})

const searchIdArr = computed({
  get() {
    const r = props.ownerValues
    const index = r.indexOf('_creator')
    if (index > -1)
      r.splice(index, 1, userInfo.id)

    return r
  },
  set(value) {
    console.log('执行此处', value)
    emits('update:ownerValues', value)
  },
})

// 更新 templateList
function updateTemplateList(list: Option[]) {
  state.templateList = deepCopy(list)
}

// 获取绑定标签
async function initSelecOptionList() {
  await projectStore.getProjectMemberList(props.spaceId, '')
}

onClickOutside(selectDom, () => {
  if (state.visibleDropDown) {
    selectDom.value?.focus()
    state.visibleDropDown = false
    selectDom.value?.blur()
    setTimeout(() => {
      emits('hide')
    }, 100)
  }
})

// 选中标签
function chooseItem(item: ProjectMemberListItem) {
  if (searchIdArr.value.includes(item.value as string)) {
    const oindex = searchIdArr.value.findIndex(idItem => item.value === idItem)
    searchIdArr.value.splice(oindex, 1)
  }
  else {
    searchIdArr.value.push(item.value as string)
  }
}
// 搜索过滤标签
function handleSearch(e: string) {
  state.searchText = e
  const list = selectOptions.value.filter((item) => {
    return (
      item.label?.toLowerCase().includes(e.toLowerCase())
      || item.userPinyin?.toLowerCase().includes(e.toLowerCase())
    )
  })
  updateTemplateList(list)
}
function vaildText(text: string) {
  const reg = /^[\w\u4E00-\u9FA5]+$/
  const length = getTextLength(text)
  if (!reg.test(text) || !(length >= 2 && length <= 20)) {
    return {
      isVaild: true,
      msg: '您所搜索的 成员昵称/用户名 超出有效格式，请重新输入',
    }
  }
}
// 获取焦点
function selectFocus() {
  placeholder.value = '搜索成员昵称/用户名'
}

// 失去焦点
function selectBlur() {
  if (state.visibleDropDown)
    selectDom.value?.focus()

  placeholder.value = `请选择 ${props.personType} 负责人`
  handleSearch('')
  const defaultIds = props.value
  const nowIds = searchIdArr.value
  const isEqual = areArraysEqual(defaultIds, nowIds) // 判断数组是否相等
  if (isEqual && nowIds.length > 0)
    return
  const compareData = compareArrays(defaultIds, nowIds)
  if (!lock.value)
    emits('onChange', compareData, nowIds)

  lock.value = true
  setTimeout(() => {
    lock.value = false
  }, 500)
}

// 将选择好的值传回父组件
function changeValue(selectedValue: string[]) {
  searchIdArr.value = searchIdArr.value.filter((item) => {
    return selectedValue.includes(String(item))
  })
}

function onSelectKeydown(e: KeyboardEvent) {
  e.stopPropagation()
  searchRef.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (!e.key.startsWith('Arrow'))
    e.stopPropagation()
}

function open() {
  if (props.disabled)
    return
  state.visibleDropDown = true
  initSelecOptionList()
  selectDom.value.focus()
  if (browser.name !== 'Safari' || (browser.name === 'Safari' && browser.verNum >= 16)) {
    setTimeout(() => {
      searchRef.value.focus()
    }, 300)
  }
}

defineExpose({
  open,
})
</script>

<template>
  <div class="custom-input-member-drop-down-class flex" :style="{ width, height }">
    <a-select
      v-bind="$attrs"
      ref="selectDom"
      v-model:value="searchIdArr"
      mode="multiple"
      :class="{ 'no-options': !selectOptions.length && !state.searchText }"
      :show-search="false"
      :dropdown-align="{ offset: [0, 8] }"
      popup-class-name="custom-input-member-drop-down-class"
      :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
      :options="selectOptions"
      :placeholder="placeholder"
      :disabled="disabled"
      :dropdown-match-select-width="dropdownMatchSelectWidth"
      :max-tag-count="maxTagCount"
      :open="state.visibleDropDown"
      @search="handleSearch"
      @dropdown-visible-change="(e: boolean) => e ? open() : ''"
      @focus="selectFocus"
      @blur="selectBlur"
      @change="changeValue"
      @input-key-down="onSelectKeydown"
    >
      <template #clearIcon>
        <a-tooltip title="清空" effect="dark">
          <img class="delete-icon w16" src="@/assets/svg/input-close.svg">
        </a-tooltip>
      </template>
      <!-- 自定义箭头样式 -->
      <template #suffixIcon>
        <svg-icon name="select-arrow" size="16" color="#666666" />
      </template>
      <template #maxTagPlaceholder>
        <span class="ml0 mt1 ml4">+{{ searchIdArr.length - 1 }}</span>
      </template>
      <!-- 自定义select中选中的标签样式 -->
      <template #tagRender="{ label, value: id, option, onClose }">
        <b-avatar-name-tag
          :user-id="id"
          :user-nickname="label"
          :src="option?.avatar || ''"
          :closable="state.visibleDropDown"
          @close="onClose"
          @click="open"
        />
      </template>
      <template #dropdownRender>
        <div :class="{ active: state.searchFocus }" class="search-box">
          <svg-icon class="search-icon" name="search2" size="16" color="#333333" />
          <input
            ref="searchRef"
            v-model="state.searchText"
            class="search-input"
            type="text"
            placeholder="搜索成员昵称"
            @input="handleSearch(state.searchText)"
            @keydown="onKeydown"
            @focus="state.searchFocus = true"
            @blur="state.searchFocus = false"
          >
          <img v-show="state.searchText" class="delete-icon w14 mt4" src="@/assets/svg/input-close.svg" @click="handleSearch('')">
        </div>
        <el-scrollbar max-height="294px" always>
          <div
            v-if="state.templateList.length"
            class="tag-list flex-column-start"
          >
            <div
              v-for="item in state.templateList"
              :key="item.value"
              class="option-item"
              @click="chooseItem(item)"
            >
              <b-head
                :id="item.value"
                width="32px"
                :name="item.label"
                fs="text14"
                :src="item?.avatar || ''"
              />
              <p class="flex-row-start text14 icon-color flex-one">
                {{ item.label }}
                <span class="ml4 text12 minor-color">{{ item?.userName }}</span>
              </p>
              <svg-icon v-if="searchIdArr.includes(String(item.value))" name="gou" size="16" color="#1D74F5" />
            </div>
          </div>
          <div v-if="!state.templateList.length && state.searchText" class="main-color h84 pl16 pr16 flex-row-center">
            <span v-if="!vaildText(state.searchText)?.isVaild">未找到与
              <span class="primary-color ml5 mr5">“{{ state.searchText }}”</span> 相关的成员</span>
            <span v-else class="minor-color ">您所输入的
              <span class="primary-color">“成员昵称/用户名”</span> 已超出有效格式，请重新输入
            </span>
          </div>
        </el-scrollbar>
      </template>
      <template #notFoundContent />
    </a-select>
  </div>
</template>

<style lang="scss">
@import './index.scss';
</style>
