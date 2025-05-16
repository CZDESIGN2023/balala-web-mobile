<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { RESTORE_REASON } from '@/utils/constant'
import type { SelectOptions } from '@/api/interface/common'

interface Props {
  dialogVisible?: boolean
  terminatedReason?: any[]
  restoreReason?: any[]
  resumeReason?: any[]
  rollbackReason?: any[]
  currentNodeRestoreReason?: any[]
}
const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  terminatedReason: () => [],
  restoreReason: () => [],
  resumeReason: () => [],
  rollbackReason: () => [],
  currentNodeRestoreReason: () => [],
})

const emits = defineEmits([
  'update:dialogVisible',
  'onRollBack',
  'onRestore',
  'onRestartInComplete',
  'onRestartInClose',
  'onTerminate',
  'onRestartInChild',
])

const state = reactive({
  dialogStatuType: '',
  dialogTitle: '',
  nodeOptions: [] as SelectOptions[],
  nodeValue: null,
  reasonValue: null,
  reasonLabel: '',
  reasonText: '',
  isShowNodeErrorTip: false,
  isShowReasonErrorTip: false,
})

// dialog任务确认原因列表
const taskDialogOptions = computed(() => {
  let result: any[] = []
  if (state.dialogStatuType === 'terminate') {
    // 终止
    result = props.terminatedReason
  }
  else if (state.dialogStatuType === 'restore') {
    // 恢复
    result = props.resumeReason
  }
  else if (state.dialogStatuType === 'rollback') {
    // 回滚
    result = props.rollbackReason
  }
  else if (['restart'].includes(state.dialogStatuType)) {
    // 重启
    result = props.currentNodeRestoreReason
  }
  else if (['', 'restartSuccess'].includes(state.dialogStatuType)) {
    // 重启
    result = props.restoreReason
  }
  else if (state.dialogStatuType === 'restartChild') {
    result = RESTORE_REASON
  }
  return result
})

// dialog 标题
const dialogTitle = computed(() => {
  return state.dialogStatuType === 'restartSuccess'
    ? `请选择${state.dialogTitle}任务原因及重启节点`
    : `请选择${state.dialogTitle}任务原因`
})

// 监听原因输入
function changeReasonTextarea() {
  if (state.reasonText)
    state.isShowReasonErrorTip = false
  else
    state.isShowReasonErrorTip = true
}

// 点击确认
function handleConfirm() {
  const reason = state.reasonValue === 'other' ? state.reasonText : state.reasonLabel
  switch (state.dialogStatuType) {
    case 'rollback':
      if (reason === '') {
        state.isShowReasonErrorTip = true
        return
      }
      emits('onRollBack', reason)
      break
    case 'restartSuccess':
      if (state.nodeValue === null || reason === '') {
        state.isShowNodeErrorTip = state.nodeValue === null
        state.isShowReasonErrorTip = reason === ''
        return
      }
      emits('onRestartInComplete', state.nodeValue, reason)
      break
    case 'restart':
      if (reason === '') {
        state.isShowReasonErrorTip = true
        return
      }
      emits('onRestartInClose', reason)
      break
    case 'restore':
      if (reason === '') {
        state.isShowReasonErrorTip = true
        return
      }
      emits('onRestore', reason)
      break
    case 'terminate':
      if (reason === '') {
        state.isShowReasonErrorTip = true
        return
      }
      emits('onTerminate', reason)
      break
    case 'restartChild':
      if (reason === '') {
        state.isShowReasonErrorTip = true
        return
      }
      emits('onRestartInChild', reason)
      break
  }
}

// 点击取消
function handleCancel() {
  state.isShowNodeErrorTip = false
  state.isShowReasonErrorTip = false
  state.nodeValue = null
  state.reasonValue = null
  state.reasonLabel = ''
  state.reasonText = ''
  emits('update:dialogVisible')
}

// 抛出方法获取数据
function setData(dialogInfo: any, nodeOptions?: SelectOptions[]) {
  state.nodeOptions = nodeOptions || []
  if (dialogInfo) {
    state.dialogStatuType = dialogInfo.type
    state.dialogTitle = dialogInfo.title
  }
}

defineExpose({
  setData,
})
</script>

<template>
  <!-- 任务状态流转确认弹框 -->
  <b-dialog
    :dialog-visible="dialogVisible"
    width="480px"
    title-icon="warning.svg"
    :title="dialogTitle"
    :confirm-btn-text="state.dialogTitle"
    :confirm-btn-color="state.dialogStatuType === 'end' ? 'danger' : 'primary'"
    @on-confirm="handleConfirm"
    @on-cancel="handleCancel"
  >
    <div class="confirm-popover-wrap">
      <div class="pt5">
        <!-- END_REASON -->
        <BBaseSelect
          v-if="state.dialogStatuType === 'restartSuccess'"
          v-model:value="state.nodeValue"
          class="mb16"
          size="large"
          placeholder="请选择节点"
          :options="state.nodeOptions"
          @change="state.isShowNodeErrorTip = false"
        />
        <div
          v-if="state.isShowNodeErrorTip"
          class="tip error-color text12 mb10"
          style="margin-top: -6px"
        >
          请选择重启任务节点
        </div>
        <BBaseSelect
          v-model:value="state.reasonValue"
          v-model:label="state.reasonLabel"
          size="large"
          placeholder="请选择原因"
          :options="taskDialogOptions"
          @change="state.isShowReasonErrorTip = false"
        />
        <div v-if="state.reasonValue === 'other'" class="reason-box pt8 flex">
          <p v-if="!state.reasonText">
            *
          </p>
          <a-textarea
            v-model:value="state.reasonText"
            :bordered="false"
            :placeholder="`请输入${state.dialogTitle}任务原因`"
            :auto-size="{ minRows: 3, maxRows: 3 }"
            @change="changeReasonTextarea"
          />
        </div>
        <div v-if="state.isShowReasonErrorTip" class="tip error-color text12 mt10">
          请选择/输入{{ state.dialogTitle }}任务原因
        </div>
      </div>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped></style>
