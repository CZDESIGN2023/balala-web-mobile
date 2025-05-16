<script lang="ts" setup>
import { computed, nextTick, reactive, ref, toRefs } from 'vue'
import { message } from 'ant-design-vue'
import { deepCopy, getAssetsFile, getTextLength } from '@/utils'
import type {
  CreateProjectModule,
  EditProjectModuleName,
  ProjectModuleListItem,
} from '@/api/interface'
import { useProjectStore } from '@/stores/modules/project'
import { createProjectModule, editProjectModuleName } from '@/api/project'
import { Scene } from '@/enum'
import { useMatchKeyword } from '@/hooks/useMatchKeyword'

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  spaceId: '',
  workItemId: '',
  enableCreate: false,
  enableEdit: false,
  disabled: false,
  source: 'add',
  dropdownMatchSelectWidth: true,
})

const emits = defineEmits(['update:modelValue', 'onChangeModule', 'onUpdateModuleName'])

// 编辑情况下输入框焦点状态
enum InputFocus {
  BLUR = 'blur',
  FOCUS = 'focus',
}

/** PROPS */
interface Props {
  modelValue: string | null
  spaceId: string
  workItemId?: string
  enableCreate?: boolean
  enableEdit?: boolean
  disabled?: boolean
  source?: string
  dropdownMatchSelectWidth?: number | boolean
}

const projectStore = useProjectStore()

const addInputRef = ref()
const moduleSelectRef = ref()

const nameInputRefs = ref<{ [key: string]: HTMLInputElement }>({})
const searchRef = ref()
const state = reactive({
  contenteditable: false,
  moduleName: '',
  currentModuleItem: {} as ProjectModuleListItem,
  currentModuleId: '',
  inputError: false,
  searchKeyword: '',
  searchFocus: false,
})

const moduleList = computed(() => {
  if (!state.searchKeyword)
    return projectStore.projectModuleList

  return projectStore.projectModuleList.filter((item) => {
    return useMatchKeyword(item.workObjectName, state.searchKeyword)
  })
})

const { contenteditable, moduleName, currentModuleItem, currentModuleId, inputError }
  = toRefs(state)

const value = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})

// 点击添加模块
function handleAddModule() {
  contenteditable.value = !contenteditable.value
  requestAnimationFrame(() => {
    addInputRef.value?.focus()
  })
}

/**
 * @description 添加模块输入框失去焦点
 * @param name 模块名称
 */
function handleAddInputBlur(name: string) {
  const length = getTextLength(name)
  const isFormatError = !(length >= 2 && length <= 14)
  if (!name) {
    contenteditable.value = !contenteditable.value
    inputError.value = false
    return
  }
  if (isFormatError) {
    message.error('请输入有效格式(2 ~ 14个字符)')
    inputError.value = true
    requestAnimationFrame(() => {
      addInputRef.value?.focus()
    })
    return
  }
  createModuleItem(name)
}

// 添加模块输入框回车
function handleAddInputEnter(event: KeyboardEvent) {
  if (!event.isComposing) {
    addInputRef.value?.blur()
  }
}

// 创建新的模块项
async function createModuleItem(name: string) {
  const params: CreateProjectModule = {
    spaceId: props.spaceId,
    workObjectName: name.trim(),
    describe: '',
  }
  if (props.source === 'edit') {
    params.workItemScene = {
      workItemId: Number(props.workItemId),
    }
    params.scene = Scene.WORK_ITEM_EDIT
  }
  else {
    params.scene = Scene.WORK_ITEM_CREATE
  }

  try {
    await createProjectModule(params)
    message.success('模块创建成功', 2)
    inputError.value = false
    moduleName.value = ''
    contenteditable.value = false
    getModuleList()
  }
  catch (error) {}
}

/**
 * @description 点击编辑当前模块
 * @param item 模块信息
 */
function handleEditModule(item: ProjectModuleListItem) {
  currentModuleId.value = item.id
  currentModuleItem.value = deepCopy(item)
  changeModuleItemInputFocus(item.id, InputFocus.FOCUS)
}

// 编辑模块输入框回车
function handleEditInputEnter(id: string) {
  changeModuleItemInputFocus(id, InputFocus.BLUR)
}

/**
 * @description 添加模块输入框失去焦点
 * @param item 模块信息
 */
function handleEditInputBlur(item: ProjectModuleListItem) {
  const length = getTextLength(currentModuleItem.value.workObjectName)
  const isFormatError = !(length >= 2 && length <= 14)
  // 判断是不是修改了
  if (item.workObjectName.trim() === currentModuleItem.value.workObjectName.trim()) {
    currentModuleId.value = ''
    changeModuleItemInputFocus(item.id, InputFocus.BLUR)
    return
  }
  // 判断为空或者格式错误
  if (!currentModuleItem.value.workObjectName || isFormatError) {
    message.error('请输入有效格式(2 ~ 14个字符)')
    inputError.value = true
    requestAnimationFrame(() => {
      changeModuleItemInputFocus(item.id, InputFocus.FOCUS)
    })
    return
  }

  // 请求编辑模块方法
  editModuleItem(currentModuleItem.value)
}

/**
 * @description 编辑模块提交
 * @param moduleItem 模块信息
 */
async function editModuleItem(moduleItem: ProjectModuleListItem) {
  const params: EditProjectModuleName = {
    spaceId: props.spaceId,
    workObjectId: moduleItem.id,
    workObjectName: moduleItem.workObjectName.trim(),
  }
  if (props.source === 'edit') {
    params.workItemScene = {
      workItemId: Number(props.workItemId),
    }
    params.scene = Scene.WORK_ITEM_EDIT
  }
  else {
    params.scene = Scene.WORK_ITEM_CREATE
  }
  try {
    await editProjectModuleName(params)
    message.success('模块编辑成功', 2)
    emits('onUpdateModuleName')
  }
  finally {
    inputError.value = false
    currentModuleId.value = ''
    changeModuleItemInputFocus(moduleItem.id, InputFocus.BLUR)
    getModuleList()
  }
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

// 点击选择模块
function handleSelectModule(item: ProjectModuleListItem) {
  // 暂时处理无法关闭的问题
  setTimeout(() => {
    moduleSelectRef.value?.focus()
    moduleSelectRef.value?.blur()
  }, 100)
  // 传递值
  emits('update:modelValue', item.id)
  if (value.value === item.id)
    return
  emits('onChangeModule', item.id)
}

// 获取模块列表
async function getModuleList() {
  await projectStore.getProjectModuleList(props.spaceId)
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
  if (open) {
    getModuleList()
    // setTimeout(() => {
    //   searchRef.value?.focus()
    // }, 400)
  }
  else {
    // 暂时处理无法关闭的问题
    moduleSelectRef.value?.focus()
    moduleSelectRef.value?.blur()
    currentModuleId.value = ''
    moduleName.value = ''
    contenteditable.value = false
    inputError.value = false
    setTimeout(() => {
      state.searchKeyword = ''
    }, 200)
  }
}
</script>

<template>
  <div class="biz-module">
    <b-select
      ref="moduleSelectRef"
      v-model:value="value"
      popup-class-name="biz-module-select"
      placeholder="请选择任务所属模块"
      style="width: 100%"
      :options="moduleList"
      :disabled="disabled"
      :dropdown-match-select-width
      :field-names="{
        label: 'workObjectName',
        value: 'id',
      }"
      :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
      @dropdown-visible-change="dropdownVisibleChange"
    >
      <template #suffixIcon>
        <svg-icon name="select-arrow" size="16" color="#666666" />
      </template>
      <template #dropdownRender>
        <div class="biz-module-dropdown">
          <div class="search-box" :class="{ active: state.searchFocus }">
            <svg-icon class="search-icon" name="search" size="16" color="#333333" />
            <input
              ref="searchRef"
              v-model="state.searchKeyword"
              class="search-input"
              type="text"
              placeholder="搜索模块名称"
              @focus="state.searchFocus = true"
              @blur="state.searchFocus = false"
            >
          </div>
          <el-scrollbar max-height="192px" always class="list" :class="{ enableCreate, empty: !moduleList.length }">
            <div v-for="item in moduleList" :key="item.id" class="item">
              <div
                v-if="item.id !== currentModuleId"
                class="wrap flex-row-between"
                :class="{ active: item.id === value }"
              >
                <p @mousedown="handleSelectModule(item)" v-html="highlightSearch(item.workObjectName)" />
                <!-- <button
                  v-if="enableEdit"
                  class="edit-btn flex-row-center"
                  @click="handleEditModule(item)"
                >
                  <svg-icon name="select-edit" size="10" color="#333333" />
                </button> -->
              </div>
              <!-- <div
                v-else
                class="input-box flex-row-between"
                :class="{ 'error-border': inputError }"
              >
                <input
                  :ref="
                    (el: any) => {
                      if (el) nameInputRefs[item.id] = el
                    }
                  "
                  v-model="currentModuleItem.workObjectName"
                  placeholder="输入模块名，回车确认"
                  @keyup.enter="handleEditInputEnter(item.id)"
                  @blur="handleEditInputBlur(item)"
                >
              </div> -->
            </div>
          </el-scrollbar>
          <!-- <div v-if="enableCreate" class="add mt4">
            <button
              v-if="!contenteditable"
              class="btn gap4 pl8 flex-row-start"
              @click="handleAddModule"
            >
              <img :src="getAssetsFile('add-primary.svg')" alt=""> 添加模块
            </button>
            <div v-else class="input-box flex-row-between" :class="{ 'error-border': inputError }">
              <input
                ref="addInputRef"
                v-model="moduleName"
                placeholder="输入模块名，回车确认"
                @keyup.enter="handleAddInputEnter"
                @blur="handleAddInputBlur(moduleName)"
              >
            </div>
          </div> -->
          <div v-if="!enableCreate && !moduleList.length" class="mt4">
            <p class="h53 text14 minor-color flex-row-center">
              请联系&nbsp;<span class="icon-color">项目管理员</span>&nbsp;添加模块
            </p>
          </div>
        </div>
      </template>
    </b-select>
  </div>
</template>

<style lang="scss">
@import './index.scss';
</style>
