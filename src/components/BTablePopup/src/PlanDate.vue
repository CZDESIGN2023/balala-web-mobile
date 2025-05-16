<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import type { TaskPlanTimeAt } from '@/api/interface'
import { editWorkPlantime } from '@/api/project'
import { isEmptyObject } from '@/utils'
import type { TableRowData } from '@/views/project/types/table'

withDefaults(defineProps<Props>(), {
  row: () => {
    return {} as TableRowData
  },
})

const emit = defineEmits(['removeItem', 'success'])

interface Props {
  row: TableRowData
}

const inputDateRef = ref()

onMounted(() => {
  inputDateRef.value.dropdown()
})

// 获取年月日
function getDay(timestamp?: string) {
  if (!timestamp)
    return ''
  const date = new Date(Number(timestamp) * 1000) // 将时间戳转换成毫秒
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1)
  const day = String(date.getDate())

  return year + month + day
}

// 更改时间
async function changeDate(record: TableRowData, time: TaskPlanTimeAt, startUnix: string, endUnix: string) {
  const isSameStart = getDay(record.planTime?.startAt) === getDay(startUnix)
  const isSameEnd = getDay(record.planTime?.completeAt) === getDay(endUnix)

  // 空数据不请求
  if (isEmptyObject(time)) {
    emit('removeItem')
    return
  }

  record.planTime = {
    startAt: String(dayjs(time.start).unix()) ?? '',
    completeAt: String(dayjs(time.complete).unix()) ?? '',
  }

  // 日期未修改不请求
  if (isSameStart && isSameEnd) {
    emit('removeItem')
    return
  }
  try {
    await editWorkPlantime(record.spaceId || '', record.id || '', time)
    message.success('总排期修改成功', 2)
    emit('success', [record.id])
    setTimeout(() => {
      emit('removeItem')
    }, 500)
  }
  catch (error) {}
}
</script>

<template>
  <b-input-date
    ref="inputDateRef"
    :info="{ planStartAt: row.planTime.startAt, planCompleteAt: row.planTime.completeAt }"
    :disabled="!row.perm.allowEdit"
    :task-status="Number(row.workItemStatus.val) || 0"
    foramt-val="MM/DD"
    class-type="table-style detail"
    width="100%"
    size="large"
    @on-change="
      (time: TaskPlanTimeAt, startUnix: string, endUnix: string) =>
        changeDate(row, time, startUnix, endUnix)
    "
    @on-close="$emit('removeItem')"
    @blur="$emit('removeItem')"
    @on-change-same-date="$emit('removeItem')"
  />
</template>

<style lang="scss" scoped>
.b-input-date {
  background-color: white;
  box-shadow: 0 0 0 2px #1d74f5 inset;
  margin-right: 0;
  height: 100%;
  :deep(.b-input2) {
    padding: 0 8px !important;
    background-color: transparent !important;
    &.ant-input-affix-wrapper-focused,
    &:focus {
      box-shadow: none !important;
    }
  }
  :deep(.ant-input) {
    font-family: 'CustomFont-Regular';
    letter-spacing: 0.02em;
    background-color: transparent !important;
    font-size: 14px;
  }
  :deep(.gray-input) {
    padding-left: 8px !important;
    padding-right: 0 !important;
  }
  :deep(.ant-input-affix-wrapper-focused) {
    box-shadow: none;
  }
}
</style>
