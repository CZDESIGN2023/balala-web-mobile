<script lang="ts" setup>
import { computed, nextTick, reactive, ref, toRefs } from 'vue'
import { message } from 'ant-design-vue'
import { deepCopy, getAssetsFile, getTextLength } from '@/utils'
import type { VersionModuleListItem } from '@/api/interface'
import { useProjectStore } from '@/stores/modules/project'
import { workVersionCreate, workVersionModifyName } from '@/api/project'
import { Scene } from '@/enum'

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  spaceId: '',
  workItemId: '',
  enableCreate: false,
  enableEdit: false,
  disabled: false,
  source: 'add',
  dropdownMatchSelectWidth: undefined,
})

const emits = defineEmits(['update:modelValue', 'onChangeVersion', 'onUpdateVersionName'])

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
  dropdownMatchSelectWidth?: number | undefined
}

const projectStore = useProjectStore()
const versionList = computed(() => projectStore.projectVersionList)

const addInputRef = ref()
const versionSelectRef = ref()
const nameInputRefs = ref<{ [key: string]: HTMLInputElement }>({})

const state = reactive({
  contenteditable: false,
  versionName: '',
  currentVersionItem: {} as VersionModuleListItem,
  currentVersionId: '',
  inputError: false,
})
const { contenteditable, versionName, currentVersionItem, currentVersionId, inputError }
  = toRefs(state)

const value = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:modelValue', value)
  },
})

// 点击添加版本
function handleAddVersion() {
  contenteditable.value = !contenteditable.value
  requestAnimationFrame(() => {
    addInputRef.value?.focus()
  })
}

/**
 * @description 添加版本输入框失去焦点
 * @param name 版本名称
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
  createVersionItem(name)
}

// 添加版本输入框回车
function handleAddInputEnter() {
  addInputRef.value?.blur()
}

// 创建新的版本项
async function createVersionItem(name: string) {
  const params: any = {
    spaceId: props.spaceId,
    versionName: name.trim(),
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
    await workVersionCreate(params)
    message.success('版本创建成功', 2)
    inputError.value = false
    versionName.value = ''
    contenteditable.value = false
    getVersionList()
  }
  catch (error) {}
}

/**
 * @description 点击编辑当前版本
 */
function handleEditVersion(item: VersionModuleListItem) {
  currentVersionId.value = item.id
  currentVersionItem.value = deepCopy(item)
  requestAnimationFrame(() => {
    changeVersionItemInputFocus(item.id, InputFocus.FOCUS)
  })
}

// 编辑模块输入框回车
function handleEditInputEnter(id: string) {
  changeVersionItemInputFocus(id, InputFocus.BLUR)
}

/**
 * @description 添加版本输入框失去焦点
 */
function handleEditInputBlur(item: any) {
  const length = getTextLength(currentVersionItem.value.versionName)
  const isFormatError = !(length >= 2 && length <= 14)
  // 判断是不是修改了
  if (item.versionName.trim() === currentVersionItem.value.versionName.trim()) {
    currentVersionId.value = ''
    changeVersionItemInputFocus(item.id, InputFocus.BLUR)
    return
  }
  // 判断为空或者格式错误
  if (!currentVersionItem.value.versionName || isFormatError) {
    message.error('请输入有效格式(2 ~ 14个字符)')
    inputError.value = true
    requestAnimationFrame(() => {
      changeVersionItemInputFocus(item.id, InputFocus.FOCUS)
    })
    return
  }

  // 请求编辑版本方法
  editVersionItem(currentVersionItem.value.id, currentVersionItem.value.versionName)
}

/**
 * @description 编辑版本提交
 * @param id 版本 id
 * @param name 版本名称
 */
async function editVersionItem(id: string, name: string) {
  // let params: any = {
  //   versionId: id,
  //   versionName: name,
  //   scene: Scene.WORK_ITEM_CREATE
  // }
  const params: any = {
    spaceId: props.spaceId,
    versionId: id,
    versionName: name.trim(),
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
    await workVersionModifyName(params)
    message.success('版本编辑成功', 2)
    emits('onUpdateVersionName')
  }
  finally {
    inputError.value = false
    currentVersionId.value = ''
    changeVersionItemInputFocus(id, InputFocus.BLUR)
    getVersionList()
  }
}

// 更改编辑状态下版本输入框焦点状态
function changeVersionItemInputFocus(id: string, focus: InputFocus) {
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

// 点击选择版本
function handleSelectVersion(item: VersionModuleListItem) {
  // 暂时处理无法关闭的问题
  setTimeout(() => {
    versionSelectRef.value?.focus()
    versionSelectRef.value?.blur()
  }, 100)

  // 传递值
  emits('update:modelValue', item.id)
  if (value.value === item.id)
    return
  emits('onChangeVersion', item.id)
}

// 获取版本列表
async function getVersionList() {
  await projectStore.getProjectVersionList(props.spaceId)
}

// 展开下拉菜单的回调
function dropdownVisibleChange(open: boolean) {
  if (open) {
    getVersionList()
  }
  else {
    // 暂时处理无法关闭的问题
    versionSelectRef.value?.focus()
    versionSelectRef.value?.blur()
    inputError.value = false
    contenteditable.value = false
    currentVersionId.value = ''
    versionName.value = ''
  }
}
</script>

<template>
  <div class="biz-version">
    <b-select
      ref="versionSelectRef"
      v-model:value="value"
      popup-class-name="biz-version-select"
      placeholder="请选择版本"
      style="width: 100%"
      :dropdown-match-select-width
      :options="versionList"
      :disabled="disabled"
      :field-names="{
        label: 'versionName',
        value: 'id',
      }"
      :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
      @dropdown-visible-change="dropdownVisibleChange"
    >
      <template #suffixIcon>
        <svg-icon name="select-arrow" size="16" color="#666666" />
      </template>
      <template #dropdownRender>
        <div class="biz-version-dropdown">
          <el-scrollbar max-height="192px" always class="list" :class="{ enableCreate, empty: !versionList.length }">
            <div v-for="item in versionList" :key="item.id" class="item">
              <div
                v-if="item.id !== currentVersionId"
                class="wrap flex-row-between"
                :class="{ active: item.id === value }"
              >
                <p @mousedown="handleSelectVersion(item)">
                  {{ item.versionName }}
                </p>
                <!-- <button
                  v-if="enableEdit"
                  class="edit-btn flex-row-center"
                  @click="handleEditVersion(item)"
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
                  v-model="currentVersionItem.versionName"
                  placeholder="输入版本号，回车确认"
                  @keyup.enter="handleEditInputEnter(item.id)"
                  @blur="handleEditInputBlur(item)"
                >
              </div> -->
            </div>
          </el-scrollbar>
          <!-- <div v-if="enableCreate" class="add">
            <button
              v-if="!contenteditable"
              class="btn gap4 pl8 flex-row-start"
              @click="handleAddVersion"
            >
              <img :src="getAssetsFile('add-primary.svg')" alt=""> 添加版本
            </button>
            <div v-else class="input-box flex-row-between" :class="{ 'error-border': inputError }">
              <input
                ref="addInputRef"
                v-model="versionName"
                placeholder="输入版本号，回车确认"
                @keyup.enter="handleAddInputEnter"
                @blur="handleAddInputBlur(versionName)"
              >
            </div>
          </div> -->
          <div v-if="!enableCreate && !versionList.length" class="mt4">
            <p class="h53 text14 minor-color flex-row-center">
              请联系&nbsp;<span class="icon-color">项目管理员</span>&nbsp;添加版本
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
