<script lang="ts" setup>
import { type Ref, computed, inject, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { taskRule } from '../utils/vaildate'
import { getFormItems } from '../utils/task'
import { deepCopy } from '@/utils'
import {
  editWorkChildDirector,
  editWorkDescribe,
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
import type { PlanTime, TaskFormData, TaskPlanTimeAt, WorkDetailData } from '@/api/interface'
import type { TaskPermission } from '@/hooks/useTaskPermission'
import type { ItemProps } from '@/components/form/BForm/src/BForm.vue'
import type { Workflow } from '@/views/flowNode/types'
import type { WorkFlowTemplateData } from '@/api/project/types'

const emits = defineEmits(['onUpdateFormItem', 'onUpdateModuleName', 'onUpdateVersionName'])

const taskPermissions = inject('taskPermissions', { value: {} }) as Ref<TaskPermission>
const taskEditFormRef = ref()
const bFormRef = ref()
const state = reactive({
  // 任务流程
  workItemType: 1,
  // 任务进度 placeholder
  taskProgressPlaceHolder: '待填进度',
  // 任务表单
  taskForm: {} as WorkDetailData,
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
    await editWorkObject(state.taskForm.spaceId, state.taskForm.id, moduleId)
    message.success('所属模块修改成功', 2)
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改优先级
async function changePriority(priority: string) {
  try {
    await editWorkPriority(state.taskForm.spaceId, state.taskForm.id, priority)
    message.success('优先级修改成功', 2)
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改任务名称
async function changeWorkItemName(workItemName: string) {
  if (!workItemName) {
    return
  }
  try {
    await editWorkName(state.taskForm.spaceId, state.taskForm.id, workItemName)
    message.success('任务名称修改成功', 2)
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改负责人
async function changeOwner(data: TaskCompare, selecteds: string[]) {
  if (selecteds.length === 0) {
    state.taskForm.curOwner = state.taskForm.rawCurOwner
    return
  }
  try {
    await editWorkChildDirector(state.taskForm.spaceId, state.taskForm.id, data)
    message.success('负责人修改成功', 2)
    emits('onUpdateFormItem')
  }
  catch (error) {
    state.taskForm.curOwner = state.taskForm.rawCurOwner
  }
}

// 修改排期
async function changeDate(planTime: TaskPlanTimeAt) {
  if (!planTime.start) {
    state.taskForm.planTimeAt = {
      planStartAt: '',
      planCompleteAt: '',
    }
    taskEditFormRef.value?.validateFields(['planTimeAt'])
    return
  }
  try {
    await editWorkPlantime(state.taskForm.spaceId, state.taskForm.id, planTime)
    message.success('总排期修改成功', 2)
    taskEditFormRef.value?.validateFields(['planTimeAt'])
    emits('onUpdateFormItem', [state.taskForm.id])
  }
  catch (error) {}
}

// 监听进度失去焦点
async function processRateBlur(val: number) {
  if (!val && val !== 0) {
    return state.taskForm.processRate = 0
  }
  try {
    await editWorkProgress(
      state.taskForm.spaceId,
      state.taskForm.id,
      val,
    )
    message.success('进度修改成功', 2)
    state.taskForm.rawProcessRate = state.taskForm.processRate
    state.taskProgressPlaceHolder = '待填进度'
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改版本
async function changeVersion(versionId: string) {
  try {
    await workVersionChange(state.taskForm.spaceId, versionId, state.taskForm.id)
    message.success('版本修改成功', 2)
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改标签
async function changeTags(data: TaskCompare) {
  try {
    await editWorkTag(state.taskForm.spaceId, state.taskForm.id, data)
    message.success('标签修改成功', 3)
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改描述
async function changeDescribe(describe: string) {
  try {
    if (state.taskForm.describe === describe)
      return

    const icon_flags = []

    if (describe.match('<img src='))
      icon_flags.push(1)

    if (describe.match('http://') || describe.match('https://'))
      icon_flags.push(2)

    await editWorkDescribe(state.taskForm.spaceId, state.taskForm.id, describe, icon_flags)
    message.success('任务描述修改成功', 2)
    state.taskForm.describe = describe
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 修改备注
async function changeRemarks(remark: string) {
  try {
    if (state.taskForm.remark === remark)
      return

    await editWorkRemark(state.taskForm.spaceId, state.taskForm.id, remark)
    message.success('交付备注修改成功', 2)
    state.taskForm.remark = remark
    emits('onUpdateFormItem')
  }
  catch (error) {}
}

// 获取表单数据
async function setFormData(data: WorkDetailData, _workflow: Workflow) {
  state.items = await getFormItems({ spaceId: data.spaceId, templateConf: { formFields: [] } } as unknown as WorkFlowTemplateData, data, taskPermissions.value) as unknown as { [key: string]: ItemProps }
  state.items.module.width = 'calc(50% - 1.53846vw)'
  state.items.module.dropdownMatchSelectWidth = 200
  state.items.planTime.width = '100%'
  state.items.processRate.width = '100%'
  state.items.version.width = '100%'
  state.items.processRate.clearRestore = true
  state.items.module.disabled = true
  state.items.version.disabled = true
  state.items.childTaskTable.show = false
  state.taskForm = data
  state.taskForm.$creator = [data.creator.userId!]
  state.taskForm.planTime = { planCompleteAt: data.planTime.completeAt, planStartAt: data.planTime.startAt } as PlanTime
  state.taskForm.tagIds = data.tags?.map(item => item.id) as string[]
  state.taskForm.curOwner = data.owners?.map(item => item.userId)

  // const { id, workItemName, workItemTypeKey, planTime, priority, workItemStatus, versionId, processRate, describe, remark, creator, tags, file, owners, workObjectId, spaceId } = data
  // const tagList = tags?.map(item => item.id)
  // const owner = owners?.map(item => item.userId) || []
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
        console.log(options)
        changeOwner(value, options)
      }
  }
}

// 改变自身数据
function onChangeData(field: string, value: any) {
  console.log(field, value)
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
        :model-value="state.taskForm"
        :items
        :label-col="{ style: { width: '17.94872vw' } }"
        :disabled="!taskPermissions.allowEdit"
        name="task-edit"
        label-align="left"
        column
        view
        @change="onChange"
        @change-data="onChangeData"
      />
    </div>
  </div>
</template>
