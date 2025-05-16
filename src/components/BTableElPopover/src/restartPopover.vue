<script setup lang="ts">
import { computed, h, ref, shallowReactive } from 'vue'
import { message } from 'ant-design-vue'
import { taskStateConfirm, workItemRestart } from '@/api/project'
import type { ConfirmPopoverData, TableRowData } from '@/views/project/types/table'
import { TaskStatus, TaskStatusKey } from '@/enum/TaskStatus'
import useFlowTemplate, { mapOptions } from '@/hooks/useFlowTemplate'

// PROPS
interface Props {
  row: TableRowData
}

interface TSStatusPop {
  // 弹窗对应的节点key
  activeKey: string
  // 验证提示内容
  validTip: string
  workCode: string
  workType?: number
  workList?: any[]
  workSelect?: string | null
  validNodeTip?: string
  validResonTip?: string
  status?: number
  displayName?: string
}

const props = withDefaults(defineProps<Props>(), {
  row: () => {
    return {} as TableRowData
  },
})
const emit = defineEmits(['success', 'update:visible', 'update:row'])

// 状态流转原因数据
const confirmPopoverData = shallowReactive<ConfirmPopoverData>({
  value: '确认问题',
  select: null,
  reason: null,
})
const statusPop = shallowReactive<TSStatusPop>({
  activeKey: '',
  validTip: '',
  workCode: '',
  workSelect: null,
})
const popoverRef = ref()

// 默认原因 子任务用
const defaultReason = [
  {
    value: 0,
    label: '任务需要继续进行',
  },
  {
    value: 1,
    label: '误操作',
  },
  {
    value: 'other',
    label: '其他',
  },
]

let submitting = false

const { flowTemplateInfo, nodeOptions, initFlowTemplate } = useFlowTemplate()

const mainTaskIsCompleted = computed(() => props.row.workItemStatus?.val === TaskStatus.COMPLETED && props.row.pid === '0')

const restartReasonList = computed(() => {
  if (props.row.pid !== '0') {
    return defaultReason
  }
  if (props.row.workItemStatus?.key === TaskStatusKey.COMPLETED) {
    return flowTemplateInfo.value?.templateConf?.rebootReasonList
  }
  else if (props.row.flowNode) {
    return mapOptions(props.row.flowNode.restartReasonOptions, props.row.flowNode.enableRestartReasonOtherOption)
  }
  return []
})

// METHODS

// 确认 - 重启
async function handleConfirm() {
  try {
    let reason: string | null
    const sval = confirmPopoverData.select
    const isChildTask = props.row.pid !== '0'
    const taskIsCompleted = props.row.workItemStatus.val === TaskStatus.COMPLETED
    // 选择的是其他
    if (sval === 'other') {
      reason = confirmPopoverData.reason
      if (!reason)
        statusPop.validResonTip = '请输入重启任务原因'
    }
    else {
      reason = restartReasonList.value.filter((item: any) => item.value === sval)[0]?.label
      confirmPopoverData.reason = reason
      if (!reason)
        statusPop.validResonTip = '请选择原因'
    }

    // 子任务重启
    if (isChildTask && taskIsCompleted) {
      if (reason)
        statusConfirmCx()

      return
    }
    if (!statusPop.workSelect && taskIsCompleted)
      statusPop.validNodeTip = '请选择节点'

    if (statusPop.validResonTip || statusPop.validNodeTip)
      return

    if (submitting === true)
      return
    submitting = true
    let res
    try {
      res = await workItemRestart(
        props.row.spaceId!,
        props.row.id!,
        statusPop.workSelect as string,
        reason as string,
      )
    }
    finally {
      setTimeout(() => (submitting = false), 200)
    }

    emit('success', res.data.ids)
    emit('update:visible', false)

    if (taskIsCompleted) {
      // 获取当前节点名称
      const nodeName = (nodeOptions.value as any[]).filter(
        (item: any) => item.value === statusPop.workSelect,
      )[0].label

      message.success(
        {
          content: h('div', {
            innerHTML: `<div>任务 <span style="color: #1D74F5;">#${props.row.workItemName}</span> 已重启至${nodeName}</div>`,
          }),
        },
        2,
      )
    }
    else {
      message.success(
        {
          content: h('div', {
            innerHTML: `<div>任务 <span style="color: #1D74F5;">#${props.row.workItemName}</span> 已重启</div>`,
          }),
        },
        2,
      )
    }
  }
  catch (error) {}
}

// 确认 - 重启 (子任务)
async function statusConfirmCx() {
  if (submitting === true)
    return
  submitting = true
  try {
    await taskStateConfirm(props.row.spaceId!, props.row.id!, TaskStatusKey.PROGRESSING, confirmPopoverData.reason || '')
  }
  finally {
    setTimeout(() => (submitting = false), 200)
  }
  emit('success', [props.row.id])
  emit('update:visible', false)

  message.success(
    {
      content: h('div', {
        innerHTML: `<div>任务 <span style="color: #1D74F5;">#${props.row.workItemName}</span> 已重启</div>`,
      }),
    },
    2,
  )
}

async function onShow() {
  if (props.row.pid !== '0')
    return
  initFlowTemplate(props.row.spaceId, props.row.workFlowTemplateId)
}

function onChangeSelect(val: number) {
  statusPop.validResonTip = ''
  if (val === 0)
    popoverRef.value.updatePosition()
}

// 重置数据
function reset() {
  setTimeout(() => {
    statusPop.workSelect = null
    confirmPopoverData.select = null
    confirmPopoverData.reason = null
    statusPop.validResonTip = ''
    statusPop.validNodeTip = ''
  }, 200)
}

function onBeforeLeave() {
  emit('update:row', {})
  reset()
}
</script>

<template>
  <BPopover
    ref="popoverRef"
    v-bind="$attrs"
    trigger="click"
    :show-arrow="false"
    transition="zoom-bottom-right"
    custom-class="table-comment-popover"
    placement="top-end"
    width="360"
    virtual-triggering
    close-btn
    @cancel="$emit('update:visible', false)"
    @confirm="handleConfirm"
    @show="onShow"
    @before-leave="onBeforeLeave"
  >
    <p class="text16 title-color">
      请选择重启任务原因<span v-if="row.pid === '0' && row.workItemStatus?.val !== TaskStatus.CLOSE">及重启节点</span>
    </p>
    <div class="confirm-popover-wrap w310" :class="row.pid !== '0' ? '' : 'pt20'">
      <div
        :class="{
          pt20: mainTaskIsCompleted,
        }"
      >
        <BBaseSelect
          v-if="mainTaskIsCompleted"
          v-model:value="statusPop.workSelect"
          size="large"
          placeholder="请选择节点"
          :options="nodeOptions"
          @change="statusPop.validNodeTip = ''"
        />
        <div
          v-if="mainTaskIsCompleted && statusPop.validNodeTip"
          class="status-not-all error-color text12 h16 mt4"
        >
          {{ statusPop.validNodeTip }}
        </div>
        <BBaseSelect
          v-model:value="confirmPopoverData.select"
          style="margin-top: 16px"
          size="large"
          placeholder="请选择原因"
          :options="restartReasonList"
          @change="onChangeSelect"
        />
        <div v-if="confirmPopoverData.select === 'other'" class="reason-box pt8 flex">
          <p v-if="!confirmPopoverData.reason">
            *
          </p>
          <a-textarea
            v-model:value="confirmPopoverData.reason"
            :bordered="false"
            placeholder="请输入重启任务原因"
            :auto-size="{ minRows: 3, maxRows: 3 }"
            @input="statusPop.validResonTip = ''"
          />
        </div>
        <div v-if="statusPop.validResonTip" class="status-not-all error-color text12 h16 mt4">
          {{ statusPop.validResonTip }}
        </div>
      </div>
    </div>
  </BPopover>
</template>
