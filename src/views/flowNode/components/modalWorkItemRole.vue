<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { verifyStatusAndRoleName } from '@/utils/validate'
import router from '@/router'
import { getWorkItemRoleList, getWorkRoleRelationCount, workItemRoleCreate, workItemRoleDel, workItemRoleNameSet, workItemRoleRankingSet } from '@/api/workflow'
import { Msgbox } from '@/utils/msgbox'

const workItemRoleList = ref([])
const spaceId = router.currentRoute.value.params.id as string

function $getWorkItemRoleList() {
  return new Promise((resolve) => {
    getWorkItemRoleList({ spaceId: router.currentRoute.value.params.id as string })
      .then((d) => {
        workItemRoleList.value = d.data.list.map((item: any) => {
          return Object.assign(item, { label: item.name, value: item.id, default: item.isSys })
        })
        resolve(true)
      })
  })
}

function onRemove(item: any) {
  return new Promise((resolve, reject) => {
    workItemRoleDel({ spaceId, id: item.value })
      .then((d) => {
        resolve(d)
        $getWorkItemRoleList()
      })
      .catch(() => {
        reject(new Error('删除角色失败'))
      })
  })
}

async function onInteractionRemove(item: any) {
  const res = await getWorkRoleRelationCount({ spaceId, id: item.value })
  const relateCount = Number(res.data.total)
  if (relateCount) {
    Msgbox.warning.m({
      title: `角色无法删除`,
      content: `该角色已被应用至任务流程中，无法删除`,
    })
    return ''
  }
  else {
    const modalInstance = Msgbox.error.m({
      title: `是否删除角色【${item.name}】`,
      okText: `删除`,
    })
    await modalInstance
    try {
      await workItemRoleDel({ spaceId, id: item.value })
      message.success(`角色删除成功`, 3)
      return 'succees'
    }
    catch (err: any) {
      message.error(err.message, 3)
    }
  }
}

function onAdd(item: any) {
  return new Promise((resolve, reject) => {
    const label = item.label.replace(/\s+/g, '')
    workItemRoleCreate({ spaceId, name: label })
      .then(async (d) => {
        message.success('角色创建成功', 3)
        await $getWorkItemRoleList()
        resolve(d)
      })
      .catch(() => {
        reject(new Error('添加角色失败'))
      })
  })
}
function onChange(item: any) {
  return new Promise((resolve, reject) => {
    const label = item.label.replace(/\s+/g, '')
    workItemRoleNameSet({ spaceId, id: item.value, name: label })
      .then((d) => {
        resolve(d)
        message.success('角色名称编辑成功', 3)
        $getWorkItemRoleList()
      })
      .catch(() => {
        reject(new Error('更新角色失败'))
      })
  })
}

function onDragChange(val: any[]) {
  workItemRoleRankingSet({ spaceId, list: val.map(item => ({ id: item.id, ranking: item.ranking })) })
    .then(() => {
      $getWorkItemRoleList()
    })
}
</script>

<template>
  <ModalListEdit
    v-model="workItemRoleList"
    :on-add="onAdd"
    :on-change="onChange"
    :on-remove="onRemove"
    :on-interaction-remove="onInteractionRemove"
    :validate="(text:string) => verifyStatusAndRoleName(text)"
    repeat-msg="角色名称重复"
    title="角色管理"
    name="角色"
    add-text="添加角色"
    placeholder="请输入角色名称，回车确认"
    search-placeholder="搜索角色"
    @drag-change="onDragChange"
  >
    <template #default="{ open }">
      <div
        class="process-role process-btn" @click="() => {
          $getWorkItemRoleList()
          open()
        }"
      >
        角色管理
      </div>
    </template>
  </ModalListEdit>
</template>
