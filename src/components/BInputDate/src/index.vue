<script lang="ts" setup>
import { inject, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { throttle } from 'xe-utils'
import type { WorkDetailInfo } from '@/api/interface'
import { formatDate, getTimeColor, isEmptyObject } from '@/utils'
import { getPlacement } from '@/utils/position'
import type { TaskStatus, TaskStatusKey } from '@/enum/TaskStatus'

defineOptions({ name: 'BInputDate' })

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '',
  info: () => ({}),
  classType: '',
  foramtVal: 'YYYY/MM/DD',
  attach: 'body',
  disabled: false,
  // 空数据时显示气泡提示
  showTips: '',
  // 超出时是否显示缩略
  showTimeTips: false,
  // 任务状态（时间颜色）
  taskStatus: '' as TaskStatus,
  plain: false,
  hideClear: false,
})

const emits = defineEmits(['onChange', 'onClose', 'onRecovery', 'onChangeSameDate'])

interface Props {
  width?: string
  height?: string
  info?: WorkDetailInfo
  classType?: string
  foramtVal?: string
  attach?: string
  disabled?: boolean
  showTips?: string
  showTimeTips?: boolean
  taskStatus?: TaskStatus
  plain?: boolean
  hideClear?: boolean
}

interface TimeRange {
  complete: string
  start: string
}

const view = inject('view', false)
const contentRef = ref()
const inputRef = ref()

// 当前弹框是否显示
const popupVisible = ref<boolean>(false)
// 是否是7天
const isSevenDay = ref<boolean>(false)
// 是否是长期
const isLongDate = ref<boolean>(false)
// 时间数组
const timeRange = ref<string[]>([])
// 时间显示
const timeValue = ref('')
// 确认时间
const selectTime = ref<WorkDetailInfo>({})

const timeJudge = ref<TimeRange>({
  complete: '',
  start: '',
})

let startOld = 'start'

const state = reactive({ placement: 'bottom-left' })
const isContentOverflow = ref(false)
onMounted(() => {
  state.placement = getPlacement(contentRef.value, { height: 373 }) || 'bottom-left'
  isShowTips()
})

watch(timeValue, (newContentEl) => {
  if (newContentEl)
    isShowTips()
  else
    isShowTips()
}, {
  immediate: true,
})

// 判断是否显示 tip
function isShowTips() {
  if (contentRef.value) {
    setTimeout(() => {
      isContentOverflow.value = (contentRef.value?.querySelector('.ant-input').scrollWidth - 1 > contentRef.value?.querySelector('.ant-input').clientWidth)
    }, 1)
  }
}

// 点击确认
function handleConfirm(emitName: any) {
  const currentDate = dayjs().format('YYYY/MM/DD')
  timeRange.value[0] = timeRange.value[0] || currentDate
  timeRange.value[1] = timeRange.value[1] || currentDate
  const startUnix = String(dayjs(timeRange.value[0]).unix())
  const endUnix = String(dayjs(timeRange.value[1]).endOf('day').unix())

  const diffInDays = dayjs(timeRange.value[1]).diff(dayjs(timeRange.value[0]), 'day')
  let planTimeAt = {
    start: `${timeRange.value[0]} 00:00:00`,
    complete: `${timeRange.value[1]} 23:59:59`,
  }

  isSevenDay.value = diffInDays === 6
  isLongDate.value = diffInDays >= 300
  popupVisible.value = false
  if (props.foramtVal === 'MM/DD') {
    if (isLongDate.value)
      timeValue.value = `${formatDate(startUnix, 'MM/DD')} ~ 长期`
    else
      timeValue.value = `${formatDate(startUnix, 'MM/DD')} ~ ${formatDate(endUnix, 'MM/DD')}`
  }
  else {
    timeValue.value = isLongDate.value
      ? `${timeRange.value[0]} ~ 长期`
      : `${timeRange.value.join(' ~ ')}`
  }
  if (timeRange.value.length === 0) {
    planTimeAt = {
      start: `${dayjs().format('YYYY/MM/DD')} 00:00:00`,
      complete: `${dayjs().format('YYYY/MM/DD')} 23:59:59`,
    }
    timeValue.value = `${dayjs().format('YYYY/MM/DD')} ~ ${dayjs().format('YYYY/MM/DD')}`
  }
  selectTime.value = {
    planStartAt: startUnix,
    planCompleteAt: endUnix,
  }
  if (timeJudge.value.complete === endUnix && timeJudge.value.start === startUnix) {
    emits('onChangeSameDate')
    return
  }

  emits(emitName, planTimeAt, startUnix, endUnix)
}

// 处理时间
function isEditTime(info: WorkDetailInfo, classType: string) {
  // 传入时间
  if (info && info.planStartAt && classType) {
    handleTime(info, classType, true)
    return
  }
  if (info && info.start) {
    // 单独处理筛选的排期
    const timeInfo = {
      planStartAt: String(dayjs(info.start).unix()),
      planCompleteAt: String(dayjs(info.complete).unix()),
    }
    handleTime(timeInfo, classType)
  }
  // 上次确认时间
  else if (!isEmptyObject(selectTime.value) && classType && classType !== 'filter-date') {
    handleTime(selectTime.value, classType, true)
  }
}

function handleTime(info: WorkDetailInfo, classType: string, isEdit?: boolean) {
  if (info?.planStartAt === 'NaN' || info?.planStartAt === '0') {
    timeRange.value = []
    timeValue.value = ''
    return
  }
  const start = dayjs(formatDate(info?.planStartAt))
  const end = dayjs(formatDate(info?.planCompleteAt))
  const diffInDays = end.diff(start, 'day')
  getTimeColor(Number(info?.planCompleteAt), props.taskStatus)
  const showTime = [
    formatDate(info?.planStartAt ?? '', classType?.includes('table-style') ? 'MM/DD' : 'YYYY/MM/DD'),
    formatDate(info.planCompleteAt ?? '', classType.includes('table-style') ? 'MM/DD' : 'YYYY/MM/DD'),
  ]
  timeRange.value = [
    formatDate(info.planStartAt ?? '', 'YYYY/MM/DD'),
    formatDate(info.planCompleteAt ?? '', 'YYYY/MM/DD'),
  ]
  timeValue.value = diffInDays > 300 ? `${showTime[0]} ~ 长期` : `${showTime.join(' ~ ')}`
  isSevenDay.value = diffInDays === 6
  isLongDate.value = diffInDays >= 300

  if (isEdit && !classType?.includes('table-style')) {
    // handleConfirm('onRecovery')
  }
}

// // 获取排期颜色
// // endTime:项目结束时间
// let timeColor = ref<string>('')
// const getTimeColor = (endTime: number = 0) => {
//   if (!endTime || !props?.taskStatus) return

//   // 完成/终止
//   if ([2, 3, 8].includes(props.taskStatus)) {
//     timeColor.value = 'grey-time'
//     return
//   }

//   // 当前时间
//   const timestamp = Math.floor(Date.now() / 1000)

//   // 未逾期
//   if (endTime > timestamp) {
//     // 截止时间3小时内
//     if (endTime - timestamp < 3 * 60 * 60) {
//       timeColor.value = 'yellow-time'
//     } else {
//       timeColor.value = ''
//     }
//   }
//   // 逾期
//   else {
//     timeColor.value = 'red-time'
//   }
// }

watch(
  props,
  (newVal) => {
    timeJudge.value.start = String(newVal.info.planStartAt)
    timeJudge.value.complete = String(newVal.info.planCompleteAt)
    isEditTime(newVal.info, newVal.classType)
  },
  {
    deep: true,
    immediate: true,
  },
)

watch(timeRange, (n) => {
  if (n.length < 2) {
    isSevenDay.value = false
    isLongDate.value = false
  }
})

// 监听是否显示日期选择器
const changePopup = throttle((visible: boolean) => {
  if (visible === false) {
    cleanDate(false)
    emits('onClose')
  }
  if (!visible)
    isEditTime(props.info, props.classType)

  popupVisible.value = visible
}, 100)

watch(
  () => popupVisible.value,
  (val) => {
    if (!val && timeRange.value.length === 1) {
      timeRange.value = []
      startOld = startOld === 'start' ? 'end' : 'start'
    }
  },
)

// 时间更改
function changeTime() {
  // isLongDate.value = false
  // isSevenDay.value = false
}

// 点击7天
function chooseSevenDay() {
  const today = dayjs().format('YYYY/MM/DD')
  const sevenDays = dayjs().add(6, 'day').format('YYYY/MM/DD')
  isLongDate.value = false
  isSevenDay.value = !isSevenDay.value
  if (isSevenDay.value)
    timeRange.value = [today, sevenDays]
  else
    timeRange.value = []
}

// 点击长期
function chooseLongDate() {
  const today = dayjs().format('YYYY/MM/DD')
  const oneYear = dayjs().add(1, 'year').format('YYYY/MM/DD')
  isSevenDay.value = false
  isLongDate.value = !isLongDate.value
  if (isLongDate.value)
    timeRange.value = [today, oneYear]
  else
    timeRange.value = []
}

// 输入框更改
function changeInput() {
  if (
    isEmptyObject(timeRange.value)
    && timeJudge.value.start === '0'
    && timeJudge.value.complete === '0'
  )
    return

  if (!timeValue.value) {
    timeRange.value = []
    emits('onChange', { start: '', complete: '' })
  }
}

// 点击取消
function handleCancel() {
  if (!timeValue.value) {
    timeRange.value = []
    isLongDate.value = false
    isSevenDay.value = false
  }
  isEditTime(props.info, props.classType)
  popupVisible.value = false
  emits('onClose')
}

const getTwoNum = (num: number): string => (num > 9 ? num.toString() : `0${num}`)

let startNew: string

function onCellClick(value: any) {
  isLongDate.value = false
  isSevenDay.value = false

  startNew = value.partial

  if (startNew === startOld) {
    let cTarget = value.e.target

    if (cTarget.classList.contains('t-date-picker__cell'))
      cTarget = cTarget.childNodes[0]

    const pDate = cTarget.parentNode
    const panelControl = pDate.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector(
      '.t-date-picker__header-controller',
    )
    // 年
    let pYear = Number.parseInt(
      panelControl
        .querySelector('.t-date-picker__header-controller-year')
        .querySelector('.t-input__inner').value,
    )
    // 月
    let pMonth = Number.parseInt(
      panelControl
        .querySelector('.t-date-picker__header-controller-month')
        .querySelector('.t-input__inner').value,
    )
    // 日
    const cDate = Number.parseInt(cTarget.innerHTML)

    if (pDate.classList.contains('t-date-picker__cell--additional')) {
      if (pDate.getAttribute('type') === 'prev-month') {
        // 上个月
        if (pMonth === 1) {
          pMonth = 12
          pYear--
        }
        else {
          pMonth--
        }
      }
      else {
        // 下个月
        if (pMonth === 12) {
          pMonth = 1
          pYear++
        }
        else {
          pMonth++
        }
      }
    }

    timeRange.value = [`${pYear}/${getTwoNum(pMonth)}/${getTwoNum(cDate)}`]
  }
}

// 点击清除图标-清除日期
function cleanDate(typ?: boolean) {
  if (typ) {
    timeValue.value = ''
    timeRange.value = []
    popupVisible.value = false
    selectTime.value = {}
    changeInput()
    return
  }
  isLongDate.value = false
  isSevenDay.value = false
}

// 输入框失焦
function onblur() {
  // if (popupVisible.value)
  //   return
  // handleCancel()
}

function dropdown() {
  popupVisible.value = true
  // inputRef.value.focus()
}

defineExpose({ cleanDate, dropdown })
</script>

<template>
  <div class="b-input-date w348 mr16" :class="{ 'b-input-date-view': view }" :style="{ width }">
    <t-popup
      content="文字提示仅展示文本内容"
      destroy-on-close
      trigger="click"
      :placement="state.placement"
      :visible="popupVisible"
      overlay-class-name="b-input-date-wrap"
      :on-visible-change="changePopup"
      :disabled="disabled"
      :attach="props.attach"
    >
      <template #content>
        <div class="b-input-date-content">
          <t-date-range-picker-panel
            v-model="timeRange"
            :first-day-of-week="1"
            :disable-date="disabled ? { before: dayjs().subtract(1, 'day').format() } : {}"
            :on-cell-click="onCellClick"
            format="YYYY/MM/DD"
            @change="changeTime"
          />
          <div class="date-foot pt16 flex-row-between">
            <div class="flex">
              <div
                class="left pointer main-color flex-row-start mr21"
                :class="{ active: isSevenDay }"
                @click="chooseSevenDay"
              >
                <div class="icon mr5" />
                7天
              </div>

              <div
                class="left pointer main-color flex-row-start"
                :class="{ active: isLongDate }"
                @click="chooseLongDate"
              >
                <div class="icon mr5" />
                长期
              </div>
            </div>

            <div class="right">
              <el-button class="btn cancel-btn" size="default" plain @click="handleCancel">
                取消
              </el-button>
              <el-button
                :disabled="timeRange?.length === 1"
                class="btn confirm-btn"
                size="default"
                type="primary"
                @click="handleConfirm('onChange')"
              >
                确认
              </el-button>
            </div>
          </div>
        </div>
      </template>
      <div ref="contentRef" class="select-box flex-row-between" :style="{ height }">
        <el-tooltip :content="timeValue" placement="top" :disabled="!isContentOverflow || popupVisible">
          <BInput2
            ref="inputRef"
            v-model:value="timeValue"
            v-bind="$attrs"
            :style="{ width, height }"
            :class="[classType, getTimeColor(Number(info?.planCompleteAt), taskStatus)]"
            :disabled="disabled"
            readonly
            placeholder="起始日期 ~ 截止日期"
            :title="timeValue"
            @change="changeInput"
            @blur="onblur"
          >
            <template #suffix>
              <a-tooltip
                v-if="popupVisible && timeValue && !disabled && classType !== 'filter-date' && !props.plain && !props.hideClear"
                title="清空"
                effect="dark"
              >
                <img
                  class="delete-icon w16"
                  src="@/assets/svg/input-close.svg"
                  @click.stop="cleanDate(true)"
                >
              </a-tooltip>
              <svg-icon v-if="!props.plain" name="date" size="16" color="#666666" />
            </template>
          </BInput2>
        </el-tooltip>
      </div>
    </t-popup>
  </div>
</template>

<style lang="scss">
/* ----- tdesign 日期组件 样式 ----- */
.b-input-date-wrap {
  &[data-popper-placement^='left'] .t-popup__content--text {
    max-width: initial;
  }
  .t-popup__content {
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow;
    border-radius: 8px;
  }
  .b-input-date-content {
    padding: 12px 8px;
    .t-date-range-picker__panel-content-wrapper {
      gap: 0 24px;
      .t-date-picker__panel-date {
        width: 258px;
      }
    }
    .t-date-picker__panel-date {
      padding: 0;
      .t-date-picker__header {
        gap: 6px;
        justify-content: start;
        .t-date-picker__header-controller {
          gap: 12px;
        }
        .t-input.t-is-readonly {
          background-color: $color-input;
          border: 0;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          &:hover {
            background-color: $color-input-hover;
          }
        }
        .t-input.t-is-focused {
          background-color: #fff;
          box-shadow: 0 0 0 1.6px $color-primary;
          &:hover {
            background-color: #fff;
          }
        }
        .t-select-option.t-is-selected {
          background-color: #edf5ff;
          color: $color-primary;
        }
        .t-select .t-fake-arrow {
          color: $color-main;
        }
      }
      .t-date-picker__table {
        thead {
          border-bottom: 1px solid $color-input-hover;
          &::before,
          &::after {
            line-height: 0;
          }
          th {
            color: $color-icon;
            width: 30px;
            height: 30px;
          }
        }
        .t-date-picker__cell {
          &::before,
          &::after {
            height: 30px;
            border-radius: 6px;
            background-color: #edf5ff;
            left: -12%;
            right: -12%;
          }
          .t-date-picker__cell-inner {
            width: 30px;
            height: 30px;
            margin: 2px 0px;
            font-size: 14px;
            color: $color-icon;
            font-weight: initial;
            border-radius: 6px;
          }
          &.t-date-picker__cell--disabled {
            &::before,
            &::after {
              display: none;
            }
            .t-date-picker__cell-inner {
              background: #f7f8fa;
            }
          }
          &.t-date-picker__cell--additional {
            .t-date-picker__cell-inner {
              color: $color-minor;
            }
          }
          &.t-date-picker__cell--now {
            .t-date-picker__cell-inner {
              background: none;
              color: $color-primary;
            }
            &.t-date-picker__cell--active {
              .t-date-picker__cell-inner {
                background: $color-primary;
                color: #fff;
              }
            }
          }
          &.t-date-picker__cell--now {
            .t-date-picker__cell-inner {
              border: 1px solid $color-primary;
            }
          }
          &:hover {
            .t-date-picker__cell-inner {
              box-shadow: none;
              background: $color-bg-hover;
            }
          }
        }
        .t-date-picker__table-date-row {
          .t-date-picker__cell {
            &:first-child {
              &::before,
              &::after {
                left: 3px;
              }
            }
            &:last-child {
              &::before,
              &::after {
                right: 3px;
              }
            }
          }
        }
        .t-date-picker__cell--active {
          &.t-date-picker__cell--active-start {
            &::before,
            &::after {
              left: 3px;
              right: -12%;
            }
          }
          &.t-date-picker__cell--active-end {
            &::before,
            &::after {
              left: -12%;
              right: 3px;
            }
          }
          &.t-date-picker__cell--active-start.t-date-picker__cell--active-end {
            &::before,
            &::after {
              left: 3px;
              right: 3px;
            }
          }
          .t-date-picker__cell-inner {
            background-color: $color-primary;
            color: #fff;
            &:hover {
              background-color: $color-primary;
              color: #fff;
            }
          }
        }
      }
    }
  }

  .date-foot {
    .left {
      .icon {
        width: 14px;
        height: 14px;
        border: 1px solid rgba(0, 0, 0, 0.4);
        border-radius: 50%;
      }
      &.active {
        .icon {
          border-color: $color-primary;
          position: relative;
          &::after {
            content: '';
            width: 7px;
            height: 7px;
            background-color: $color-primary;
            border-radius: 50%;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      }
    }
    .btn {
      border-radius: 6px;
      padding: 12px 23px;
    }
  }
}

.b-input-date {
  &.b-input-date-view {
    .ant-input-suffix {
      opacity: 0;
      transition: 0.3s;
    }
  }
  .select-box {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    font-size: 14px;
    color: $color-minor;
    cursor: pointer;
    .table-style {
      border-radius: 0;
      .ant-input-suffix {
        display: none;
      }
      &:hover {
        background: none;
      }
    }
    .b-input2 {
      &:hover,
      &.ant-input-affix-wrapper-focused {
        .ant-input-suffix {
          opacity: 1;
        }
      }
    }
    .ant-input-suffix {
      display: flex;
    }
    // .notIcon {
    //   .ant-input-suffix {
    //     display: none;
    //   }
    // }
    .radius {
      border-radius: 6px;
    }
    .error {
      width: calc(100% - 3.2px) !important;
      height: calc(100% - 3.2px);
      box-shadow: 0 0 0 1.6px #fd4c4c;
      position: relative;
      left: 1.6px;
    }
  }

  .delete-icon {
    display: none;
  }
}

.t-date-picker__cell--active-start ~ .t-date-picker__cell--additional::before {
  opacity: 1;
}

.b-input-date-wrap
  .b-input-date-content
  .t-date-picker__panel-date
  .t-date-picker__table {
  .t-date-picker__cell--hover-highlight:not(:last-child):not(
      .t-date-picker__cell--active-end
    ).t-date-picker__cell--hover-end::after,
  .t-date-picker__cell:not(:last-child):not(
      .t-date-picker__cell--active-end
    ):not(
      .t-date-picker__cell--active-start
    ).t-date-picker__cell--hover-start::after {
    width: 38px;
  }
  .t-date-picker__cell:not(:last-child):not(
      .t-date-picker__cell--active-end
    ).t-date-picker__cell--active-start.t-date-picker__cell--hover-start::after,
  .t-date-picker__cell--hover-highlight:first-child.t-date-picker__cell--hover-start::after,
  .t-date-picker__cell--highlight.t-date-picker__cell--active-start:last-child::after,
  .t-date-picker__cell--highlight.t-date-picker__cell--active-start::before {
    width: 30px;
  }
  .t-date-picker__cell--additional.t-date-picker__cell--active-start::before,
  .t-date-picker__cell--highlight.t-date-picker__cell--active-end::before,
  .t-date-picker__cell:not(.t-date-picker__cell--hover-highlight)
    + .t-date-picker__cell--hover-highlight.t-date-picker__cell--hover-end::after,
  .t-date-picker__cell:not(.t-date-picker__cell--hover-highlight)
    + .t-date-picker__cell--hover-highlight.t-date-picker__cell--hover-start::after,
  .t-date-picker__cell--highlight.t-date-picker__cell--hover-highlight.t-date-picker__cell--first-day-of-month:last-child::after,
  .t-date-picker__cell--highlight.t-date-picker__cell--first-day-of-month:last-child::before {
    left: 4px;
  }
}
</style>

<style lang="scss" scoped>
.b-input-date:hover {
  .delete-icon {
    display: block;
  }
}

.select-box {
  :deep() {
    .ant-input {
      text-overflow: ellipsis !important;
    }
  }
}

.default-time:deep(.ant-input) {
  color: #333 !important;
  &:disabled {
    color: #333 !important;
    -webkit-text-fill-color: #333 !important;
  }
}

.grey-time {
  :deep(.ant-input) {
    color: #999999 !important;
    &:disabled {
      color: #999999 !important;
      -webkit-text-fill-color: #999999 !important;
    }
  }
}

.yellow-time {
  :deep(.ant-input) {
    color: #ff9800;
  }
}

.red-time {
  :deep(.ant-input) {
    color: #e43535;
  }
}

.b-input-date-content {
  :deep() {
    .t-date-picker__header-controller {
      flex-direction: row-reverse;
      width: calc(100% - 24px);
      margin-left: 14px;
    }

    .t-pagination-mini {
      display: none;
    }

    .t-select__wrap {
      width: 50%;
    }
  }
}

.ellipsis-time {
  color: rgba(0, 0, 0, 0.88);
  line-height: 32px;
  position: relative;
  cursor: text;

  .ellipsis-time-svg {
    position: absolute;
    right: 12px;
    top: 8px;
  }

  &:hover {
    border-color: #4096ff;
  }
}

.ellipsis-time-placeholder {
  color: #999999;
}
</style>
