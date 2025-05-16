<script lang="ts" setup>
import { computed, h, reactive, ref, shallowReactive } from 'vue'
import { message } from 'ant-design-vue'
import type { ConfirmPopoverData, TableRowData } from '@/views/project/types/table'
import { nodesStateConfirm, workItemClose } from '@/api/project'
import useFlowTemplate from '@/hooks/useFlowTemplate'

// PROPS
interface Props {
  data: TableRowData
}

const props = withDefaults(defineProps<Props>(), {
  data: () => {
    return {} as TableRowData
  },
})

const emit = defineEmits(['update:visible', 'success', 'update:data'])

const popoverRef = ref()
const state = reactive({
  error: '',
})

let submitting = false

// 状态流转原因数据
const confirmPopoverData = shallowReactive<ConfirmPopoverData>({
  value: 'confirm',
  select: null,
  reason: null,
})

const radioOptions = computed(() => {
  return [
    {
      label: props.data?.flowNode?.doneOperationDisplayName,
      value: 'confirm',
    },
    {
      label: '关闭',
      value: 'close',
    },
  ]
})

const { initFlowTemplate, currentNode } = useFlowTemplate()

function validate() {
  state.error = ''
  switch (confirmPopoverData.value) {
    case 'close':
      if (confirmPopoverData.select === null) {
        state.error = '请选择原因'
        throw new Error('请选择原因')
      }
      if (confirmPopoverData.select === 'other' && !confirmPopoverData.reason) {
        state.error = '请输入关闭任务原因'
        throw new Error('请输入关闭任务原因')
      }
      break
  }
}

// 确认问题、关闭问题
async function handleConfirm() {
  validate()
  if (submitting)
    return
  submitting = true
  if (confirmPopoverData.select !== 'other') {
    const reason = currentNode.value?.closeReasonList.find(item => item.value === confirmPopoverData.select)
    if (reason)
      confirmPopoverData.reason = reason.label
  }
  let res: any
  try {
    if (confirmPopoverData.value === 'confirm') {
      res = await nodesStateConfirm(
        props.data.spaceId as string,
        props.data.id as string,
        props.data.flowNode?.key as string,
      )
    }
    else {
      res = await workItemClose(
        props.data.spaceId as string,
        props.data.id as string,
        props.data.flowNode?.key as string,
        confirmPopoverData.reason!,
      )
    }
  }
  finally {
    setTimeout(() => (submitting = false), 200)
  }
  emit('success', res.data.ids)
  emit('update:visible', false)

  if (confirmPopoverData.value === 'confirm') {
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${props.data.workItemName}</span> 已确认</div>`,
        }),
      },
      2,
    )
  }
  else {
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${props.data.workItemName}</span> 已关闭</div>`,
        }),
      },
      2,
    )
  }
}

async function handleCancel() {
  emit('update:visible', false)
}

function onUpdateSelect() {
  popoverRef.value?.updatePosition()
  state.error = ''
}

// 重置数据
function reset() {
  confirmPopoverData.value = 'confirm'
  confirmPopoverData.reason = null
  confirmPopoverData.select = null
  state.error = ''
}

function onShow() {
  initFlowTemplate(props.data.spaceId, props.data.workFlowTemplateId, props.data.flowNode.key)
}

function onBeforeLeave() {
  emit('update:data', null)
  reset()
}
</script>

<template>
  <BPopover
    ref="popoverRef"
    v-bind="$attrs"
    :show-arrow="false"
    :confirm-text="confirmPopoverData.value === 'close' ? '关闭' : '确认'"
    trigger="click"
    transition="zoom-bottom-right"
    width="360"
    placement="top-end"
    virtual-triggering
    close-btn
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @show="onShow"
    @before-leave="onBeforeLeave"
  >
    <div>
      <p class="text16 title-color">
        请对任务内容进行 {{ props.data?.flowNode?.name }} 确认
      </p>
      <div class="confirm-popover-wrap w310 pt20">
        <a-radio-group
          :value="confirmPopoverData.value"
          :options="radioOptions"
          @update:value="(val: string) => {
            confirmPopoverData.value = val
            popoverRef?.updatePosition()
            state.error = ''
            confirmPopoverData.select = null
          }"
        />
        <div v-if="confirmPopoverData.value === 'close'" class="pt20">
          <BBaseSelect
            v-model:value="confirmPopoverData.select"
            size="large"
            placeholder="请选择原因"
            :options="currentNode?.closeReasonList"
            @update:value="onUpdateSelect"
          />
          <div v-if="confirmPopoverData.select === 'other'" class="reason-box pt8 flex">
            <p v-if="!confirmPopoverData.reason">
              *
            </p>
            <a-textarea
              v-model:value="confirmPopoverData.reason"
              :bordered="false"
              placeholder="请输入关闭任务原因"
              :auto-size="{ minRows: 3, maxRows: 3 }"
            />
          </div>
          <!-- 已注释 <div class="status-not-all error-color text12 h16 mt4" v-if="statusPop.validResonTip">{{ statusPop.validResonTip }}</div> -->
        </div>
      </div>
    </div>
    <div v-if="state.error" class="valid-tip">
      {{ state.error }}
    </div>
  </BPopover>
</template>

<style lang="scss" scoped>
.valid-tip {
  width: 100%;
  font-size: 12px;
  margin-top: 2px;
  color: $color-error;
  position: absolute;
}
</style>
