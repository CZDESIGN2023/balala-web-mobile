<script lang="ts" setup>
import { type Ref, computed, inject, nextTick, reactive, ref } from 'vue'

import { message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { getFormItems } from '../utils/task'
import childTaskTable from './child-task-table.vue'
import { deepCopy, isEmptyObject } from '@/utils'
import {
  editWorkDescribe,
  editWorkDirector,
  editWorkName,
  editWorkObject,
  editWorkPlantime,
  editWorkPriority,
  editWorkProgress,
  editWorkRemark,
  editWorkTag,
  workVersionChange,
} from '@/api/project'
import type { TaskCompare } from '@/api/interface/common'
import type { PlanTime, TaskPlanTimeAt, WorkDetailData } from '@/api/interface'
import type { TaskPermission } from '@/hooks/useTaskPermission'
import type { ItemProps } from '@/components/form/BForm/src/BForm.vue'
import type { WorkFlowTemplateData } from '@/api/project/types'

const emits = defineEmits(['onUpdateFormItem', 'onUpdateModuleName', 'onUpdateVersionName'])

const taskPermissions = inject('taskPermissions') as Ref<TaskPermission>
const bFormRef = ref()
const childTaskTableRef = ref()
const state = reactive({
  form: {
    planTime: {},
    processRate: 0,
    workItemStatus: {},
  } as WorkDetailData,
  rawForm: {} as WorkDetailData,
  items: {} as { [key: string]: ItemProps },
})

const items = computed(() => {
  if (Object.values(state.items).length <= 0)
    return []
  return [
    state.items.module,
    state.items.priority,
    state.items.workItemName,
    state.items.$creator,
    ...Object.values(state.items).filter(item => item.type === 'personSelect' && item.field !== '$creator'),
    state.items.planTime,
    state.items.processRate,
    state.items.version,
    state.items.tag,
    state.items.describe,
    state.items.line,
    state.items.remark,
    state.items.files,
  ]
})

/** METHODS */

// 修改模块信息
async function changeModule(moduleId: string) {
  try {
    await editWorkObject(state.form.spaceId, state.form.id, moduleId)
    message.success('所属模块修改成功', 2)
    emits('onUpdateFormItem', [])
  }
  catch (error) {}
}

// 修改优先级
async function changePriority(priority: string) {
  try {
    await editWorkPriority(state.form.spaceId, state.form.id, priority)
    message.success('优先级修改成功', 2)
    emits('onUpdateFormItem', [state.form.id])
  }
  catch (error) {}
}

// 修改任务名称
async function changeWorkItemName(workItemName: string) {
  if (!workItemName) {
    return
  }
  try {
    await editWorkName(state.form.spaceId, state.form.id, workItemName)
    message.success('任务名称修改成功', 2)
    emits('onUpdateFormItem', [state.form.id])
  }
  catch (error) {}
}

// 修改负责人
async function changeOwner(role: string, data: TaskCompare, selecteds: string[]) {
  if (selecteds.length === 0) {
    state.form.$roleOwners = deepCopy(state.rawForm.$roleOwners)
    return
  }
  try {
    await editWorkDirector(state.form.spaceId, state.form.id, role, data)
    message.success('负责人修改成功', 2)
    emits('onUpdateFormItem', [state.form.id])
  }
  catch (error) {
    state.form.$roleOwners = deepCopy(state.rawForm.$roleOwners)
  }
}

// 修改排期
async function changeDate(planTime: TaskPlanTimeAt) {
  if (isEmptyObject(planTime) || !planTime) {
    state.form.planTime = {
      planCompleteAt: '',
      planStartAt: '',
    } as PlanTime
    return
  }
  try {
    await editWorkPlantime(state.form.spaceId, state.form.id, planTime)
    message.success('总排期修改成功', 2)
    emits('onUpdateFormItem', [state.form.id])
  }
  catch (error) {
  }
}

// 监听进度失去焦点
async function processRateBlur(value: number) {
  if (!value && value !== 0) {
    return state.form.processRate = 0
  }
  await editWorkProgress(
    state.form.spaceId,
    state.form.id,
    value,
  )
  message.success('进度修改成功', 2)
  emits('onUpdateFormItem', [state.form.id])
}

// 修改版本
async function changeVersion(versionId: string) {
  try {
    const { data } = await workVersionChange(state.form.spaceId, versionId, state.form.id)
    message.success('版本修改成功', 2)
    emits('onUpdateFormItem', data.ids)
  }
  catch (error) {}
}

// 修改标签
async function changeTags(data: TaskCompare) {
  await editWorkTag(state.form.spaceId, state.form.id, data)
  message.success('标签修改成功', 2)
  state.rawForm.tagIds = state.form.tagIds
  emits('onUpdateFormItem', [])
}

// 修改描述
async function changeDescribe(describe: string) {
  if (state.form.describe === describe)
    return

  const icon_flags = []

  if (describe.match('<img src='))
    icon_flags.push(1)

  if (describe.match('http://') || describe.match('https://'))
    icon_flags.push(2)

  await editWorkDescribe(state.form.spaceId, state.form.id, describe, icon_flags)
  message.success('任务描述修改成功', 2)
  state.form.describe = describe
  emits('onUpdateFormItem', [state.form.id])
}

// 修改备注
async function changeRemarks(remark: string) {
  try {
    if (state.form.remark === remark)
      return

    await editWorkRemark(state.form.spaceId, state.form.id, remark)
    message.success('交付备注修改成功', 2)
    state.form.remark = remark
    emits('onUpdateFormItem', [state.form.id])
  }
  catch (error) {}
}

// 获取表单数据
async function setFormData(data: WorkDetailData, workflow: WorkFlowTemplateData) {
  state.items = await getFormItems(workflow, data, taskPermissions.value) as unknown as { [key: string]: ItemProps }
  state.items.module.width = 'calc(50% - 1.53846vw)'
  state.items.module.dropdownMatchSelectWidth = 200
  state.items.planTime.width = '100%'
  state.items.processRate.width = '100%'
  state.items.version.width = '100%'
  state.items.processRate.clearRestore = true
  state.form = data

  data.roleOwners!.forEach((item) => {
    item.directorIds = item.owners.map(ele => ele.id)
  })
  state.form.$roleOwners = data.roleOwners

  data.roleOwners!.forEach((item) => {
    state.form[item.roleKey] = item.directorIds
  })
  state.form.$creator = [data.creator.userId!]
  state.form.planTime = { planCompleteAt: data.planTime.completeAt, planStartAt: data.planTime.startAt } as PlanTime

  state.form.tagIds = data.tags?.map(item => item.id) as string[]
  state.rawForm = cloneDeep(data)
  state.rawForm.tagIds = cloneDeep(state.form.tagIds)

  nextTick(() => {
    childTaskTableRef.value?.setData(data)
  })
}

async function onChange(field: string, value: any, options: any) {
  try {
    await bFormRef.value.validate()
  }
  catch (e) {
    if ((e as any).errorFields.length > 0 && (e as any).errorFields.find((item: any) => item.name.includes(field))) {
      return false
    }
  }
  switch (field) {
    case 'workItemName':
      changeWorkItemName(value)
      break
    case 'workObjectId':
      changeModule(value)
      break
    case 'priority':
      changePriority(value)
      break
    case 'planTime':
      changeDate(value)
      break
    case 'processRate':
      processRateBlur(value)
      break
    case 'versionId':
      changeVersion(value)
      break
    case 'tagIds':
      changeTags(value)
      break
    case 'describe':
      changeDescribe(value)
      break
    case 'remark':
      changeRemarks(value)
      break
    default:
      const owner = Object.values(state.items).find(item => (item.type === 'personSelect' && item.field === field))
      if (owner) {
        changeOwner(field, value, options)
      }
  }
}

// 改变自身数据
function onChangeData(field: string) {
  switch (field) {
    case 'workObjectId':
      emits('onUpdateModuleName')
      break
    case 'versionId':
      emits('onUpdateVersionName')
      break
  }
}

defineExpose({
  setFormData,
})
</script>

<template>
  <div class="task-form task-add-form">
    <div class="pl16 pr16">
      <BForm
        ref="bFormRef"
        :items
        :model-value="state.form"
        :label-col="{ style: { width: '17.94872vw' } }"
        :disabled="!taskPermissions.allowEdit"
        name="task-edit"
        label-align="left"
        column
        view
        @change="onChange"
        @change-data="onChangeData"
      >
        <template #childTaskTable>
          <a-form-item-rest>
            <child-task-table
              ref="childTaskTableRef"
              @on-update-child-task="emits('onUpdateFormItem', [])"
            />
          </a-form-item-rest>
        </template>
      </BForm>
    </div>
  </div>
</template>
