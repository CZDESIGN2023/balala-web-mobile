<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, reactive, ref, toRaw } from 'vue'
import { message } from 'ant-design-vue'
import { childTaskTableColumn } from '../utils/child-task'
import TaskChildEdit from '../task-edit-child.vue'
import { deepCopy, getAssetsFile, getTextLength, throttle } from '@/utils'
import {
  createProjectTaskWork,
  deleteWork,
  editWorkChildDirector,
  editWorkName,
  editWorkPlantime,
  editWorkProgress,
  getWorkItemDetail,
  taskStateConfirm,
} from '@/api/project'
import type { TaskPlanTimeAt, WorkDetailChildTask, WorkDetailData } from '@/api/interface'
import type { TaskCompare, TaskDrawerProps } from '@/api/interface/common'
import { permCheck, taskIsArchived } from '@/utils/permission'
import { WorkItemPerm } from '@/enum'
import { TaskStatusKey } from '@/enum/TaskStatus'

const emits = defineEmits(['onUpdateChildTask'])
// const { proxy } = getCurrentInstance() as any

/** DATA */
const taskChildRef = ref()
const nameInputRefs = ref<{ [key: string]: HTMLInputElement }>({})
const processInputRefs = ref<{ [key: string]: HTMLInputElement }>({})
const isConfirmButtonDisabled = ref<boolean>(false)
const state = reactive({
  spaceId: '',
  workItemId: '',
  tableData: [] as WorkDetailChildTask[],
  deleteDialogVisible: false,
  parentTaskIsArchived: false,
  parentTaskHasEditPerm: false,
  hasCreateTaskPerm: false,
  currentItem: {} as WorkDetailChildTask,
  componentProps: {} as TaskDrawerProps,
})

/** COMPUTED */

// 是否展示新增行按钮
const isShowAddBtn = computed(() => {
  return (
    !state.tableData.some(item => item.isAddRow) // 不是新增
    && state.parentTaskHasEditPerm // 主任务有编辑权限
    && !state.parentTaskIsArchived // 主任务是归档
    && state.hasCreateTaskPerm // 子任务有创建权限
  )
})

// 是否显示更多删除按钮
const isShowMoreBtn = computed(() => {
  return (record: WorkDetailChildTask) => {
    return !record.isAddRow && record.hasDeletePerm
  }
})

// 是否显示新增时候的保存按钮
const isShowSaveIcon = computed(() => {
  return (record: WorkDetailChildTask) => {
    return record.isAddRow && record.workItemName
  }
})

// 时间组件类名
const dateClassName = computed(() => {
  return (isError: boolean) => {
    const showClass = isError ? 'table-style detail radius error' : 'table-style detail radius'
    return showClass
  }
})

const isDisabled = computed(() => {
  return (record: WorkDetailChildTask) => {
    return !record.hasEditPerm || state.parentTaskIsArchived || record.isComplete
  }
})

/** METHODS */

// 点击新增一行
function handleAddRow() {
  const rowData = {
    spaceId: state.spaceId,
    id: state.workItemId,
    pid: '',
    userId: '',
    workItemType: '',
    workObjectId: '',
    workItemGuid: '',
    workItemName: '',
    rawWorkItemName: '',
    workItemStatus: { key: TaskStatusKey.PROGRESSING },
    processRate: '0%',
    rawProcessRate: 0,
    priority: '',
    planStartAt: '',
    planCompleteAt: '',
    planTimeAt: {},
    creator: null,
    owners: [],
    director: {},
    curOwner: [],
    rawCurOwner: [],
    operationPermissions: '',
    contenteditable: true,
    isShowNameErrorTip: false,
    nameTip: '',
    isShowOwnerErrorTip: false,
    isShowDateErrorTip: false,
    isAddRow: true,
    isShowDeleteOperation: false,
    hasEditPerm: true,
    hasChangeNodePerm: true,
    hasDeletePerm: true,
    isComplete: false,
    planTime: { startAt: null, completeAt: null },
  } as unknown as WorkDetailChildTask
  state.tableData.push(rowData)
  changeNameContenteditable(rowData)
}

// 移除行
function handleRemoveRow(index: number) {
  state.tableData.splice(index, 1)
}

// 修改名称编辑状态
function changeNameContenteditable(record: WorkDetailChildTask) {
  record.contenteditable = true
  nextTick(() => {
    const input = nameInputRefs.value[record.id]
    if (input)
      input.focus()
  })
}

// 名称获取焦点事件 滚动到输入框焦点位置
function handleNameFocus(record: WorkDetailChildTask) {
  nextTick(() => {
    const input = nameInputRefs.value[record.id]
    if (input)
      input.scrollIntoView()
  })
}

// 名称回车事件
function handleNameKeyup(record: WorkDetailChildTask) {
  nextTick(() => {
    const input = nameInputRefs.value[record.id]
    if (input)
      input.blur()
  })
}

// 名称失去焦点事件
function handleNameBlur(record: WorkDetailChildTask, index: number) {
  const name = record.workItemName || ''
  const length = getTextLength(name)
  const isVerified = length === Math.min(Math.max(length, 2), 200)
  const hasOwner = record.curOwner.length > 0

  const showNameError = (record: WorkDetailChildTask, message: string) => {
    record.contenteditable = true
    record.isShowNameErrorTip = true
    record.nameTip = message
  }

  const hideError = (record: WorkDetailChildTask) => {
    record.contenteditable = false
    record.isShowNameErrorTip = false
    record.isShowOwnerErrorTip = false
  }

  if (record.isAddRow) {
    // 没有输入任务名称直接移除
    if (!name) {
      handleRemoveRow(index)
      return
    }

    // 格式验证错误提示
    if (!isVerified) {
      showNameError(record, '请输入2 ~ 200个字符')
      return
    }

    // 移除错误提示 验证负责人是否选择
    hideError(record)
    if (!hasOwner)
      record.isShowOwnerErrorTip = true
  }
  else {
    // 没有输入任务名称直接移除
    if (!name || !isVerified) {
      showNameError(record, '请输入2 ~ 200个字符')
      return
    }
    // 判断是否有修改
    if (name === record.rawWorkItemName) {
      hideError(record)
      return
    }
    editWorkItemName(record)
  }
}

// 修改任务名称
async function editWorkItemName(record: WorkDetailChildTask) {
  try {
    await editWorkName(record.spaceId, record.id, record.workItemName.trim())
    message.success('任务名称修改成功', 2)
    record.contenteditable = false
    emits('onUpdateChildTask')
  }
  catch (error) {}
}

// 选择负责人
function changeOwner(data: TaskCompare, selecteds: string[], record: WorkDetailChildTask) {
  if (record.isAddRow) {
    // 添加选中负责人
    if (data.add.length === 0) {
      record.isShowOwnerErrorTip = true
    }
    else {
      record.isShowOwnerErrorTip = false
      record.director = data
    }
  }
  else {
    // 编辑选中负责人
    if (selecteds.length === 0) {
      record.curOwner = deepCopy(record.rawCurOwner)
      return
    }
    record.director = data
    editDirector(record)
  }
}

// 修改负责人
async function editDirector(record: WorkDetailChildTask) {
  try {
    await editWorkChildDirector(record.spaceId, record.id, record.director)
    message.success('负责人修改成功', 2)
    emits('onUpdateChildTask')
  }
  catch (error) {
  }
}

// 选择排期
function changeDate(planTimeAt: TaskPlanTimeAt, record: WorkDetailChildTask) {
  record.isShowDateErrorTip = false
  record.planStartAt = planTimeAt.start as string
  record.planCompleteAt = planTimeAt.complete as string
  record.planTimeAt = planTimeAt

  if (!record.isAddRow)
    editPlantime(record)
}

// 修改排期
async function editPlantime(record: WorkDetailChildTask) {
  try {
    await editWorkPlantime(record.spaceId, record.id, record.planTimeAt)
    message.success('总排期修改成功', 2)
    emits('onUpdateChildTask')
  }
  catch (error) {}
}

// 进度获取焦点事件 滚动到输入框焦点位置
function handleProcessFocus(record: WorkDetailChildTask) {
  nextTick(() => {
    const input = processInputRefs.value[record.id]
    if (input)
      input.scrollIntoView()

    record.processRate = record.processRate?.replace('%', '')
  })
}

// 监听进度输入
function handleProcessInput(record: WorkDetailChildTask) {
  // 从 processRate 中移除所有非数字字符
  const sanitizedProcessRate = record.processRate?.replace(/\D/g, '') || '0'
  // 将清理后的字符串转换为数字，然后再次转换为字符串，以确保它是有效的数字
  record.processRate = Math.min(Number(sanitizedProcessRate), 100).toString()
}

// 监听进度回车
function handleProcessKeyup(record: WorkDetailChildTask) {
  nextTick(() => {
    const input = processInputRefs.value[record.id]
    if (input)
      input.blur()
  })
}

// 监听进度失去焦点
function handleProcessBlur(record: WorkDetailChildTask) {
  // 新增行
  if (record.isAddRow) {
    record.processRate += '%'
  }
  else {
    // 无变化
    if (Number(record.processRate) === record.rawProcessRate) {
      record.processRate += '%'
    }
    else {
      // 有变化，调用编辑进度的函数
      editProcess(record)
    }
  }
}

// 修改进度
async function editProcess(record: WorkDetailChildTask) {
  try {
    await editWorkProgress(record.spaceId, record.id, record.processRate)
    message.success('进度修改成功', 2)
    record.processRate += '%'
    emits('onUpdateChildTask')
  }
  catch (error) {}
}

// 点击显示删除子任务弹框
function handleOpenDeleteDialog(record: WorkDetailChildTask) {
  state.deleteDialogVisible = true
  record.isShowDeleteOperation = false
  state.currentItem = record
}

// 删除子任务
async function handleDeleteTask() {
  const { spaceId, id } = state.currentItem
  try {
    await deleteWork(spaceId, id)
    message.success('子任务删除成功', 2)
    state.deleteDialogVisible = false
    emits('onUpdateChildTask')
  }
  catch (errorInfo) {
    console.log('Failed:', errorInfo)
    state.deleteDialogVisible = false
  }
}

// 切换任务状态
const changeStatu = throttle((record: WorkDetailChildTask) => {
  console.log(record)
  if (record.workItemStatus.key === TaskStatusKey.PROGRESSING)
    changeChildTaskStatus(TaskStatusKey.COMPLETED, record)
  else
    changeChildTaskStatus(TaskStatusKey.PROGRESSING, record)
}, 300)

// 子任务 状态切换
async function changeChildTaskStatus(type: TaskStatusKey, record: WorkDetailChildTask) {
  try {
    await taskStateConfirm(record.spaceId, record.id, type)
    message.success('任务状态切换成功', 2)
    emits('onUpdateChildTask')
  }
  catch (error) {}
}

// 校验表格行是否都填写
function validateChildTask(record: WorkDetailChildTask) {
  record.isShowNameErrorTip = false
  record.isShowOwnerErrorTip = false
  record.isShowDateErrorTip = false
  const length = getTextLength(record.workItemName)
  const isVerified = length === Math.min(Math.max(length, 2), 200)
  // 判断有没有写任务名称
  if (!record.workItemName || !isVerified) {
    record.isShowNameErrorTip = true
    record.nameTip = '请输入2～200个字符'
    return false
  }
  // 判断有没有选择负责人
  if (record.curOwner.length === 0) {
    record.isShowOwnerErrorTip = true
    return false
  }
  // 是否选择了时间
  if (!record.planStartAt) {
    record.isShowDateErrorTip = true
    return false
  }
  return true
}

// 新增提交
const handleAddSubmit = throttle(async (record: WorkDetailChildTask) => {
  setTimeout(async () => {
    const allFilled = validateChildTask(record)
    if (allFilled && !isConfirmButtonDisabled.value) {
      isConfirmButtonDisabled.value = true
      const params = {
        spaceId: record.spaceId,
        workItemId: record.id,
        itemName: record.workItemName,
        progressRate: record.processRate.toString(),
        planTimeAt: record.planTimeAt,
        director: record.director,
      }
      try {
        await createProjectTaskWork(params)
        message.success('子任务创建成功', 2)
        record.isAddRow = false
        emits('onUpdateChildTask')
      }
      catch (error) {
      }
    }
  }, 100)
}, 300)

// 是否有权限
function hasPermission(operationPermissions: string, key: string): boolean {
  try {
    const permissions: Record<string, boolean> = JSON.parse(operationPermissions)
    return permCheck(permissions, key)
  }
  catch (error) {
    return false
  }
}

// 获取数据
function setData(data: WorkDetailData) {
  const { subTasks, operationPermissions } = data
  const parentTaskIsArchived = taskIsArchived(data.workItemStatus.key) // 主任务是否是归档状态
  const formatData = subTasks?.map((item) => {
    const owner = item.owners?.map(item => String(item.userId)) || []
    return {
      ...item,
      curOwner: owner,
      director: {},
      rawCurOwner: deepCopy(owner),
      contenteditable: false,
      planTimeAt: {
        planStartAt: item.planStartAt,
        planCompleteAt: item.planCompleteAt,
      },
      rawWorkItemName: item.workItemName,
      processRate: `${item.processRate}%`,
      rawProcessRate: item.processRate,
      isShowNameErrorTip: false,
      nameTip: '',
      isShowOwnerErrorTip: false,
      isShowDateErrorTip: false,
      isAddRow: false,
      isShowDeleteOperation: false,
      hasEditPerm: hasPermission(item.operationPermissions, WorkItemPerm.WORK_ITEM_MODIFY),
      hasChangeNodePerm: !parentTaskIsArchived && hasPermission(
        item.operationPermissions,
        WorkItemPerm.WORK_ITEM_CHANGE_STATE,
      ),
      hasDeletePerm: hasPermission(item.operationPermissions, WorkItemPerm.WORK_ITEM_DELETE),
      isComplete: item.workItemStatus.key === TaskStatusKey.COMPLETED,
    }
  })
  state.spaceId = data.spaceId as string
  state.workItemId = data.id as string
  state.parentTaskIsArchived = parentTaskIsArchived
  state.parentTaskHasEditPerm = hasPermission(
    operationPermissions as string,
    WorkItemPerm.WORK_ITEM_MODIFY,
  )
  state.hasCreateTaskPerm = hasPermission(
    operationPermissions as string,
    WorkItemPerm.TASK_CHILD_CREATE,
  )
  state.tableData = formatData as WorkDetailChildTask[]

  isConfirmButtonDisabled.value = false
}

// 展开子任务详情
function openTaskDetail(record: WorkDetailChildTask) {
  if (record.isAddRow)
    return
  // proxy.mittBus.emit('openTaskDialog', {
  //   openType: 'child_detail',
  //   taskParams: {
  //     spaceId: record.spaceId,
  //     workItemId: record.id
  //   }
  // })

  state.componentProps = {
    openType: 'child_detail',
    taskParams: {
      spaceId: record.spaceId,
      workItemId: record.id,
    },
  }
  getTaskDetail(
    state.componentProps.taskParams?.spaceId as string,
    state.componentProps.taskParams?.workItemId as string,
  )
}

// 获取任务详情
async function getTaskDetail(spaceId: string, workItemId: string) {
  try {
    const { data } = await getWorkItemDetail({
      spaceId,
      workItemId,
    })
    data.commentNum = Number(data.commentNum)
    nextTick(() => {
      taskChildRef.value?.openChildTaskDrawer(data)
    })
  }
  catch (error: any) {
    switch (error.code) {
      case 305003:
        message.error(`您已不在当前项目中，无权查看`)
        break
      case 301002:
        message.error('当前任务不存在')
        break
      default:
        message.error('项目信息错误')
        break
    }
  }
}

defineExpose({
  setData,
})
</script>

<template>
  <div class="task-children">
    <div v-if="state.tableData.length > 0" class="task-children-wrap mb16">
      <a-table
        class="task-children-table current-children"
        height="240"
        :data-source="state.tableData"
        :pagination="false"
        :columns="childTaskTableColumn"
        :row-class-name="(_record: any) => (!_record.id ? 'shadow' : '')"
        style="width: 100%"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 任务名 -->
          <template v-if="column.key === 'workItemName'">
            <div class="name-box flex-row-between">
              <div v-if="record.hasChangeNodePerm && !record.isAddRow" class="radio flex-row-center">
                <el-tooltip
                  placement="top"
                  content="完成任务"
                  :disabled="record.workItemStatus.key === TaskStatusKey.COMPLETED"
                >
                  <div
                    class="checkbox-icon flex-row-center"
                    :class="{ active: record.workItemStatus.key === TaskStatusKey.COMPLETED }"
                    @click="changeStatu(record)"
                  >
                    <img class="statu" :src="getAssetsFile('checkbox-active.svg')" alt="">
                  </div>
                </el-tooltip>
              </div>
              <div
                class="pointer name ss-line-1 flex-row-start flex-one text13 icon-color"
                @click="openTaskDetail(record)"
              >
                <b-ellipsis :content="record.workItemName" />
              </div>
              <div
                v-if="!isDisabled(record)"
                class="edit-icon flex-shrink-0 flex-row-center"
              >
                <svg-icon
                  name="child-table-edit"
                  size="10"
                  color="#333333"
                  @click="changeNameContenteditable(record)"
                />
              </div>
              <div v-if="record.contenteditable" class="input-box">
                <el-tooltip
                  :key="record.isShowNameErrorTip"
                  placement="top"
                  effect="customized"
                  :show-after="100"
                  :teleported="false"
                  :visible="record.isShowNameErrorTip"
                >
                  <template #content>
                    <p class="flex-row-center gap4">
                      <img class="w16" src="@/assets/icon/warning-icon.png" alt="">
                      {{ record.nameTip }}
                    </p>
                  </template>
                  <input
                    :ref="
                      (el: any) => {
                        if (el) nameInputRefs[record.id] = el
                      }
                    "
                    v-model="record.workItemName"
                    type="text"
                    class="edit-input text14 title-color"
                    placeholder="请输入任务名称"
                    :class="{ 'is-error': record.isShowNameErrorTip }"
                    @keyup.enter="handleNameKeyup(record)"
                    @focus="handleNameFocus(record)"
                    @blur="handleNameBlur(record, index)"
                  >
                </el-tooltip>
              </div>
            </div>
          </template>
          <!-- 负责人 -->
          <div v-if="column.key === 'owner'" class="h40">
            <div class="owner-box">
              <el-tooltip
                placement="top"
                effect="customized"
                :show-after="100"
                :teleported="false"
                :visible="record.isShowOwnerErrorTip"
              >
                <template #content>
                  <p class="flex-row-center gap4">
                    <img class="w16" src="@/assets/icon/warning-icon.png" alt="">
                    请选择负责人
                  </p>
                </template>
                <biz-person-select
                  v-model:ownerValues="record.curOwner"
                  class="table-detail"
                  person-type=""
                  :class="{ 'is-error': record.isShowOwnerErrorTip }"
                  :max-tag-count="1"
                  :tag-name-max-width="40"
                  :dropdown-match-select-width="393"
                  :value="record.rawCurOwner"
                  :space-id="record.spaceId"
                  :disabled="isDisabled(record)"
                  @on-change="(data: TaskCompare, selecteds: string[]) => changeOwner(data, selecteds, record)"
                />
              </el-tooltip>
            </div>
          </div>
          <!-- 排期 -->
          <div v-if="column.key === 'planTimeAt'" style="margin-left: -1px; padding-left: 1px">
            <div class="time-box">
              <el-tooltip
                placement="top"
                effect="customized"
                :show-after="100"
                :teleported="false"
                :visible="record.isShowDateErrorTip"
              >
                <template #content>
                  <p class="flex-row-center gap4">
                    <img class="w16" src="@/assets/icon/warning-icon.png" alt="">
                    请选择排期
                  </p>
                </template>
                <b-input-date
                  width="100%"
                  foramt-val="MM/DD"
                  :info="{ planCompleteAt: record.planTime.completeAt, planStartAt: record.planTime.startAt }"
                  :task-status="record.workItemStatus.key"
                  :class-type="dateClassName(record.isShowDateErrorTip)"
                  :disabled="isDisabled(record)"
                  @on-change="(planTimeAt: TaskPlanTimeAt) => changeDate(planTimeAt, record)"
                />
              </el-tooltip>
            </div>
          </div>
          <!-- 进度 -->
          <template v-if="column.key === 'processRate'">
            <div class="process-box pl4">
              <input
                :ref="
                  (el: any) => {
                    if (el) processInputRefs[record.id] = el
                  }
                "
                v-model="record.processRate"
                type="text"
                class="process-input text14 title-color"
                placeholder="待填进度"
                :maxlength="3"
                :class="{ 'is-error': record.isShowNameErrorTip }"
                :disabled="isDisabled(record)"
                @keyup.enter="handleProcessKeyup(record)"
                @focus="handleProcessFocus(record)"
                @input="handleProcessInput(record)"
                @blur="handleProcessBlur(record)"
              >
            </div>
          </template>
          <!-- 操作 -->
          <template v-if="column.dataIndex === 'operation'">
            <div class="operation-box">
              <!-- 新增 移除按钮 -->
              <div v-if="record.isAddRow" class="flex-row-center pointer">
                <el-tooltip placement="top" content="移除">
                  <div class="remove-icon flex-row-center pointer" @click="handleRemoveRow(index)">
                    <svg-icon name="close" size="15" />
                  </div>
                </el-tooltip>
              </div>
              <!-- 删除按钮 -->
              <a-popover
                v-if="isShowMoreBtn(record)"
                v-model:open="record.isShowDeleteOperation"
                trigger="click"
                placement="bottomRight"
                :align="{ offset: [-10, -15] }"
                overlay-class-name="child-task-delete"
              >
                <template #content>
                  <div
                    class="operation-del error-color text14 flex-row-center gap8 pointer"
                    @click="handleOpenDeleteDialog(record)"
                  >
                    <svg-icon name="delete-line" color="#FD4C4C" size="16" />
                    删除
                  </div>
                </template>
                <div
                  class="more-icon flex-row-center pointer"
                  :class="{ always: record.isShowDeleteOperation }"
                >
                  <svg-icon name="table-more" :size="16" color="#333333" />
                </div>
              </a-popover>
              <!-- 确认提交按钮 -->
              <div v-if="isShowSaveIcon(record)" class="flex-row-center pointer">
                <el-tooltip placement="top" content="确认">
                  <span class="save-icon" @click="handleAddSubmit(record, index)">
                    <img class="w16 h16" src="@/assets/icon/task-save.png" alt="">
                  </span>
                </el-tooltip>
              </div>
            </div>
          </template>
        </template>
      </a-table>
    </div>
    <div
      v-if="isShowAddBtn"
      class="h32 add-btn flex-row-start gap4 text14 primary-color pointer"
      @click="handleAddRow"
    >
      <img :src="getAssetsFile('add-primary.svg')" alt=""> 新增子任务
    </div>
    <!-- 删除任务确认弹框 -->
    <b-dialog
      v-model:dialogVisible="state.deleteDialogVisible"
      width="408px"
      title-icon="warning.svg"
      title="确认删除该任务吗？"
      confirm-btn-color="danger"
      @on-confirm="handleDeleteTask"
    />
    <TaskChildEdit
      ref="taskChildRef"
      v-bind="state.componentProps"
      @on-close-drawer="emits('onUpdateChildTask')"
    />
  </div>
</template>

<style lang="scss">
.child-task-delete {
  .ant-popover-content {
    .ant-popover-inner {
      padding: 8px !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.operation-del {
  padding: 4px;
  border-radius: 4px;
  &:hover {
    background-color: $color-bg-hover;
  }
}
.task-children {
  width: 100%;

  .task-children-wrap {
    border-radius: 8px;
    border: 1px solid $color-border-minor;
  }

  .add-btn {
    border-radius: 4px;
    padding: 0 8px 0 8px;
    display: inline-flex;

    &:hover {
      background: $color-bg-hover;
    }
  }
}

:deep(.task-children-table) {
  .ant-table {
    background: none;
    border-radius: 8px;
  }
  .ant-table-thead {
    .ant-table-cell {
      background: none;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: initial;
      color: $color-title;
      border-bottom: 0px solid $color-border-minor;
      &::before {
        opacity: 0;
      }
    }
  }
  .ant-table-tbody {
    border-radius: 0 0 8px 8px;
    .ant-table-row {
      &:last-child {
        .ant-table-cell:first-child {
          border-radius: 0 0 0 8px;
        }
        .ant-table-cell:last-child {
          border-radius: 0 0 8px 0;
        }
      }
      &.shadow {
        background: #fff;
        box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
        .ant-table-cell {
          &::after {
            opacity: 0;
          }
        }
        &:hover {
          .ant-table-cell {
            background: #fff;
            &.ant-table-cell-row-hover {
              background: #fff;
            }
          }
        }
      }
      .ant-table-cell {
        color: $color-minor;
        font-size: 13px;
        position: relative;
        padding: 0;
        min-height: 40px;
        border: 0 !important;
        max-width: 223px;
        &::after {
          content: '';
          width: 100%;
          height: 1px;
          background: $color-border-minor;
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 0 0 8px 8px;
        }
        &.ant-table-cell-row-hover {
          background: $color-default-hover;
        }
        .name-box {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          position: relative;
          .name {
            line-height: 16px;
          }
          .checkbox-icon {
            width: 14px;
            height: 14px;
            cursor: pointer;
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.2);
            border-radius: 50%;
            margin-right: 4px;

            .statu {
              opacity: 0;
            }

            &.active {
              background: $color-primary;
              border-color: $color-primary;

              .statu {
                opacity: 1;
              }
            }
          }
          .edit-icon {
            width: 20px;
            height: 20px;
            border: 1px solid #e5e5e5;
            background: #fff;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
            opacity: 0;
            &:hover {
              .svg-icon {
                use {
                  fill: $color-primary;
                }
              }
            }
          }
          .input-box {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 3.2px;
            left: 0px;
            .edit-input {
              width: calc(100% - 3.2px);
              height: 35.4px;
              padding: 0px 8px 0px 12px;
              box-shadow: 0 0 0 1.6px $color-primary;
              border: 0;
              border-radius: 6px;
              outline: none;
              background: #fff;
              margin: 0;
              &.is-error {
                box-shadow: 0 0 0 1.6px #fd4c4c;
              }
            }
          }
          &:hover {
            .name {
              color: $color-primary;
            }

            .checkbox-icon {
              border-color: $color-primary;
            }

            .edit-icon {
              opacity: 1;
            }
          }
        }
        .process-box {
          width: 56px;
          height: 40px;
          position: relative;
          z-index: 1;
          .process-input {
            padding-left: 12px;
            width: 56px;
            height: calc(100% - 4.8px);
            border: 0;
            outline: none;
            margin-top: 3.2px;
            background: none;
            border-radius: 6px;
            &:focus {
              box-shadow: 0 0 0 1.6px $color-primary;
            }
            &:disabled {
              cursor: not-allowed;
              color: $color-minor;
            }
          }
        }
        .operation-box {
          .remove-icon {
            width: 15px;
            height: 15px;
            border-radius: 100%;
            background: rgba(0, 0, 0, 0.45);
            flex: none;
            color: #fff;
            position: absolute;
            right: -8px;
            top: -8px;
            z-index: 10;

            &:hover {
              background: rgba(0, 0, 0, 0.65);
            }
          }
          .more-icon {
            width: 100%;
            height: 40px;
            opacity: 0;
            &:hover {
              .svg-icon {
                use {
                  fill: $color-primary !important;
                }
              }
            }
            &.always {
              opacity: 1 !important;
            }
          }
          .save-icon {
            width: 24px;
            height: 24px;
            border: 1px solid $color-border-main;
            box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
            background: #fff;
            display: inline-block;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            margin-right: 8px;
          }
        }
      }
      &:hover {
        .operation-box {
          .more-icon {
            opacity: 1;
          }
        }
      }
    }
  }
}
</style>
