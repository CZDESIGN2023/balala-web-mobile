<script lang="ts" setup>
import { computed, inject, ref } from 'vue'
import dayjs from 'dayjs'
import { getTimeColor } from '@/utils'
import type { TaskStatus } from '@/enum/TaskStatus'
// import type { RadioChangeEvent } from 'ant-design-vue'

interface Props {
  value: string[] | null
  separator?: string
  format?: string
  disabled?: boolean
  status?: TaskStatus
}

const props = withDefaults(defineProps<Props>(), {
  value: () => [],
  separator: '~',
  format: 'YYYY/MM/DD',
  disabled: false,
  status: '' as TaskStatus,
})
const emit = defineEmits(['update:value'])
// const diffDays = ref()
// const view = inject('view', false)
const show = ref(false)

const text = computed(() => {
  if (!props.value || !props.value.length || (props.value && props.value[0] && props.value[0].length < 2))
    return ''
  let startTime: number | string = props.value[0]
  let endTime: number | string = props.value[1]
  if (/^\d+$/.test(startTime)) {
    startTime = Number.parseInt(startTime) * 1000
    endTime = Number.parseInt(endTime) * 1000
  }
  return `${dayjs(startTime).format(props.format)} ${props.separator} ${dayjs(endTime).format(props.format)}`
})

const colorTime = computed(() => {
  if (text.value && props.status) {
    if (/^\d{10}$/.test(props.value![1])) {
      return getTimeColor(Number.parseInt(props.value![1]), props.status)
    }
    return getTimeColor(Number(dayjs(props.value![1]).unix()), props.status)
  }
  return ''
})

// function customFormat(val: dayjs.Dayjs) {
//   if (!props.value)
//     return ''
//   if (dayjs(props.value[1]).format('YYYY/MM/DD') === val.format('YYYY/MM/DD')) {
//     const diffInDays = dayjs(props.value[1]).diff(dayjs(props.value[0]), 'day')
//     if (diffInDays === 6) {
//       diffDays.value = 7
//     }
//     else if (diffInDays >= 300) {
//       diffDays.value = 300
//     }
//     return diffInDays > 300 ? '长期' : val.format(props.format)
//   }
//   return val.format(props.format)
// }

// function onRadioChange(e: RadioChangeEvent) {
//   switch (e.target.value) {
//     case 7:
//       updateValue([dayjs().format('YYYY/MM/DD'), dayjs().add(6, 'day').format('YYYY/MM/DD')])
//       break
//     case 300:
//       updateValue([dayjs().format('YYYY/MM/DD'), dayjs().add(1, 'year').format('YYYY/MM/DD')])
//       break
//   }
// }

// function updateValue(date: string[]) {
//   emit('update:value', [`${date[0]} 00:00:00`, `${date[1]} 23:59:59`])
// }

function onConfirm([start, end]: Date[]) {
  emit('update:value', [`${dayjs(start).format('YYYY/MM/DD')} 00:00:00`, `${dayjs(end).format('YYYY/MM/DD')} 23:59:59`])
  show.value = false
}
</script>

<template>
  <div>
    <BInput2
      :value="text"
      :class="[colorTime] "
      class="b-range-picker"
      placeholder="起始日期 ~ 截止日期"
      readonly
      @click="() => {
        if (!$props.disabled)
          show = true
      }"
    />
    <van-calendar v-model:show="show" title="总排期选择" type="range" switch-mode="year-month" allow-same-day @confirm="onConfirm" />
  </div>
</template>

<style lang="scss">
.b-range-picker {
  &.grey-time .ant-input {
    color: #999999;
  }
  &.red-time .ant-input {
    color: #e43535;
  }
  &.yellow-time .ant-input {
    color: #ff9800;
  }
}
</style>
