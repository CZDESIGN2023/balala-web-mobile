<script lang="ts" setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  formatTaskPriority,
  getTextLength,
  getTimediff,
} from '@/utils'
import { archivedTaskStatusList } from '@/enum/TaskStatus'
import type { WorkDetailData, WorkItemStatus, WorkTaskInfo } from '@/api/interface'
import { editWorkName } from '@/api/project'
import { permCheckIsArchived } from '@/utils/permission'
import { WorkItemPerm } from '@/enum'
import { getBadgeColor } from '@/utils/color'

const emits = defineEmits(['onUpdateFormItem'])

const editTitleInputRef = ref()
const state = reactive({
  data: {
    workItemStatus: {} as WorkItemStatus,
  } as WorkTaskInfo,
  editTitleInputVisible: false,
})

// 任务优先级名称样式
const taskPriority = computed(() => {
  return formatTaskPriority(state.data.priority) || { label: '' }
})

// 任务更新时间
const taskUpdateTimeText = computed(() => {
  const { workItemStatus, isRestart, resumeAt, createdAt, restartAt, lastStatusAt, pid }
    = state.data

  let timeText: string = ''
  const isArchived = archivedTaskStatusList().includes(state.data.workItemStatus!.key) // 任务已归档
  const isMainTask = pid === '0'
  const isResume = resumeAt && Number(resumeAt) - Number(restartAt) > 0

  if (isArchived) {
    timeText = `${getTimediff(lastStatusAt || '', true, workItemStatus!.key)}`
  }
  else {
    if (isResume) {
      timeText = `任务已进行 ${getTimediff(resumeAt || '', true)}`
    }
    else if (isRestart) {
      timeText = `任务已重启 ${getTimediff(restartAt || '', true)}`
    }
    else {
      const time = isMainTask || lastStatusAt === '0' ? createdAt : lastStatusAt
      timeText = `任务已进行 ${getTimediff(time || '', true)}`
    }
  }

  return timeText
})

// 获取任务表单权限
const hasPermission = computed(() => {
  try {
    return permCheckIsArchived(
      JSON.parse(state.data.operationPermissions as string),
      WorkItemPerm.WORK_ITEM_MODIFY,
      state.data.workItemStatus?.key,
    )
  }
  catch (error) {
    return false
  }
})

function openNameInput() {
  if (!hasPermission.value)
    return
  state.editTitleInputVisible = true
  nextTick(() => {
    editTitleInputRef.value?.focus()
  })
}

// 编辑头部标题回车
function titleInputEnter() {
  editTitleInputRef.value?.blur()
}

async function titleInputBlur() {
  const { workItemName, rawWorkItemName, id, spaceId } = state.data
  const name = workItemName?.trim()
  const length = getTextLength(name as string)
  if (rawWorkItemName === name) {
    state.editTitleInputVisible = false
    state.data.workItemName = name
    return
  }
  if (!(length >= 2 && length <= 200)) {
    state.data.workItemName = rawWorkItemName
    state.editTitleInputVisible = false
    message.error('请输入任务名称(2 ~ 200个字符)', 3)
    return
  }
  await editWorkName(spaceId as string, id as string, name)
  state.data.workItemName = name
  message.success('任务名称修改成功', 3)
  state.editTitleInputVisible = false
  emits('onUpdateFormItem', [id])
}

// 抛出事件获取所需数据
function setData(data: WorkDetailData) {
  const { operationPermissions } = data
  state.data = {
    spaceId: data.spaceId,
    id: data.id,
    workItemName: data.workItemName,
    rawWorkItemName: data.workItemName,
    workFlowName: data.template.workFlowName,
    workItemType: Number.parseInt(data.template.workFlowId),
    workFlowId: data.template.workFlowId,
    workFlowKey: data.template.workFlowKey,
    priority: data.priority,
    workItemStatus: data.workItemStatus,
    resumeAt: data.resumeAt,
    restartAt: data.restartAt,
    isRestart: data.isRestart,
    createdAt: data.createdAt,
    lastStatusAt: data.workItemStatus.last.updatedAt,
    pid: data.pid,
    operationPermissions,
  } as unknown as WorkTaskInfo
}

defineExpose({
  setData,
})
</script>

<template>
  <div v-if="state.data.id" class="task-header-info flex-row-start">
    <!-- <div class="task-title" @click="openNameInput"> -->
    <!-- </div> -->
    <b-badge
      :label="state.data.workFlowName || ''"
      :color="getBadgeColor(state.data.workFlowName)"
      min-width="14.8717913.33333vw"
      custom-class="ml8"
    />
    <!-- <b-badge
      v-if="taskPriority"
      :label="taskPriority.label"
      :color="taskPriority.color || ''"
      min-width="48px"
      custom-class="ml8 mr8"
    /> -->
    <b-badge
      :label="state.data.workItemStatus?.name || ''"
      :color="getBadgeColor(state.data.workItemStatus?.name || '')"
      min-width="14.87179vw"
      custom-class="ml8 mr8"
    />
    <!-- <p class="text14 minor-color flex-shrink-0">
      {{ taskUpdateTimeText }}
    </p> -->
    <div v-if="state.editTitleInputVisible" class="input-box">
      <a-input
        ref="editTitleInputRef"
        v-model:value="state.data.workItemName"
        class="title-input"
        @press-enter="titleInputEnter"
        @blur="titleInputBlur"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.task-header-info {
  height: 100%;
  position: relative;
  flex-shrink: 0;
  p {
    font-weight: normal;
  }
  .task-title {
    max-width: calc(100% - 315px);
    border-radius: 6px;
    height: 40px;
    border: 1px solid transparent;
    padding: 0 7px;
    display: flex;
    cursor: pointer;
    align-items: center;
    &:hover {
      border-color: $color-border-main;
    }
  }
  .input-box {
    width: 100%;
    height: 64px;
    position: absolute;
    left: 0px;
    bottom: -12px;
    display: flex;
    align-items: center;
    .title-input {
      height: 40px;
      border: 2px solid $color-primary;
      font-size: 18px;
      line-height: 18px;
      color: $color-title;
      padding-left: 8px;
      caret-color: $color-primary;
      &:focus {
        box-shadow: none !important;
      }
    }
  }
}
</style>
