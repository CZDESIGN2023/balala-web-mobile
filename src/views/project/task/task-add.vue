<script lang="ts" setup>
import { type Ref, computed, getCurrentInstance, h, onMounted, onUnmounted, reactive, ref, toRaw, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { type ButtonProps, message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import { taskRule } from './utils/vaildate'
import { getFormItems } from './utils/task'
import { useProjectStore } from '@/stores/modules/project'
import { useUserStore } from '@/stores/modules/user'
import { deepCopy, deepEqual, isEmptyObject, throttle } from '@/utils'
import { createProjectWork, getSpaceWorkItemOperationPermissions } from '@/api/project'
import { SpaceRole } from '@/enum'
import type { SelectOptions } from '@/api/interface/common'
import type { TaskPlanTimeAt, WorkDetailData, WorkItemStatus } from '@/api/interface'
import { type TaskPermission, useTaskPermission } from '@/hooks/useTaskPermission'
import type { ItemProps } from '@/components/form/BForm/src/BForm.vue'
import useFlowTemplate from '@/hooks/useFlowTemplate'
import { Msgbox } from '@/utils/msgbox'

const props = withDefaults(defineProps<Props>(), {
  openType: 'project',
})

const emits = defineEmits(['onCloseDrawer'])

/** CTX */
const { proxy } = getCurrentInstance() as any

/** PROPS */
interface Props {
  openType?: string
}
/** STORE */
const projectStore = useProjectStore()
const { userInfo } = useUserStore()
const { currentRoute } = useRouter()
const { flowTemplateInfo, initFlowTemplate } = useFlowTemplate()
/** DATA */
const taskPermissions = ref({}) as Ref<TaskPermission>
const formConfig = {
  name: 'task-add',
  validateOnRuleChange: true,
  labelCol: { style: { width: '20vw', display: 'flex', justifyContent: 'start', flex: 'none' } },
  wrapperCol: { style: { flex: '1' } },
}
const dateRef = ref()
const uploadRef = ref()
const taskAddFormRef = ref()
const bFormRef = ref()
const refreshOnClose = ref(false)
const businessWorkFlowSelectRef = ref()

let rawTaskForm = {} as WorkDetailData
const baseForm = {
  spaceId: (currentRoute.value.params.id as string) || null,
  flowId: '',
  tagIds: [],
  roleOwners: [],
  workItemId: '',
  describe: '',
  remark: '',
  processRate: null,
  priority: 'P3',
  onwer: [],
  $creator: [userInfo.id],
}
const state = reactive({
  dialogVisible: false,
  isContinue: false,
  // 提交按钮loading
  submitLoading: false,
  // 任务流程
  flowId: null as string | null,
  // 关闭表单时如果存在已经填写的则提示是否关闭的弹框
  // 任务表单
  taskForm: cloneDeep(baseForm) as unknown as WorkDetailData,
  items: {} as { [key: string]: ItemProps },
  fromKey: 0,
  workFlowKey: 0,
  file: [] as string[],
})

/** COMPUTED */
const projectList = computed<SelectOptions[]>(() => {
  // 项目列表 过滤掉查看者权限
  return projectStore.projectList
    .filter((project: any) => Number(project.roleId) !== SpaceRole.WATCHER)
    .map((project: any) => ({
      value: project.id,
      label: project.spaceName,
    }))
})

// 当前项目信息是否存在
const hasProject = computed(() => {
  return !!state.taskForm.spaceId
})

// 当前项目信息和任务流程是否存在
const hasProjectAndType = computed(() => {
  return state.taskForm.spaceId && state.taskForm.flowId
})

onMounted(() => {
  proxy.mittBus.on('deleteWorkFlow', onCooperateDelete)
  proxy.mittBus.on('disableWorkFlow', onCooperateDisabled)
})

onUnmounted(() => {
  proxy.mittBus.off('deleteWorkFlow', onCooperateDelete)
  proxy.mittBus.off('disableWorkFlow', onCooperateDisabled)
})

/** METHODS */

// 选择任务所属项目
function changeTaskProject(value: string) {
  state.taskForm = cloneDeep(baseForm) as unknown as WorkDetailData
  state.taskForm.spaceId = value
  state.taskForm.flowId = ''
  projectStore.getProjectModuleList(value)
  projectStore.getProjectVersionList(value)
  projectStore.getProjectTagList(value, [], true)
  state.workFlowKey++
  // projectStore.getProjectMemberList(value, '')
  _initFormData()
}

// 选择任务所属类型
async function changeTaskType(templateId: string) {
  await initFlowTemplate(state.taskForm.spaceId!, templateId)
  state.items = await getFormItems(flowTemplateInfo.value, { id: '', workItemStatus: {}, creator: { userId: userInfo.id } } as WorkDetailData, taskPermissions.value) as unknown as { [key: string]: ItemProps }
  state.fromKey++
  // 更新配置
  delete state.items.childTaskTable
  state.items.version.dropdownMatchSelectWidth = 200
  state.items.files.taskMode = false
  state.items.processRate.hideLabel = true
  state.items.processRate.inputSuffix = ''
  state.items.processRate.suffix = '%'
  // 填充默认值
  Object.values(state.items).forEach((item: ItemProps) => {
    if (item.type === 'personSelect' && item.roleId) {
      // 更新人员选择配置为：清空后不恢复原数据
      item.clearNotRestore = true
      const index = item.directorIds.indexOf('_creator')
      if (index > -1) {
        if (item.directorIds.includes(userInfo.id)) {
          item.directorIds.splice(index, 1)
        }
        else {
          item.directorIds.splice(index, 1, userInfo.id)
        }
      }
      state.taskForm[item.field!] = item.directorIds
    }
  })
}

// 获取项目权限
async function getProjectPermission() {
  try {
    const { data } = await getSpaceWorkItemOperationPermissions(
      state.taskForm.spaceId as string,
      '0',
      'work_item_create',
    )
    const { perms } = useTaskPermission({ workItemStatus: {} as WorkItemStatus, operationPermissions: JSON.parse(data) })
    perms.allowEdit = true
    taskPermissions.value = perms
  }
  catch (error) {
  }
}

// 打开任务弹框
function handleOpen(open: boolean) {
  if (open) {
    if (props.openType === 'project') {
      state.taskForm.spaceId = currentRoute.value.params.id as string
      _initFormData()
    }

    rawTaskForm = deepCopy(toRaw(state.taskForm))
  }
  else {
    _clearFormData()
    if (state.isContinue)
      proxy.mittBus.emit('onRefreshTable', [])

    emits('onCloseDrawer', false)
  }
}

// 关闭任务弹框
function handleClose() {
  const isFormFilled = !deepEqual(toRaw(state.taskForm), rawTaskForm)
  if (isFormFilled && !isEmptyObject(rawTaskForm)) {
    Msgbox.warning.l({ title: '当前已有编辑内容，是否关闭？', onOk: handleConfirmClose })
    return
  }
  state.dialogVisible = false
  if (refreshOnClose.value)
    proxy.mittBus.emit('closeTaskDialog', 'refreshTable')
  else
    proxy.mittBus.emit('closeTaskDialog')
}

// 存在编辑内容时确认关闭
function handleConfirmClose() {
  _clearFormData()
  state.dialogVisible = false
  proxy.mittBus.emit('closeTaskDialog')
}

// 初始化数据
async function _initFormData() {
  state.isContinue = false
  getProjectPermission()
}

// 清空表单
function _clearFormData() {
  state.taskForm = Object.assign(cloneDeep(baseForm), { spaceId: state.taskForm.spaceId }) as unknown as WorkDetailData
  dateRef.value?.cleanDate(true)
  taskAddFormRef.value?.resetFields()
}

// 清空部分表单
function _clearPartFormData() {
  state.taskForm.workItemName = ''
  state.taskForm.processRate = undefined
  state.taskForm.tagIds = [] as any
  state.taskForm.describe = ''
  state.taskForm.remark = ''
  state.taskForm.files = [] as { add?: string[] | undefined, remove?: string[] | undefined }
  uploadRef.value?.clearAll()
}

// 提交创建
const handleSubmit = throttle(async () => {
  if (state.submitLoading)
    return
  try {
    await bFormRef.value.validate()
    // 组织角色数据
    const owner: any[] = []
    Object.values(state.items).forEach((item: any) => {
      if (item.type === 'personSelect' && item.roleId) {
        owner.push({
          role: item.roleId,
          directorId: state.taskForm[item.field],
        })
      }
    })
    // 组织 iconflags 数据
    const icon_flags = []
    if (state.taskForm.describe.match('<img src='))
      icon_flags.push(1)
    if (state.taskForm.describe.match('http://') || state.taskForm.describe.match('https://'))
      icon_flags.push(2)

    state.submitLoading = true
    await createProjectWork({
      describe: state.taskForm.describe,
      flowId: state.taskForm.flowId,
      itemName: state.taskForm.workItemName,
      owner,
      planTimeAt: state.taskForm.planTime as TaskPlanTimeAt,
      priority: state.taskForm.priority,
      progressRate: state.taskForm.processRate === undefined ? 0 : state.taskForm.processRate,
      remark: state.taskForm.remark,
      spaceId: state.taskForm.spaceId,
      tag: { add: state.taskForm.tagIds },
      workItemId: '',
      workItemType: state.taskForm.workItemType,
      workObjectId: state.taskForm.workObjectId,
      workVersionId: state.taskForm.versionId,
      icon_flags,
      file: { add: state.file },
    })
    message.success('任务创建成功', 3)
    state.submitLoading = false
    if (state.isContinue) {
      // 连续建单
      _clearPartFormData()
    }
    else {
      state.dialogVisible = false
      proxy.mittBus.emit('onRefreshTable', [])
      _clearFormData()
    }
  }
  catch (errorInfo) {
    state.submitLoading = false
  }
}, 1500)

function cooperateWarning(data: any, name: string) {
  if (Number.parseInt(state.taskForm.flowId) === data.workFlow.id) {
    Msgbox.warning.l({
      title: `当前任务流程已被${name}`,
      content: h('div', [
        h('p', [
          `1.流程【${data.workFlow.name}】已被 ${data.operator.nickname}`,
          h('span', { style: { color: '#999' } }, `（${data.operator.username}）`),
          `${name}`,
        ]),
        h('p', '2.您可点击"我知道了"重新选择任务类型'),
      ]),
      cancelButtonProps: { style: { display: 'none' } } as ButtonProps,
      okText: '我知道了',
      onOk: () => {
        // businessWorkFlowSelectRef.value.refresh(true)
        _clearFormData()
        _initFormData()
      },
    })
  }
}

function onCooperateDelete(data: any) {
  cooperateWarning(data, '删除')
}

function onCooperateDisabled(data: any) {
  cooperateWarning(data, '禁用')
}

function onChangeForm(field: string, value: any) {
  switch (field) {
    case 'describe':
      state.taskForm.describe = value
      break
    case 'remark':
      state.taskForm.remark = value
      break
    case 'files':
      state.file = value
      break
  }
}

function openTaskDrawer() {
  state.dialogVisible = true
}

defineExpose({
  openTaskDrawer,
})
</script>

<template>
  <a-drawer
    :open="state.dialogVisible"
    root-class-name="project-task-drawer"
    class="task-add-drawer"
    :mask-style="{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }"
    destroy-on-close
    :width="680"
    :closable="false"
    :push="{
      distance: 0,
    }"
    :z-index="2001"
    @close="handleClose"
    @after-open-change="handleOpen"
  >
    <!-- 头部 -->
    <template #title>
      <navbar content-align="center" title="" is-back @on-back="handleClose">
        <template #content>
          <div class="text16 pfm">
            新建任务
          </div>
        </template>
      </navbar>
      <!-- <div class="drawer-header flex-row-between">
        <p class="text20 pfm">
          新建任务
        </p>
        <div class="close flex-row-center pointer ml16" @click="handleClose">
          <svg-icon name="drawer-close" color="#1a1a1a" size="16" />
        </div>
      </div> -->
    </template>
    <!-- 内容 -->
    <touch-content direction="right" style="min-height: 100%;" @on-swiper="handleClose">
      <div class="task-add-scrollbar">
        <div class="task-form task-add-form">
          <a-form
            ref="taskAddFormRef"
            :model="state.taskForm"
            :rules="taskRule"
            v-bind="formConfig"
          >
            <!-- 工作台 所属项目 -->
            <div v-if="openType === 'dashboard'" class="module home-module">
              <a-form-item label="所属项目" name="spaceId">
                <BBaseSelect
                  v-model:value="state.taskForm.spaceId"
                  placeholder="请选择项目"
                  class-name="project-select"
                  :options="projectList"
                  @change="changeTaskProject"
                >
                  <template #notFoundContent>
                    <p class="text14 main-color flex-row-center h54">
                      当前没有参与任何项目
                    </p>
                  </template>
                </BBaseSelect>
              </a-form-item>
            </div>

            <!-- 任务流程 -->
            <div v-if="hasProject" class="module type-module">
              <!-- 任务流程 -->
              <a-form-item name="flowId" html-for="">
                <template #label>
                  <div class="flex-row-center">
                    <span>任务流程</span>
                  <!-- <a-tooltip
                    title="请选择合适的任务流程，不同类型的任务单其流程步骤节点不同"
                    overlay-class-name="task-tooplip-title"
                  >
                    <div class="tips-svg">
                      <svg-icon
                        class="tips-no-hover"
                        name="tips-icon"
                        size="16"
                        color="rgba(0, 0, 0, 0.65)"
                      />
                    </div>
                  </a-tooltip> -->
                  </div>
                </template>
                <BusinessWorkFlowSelect
                  :key="state.workFlowKey"
                  ref="businessWorkFlowSelectRef"
                  :value="state.taskForm.flowId ? [state.taskForm.flowId] : []"
                  placeholder="请选择任务流程"
                  :space-id="state.taskForm.spaceId"
                  :is-single="true"
                  :can-clear="false"
                  status="1"
                  size="large"
                  :max-tag-count="1"
                  @update:value="(val: string[], options: any[]) => {
                    state.taskForm.flowId = val[0]
                    changeTaskType(options.find(item => item.value === val[0]).templateId)
                  }"
                />
              </a-form-item>
            </div>

            <!-- 项目部分表单 -->
            <div v-if="hasProjectAndType" class="module base-module">
              <BForm
                ref="bFormRef"
                :key="state.fromKey"
                :model-value="state.taskForm"
                :items="Object.values(state.items)"
                :label-col="{ style: { width: '17.94872vw' } }"
                :disabled="!taskPermissions.allowEdit"
                name="task-edit"
                label-align="left"
                column
                @change="onChangeForm"
              />
            </div>
          </a-form>
        </div>
      </div>
    </touch-content>

    <!-- 底部 -->
    <template #footer>
      <div v-if="hasProjectAndType" class="drawer-footer flex-row-between pr16 pl16">
        <a-checkbox v-model:checked="state.isContinue">
          <span class="text14 title-color">连续创建</span>
        </a-checkbox>
        <div class="flex-row-start gap12">
          <a-button class="btn cancel-btn h32" size="default" @click="handleClose">
            取消
          </a-button>
          <a-button
            class="btn confirm-btn h32"
            size="default"
            type="primary"
            :loading="state.submitLoading"
            @click="handleSubmit"
          >
            确认创建
          </a-button>
        </div>
      </div>
    </template>
  </a-drawer>
</template>

<style lang="scss">
@import '../scss/task-add.scss';
</style>

<style lang="scss" scoped>
.home-module,
.type-module {
  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
  :deep(.ant-form-item-label) {
    padding-bottom: 0;
    label {
      font-size: 14px;
      height: 36px;
      &::before {
        font-size: 14px !important;
      }
    }
  }
  :deep(.ant-select-selector) {
    height: 36px !important;
    border-radius: 6px;
  }
  :deep(.ant-select-arrow) {
    inset-inline-end: 8px !important;
    .svg-icon {
      width: 16px !important;
      height: 16px !important;
    }
  }
}
</style>
