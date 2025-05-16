<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { getParentElementByClass } from '@/utils/dom'
import WorkItemName from '@/components/BTablePopup/src/WorkItemName.vue'
import PrioritySelect from '@/components/BTablePopup/src/PrioritySelect.vue'
import DirectorSelect from '@/components/BTablePopup/src/DirectorSelect.vue'
import ProcessRate from '@/components/BTablePopup/src/ProcessRate.vue'
import PlanDate from '@/components/BTablePopup/src/PlanDate.vue'
import type { TableTaskItem } from '@/api/interface'
import type { TableRowData } from '@/views/project/types/table'

defineOptions({ name: 'BTablePopup' })

defineEmits(['onChange', 'onClose', 'success'])

/** STATE */
interface Props {
  row: TableRowData
  index: number
  level: string
}
interface Options {
  type: string
  clickOutside: boolean
  props: Props
  style: any
  addTime: number
  hideContent?: boolean
  width?: string
  border?: boolean
}

enum COMPONENT_TYPE {
  prioritySelect = 'prioritySelect',
}

const TYPES = {
  workItemName: WorkItemName,
  prioritySelect: PrioritySelect,
  director: DirectorSelect,
  processRate: ProcessRate,
  planDate: PlanDate,
}

const lockScroll = inject('lockScroll') as Ref<number>
const componentRef = ref()
const state = reactive({
  list: [] as Options[],
})

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

/** METHODS */
/**
 * 增加弹窗方法
 * @params e: 点击的鼠标事件
 * @params options: {type: string 目标组件类型名称, clickOutside: boolean 值为 false 时，子组件需自行处理 clickOutSide 事件}
 * @params props: 绑定到目标组件的 props，如: WorkItemName 组件
 */
function pop(e: MouseEvent, options: Options, props: any) {
  // 如果已经有则移除
  const existIndex = findItem({ type: options.type, props })
  lockScroll.value++
  if (existIndex > -1)
    return removeItem(existIndex)

  // 获取目标父级 dom节点
  const result = getParentElementByClass(e.target as HTMLElement, 'vxe-body--column')
  // 获取位置
  const rect = result?.getBoundingClientRect()
  // 把东西搬到指定位置
  const nextid = requestAnimationFrame(() => {
    state.list.push({
      type: options.type,
      clickOutside: options.clickOutside,
      hideContent: options.hideContent,
      border: options.border ?? true,
      props,
      style: {
        left: `${rect?.left}px`,
        top: `${rect?.top}px`,
        height: `${rect?.height as number - 1}px`,
        width: options.width ? options.width : `${rect?.width as number - 1}px`,
      },
      addTime: Date.now(),
    })
    cancelAnimationFrame(nextid)
  })
}

function clickOutside(d: Options, i: number) {
  if (d.clickOutside === false) { componentRef.value[i]?.clickOutside?.() }
  else {
    const index = findItem(d)
    if (index > -1)
      removeItem(index)
  }
}

function findItem(d: any) {
  let index = -1
  state.list.find((item, i) => {
    if (item.type === d.type && item.props.row.key === d.props.row.key) {
      index = i
      return true
    }
    return false
  })
  return index
}

function removeItem(i: number) {
  if (componentRef.value[i]?.close)
    componentRef.value[i]?.close()
  setTimeout(() => {
    lockScroll.value--
    state.list.splice(i, 1)
  }, 200)
}

function onResize() {
  clear()
}

function clear() {
  lockScroll.value = lockScroll.value - state.list.length
  state.list = []
}

defineExpose({ pop, clear })
</script>

<template>
  <teleport to="body">
    <div>
      <div
        v-for="(d, i) in state.list"
        :key="d.addTime"
        v-click-outside="() => clickOutside(d, i)"
        :style="d.style"
        :class="{ 'hide-content': d.hideContent, 'border': d.border }"
        class="content-item"
      >
        <component
          :is="TYPES[d.type as COMPONENT_TYPE]"
          ref="componentRef"
          v-bind="d.props"
          @remove-item="() => removeItem(i)"
          @on-change="(...arg: any) => $emit('onChange', ...arg)"
          @on-close="(...arg: any) => $emit('onClose', ...arg)"
          @success="(...arg: any) => $emit('success', ...arg)"
        />
      </div>
    </div>
  </teleport>
</template>

<style lang="scss" scoped>
.content-item {
  position: fixed;
  display: flex;
  z-index: 999;
  align-items: center;
  line-height: 22px;
  &.hide-content {
    pointer-events: none;
    > :deep(div) {
      opacity: 0;
    }
  }
  &.border {
    box-shadow: 0 0 0 2px #1d74f5 inset;
  }
}
</style>
