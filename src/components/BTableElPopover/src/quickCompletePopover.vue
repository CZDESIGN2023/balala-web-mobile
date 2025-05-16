<script lang="ts" setup>
import { message } from 'ant-design-vue'
import { nodesStateConfirm, taskStateConfirm } from '@/api/project'
import { TaskStatusKey } from '@/enum/TaskStatus'
import type { TableRowData } from '@/views/project/types/table'

// PROPS
interface Props {
  data: TableRowData | null
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
})

const emit = defineEmits(['update:visible', 'success', 'update:data'])

let submitting = false

// 快速完成，请求接口
async function handleConfirm() {
  if (submitting === true)
    return
  submitting = true
  let res
  try {
    if (props.data!.pid !== '0') {
      res = await taskStateConfirm(props.data?.spaceId as string, props.data?.id as string, TaskStatusKey.COMPLETED)
    }
    else {
      res = await nodesStateConfirm(
        props.data?.spaceId as string,
        props.data?.id as string,
        props.data?.flowNode.key as string,
      )
    }
  }
  finally {
    setTimeout(() => (submitting = false), 200)
  }
  emit('success', res.data.ids || [props.data?.id])
  emit('update:visible', false)

  message.success('修改任务状态成功', 2)
}
</script>

<template>
  <BPopover
    :show-arrow="false"
    trigger="click"
    effect="light"
    placement="top-end"
    virtual-triggering
    transition="zoom-bottom-right"
    @cancel="$emit('update:visible', false)"
    @confirm="handleConfirm"
    @before-leave="$emit('update:data', null)"
  >
    <div>
      <p v-if="data?.flowNode?.doneOperationDisplayName" class="text16 title-color">
        确认完成任务 [{{ data?.flowNode.doneOperationDisplayName }}] ？
      </p>
      <p v-else class="text16 title-color">
        确认完成任务？
      </p>
    </div>
  </BPopover>
</template>
