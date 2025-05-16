<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { verifyStatusAndRoleName } from '@/utils/validate'
import router from '@/router'
import { getWorkItemStatusList, getWorkStatusRelationCount, workItemStatusCreate, workItemStatusDel, workItemStatusNameSet, workItemStatusRankingSet } from '@/api/workflow'
import { Msgbox } from '@/utils/msgbox'

const workItemStatusList = ref([])
const spaceId = router.currentRoute.value.params.id as string

function $getWorkItemStatusList() {
  return new Promise((resolve) => {
    getWorkItemStatusList({ spaceId })
      .then((d) => {
        workItemStatusList.value = d.data.list.map((item: any) => {
          return Object.assign(item, { label: item.name, value: item.id, default: item.isSys })
        })
        resolve(true)
      })
  })
}

function onRemove(item: any) {
  return new Promise((resolve, reject) => {
    workItemStatusDel({ spaceId, id: item.value })
      .then((d) => {
        resolve(d)
        $getWorkItemStatusList()
      })
      .catch((err) => {
        Msgbox.warning.m({
          title: `任务状态无法删除`,
          content: `${err.message}`,
        })
        reject(new Error('删除任务状态失败'))
      })
  })
}

async function onInteractionRemove(item: any) {
  const res = await getWorkStatusRelationCount({ spaceId, id: item.value })
  const relateCount = Number(res.data.total)
  if (relateCount) {
    Msgbox.warning.m({
      title: `任务状态无法删除`,
      content: `该任务状态已被应用至任务流程中，无法删除`,
    })
    return ''
  }
  else {
    const modalInstance = Msgbox.error.m({
      title: `是否删除任务状态【${item.name}】`,
      okText: `删除`,
    })
    await modalInstance
    try {
      await workItemStatusDel({ spaceId, id: item.value })
      message.success(`任务状态删除成功`, 3)
      return 'success'
    }
    catch (err: any) {
      message.error(err.message, 3)
    }
  }
}

function onAdd(item: any) {
  return new Promise((resolve, reject) => {
    const label = item.label.replace(/\s+/g, '')
    workItemStatusCreate({ spaceId, name: label })
      .then(async (d) => {
        message.success('任务状态创建成功', 3)
        await $getWorkItemStatusList()
        resolve(d)
      })
      .catch(() => {
        reject(new Error('添加任务状态失败'))
      })
  })
}
function onChange(item: any) {
  return new Promise((resolve, reject) => {
    const label = item.label.replace(/\s+/g, '')
    workItemStatusNameSet({ spaceId, id: item.value, name: label })
      .then((d) => {
        message.success('任务状态名称编辑成功', 3)
        resolve(d)
        $getWorkItemStatusList()
      })
      .catch(() => {
        reject(new Error('更新任务状态失败'))
      })
  })
}

function onDragChange(val: any[]) {
  workItemStatusRankingSet({ spaceId, list: val.map(item => ({ id: item.id, ranking: item.ranking })) })
    .then(() => {
      $getWorkItemStatusList()
    })
}
</script>

<template>
  <ModalListEdit
    v-model="workItemStatusList"
    :on-add="onAdd"
    :on-change="onChange"
    :on-remove="onRemove"
    :on-interaction-remove="onInteractionRemove"
    :validate="(text:string) => verifyStatusAndRoleName(text)"
    repeat-msg="状态名称重复"
    title="状态管理"
    name="任务状态"
    add-text="添加状态"
    placeholder="请输入任务状态名称，回车确认"
    search-placeholder="搜索任务状态"
    @drag-change="onDragChange"
  >
    <template #default="{ open }">
      <div
        class="process-status process-btn" @click="() => {
          $getWorkItemStatusList()
          open()
        }"
      >
        状态管理
      </div>
    </template>
  </ModalListEdit>
</template>
