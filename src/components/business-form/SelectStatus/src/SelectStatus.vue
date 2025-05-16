<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import router from '@/router'
import { getWorkItemStatusList, workItemStatusCreate, workItemStatusNameSet } from '@/api/workflow'
import { TaskStatusKey } from '@/enum/TaskStatus'

const props = defineProps({ spaceId: { type: String, default: '' } })
const spaceId = router.currentRoute.value.params.id as string
const selectSyncEditRef = ref()

// 获取状态列表
function queryStatusOptions() {
  return new Promise((resolve, reject) => {
    getWorkItemStatusList({ spaceId: spaceId || props.spaceId })
      .then((d) => {
        resolve(d.data.list
          .sort((a: any, b: any) => Number.parseInt(b.ranking) - Number.parseInt(a.ranking))
          .map((item: any) => {
            return Object.assign(item, { label: item.name, value: item.id, default: item.isSys })
          })
          .filter((item: any) => ![TaskStatusKey.CLOSE, TaskStatusKey.COMPLETED, TaskStatusKey.TERMINATED].includes(item.key)),
        )
      })
      .catch(() => {
        reject(new Error('状态获取失败'))
      })
  })
}

function onAdd(label: string) {
  return new Promise((res, rej) => {
    const newLabel = label.replace(/\s+/g, '')
    workItemStatusCreate({ spaceId: spaceId || props.spaceId, name: newLabel })
      .then(() => {
        message.success({ content: '任务状态创建成功' })
        res(true)
      })
      .catch((e) => {
        rej(new Error(e.message))
      })
  })
}

function onEdit(item: any) {
  return new Promise((res, rej) => {
    const label = item.label.replace(/\s+/g, '')
    workItemStatusNameSet({ spaceId: spaceId || props.spaceId, name: label, id: item.id })
      .then(() => {
        message.success({ content: '任务状态编辑成功' })
        return res(true)
      })
      .catch((e) => {
        return rej(new Error(e.message))
      })
  })
}

function refresh() {
  return selectSyncEditRef.value?.refresh()
}

defineExpose({ refresh })
</script>

<template>
  <BSelectSyncEdit
    ref="selectSyncEditRef"
    v-bind="$attrs"
    :query-options="queryStatusOptions"
    :add-fn="onAdd"
    :edit-fn="onEdit"
    placeholder="请选择任务状态"
    search-placeholder="搜索任务状态"
    edit-placeholder="输入任务状态，回车确认"
    create-text="添加状态"
  />
</template>
