<script setup lang="ts">
import { h, ref } from 'vue'
import { message } from 'ant-design-vue'
import { workItemResume } from '@/api/project'
import type { TableRowData } from '@/views/project/types/table'
import useFlowTemplate from '@/hooks/useFlowTemplate'

// PROPS & EMITS
const props = defineProps<{
  row: TableRowData | undefined
}>()

const emit = defineEmits(['success', 'update:visible', 'update:row'])

const popoverRef = ref()
// STATE
const ajaxData = ref({
  select: null,
  reason: '',
})
const validResonTip = ref('')
let submitting = false

const { flowTemplateInfo, initFlowTemplate } = useFlowTemplate()

// METHODS
async function handleConfirm() {
  let reason: string | null
  const sval = ajaxData.value.select

  if (sval === 'other') {
    reason = ajaxData.value.reason
    if (!reason)
      validResonTip.value = '请输入恢复任务原因'
  }
  else {
    reason = flowTemplateInfo.value?.templateConf?.resumeReasonList.filter(item => item.value === sval)[0]?.label
    if (!reason)
      validResonTip.value = '请选择原因'
  }

  if (validResonTip.value)
    return

  if (submitting)
    return
  submitting = true
  let res
  try {
    res = await workItemResume(props.row!.spaceId, props.row!.id, reason as string)
  }
  finally {
    setTimeout(() => (submitting = false), 200)
  }
  emit('success', res.data.ids)
  emit('update:visible', false)
  message.success(
    {
      content: h('div', {
        innerHTML: `<div>任务 <span style="color: #1D74F5;">#${props.row!.workItemName}</span> 已恢复</div>`,
      }),
    },
    2,
  )
}

function onChangeSelect(val: number) {
  validResonTip.value = ''
  if (val === 0)
    popoverRef.value.updatePosition()
}

function reset() {
  setTimeout(() => {
    ajaxData.value = { select: null, reason: '' }
    validResonTip.value = ''
  }, 200)
}

async function onShow() {
  if (props.row!.pid !== '0')
    return
  initFlowTemplate(props.row!.spaceId, props.row!.workFlowTemplateId)
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
    confirm-text="恢复"
    virtual-triggering
    close-btn
    @cancel="$emit('update:visible', false)"
    @confirm="handleConfirm"
    @show="onShow"
    @before-leave="onBeforeLeave"
  >
    <p class="text16 title-color">
      选择恢复任务原因
    </p>
    <div class="confirm-popover-wrap w310">
      <div class="pt20">
        <BBaseSelect
          v-model:value="ajaxData.select"
          style="margin-top: 16px"
          size="large"
          placeholder="请选择原因"
          :options="flowTemplateInfo?.templateConf?.resumeReasonList"
          @change="onChangeSelect"
        />
        <div v-if="ajaxData.select === 'other'" class="reason-box pt8 flex">
          <p v-if="!ajaxData.reason">
            *
          </p>
          <a-textarea
            v-model:value="ajaxData.reason"
            :bordered="false"
            placeholder="请输入恢复任务原因"
            :auto-size="{ minRows: 3, maxRows: 3 }"
            @input="validResonTip = ''"
          />
        </div>
        <div v-if="validResonTip" class="status-not-all error-color text12 h16 mt4">
          {{ validResonTip }}
        </div>
      </div>
    </div>
  </BPopover>
</template>
