<script lang="ts" setup>
import { getCurrentInstance, nextTick, ref, shallowRef } from 'vue'
import TaskAdd from './task-add.vue'
import TaskEdit from './task-edit.vue'
import TaskChildEdit from './task-edit-child.vue'
import { TaskDrawerOpenType } from '@/enum'
import type { TaskDrawerProps } from '@/api/interface/common'

defineOptions({ name: 'TaskIndex' })

const componentRef = ref()
const currentComponent = shallowRef()
const componentProps = ref<TaskDrawerProps>()
const showComponent = ref(true)
const { proxy } = getCurrentInstance() as any

// 打开弹框弹框
function openDrawer(data: TaskDrawerProps) {
  showComponent.value = true
  switch (data.openType) {
    case TaskDrawerOpenType.DETAIL:
      currentComponent.value = TaskEdit
      componentProps.value = {
        openType: data.openType,
        taskTabKey: data.taskTabKey,
        taskParams: data.taskParams,
      }
      nextTick(() => {
        componentRef.value?.openTaskDrawer()
      })
      break
    case TaskDrawerOpenType.CHILD_DETAIL:
      currentComponent.value = TaskChildEdit
      componentProps.value = {
        openType: data.openType,
        taskTabKey: data.taskTabKey,
        taskParams: data.taskParams,
      }
      nextTick(() => {
        componentRef.value?.openChildTaskDrawer()
      })
      break
    default:
      currentComponent.value = TaskAdd
      componentProps.value = {
        openType: data.openType,
        taskParams: {},
      }
      nextTick(() => {
        componentRef.value?.openTaskDrawer()
      })
  }
}

function handleCloseDrawer(isEmit: boolean = true) {
  currentComponent.value = null
  if (isEmit)
    proxy.mittBus.emit('closeTaskDialog')
}

defineExpose({
  openDrawer,
})
</script>

<template>
  <component
    :is="currentComponent"
    v-bind="componentProps"
    ref="componentRef"
    @on-close-drawer="handleCloseDrawer"
  />
</template>

<style lang="scss" scoped></style>
