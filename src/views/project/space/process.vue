<script lang="ts" setup>
import { computed, getCurrentInstance, h, inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import draggable from 'vuedraggable'
import { message } from 'ant-design-vue'
import NodePanel from '@/views/flowNode/components/nodePanel.vue'
import taskUpdateDialog from '@/views/project/task/components/task-update-dialog.vue'
import { deepCopy, getTextLength } from '@/utils'
import { Msgbox } from '@/utils/msgbox'
import { getWorkFlowPageList } from '@/api/project'
import router from '@/router'
import { createWorkFlow, delWorkFlow, getWorkFlowRelationCount, setWorkFlowCopy, setWorkFlowName, setWorkFlowRanking, setWorkFlowStatus } from '@/api/workflow'
import ModalWorkItemStatus from '@/views/flowNode/components/modalWorkItemStatus.vue'
import ModalWorkItemRole from '@/views/flowNode/components/modalWorkItemRole.vue'
import type { WorkflowPageListData } from '@/api/project/types'
import type { QueryCondition } from '@/components/BSearchFilter/interface'
import { Perm } from '@/enum/permission'
import { usePermission } from '@/hooks/usePermission'

const emits = defineEmits(['handleLoading'])
let temporaryName = ''
interface TypeActions {
  [key: string]: (element: any, status: number) => Promise<void> | void
}
interface EditNameShowType {
  name: string
  show: boolean
  menuShow: boolean
  dragNodeSrc: string
}
interface EditTextMenuType {
  icon: string
  iconColor: string
  type: string
  name: string
  nameColor: string
}
const handleChangeTab: Function = inject('handleChangeTab') as Function
const { proxy } = getCurrentInstance() as any
const { checkPerm } = usePermission()
const currentTemplate = ref<WorkflowPageListData>()
const enabledNodePanelRef = ref([] as any[])
const disabledNodePanelRef = ref([] as any[])

const enableNameInputRef = ref([] as any[]) // input输入框集合
const disableNameInputRef = ref([] as any[])

const enabledDeepList = ref<WorkflowPageListData[]>([])
const disabledDeepList = ref<WorkflowPageListData[]>([])

const state = reactive({
  isLoadingData: false,
  processDialogTitle: '',
  processVisible: false,
  enabledList: [] as WorkflowPageListData[],
  disabledList: [] as WorkflowPageListData[],
  editEnabledNameShow: [] as EditNameShowType[],
  editDisabledNameShow: [] as EditNameShowType[],
  taskUpdateDialogVisible: false,
  editTextMenu: [] as EditTextMenuType[],
  spaceId: '',
  workFlowId: '',
  workFlowConf: null,
  workFlowName: '',
  isDraging: false,
})
const editTextArr = [
  {
    icon: 'node-title-edit',
    iconColor: '#666',
    type: 'edit',
    name: '编辑',
    nameColor: '#333',
    show: checkPerm(Perm.ModifySpaceWorkFlow),
  },
  {
    icon: 'node-edit-copy',
    iconColor: '#666',
    type: 'copy',
    name: '复制',
    nameColor: '#333',
    show: checkPerm(Perm.CopySpaceWorkFlow),
  },
  {
    icon: 'node-edit-update',
    iconColor: '#666',
    type: 'update',
    name: '升级',
    nameColor: '#333',
    show: checkPerm(Perm.UpdateSpaceWorkFlow),
  },
  {
    icon: 'node-edit-disabled',
    iconColor: '#666',
    type: 'disabled',
    name: '禁用',
    nameColor: '#333',
    show: checkPerm(Perm.UpdateSpaceWorkFlowStatus),
  },
  {
    icon: 'node-edit-enabled',
    iconColor: '#666',
    type: 'enabled',
    name: '启用',
    nameColor: '#333',
    show: checkPerm(Perm.UpdateSpaceWorkFlowStatus),
  },
  {
    icon: 'node-edit-del',
    iconColor: '#FD4C4C',
    type: 'del',
    name: '删除',
    nameColor: '#FD4C4C',
    show: checkPerm(Perm.DeleteSpaceWorkFlow),
  },
]

const creatorOrSuperManager = computed(() => {
  const result = checkPerm(Perm.ModifySpaceWorkFlow)
  return result
})

function filtetProjectData(flowId: string) {
  const conditions: QueryCondition[] = [{
    field: 'work_item_flow_id',
    operator: 'EQ',
    values: [flowId],
  }]
  handleChangeTab && handleChangeTab({
    conditions,
    conjunction: 'AND',
    conditionGroup: [],
  })
}

function showProcessEditMenu(visible: boolean, element: any, index: number, status: number) {
  const isEnabled = status === 1
  // 禁用 启用
  let filterTypes = isEnabled ? ['enabled'] : ['disabled']
  // 系统预设
  if (element.isSys === '1') {
    filterTypes = [...filterTypes, 'edit', 'del', 'update']
  }

  // 获取当前下拉菜单
  const result = deepCopy(editTextArr.filter(item => !filterTypes.includes(item.type)))
  const editNameShow = isEnabled ? state.editEnabledNameShow : state.editDisabledNameShow
  // 控制菜单显示隐藏
  if (visible) {
    state.editTextMenu = result
    editNameShow[index].menuShow = true
  }
  else {
    editNameShow[index].menuShow = false
  }
}

// 流程编辑按钮
function editProcess(type: string, element: any, index: number, status: number) {
  const isEnabled = status === 1
  const editNameShow = isEnabled ? state.editEnabledNameShow : state.editDisabledNameShow
  const typeActions: TypeActions = {
    edit: handleEdit,
    copy: handleCopy,
    update: handleUpdate,
    disabled: handleWorkFlowStatus,
    enabled: handleWorkFlowStatus,
    del: handleDelete,
  }
  if (type in typeActions) {
    typeActions[type](element, status)
    editNameShow[index].menuShow = false
  }
  else {
    throw new Error(`Unknown type`)
  }
}

function handleEdit(element: any) {
  openDialog(element)
}

async function handleCopy(element: any) {
  const { spaceId, id } = element
  await setWorkFlowCopy({ spaceId, flow_id: id })
  getTemplateListByStatus()
}

function handleUpdate(element: any) {
  const { spaceId, workFlowConf, id, name } = element
  state.spaceId = spaceId
  state.workFlowId = id
  state.workFlowConf = workFlowConf
  state.workFlowName = name
  state.taskUpdateDialogVisible = true
}

// 切换禁用 启用
async function handleWorkFlowStatus(element: any, status: number) {
  const isEnabled = status === 1
  const { spaceId, id } = element
  let modalInstance: any

  // 获取流程关联的任务数
  const relateCountRes = await getWorkFlowRelationCount({ spaceId, id, scene: '' })
  const relateCount = Number(relateCountRes.data.total) || 0

  const textTitle = `是否${isEnabled ? '禁用' : '启用'}流程【${element.name}】`
  const textContentOne = isEnabled
    ? h('p', null, [
      '1.当前任务流程已关联任务数 ',
      h('span', { class: 'pfm-smoothing pointer', onClick: () => {
        modalInstance && modalInstance.destroy()
        // 跳转表格
        filtetProjectData(id)
      } }, relateCount),
    ])
    : '1.启用后，当前项目成员可使用该流程创建任务'
  const textContentTwo = isEnabled ? '2.禁用后,不影响应用当前流程的任务单' : '2.不影响已应用当前流程的任务单'

  modalInstance = Msgbox.warning.m({
    title: textTitle,
    okText: `${isEnabled ? '禁用' : '启用'}`,
    content: [h('p', null, textContentOne), h('p', null, textContentTwo)],
  })
  await modalInstance
  await setWorkFlowStatus({ spaceId, flow_id: id, status: isEnabled ? 0 : 1 })

  const msg = h('div', {
    innerHTML: `<div style="color: #333333;"><span class="pfm-smoothing">${element.name} </span>流程已${isEnabled ? '禁用' : '启用'}</div>`,
  })
  message.success(msg, 3)
  getTemplateListByStatus()
}

async function handleDelete(element: any, status: number) {
  const isEnabled = status === 1
  const { spaceId, id } = element
  let modalInstance: any

  // 获取流程关联的任务数
  const relateCountRes = await getWorkFlowRelationCount({ spaceId, id, scene: '' })
  const relateCount = Number(relateCountRes.data.total) || 0

  const textContentOne = relateCount
    ? h('p', null, [
      '1.当前任务流程已关联任务数量',
      h('span', { class: 'pfm-smoothing pointer ml5 mr5', onClick: () => {
        modalInstance && modalInstance.destroy()
        // 跳转表格
        filtetProjectData(id)
      } }, relateCount),
      ', 流程无法删除',
    ])
    : '1.确认后，将永久删除该任务流程, 不可恢复'
  const textContentTwo = relateCount ? '2.若该流程已失效，推荐将流程设置为禁用' : '2.当前项目将无法使用该流程创建任务'

  const msgConfig: any = {
    title: `${relateCount ? '无法' : '是否'}删除流程【${element.name}】`,
    okText: `删除`,
    cancelText: `取消`,
    content: [
      h('p', null, textContentOne),
      h('p', null, textContentTwo),
    ],
    footer: [
      h('div', { class: 'process-control-custom-btn' }, [
        h('div', {
          onClick: () => {
            modalInstance.destroy()
          },
          class: 'ant-btn ant-btn-del',
        }, '我知道了'),
      ]),
    ],
  }

  if (!relateCount && msgConfig.footer) {
    delete msgConfig.footer
  }

  modalInstance = Msgbox.error.m(msgConfig)
  await modalInstance
  await delWorkFlow({ spaceId, flow_id: id })

  const msg = h('div', {
    innerHTML: `<div style="color: #333333;"><span class="pfm-smoothing">${element.name} </span>流程删除成功</div>`,
  })
  message.success(msg, 3)
  updateList(id, isEnabled)
}
// 删除后更新列表
function updateList(id: string, isEnabled: boolean) {
  const listName = isEnabled ? 'enabledList' : 'disabledList'
  const index = state[listName].findIndex(item => item.id === id)
  if (index !== -1) {
    state[listName].splice(index, 1)
    state[`edit${isEnabled ? 'Enabled' : 'Disabled'}NameShow`].splice(index, 1)
  }
}

function editDisabledBlur(index: number, status: number) {
  const isEnabled = status === 1
  const inputRef = isEnabled ? enableNameInputRef : disableNameInputRef

  const inputRefValue = inputRef.value[index]
  inputRefValue.blur()
}
// 修改流程名称
async function toggleEditName(templateIndex: number, editShow: boolean, status: number, element: any) {
  const { spaceId, id, isSys } = element
  if (!creatorOrSuperManager.value || isSys === '1') {
    return
  }
  const isEnabled = status === 1

  const processList = isEnabled ? state.enabledList : state.disabledList
  const editNameShow = isEnabled ? state.editEnabledNameShow : state.editDisabledNameShow
  const inputRef = isEnabled ? enableNameInputRef : disableNameInputRef

  const inputRefValue = inputRef.value[templateIndex]
  const editNameItem = editNameShow[templateIndex]

  editNameItem.show = editShow
  if (editShow) {
    temporaryName = editNameItem.name
    inputRefValue && inputRefValue.focus()
  }
  else {
    // 校验输入值是否符合修改要求
    const error = checkEditName(editNameItem.name)
    if (error) {
      message.error(error, 3)
      editNameItem.name = temporaryName
      return
    }
    // 修改值和初始值相同
    if (temporaryName === editNameItem.name) {
      return
    }
    processList[templateIndex].name = editNameItem.name
    try {
      await setWorkFlowName({ spaceId, flow_id: id, name: editNameItem.name.trim() })
      message.success('流程名称修改成功', 3)
    }
    catch (err) {
      editNameItem.name = temporaryName
    }
  }
}

function checkEditName(name: string): string {
  const length = getTextLength(name)
  if (!name) {
    return '流程名称不能为空'
  }
  if (!(length >= 2 && length <= 30)) {
    return '请输入有效格式(2 ~ 30个字符)'
  }
  return ''
}

function dragDisableData(data: any) {
  const moved = data.moved
  fnSetSpaceOrder(moved.oldIndex, moved.newIndex, 0)
}
function dragEnableData(data: any) {
  const moved = data.moved
  fnSetSpaceOrder(moved.oldIndex, moved.newIndex, 1)
}

function dragChoose(data: any, status: number) {
  state.isDraging = true
  const isEnabled = status === 1
  const { item: dragDom, oldIndex: index } = data
  const canvas = dragDom.querySelector('canvas')
  const imgData = canvas.toDataURL('image/png')

  const editNameShow = isEnabled ? state.editEnabledNameShow : state.editDisabledNameShow
  editNameShow[index].dragNodeSrc = imgData
}

function dragEnd(data: any, status: number) {
  state.isDraging = false
  const isEnabled = status === 1
  const { oldIndex: index } = data
  const editNameShow = isEnabled ? state.editEnabledNameShow : state.editDisabledNameShow
  editNameShow[index].dragNodeSrc = ''
}

async function fnSetSpaceOrder(fromIdx: number, toIdx: number, status: number) {
  const isEnabled = status === 1
  const sourceList = isEnabled ? enabledDeepList : disabledDeepList

  const itemToMove = sourceList.value.splice(fromIdx, 1)[0]
  sourceList.value.splice(toIdx, 0, itemToMove)

  const decrementBy = 100
  const baseRanking = (sourceList.value.length + 1) * decrementBy
  for (let i = 0; i < sourceList.value.length; i++) {
    sourceList.value[i].ranking = baseRanking - (i * decrementBy)
  }

  const editNameShow = sourceList.value.map((item: any) => ({
    name: item.name,
    show: false,
    menuShow: false,
    dragNodeSrc: '',
  }))

  if (isEnabled) {
    state.editEnabledNameShow = editNameShow
    state.enabledList = sourceList.value
  }
  else {
    state.editDisabledNameShow = editNameShow
    state.disabledList = sourceList.value
  }

  const updatedItems = sourceList.value.map((item: any, index: number) => ({
    id: item.id,
    name: item.name,
    ranking: baseRanking - (index * decrementBy),
  }))

  await setWorkFlowRanking({
    spaceId: router.currentRoute.value.params.id as string,
    list: updatedItems,
  })
}

// 交换位置
// async function fnSetSpaceOrder(fromIdx: number, toIdx: number, status: number) {
//   const isEnabled = status === 1
//   const sourceList = isEnabled ? enabledDeepList : disabledDeepList

//   // 创建正确的更新项目列表
//   const updatedItems = [
//     {
//       id: sourceList.value[fromIdx].id,
//       ranking: sourceList.value[toIdx].ranking,
//     },
//     {
//       id: sourceList.value[toIdx].id,
//       ranking: sourceList.value[fromIdx].ranking,
//     },
//   ];

//   //  交换位置
//   [sourceList.value[toIdx], sourceList.value[fromIdx]] = [sourceList.value[fromIdx], sourceList.value[toIdx]];

//   [sourceList.value[toIdx].ranking, sourceList.value[fromIdx].ranking] = [sourceList.value[fromIdx].ranking, sourceList.value[toIdx].ranking]

//   const editNameShow = sourceList.value.map((item: any) => ({ name: item.name, show: false, menuShow: false, dragNodeSrc: '' }))

//   isEnabled ? state.editEnabledNameShow = editNameShow : state.editDisabledNameShow = editNameShow
//   isEnabled ? state.enabledList = sourceList.value : state.disabledList = sourceList.value

//   await setWorkFlowRanking({
//     spaceId: router.currentRoute.value.params.id as string,
//     list: updatedItems,
//   })
// }

// 获取模板列表
async function getTemplateListByStatus() {
  emits('handleLoading', true)
  const spaceId = router.currentRoute.value.params.id as string
  try {
    const result = await getWorkFlowPageList(spaceId, 1)
    emits('handleLoading', false)
    state.isLoadingData = true

    const enabledList = result.data.list.filter(item => item.status === '1')
    const disabledList = result.data.list.filter(item => item.status === '0')

    state.enabledList = enabledList
    state.disabledList = disabledList

    enabledDeepList.value = enabledList
    disabledDeepList.value = disabledList

    state.editEnabledNameShow = getListNameShow(state.enabledList)
    state.editDisabledNameShow = getListNameShow(state.disabledList)

    nextTick(() => {
      enabledNodePanelRef.value.map((item) => {
        item && item.refresh()
      })
      disabledNodePanelRef.value.map((item) => {
        item && item.refresh()
      })
    })
  }
  catch (error) {
    emits('handleLoading', false)
  }
}

function getListNameShow(list: any) {
  return list.map((item: any) => ({
    name: item.name,
    show: false,
    menuShow: false,
    dragNodeSrc: '',
  }))
}

// 展示全部流程节点
function openDialog(item: any) {
  const { spaceId, id, isSys } = item
  if (creatorOrSuperManager.value && isSys !== '1') {
    proxy.mittBus.emit('openFlowDialog', { spaceId, flowId: id, isCreating: false })
  }
  else {
    currentTemplate.value = item
    state.processDialogTitle = `<span class="pfm-smoothing" style="margin-right: 7px;">${item.name}</span><span class="pfm-smoothing">任务流程</span>`
    setTimeout(() => {
      state.processVisible = true
    }, 10)
  }
}

// 打开新建流程弹框
function openFlowDialog() {
  if (!creatorOrSuperManager.value) {
    return
  }
  const spaceId = router.currentRoute.value.params.id as string
  createWorkFlow({ spaceId, name: '' }).then((res) => {
    const flowId: string = res.data.flowId as string
    proxy.mittBus.emit('openFlowDialog', { spaceId, flowId, isCreating: true })
  })
}

function closeFlowDrawer(isSave: boolean) {
  if (isSave) {
    getTemplateListByStatus()
  }
}

function calcEditClass(index: number) {
  if (index === 1 && state.editTextMenu.length > 2)
    return 'edit-bot-line'
}

onMounted(() => {
  proxy.mittBus.on('closeFlowDrawer', closeFlowDrawer)
  getTemplateListByStatus()
})

onUnmounted(() => {
  proxy.mittBus.off('closeFlowDrawer', closeFlowDrawer)
})
</script>

<template>
  <!-- 任务升级弹窗 -->
  <taskUpdateDialog
    v-if="state.taskUpdateDialogVisible"
    v-model:dialogVisible="state.taskUpdateDialogVisible"
    :space-id="state.spaceId"
    :is-all-update="true"
    :work-flow-name="state.workFlowName"
    :work-flow-id="state.workFlowId"
    :template-conf="state.workFlowConf"
  />
  <el-scrollbar>
    <div v-if="state.isLoadingData" class="project-space-process" :class="{ 'is-draging': state.isDraging }">
      <div class="process-block">
        <div class="process-head">
          <div class="process-head-left">
            <div class="process-title pfm-smoothing">
              流程
            </div>
            <div v-if="creatorOrSuperManager" class="process-add" @click="openFlowDialog">
              <SvgIcon name="process_add" size="12" color="#1D74F5" />
              <div class="add-text">
                新建
              </div>
            </div>
          </div>
          <div v-if="creatorOrSuperManager" class="process-head-right">
            <ModalWorkItemRole />
            <ModalWorkItemStatus />
          </div>
        </div>
        <draggable
          v-model="state.enabledList"
          class="process-list"
          drag-class="drag-item"
          chosen-class="choose-item"
          item-key="id"
          :force-fallback="true"
          :fallback-on-body="true"
          :animation="400"
          handle=".handle"
          @change="dragEnableData"
          @choose="dragChoose($event, 1)"
          @unchoose="dragEnd($event, 1)"
          @end="dragEnd($event, 1)"
        >
          <template #item="{ element, index }">
            <transition-group name="slide" tag="div" class="transition-item flex-column-center select-none">
              <div :key="element.id" class="item flex-column-center" :class="{ 'item-permission': creatorOrSuperManager }">
                <div class="item-body" @click="openDialog(element)">
                  <NodePanel
                    v-show="!state.editEnabledNameShow[index].dragNodeSrc"
                    :id="`enabled + ${element.id}`"
                    :key="element.id"
                    :ref="r => enabledNodePanelRef[index] = r"
                    :nodes="element.workFlowConf.nodes"
                    :connections="element.workFlowConf.connections"
                  />
                  <img class="drag-node-src" :src="state.editEnabledNameShow[index].dragNodeSrc">
                </div>
                <div class="item-foot flex-row-center">
                  <input
                    :ref="r => enableNameInputRef[index] = r"
                    v-model="state.editEnabledNameShow[index].name"
                    type="text"
                    class="foot-input"
                    :class="{ 'input-show': state.editEnabledNameShow[index].show }"
                    @blur="toggleEditName(index, false, 1, element)"
                    @keyup.enter="editDisabledBlur(index, 1)"
                  >
                  <div v-if="creatorOrSuperManager" class="foot-drag flex-row-center mr3" :class="{ 'drag-show': !state.editEnabledNameShow[index].show }">
                    <svg-icon
                      class="drag-icon handle"
                      name="drag_icon"
                      size="16"
                    />
                  </div>
                  <div class="foot-right" :class="{ 'text-show': !state.editEnabledNameShow[index].show }">
                    <div
                      v-show="!state.editEnabledNameShow[index].show"
                      class="foot-name text-ellipsis"
                      @click="toggleEditName(index, true, 1, element)"
                    >
                      <b-ellipsis-text :content="state.editEnabledNameShow[index].name" content-class="pfm-smoothing" />
                    </div>
                    <div class="foot-desc">
                      {{ Number(element.isSys) ? `预设` : `v${element.version}` }}
                    </div>
                  </div>
                  <a-popover
                    v-if="creatorOrSuperManager"
                    placement="rightTop"
                    trigger="click"
                    overlay-class-name="process-edit-btn-list"
                    :get-popup-container="(triggerNode: any) => triggerNode.parentNode.parentNode"
                    :align="{ offset: [-35, 35] }"
                    :open="state.editEnabledNameShow[index] && state.editEnabledNameShow[index].menuShow"
                    @open-change="showProcessEditMenu($event, element, index, 1)"
                  >
                    <template #content>
                      <div
                        v-for="(editItem, editIndex) in state.editTextMenu"
                        :key="editIndex"
                        class="edit-item"
                        :class="calcEditClass(editIndex)"
                        @click="editProcess(editItem.type, element, index, 1)"
                      >
                        <SvgIcon :name="editItem.icon" :size="16" :color="editItem.iconColor" />
                        <div class="item-text" :style="{ color: editItem.nameColor }">
                          {{ editItem.name }}
                        </div>
                      </div>
                    </template>
                    <div class="foot-left" :class="{ active: state.editEnabledNameShow[index].menuShow }">
                      <SvgIcon name="my-more" :size="16" color="#666" />
                    </div>
                  </a-popover>
                </div>
              </div>
            </transition-group>
          </template>
        </draggable>
      </div>
      <div v-if="state.disabledList?.length" class="process-block">
        <div class="process-head">
          <div class="process-head-left">
            <div class="process-title pfm-smoothing">
              已禁用流程
            </div>
          </div>
        </div>
        <div classs="process-list">
          <draggable
            v-model="state.disabledList"
            class="process-list"
            drag-class="drag-item"
            chosen-class="choose-item"
            item-key="id"
            :force-fallback="true"
            :fallback-on-body="true"
            handle=".handle"
            :animation="400"
            @change="dragDisableData"
            @choose="dragChoose($event, 0)"
            @unchoose="dragEnd($event, 0)"
            @end="dragEnd($event, 0)"
          >
            <template #item="{ element, index }">
              <transition-group name="slide" tag="div" class="transition-item flex-column-center">
                <div :key="element.id" class="item flex-column-center" :class="{ 'item-permission': creatorOrSuperManager }">
                  <div class="item-body" @click="openDialog(element)">
                    <NodePanel
                      v-show="!state.editDisabledNameShow[index].dragNodeSrc"
                      :id="`disabled + ${element.id}`"
                      :key="element.id"
                      :ref="r => disabledNodePanelRef[index] = r"
                      :nodes="element.workFlowConf.nodes"
                      :connections="element.workFlowConf.connections"
                    />
                    <img class="drag-node-src" :src="state.editDisabledNameShow[index].dragNodeSrc">
                  </div>
                  <div class="item-foot flex-row-center">
                    <input
                      :ref="r => disableNameInputRef[index] = r"
                      v-model="state.editDisabledNameShow[index].name"
                      type="text"
                      class="foot-input"
                      :class="{ 'input-show': state.editDisabledNameShow[index].show }"
                      @blur="toggleEditName(index, false, 0, element)"
                      @keyup.enter="editDisabledBlur(index, 0)"
                    >
                    <div v-if="creatorOrSuperManager" class="foot-drag flex-row-center mr3" :class="{ 'drag-show': !state.editDisabledNameShow[index].show }">
                      <svg-icon
                        class="drag-icon handle"
                        name="drag_icon"
                        size="16"
                      />
                    </div>
                    <div class="foot-right" :class="{ 'text-show': !state.editDisabledNameShow[index].show }">
                      <div
                        v-show="!state.editDisabledNameShow[index].show"
                        class="foot-name text-ellipsis"
                        @click="toggleEditName(index, true, 0, element)"
                      >
                        <b-ellipsis-text :content="state.editDisabledNameShow[index].name" content-class="pfm-smoothing" />
                      </div>
                      <div class="foot-desc">
                        {{ Number(element.isSys) ? `预设` : `v${element.version}` }}
                      </div>
                    </div>
                    <a-popover
                      v-if="creatorOrSuperManager"
                      placement="rightTop"
                      trigger="click"
                      overlay-class-name="process-edit-btn-list"
                      :get-popup-container="(triggerNode: any) => triggerNode.parentNode.parentNode"
                      :align="{ offset: [-35, 35] }"
                      :open="state.editDisabledNameShow[index] && state.editDisabledNameShow[index].menuShow"
                      @open-change="showProcessEditMenu($event, element, index, 0)"
                    >
                      <template #content>
                        <div
                          v-for="(editItem, editIndex) in state.editTextMenu"
                          :key="editIndex"
                          class="edit-item"
                          :class="calcEditClass(editIndex)"
                          @click="editProcess(editItem.type, element, index, 0)"
                        >
                          <SvgIcon :name="editItem.icon" :size="16" :color="editItem.iconColor" />
                          <div class="item-text" :style="{ color: editItem.nameColor }">
                            {{ editItem.name }}
                          </div>
                        </div>
                      </template>
                      <div class="foot-left" :class="{ active: state.editDisabledNameShow[index].menuShow }">
                        <SvgIcon name="my-more" :size="16" color="#666" />
                      </div>
                    </a-popover>
                  </div>
                </div>
              </transition-group>
            </template>
          </draggable>
        </div>
      </div>
    </div>
  </el-scrollbar>
  <!-- 流程展示 -->
  <b-dialog
    v-model:dialogVisible="state.processVisible"
    class="detail-process-dialog-show"
    width="776px"
    main-padding="0px 0px"
    header-padding="0px 0px"
    :title="state.processDialogTitle"
    close-color="#666"
    :show-footer="false"
  >
    <div class="w728 h192">
      <NodePanel
        :id="`${currentTemplate?.id}-preview`"
        :nodes="currentTemplate?.workFlowConf.nodes"
        :connections="currentTemplate?.workFlowConf.connections"
        :config="{
          fitCenter: false,
          nodeHeight: 32,
          nodePadding: 16,
          lineWidth: 2,
          nodeTextSize: 14,
        }"
      />
    </div>
  </b-dialog>
</template>

<style lang="scss">
.process-control-custom-btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 40px;
  .ant-btn {
    padding: 0 12px;
    height: 32px;
    line-height: 32px;
    border-radius: 4px;
    font-size: 14px;
    margin-left: 16px;
    cursor: pointer;
    &.ant-btn-default {
      border: 1px solid #edeef0;
      color: #1a1a1a;
    }
    &.ant-btn-del {
      background-color: #fd4c4c;
      color: #fff;
    }
  }
}

.flow-work-num {
  margin-left: 3px;
  cursor: pointer;
  &:hover {
    color: $color-primary;
  }
}
.process-edit-btn-list {
  .ant-popover-content {
    border-radius: 8px;
    .ant-popover-inner {
      border: 1px solid $tool-drop-box-border;
      box-shadow: $tool-drop-box-shadow;
      padding: 7px;
    }
  }
  .edit-item {
    display: flex;
    align-items: center;
    padding: 8px 84px 8px 8px;
    margin-bottom: 4px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background: $tool-hover-bg;
    }
    &:active {
      background-color: $tool-click-bg;
    }
    &.edit-bot-line {
      position: relative;
      &:before {
        content: '';
        position: absolute;
        bottom: -2.5px;
        left: 0;
        right: 0;
        height: 1px;
        background-color: #edeef0;
      }
    }
    &:last-of-type {
      margin-bottom: 0;
    }
    .item-text {
      font-size: 14px;
      line-height: 14px;
      margin-left: 8px;
      letter-spacing: 0;
    }
  }
}
.detail-process-dialog-show {
  padding: 24px;
  .el-dialog__header {
    margin-bottom: 24px;
    min-height: 24px;
    p {
      font-size: 16px;
      color: #1a1a1a;
    }
  }
  .b-dialog-main {
    background-color: #f9fafc;
    border-radius: 8px;
    height: 192px;
  }
}
</style>

<style lang="scss" scoped>
.drag-node-src {
  user-select: none;
}

.choose-item.sortable-ghost {
  border: 1px solid $color-primary !important;
  .item {
    opacity: 0.3;
  }
}
.drag-item {
  flex: 0 0 calc(25% - 14px);
  border-radius: 8px;
  flex-shrink: 0;
  opacity: 1 !important;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid $tool-drop-box-border;
  box-shadow:
    0px 16px 32px 0px rgba(12, 20, 33, 0.02),
    0px 4px 16px 0px rgba(12, 20, 33, 0.02);
  position: relative;
  // background: rgba(255 255 255 / 0.48);
  .item-body {
    width: 276px;
    height: 118px;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(6px);
  }
  .item-foot {
    width: 100%;
    min-height: 48px;
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    position: relative;
    background-color: #fff;

    .foot-input {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      left: 8px;
      width: 0;
      opacity: 0;
    }
    .foot-drag {
      position: absolute;
      left: 5px;
      bottom: 16px;
      z-index: 1;
      svg {
        color: #999;
      }
    }
    .foot-right {
      display: flex;
      align-items: center;
      .foot-name {
        font-size: 14px;
        line-height: 1;
        color: #333;
        margin-right: 8px;
        &:hover {
          cursor: text;
        }
      }
      .foot-desc {
        font-size: 12px;
        line-height: 1;
        color: #bfbfbf;
      }
    }
  }
}
.project-space-process {
  padding: 15px 23px;
  &.is-draging {
    cursor: grabbing;
    * {
      cursor: grabbing;
    }
  }
  .process-block {
    margin-bottom: 1px;
    &:last-child {
      margin-bottom: 0;
    }
    .process-title {
      line-height: 1;
      color: #333;
      position: relative;
      margin-right: 8px;
      padding-left: 8px;
      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 2px;
        background-color: #1d74f5;
      }
    }
    .process-head {
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      margin-left: 1px;
      min-height: 32px;
      .process-head-left {
        display: flex;
        align-items: center;
        .process-add {
          color: #1d74f5;
          display: flex;
          align-items: center;
          line-height: 1;
          padding: 9px 12px;
          border-radius: 4px;
          cursor: pointer;
          .add-text {
            margin-left: 4px;
          }
          &:hover {
            background: $tool-hover-bg;
          }
          &:active {
            background-color: $tool-click-bg;
          }
        }
      }
      .process-head-right {
        display: flex;
        align-items: center;
        :deep(.process-btn) {
          color: #333;
          border: 1px solid #edeef0;
          padding: 8px 11px;
          border-radius: 4px;
          margin-left: 8px;
          line-height: 1;
          cursor: pointer;
          &:first-of-type {
            margin-right: 0;
          }
          &:hover {
            background: $tool-hover-bg;
            border: none;
            padding: 9px 12px;
          }
          &:active {
            background-color: $tool-click-bg;
            border: none;
            padding: 9px 12px;
          }
        }
      }
    }
    .process-list {
      display: flex;
      flex-wrap: wrap;
      margin-right: -14px;
    }
    .transition-item {
      margin-right: 14px;
      flex: 0 0 calc(25% - 14px); /* 33.33%减去间距 */
      border-radius: 8px;
      flex-shrink: 0;
      border: 1px solid #f2f3f5;
      overflow: hidden;
      box-sizing: border-box;
      margin-bottom: 14px;
      &:nth-child(4n) {
        margin-right: 0;
      }
      &:hover {
        border: 1px solid $tool-drop-box-border;
        box-shadow:
          0px 16px 32px 0px rgba(12, 20, 33, 0.02),
          0px 4px 16px 0px rgba(12, 20, 33, 0.02);
      }
    }
    .item {
      width: 100%;
      &.item-permission {
        &:hover {
          .item-foot {
            padding: 12px 8px 12px 24px;
            .foot-drag {
              opacity: 1;
            }
          }
        }
      }
      .item-body {
        width: 100%;
        height: 118px;
        background: #f9fafc;
        overflow: hidden;
        cursor: pointer;
        :deep(.node-graph) {
          pointer-events: none;
        }
      }
      .item-foot {
        width: 100%;
        padding: 12px 8px;
        display: flex;
        justify-content: space-between;
        min-height: 48px;
        position: relative;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        .foot-input {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 8px;
          width: 0;
          opacity: 0;
          border-radius: 4px;
          padding-left: 8px;
          min-height: 32px;
          font-size: 14px;
          border: 2px solid #1d74f5;
          outline: none;
          cursor: default;
          z-index: 2;
          transition:
            width 0.4s cubic-bezier(0.4, 0, 0, 1),
            opacity 0.4s cubic-bezier(0.4, 0, 0, 1);
          &.input-show {
            width: 212px;
            opacity: 1;
            cursor: text;
          }
        }
        .foot-drag {
          position: absolute;
          left: 5px;
          bottom: 16px;
          cursor: grab;
          opacity: 0;
          z-index: 1;
          svg {
            color: #999;
            &:hover {
              color: #666 !important;
            }
          }
          &:active {
            cursor: grabbing;
          }
          &.drag-show {
            z-index: 3;
          }
        }
        .foot-right {
          display: flex;
          align-items: center;
          opacity: 0;
          &.text-show {
            opacity: 1;
            transition: opacity 0.2s cubic-bezier(0.4, 0, 0, 1);
            transition-delay: 0.3s;
          }
          .foot-name {
            font-size: 14px;
            line-height: 20px;
            margin-right: 8px;
            max-width: 160px;
            color: #333;
            &:hover {
              cursor: text;
            }
          }
          .foot-desc {
            font-size: 12px;
            line-height: 1;
            color: #bfbfbf;
          }
        }
        .foot-left {
          display: flex;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          &:hover {
            background: $tool-hover-bg;
          }
          &:active {
            background-color: $tool-click-bg;
          }
          &.active {
            background-color: $tool-click-bg;
          }
        }
      }
    }
  }
}
</style>
