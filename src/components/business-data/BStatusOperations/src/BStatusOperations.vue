<script setup lang="ts">
import { computed } from 'vue'
import { TaskStatus, archivedTaskStatus } from '@/enum/TaskStatus'
import type { TableRowData } from '@/views/project/types/table'

interface Props {
  row: TableRowData
  active: boolean
  showRestart: boolean
  miniHover?: boolean
  ellipsis?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  row: () => { return {} as TableRowData },
  active: false,
  miniHover: false,
  ellipsis: false,
  showRestart: false,
})

defineEmits(['onClick', 'mouseOverBack'])

// 预览文本
const preview = computed(() => {
  return {
    color: props.row.statuColor,
    label: props.row.workItemStatus.name,
  }
})

// 是否禁用
const disabled = computed(() => {
  let isDisabled = true
  if (props.row.perm.allowChangeState || props.row.perm.allowNode) {
    if (props.row.workItemStatus?.val !== TaskStatus.TERMINATED || props.row.pid === '0') {
      isDisabled = false
    }
  }

  // 已完成 和 已终止 状态必须 allowChangeState 才可操作
  if ([TaskStatus.COMPLETED, TaskStatus.TERMINATED].includes(props.row.workItemStatus?.val) && !props.row.perm.allowChangeState)
    isDisabled = true

  // 已关闭，子任务重启 禁用条件：子任务 且 父任务不能是已关闭(8)
  if (props.row.pid !== '0' && props.row.parentStatus?.val === TaskStatus.CLOSE)
    isDisabled = true

  return isDisabled
})

// 操作按钮参数
const operate = computed(() => {
  let result

  // 快速完成
  switch (props.row.workItemStatus.val) {
    case TaskStatus.COMPLETED: // 已完成 重启
    case TaskStatus.CLOSE: // 已关闭 重启
      result = { label: '重启', color: '#1D74F5', type: 'restart' }
      break
    case TaskStatus.TERMINATED: // 已终止 恢复
      result = { label: '恢复', color: '#1D74F5', type: 'restore' }
      break
    default:
      if (!props.row.flowNode?.enableClose) {
        result = { label: '快速完成', color: '#1D74F5', type: 'quickComplete' }
      }
      else {
        result = { label: props.row.workItemStatus.name, color: '#FFE6C4', type: 'confirm', textColor: 'rgba(0, 0, 0, 0.8)' }
      }
      break
  }

  // 子任务重启
  if (props.row.pid !== '0' && props.row.workItemStatus?.val === TaskStatus.COMPLETED && archivedTaskStatus.includes(props.row.parentStatus?.val as TaskStatus))
    result = null

  return result
})
</script>

<template>
  <div
    :class="{ 'disabled': disabled || !operate, active, 'show-restart': showRestart }"
    class="b-status-operations flex-row-start"
    @click="e => {
      if (!disabled && operate)
        $emit('onClick', e, operate?.type)
    }"
  >
    <div
      :style="{ background: preview.color }"
      class="content-ctn flex-inline h24 pl8 pr8 br4 text14"
    >
      <b-ellipsis
        :content="preview.label"
        :ellipsis="ellipsis"
        content-class="pfm"
        style="min-width: 20px;"
        @mouse-over-back="(e: MouseEvent) => $emit('mouseOverBack', e, preview.label)"
      />
      <div
        v-if="!disabled && operate"
        :class="{ 'mini-hover': miniHover }"
        :style="{ background: operate.color, color: operate.textColor }"
        class="operate h24 pl8 pr8 br4"
        @mouseover="e => miniHover ? $emit('mouseOverBack', e, operate?.label) : ''"
      >
        <img v-if="operate.type === 'quickComplete'" class="w14 h14 mr5" src="@/assets/yes.jpg">
        <template v-if="operate.type !== 'quickComplete' || (operate.type === 'quickComplete' && !miniHover)">
          {{ miniHover ? '...' : operate.label }}
        </template>
        <svg-icon v-if="operate.type === 'confirm'" class="confirm-icon" name="arrow-b-out" size="16" color="rgba(0, 0, 0, 0.6)" />
      </div>
    </div>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.b-status-operations {
  color: rgba(0, 0, 0, 0.8);
  height: calc(var(--vxe-table-row-height-default) - 1px);
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  max-width: calc(100% + 16px);
  margin: 0 -8px 1px -8px;
  padding: 0 8px;
  &.active,
  &:hover {
    &::after {
      content: '';
      display: block;
      position: absolute;
      width: calc(100% - 8px);
      height: calc(100% - 4px);
      background: rgba(249, 250, 251);
      z-index: 2;
    }
    .operate {
      display: inline-flex;
    }
  }
  &.disabled {
    cursor: not-allowed;
    &::after {
      display: none;
    }
  }
  &.active {
    border-color: #1d74f5;
  }
  &.show-restart {
    padding-right: 18px;
  }
  .content-ctn {
    position: relative;
    z-index: 4;
    max-width: 100%;
    text-align: center;
    line-height: 24px;
    background: rgb(212, 229, 255);
  }
  .label {
    line-height: 14px;
    padding-top: 5px;
  }
  .operate {
    min-width: 100%;
    position: absolute;
    left: 0;
    top: 0;
    align-items: center;
    justify-content: center;
    display: none;
    color: white;
    width: max-content;
    z-index: 20;
    &.mini-hover {
      width: 100%;
      img {
        margin-right: 0;
      }
    }
  }
  .confirm-icon {
    margin-right: -4px;
  }
}
</style>
