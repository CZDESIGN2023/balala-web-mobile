<script lang="ts" setup>
import { message } from 'ant-design-vue'
import { nextTick, reactive, ref } from 'vue'
import type { Workflow } from '../types'
import { getTextLength } from '@/utils'
import { setWorkFlowName } from '@/api/workflow'

const emits = defineEmits(['onEditName'])

const editTitleInputRef = ref()

const state = reactive({
  rawFlowName: '未命名流程',
  flowName: '未命名流程',
  editTitleInputVisible: false,
  showflowNameError: false,
  flowVersion: '',
  spaceId: '',
  flowId: '',
})

// 切换标题编辑模式
function handleToggleInput() {
  state.editTitleInputVisible = true
  nextTick(() => {
    editTitleInputRef.value?.focus()
  })
}

function titleInputEnter() {
  // state.editTitleInputVisible = false
  editTitleInputRef.value?.blur()
}

async function titleInputBlur() {
  const length = getTextLength(state.flowName as string)
  if (!state.flowName) {
    state.showflowNameError = true
    message.error('流程名称不能为空', 3)
    return
  }
  if (!(length >= 2 && length <= 30)) {
    state.showflowNameError = true
    message.error('请输入有效格式(2 ~ 30个字符)', 3)
    return
  }
  if (state.rawFlowName === state.flowName) {
    state.editTitleInputVisible = false
    state.showflowNameError = false
    return
  }

  handleEditName(state.flowName)
}

async function handleEditName(name: string) {
  const flowName = name.trim()
  try {
    await setWorkFlowName({ spaceId: state.spaceId, flow_id: state.flowId, name: flowName })
    message.success('流程名称修改成功', 3)
    state.flowName = flowName
    state.rawFlowName = flowName
    state.editTitleInputVisible = false
    state.showflowNameError = false
    emits('onEditName', flowName)
  }
  catch (err) {
    state.showflowNameError = true
  }
}

function setData(data: Workflow) {
  state.flowName = data.name
  state.rawFlowName = data.name
  state.flowVersion = `v${data.version}`
  state.spaceId = data.spaceId
  state.flowId = data.id
}

function setName(name: string) {
  state.flowName = name
  state.rawFlowName = name
}

defineExpose({
  setData,
  setName,
})
</script>

<template>
  <div class="drawer-title flex-row-center" :class="state.editTitleInputVisible ? 'op' : ''" @click="handleToggleInput">
    <p class="icon-color text18 pfm">
      {{ state.flowName }}
    </p>
    <svg-icon class="ml4 pointer" name="node-title-edit" size="16" color="#666666" />
    <span class="version ml4">{{ state.flowVersion }}</span>
  </div>
  <div v-if="state.editTitleInputVisible" class="input-box">
    <a-input
      ref="editTitleInputRef"
      v-model:value="state.flowName"
      class="title-input"
      :class="state.showflowNameError ? 'error' : ''"
      placeholder="请输入流程名称"
      @press-enter="titleInputEnter"
      @blur="titleInputBlur"
    />
  </div>
</template>

<style lang="scss" scoped>
  .drawer-title {
  height: 40px;
  border-radius: 6px;
  padding: 0 8px;
  border: 1px solid transparent;
  &:hover {
    border-color: #edeef0;
  }
  .version {
    color: #bfbfbf;
    font-size: 12px;
  }
}
.input-box {
  width: 552px;
  height: 64px;
  position: absolute;
  left: 16px;
  top: 0;
  display: flex;
  align-items: center;
  .title-input {
    height: 40px;
    border: 2px solid $color-primary;
    font-size: 14px;
    color: $color-icon;
    padding-left: 8px;
    caret-color: $color-primary;
    &:focus {
      box-shadow: none !important;
    }
    &.error {
      border: 2px solid $color-error;
    }
  }
}
</style>
