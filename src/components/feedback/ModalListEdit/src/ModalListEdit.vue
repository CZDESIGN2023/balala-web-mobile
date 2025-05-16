<script setup lang="ts">
import { type Ref, computed, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import draggable from 'vuedraggable'
import { getAssetsFile, throttle } from '@/utils'
import { useDrag } from '@/hooks/useDrag'
import SvgIcon from '@/components/SvgIcon/src/index.vue'
import { Msgbox } from '@/utils/msgbox'
import { useMatchKeyword } from '@/hooks/useMatchKeyword'

const props = defineProps({
  modelValue: { type: Array, default: () => [] as string[] },
  title: { type: String, default: '' },
  name: { type: String, default: '' },
  addText: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  onInteractionRemove: { type: Function, default: null },
  deleteMsg: { type: String, default: '' },
  repeatMsg: { type: String, default: '' },
  onRemove: { type: Function, default: null },
  onChange: { type: Function, default: null },
  onAdd: { type: Function, default: null },
  validate: { type: Function, default: undefined },
  otherOptions: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'dragChange'])

interface State {
  editIndex: number | null
  editLabel: string
  visible: boolean
  errMsg: string
}

const data = ref([]) as Ref<any[]>
watch(() => props.modelValue, (n: any[]) => {
  data.value = n.sort((a, b) => Number.parseInt(b.ranking) - Number.parseInt(a.ranking))
}, { immediate: true })

const state = reactive<State>({
  visible: false,
  editIndex: null,
  editLabel: '',
  errMsg: '',
})

const inputRefs = ref()
const searchRef = ref()
const searchKey = ref('')
const grabbing = ref(false)
const tooltipRef = ref()
const tooltipMsg = ref('')
const adding = ref(false) // 正在添加新项目
let committing = false
const modalTitleRef = ref()
const { transformStyle } = useDrag(modalTitleRef)

const afterData = computed<any[]>(() => {
  if (!searchKey.value)
    return data.value

  return data.value.filter((item: any) => {
    return useMatchKeyword(item.label, searchKey.value)
  })
})

const optionCount = computed(() => {
  if (props.otherOptions)
    return afterData.value.length + 1
  return afterData.value.length
})

watch(() => state.visible, (n: boolean) => {
  if (n)
    requestAnimationFrame(() => searchRef.value?.focus())
})

function onAdd() {
  if (!validate() || state.editIndex || state.editIndex === 0 || adding.value)
    return
  emit('update:modelValue', [{ label: '', value: Math.random() }, ...data.value])
  state.editIndex = 0
  state.editLabel = ''
  inputFocus()
  adding.value = true
}

function inputAddKeyEnter() {
  requestAnimationFrame(() => {
    inputRefs.value.blur()
  })
}

async function onSave() {
  const isPass = validate()
  console.log(state.editIndex)
  if (!isPass || state.editIndex === null) {
    if (state.errMsg)
      message.error(state.errMsg, 2)
  }
  else {
    const tempLabel = data.value[state.editIndex!].label
    try {
      if (committing)
        return
      committing = true
      data.value[state.editIndex!].label = state.editLabel
      if (adding.value && props.onAdd)
        await props.onAdd(data.value[state.editIndex!])
      else if (props.onChange)
        await props.onChange(data.value[state.editIndex!])
      emit('update:modelValue', data.value)
    }
    catch (error) {
      data.value[state.editIndex!].label = tempLabel
      if (adding.value) {
        data.value.splice(0, 1)
      }
    }
    finally {
      adding.value = false
      committing = false
      state.editIndex = null
      state.editLabel = ''
    }
  }
}

const onRemove = throttle(async (index: number) => {
  if (!validate())
    return

  if (props.onInteractionRemove) {
    const res = await props.onInteractionRemove(data.value[index])
    if (res) {
      data.value.splice(index, 1)
      emit('update:modelValue', data.value)
      if (state.editIndex === index) {
        state.editIndex = null
        state.editLabel = ''
      }
    }
  }
  else {
    Msgbox.error.m({ title: props.deleteMsg || `是否删除${props.name}【${data.value[index].name}】`, okText: '删除' }).then(async () => {
      if (props.onRemove)
        await props.onRemove(data.value[index])
      data.value.splice(index, 1)
      emit('update:modelValue', data.value)
      if (state.editIndex === index) {
        state.editIndex = null
        state.editLabel = ''
      }
    })
  }
}, 1000)

function validate() {
  if (state.editIndex === null)
    return true
  state.errMsg = ''

  state.editLabel = state.editLabel.replace(/\s+/g, '')
  // 是否重复
  const isDuplicate = data.value.find((ele: any, index) => ((ele.label === state.editLabel) && (index !== state.editIndex)))
  // 是否有做更改
  const noChange = state.editLabel === data.value[state.editIndex].label
  // 正则校验
  let validMsg = ''
  if (props.validate)
    validMsg = props.validate(state.editLabel)
  if (adding.value && !state.editLabel) {
    data.value.splice(0, 1)
    emit('update:modelValue', data.value)
    state.editIndex = null
    adding.value = false
    return false
  }
  else if (noChange && state.editIndex !== null) {
    state.editIndex = null
    state.editLabel = ''
    return false
  }
  else if (validMsg) {
    state.errMsg = validMsg
  }
  else if (isDuplicate) {
    state.errMsg = props.repeatMsg
  }

  if (state.errMsg) {
    inputFocus()
    return false
  }
  return true
}

function onClose() {
  if (!validate() || state.editIndex || state.editIndex === 0)
    return
  searchKey.value = ''
  state.visible = false
}

// function onUpdateValue(val: string, i: number, element: any) {
//   const item = data.value.find(item => item.value === element.value)
//   item.label = val
//   emit('update:modelValue', data.value)
// }

function onDragChange({ moved }: any) {
  const val = moved.element
  data.value.splice(moved.oldIndex, 1)
  data.value.splice(moved.newIndex, 0, val)

  const newOrderList = afterData.value

  const updateList = []
  let ranking = 0
  for (let i = newOrderList.length - 1; i >= 0; i--) {
    ranking += 100
    if (Number.parseInt(newOrderList[i].ranking) !== ranking) {
      newOrderList[i].ranking = ranking
      updateList.push(newOrderList[i])
    }
  }
  // 找出差异项
  emit('dragChange', updateList)
  emit('update:modelValue', newOrderList)
}

function inputFocus() {
  requestAnimationFrame(() => {
    const input = Array.isArray(inputRefs.value) ? inputRefs.value?.[0] : inputRefs.value
    if (input)
      input.focus()
  })
}

function onEditInput(index: number, label: string) {
  if (!validate())
    return
  state.editIndex = index
  state.editLabel = label
  inputFocus()
}

// tooltip 在目标上移动
function tooltipMouseover(e: MouseEvent, msg: string) {
  tooltipRef.value = e.currentTarget
  tooltipMsg.value = msg
}

async function onCancel() {
  state.editLabel = ''
  state.editIndex = null
  state.errMsg = ''
  if (adding.value) {
    data.value.splice(0, 1)
    adding.value = false
  }
}
</script>

<template>
  <slot v-if="$slots.default" :open="() => state.visible = true" />
  <a-button v-else class="fullbtn h32" @click="state.visible = true">
    <div>
      {{ title }}配置·{{ optionCount }}个
    </div>
  </a-button>

  <a-modal
    v-model:open="state.visible"
    v-bind="$attrs"
    :mask-closable="false"
    :closable="false"
    :mask="false"
    width="360px"
    class="modal-list-edit"
    centered
    @cancel="onCancel"
    @ok="state.visible = false"
  >
    <template #title>
      <div ref="modalTitleRef" class="modal-title w-full cursor-move flex items-center border-b border-0 border-solid pfm">
        {{ title }}
      </div>
    </template>
    <template #modalRender="{ originVNode }">
      <div :style="transformStyle">
        <component :is="originVNode" />
      </div>
    </template>
    <SvgIcon name="project-leave" class="close-btn pointer" color="#333" size="16" @click="onClose" />
    <a-form-item-rest>
      <div :class="{ grabbing }" class="flex-1">
        <div class="pl16 pr16 mb12">
          <b-input2 ref="searchRef" v-model:value="searchKey" :placeholder="searchPlaceholder" :maxlength="40" class="search-input h36 mt12 px8">
            <template #suffix>
              <SvgIcon class="search-icon" name="search3" color="999" size="16" />
            </template>
          </b-input2>
        </div>
        <el-scrollbar v-if="(props.otherOptions ? 1 : 0) + optionCount > 0" style="height:216px" max-height="216px">
          <draggable
            :model-value="afterData"
            :force-fallback="true"
            :fallback-on-body="true"
            chosen-class="modal-list-edit-chosen"
            ghost-class="ghost-class"
            item-key="oneSelectVal"
            handle=".handle"
            @start="grabbing = true"
            @end="grabbing = false"
            @change="onDragChange"
          >
            <template #item="{ element, index }">
              <div :class="{ 'is-default': element.default }" class="item h36 ml8 mr8">
                <template v-if="state.editIndex === index">
                  <b-input2
                    ref="inputRefs"
                    v-model:value="state.editLabel"
                    :placeholder="placeholder"
                    :class="{ error: state.errMsg }"
                    class="edit-input mt2"
                    @blur="onSave"
                    @keydown.enter="inputAddKeyEnter"
                  />
                </template>
                <template v-else>
                  <div class="flex items-center h-full pr16 select-none">
                    <SvgIcon class="drag-svg handle" name="drag_icon" size="16px" />
                    <div class="flex-1 flex flex-row min-w-0">
                      <b-ellipsis
                        :content="element.label"
                        :highlight="searchKey"
                        @mouse-over-back="(e: MouseEvent) => tooltipMouseover(e, element.label)"
                      />
                      <div style="color: #999;">
                        {{ element.description }}
                      </div>
                    </div>
                    <div
                      class="edit-icon w20 h20 flex bg-white items-center justify-items-center cursor-pointer ml8"
                      @click="onEditInput(index, element.label)"
                    >
                      <SvgIcon name="table-edit" size="15.72px" />
                    </div>
                    <a-tooltip>
                      <template #title>
                        删除
                      </template>
                      <SvgIcon
                        class="remove-icon cursor-pointer ml8" name="delete" size="16px"
                        @click="onRemove(index)"
                      />
                    </a-tooltip>
                    <div class="preset">
                      预设
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </draggable>
          <div v-if="props.otherOptions && (!searchKey || searchKey === '其他')" class="item h36 ml8 mr8 is-default">
            <div class="flex items-center h-full pr16 select-none">
              <SvgIcon class="drag-svg opacity-0 pointer-events-none" name="drag_icon" size="16" />
              <div class="flex-1 flex flex-row min-w-0">
                <b-ellipsis
                  content="其他"
                />
                <div style="color: #999;">
                  （需要填写具体原因）
                </div>
              </div>
              <div class="preset">
                预设
              </div>
            </div>
          </div>
        </el-scrollbar>
        <div v-else class="empty-data flex-row-center">
          <p v-if="searchKey">
            未找到与<span class="name"> “{{ searchKey }}” </span>相关的{{ name }}
          </p>
          <p v-else>
            未找到相关的{{ name }}
          </p>
        </div>
      </div>
    </a-form-item-rest>

    <div v-if="!searchKey" class="add-reason flex items-center justify-items-center cursor-pointer ml8" @click="onAdd">
      <img :src="getAssetsFile('add-primary.svg')" class="align-sub pr4 add-icon">
      {{ addText }}
    </div>
  </a-modal>
  <ElTooltip
    :virtual-ref="tooltipRef"
    :content="tooltipMsg"
    trigger="hover"
    placement="top"
    raw-content
    virtual-triggering
  />
</template>

<style lang="scss">
.modal-list-edit {
  .grabbing,
  .grabbing .drag-svg {
    cursor: grabbing !important;
  }
  .ant-modal-content {
    padding: 0;
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow2;
    .modal-title {
      height: 48px;
      padding: 0 16px 0 24px;
      border-color: #edeef0;
    }
    .ant-modal-header {
      margin-bottom: 0;
    }
    .ant-modal-body {
      display: flex;
      flex-direction: column;
      height: 320px;
      padding: 0 0 8px 0;
    }
  }
  .ant-modal-footer {
    display: none;
  }
  .hide-tab {
    .ant-tabs-nav {
      display: none;
    }
  }
  .add-reason {
    width: 110px;
    height: 36px;
    border-radius: 4px;
    color: #1d74f5;
    transition: 0.2s;
    font-size: 14px;
    &:hover {
      background: rgba(24, 62, 118, 0.03);
    }
    &:active {
      background: rgba(24, 62, 118, 0.06);
    }
  }
  .item {
    &.is-default {
      .edit-icon,
      .remove-icon {
        display: none !important;
      }
      .preset {
        display: block;
        padding-left: 4px;
      }
    }
  }
}

.modal-list-edit-chosen.item,
.modal-list-edit .item {
  border-radius: 4px;
  font-size: 14px;
  position: relative;
  &:hover {
    background: rgba(24, 62, 118, 0.03);
    .drag-svg {
      visibility: visible;
    }
    .edit-icon {
      display: flex;
    }
    .remove-icon {
      display: block;
    }
  }
  &.ghost-class {
    &::before {
      content: '';
      display: block;
      width: 100%;
      height: 2px;
      background: #1d74f5;
    }
  }
  .drag-svg {
    visibility: hidden;
    transform: translateY(-1px);
    cursor: grab;
    &:hover {
      use {
        fill: #333;
      }
    }
    &:active {
      cursor: grabbing;
    }
    use {
      fill: #999;
    }
  }
  .edit-icon {
    display: none;
    border: 0.5px solid #e8e9eb;
    border-radius: 4px;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
    &:hover {
      use {
        fill: #1d74f5;
      }
    }
  }
  .remove-icon {
    display: none;
    use {
      fill: #bfbfbf;
    }
    &:hover {
      use {
        fill: #fd4c4c;
      }
    }
  }
}
.modal-list-edit-chosen.item {
  border: none !important;
  background: rgba(24, 62, 118, 0.03) !important;
  .drag-svg {
    visibility: visible;
  }
}
</style>

<style lang="scss" scoped>
.fullbtn {
  margin-left: -4px;
  width: calc(100% + 8px);
  color: #1d74f5;
  border: 1px solid #edeef0;
  margin-top: 5px;
  + .fullbtn {
    margin-top: 8px;
  }
}
.close-btn {
  position: absolute;
  right: 16px;
  top: 16px;
}
.preset {
  display: none;
  font-size: 12px;
  color: #999;
}
.edit-input {
  &.error {
    box-shadow: 0 0 0 2px $color-error inset;
  }
}
.empty-data {
  min-height: 216px;
  text-align: center;
  padding: 0 16px;
  .name {
    color: #1d74f5;
    word-break: break-all;
  }
}
</style>
