<script lang="ts" setup>
import type { Ref } from 'vue'
import { computed, getCurrentInstance, h, reactive, ref, unref } from 'vue'
import { message } from 'ant-design-vue'
import { cloneDeep } from 'lodash'
import type { NodeProp, Workflow } from '@/views/flowNode/types'
import { useOwners } from '@/views/flowNode/utils/useOwners'
import { useProjectStore } from '@/stores/modules/project'
import FlowTitle from '@/views/flowNode/components/flowTitle.vue'
import NodeGraph from '@/views/flowNode/components/nodeGraph.vue'
import ControlPanel from '@/views/flowNode/components/controlPanel.vue'
import { getWorkFlow, getWorkFlowRelationCount, postWorkFlow } from '@/api/workflow'
import { Msgbox } from '@/utils/msgbox'
import { getFormItems } from '@/views/flowNode/utils/formItems'
import { getValueByPath } from '@/utils/object'
import PreviewWorkflow from '@/views/flowNode/components/previewWorkflow.vue'
import type { WorkFlowTemplateData } from '@/api/project/types'

defineOptions({ name: 'FlowNode' })

const { proxy } = getCurrentInstance() as any

const ownersConfig = useOwners([])
const data = ref({
  id: '',
  name: '',
  spaceId: '',
  status: 0,
  flowId: '',
  version: '',
  flowConf: {},
  templateConf: {
    nodes: [],
    connections: [],
    // 终止原因
    terminatedReasonOptions: [],
    // 重启原因
    rebootReasonOptions: [],
  },
}) as unknown as Ref<Workflow>
const flowTitleRef = ref()
const nodeGraphRef = ref()
const controlPanelRef = ref()
const currentNode = ref()

const projectStore = useProjectStore()
const drawerWidth = computed(() => projectStore.isCollapse ? 'calc(100% - 68px)' : 'calc(100% - 240px)')
let isEdited = false
let isEditedName = false
let isCreated = false
let isSaving = false
const state = reactive({
  dialogVisible: false,
  editTitleInputVisible: false,
  loading: false,
})

// 打开任务弹框
function handleOpen(open: boolean) {
  if (open)
    isEdited = false
}

// 关闭任务弹框
async function handleClose() {
  // 修改名称, 或者点击新建进入 需要刷新流程列表
  if (isEditedName || isCreated) {
    proxy.mittBus.emit('closeFlowDrawer', true)
  }
  // 有修改过流程配置
  if (isEdited) {
    Msgbox.warning.l({
      title: `当前已有编辑内容，是否关闭？`,
      content: `当前流程编辑内容未保存，关闭后将不会保留已改动内容`,
      okText: '关闭',
    }).then(() => {
      state.dialogVisible = false
    })
  }
  else {
    state.dialogVisible = false
  }
}

// 获取流程详情
async function getWorkFlowDetail(spaceId: string, flowId: string) {
  state.loading = true
  try {
    const { data: WorkFlowDetail } = await getWorkFlow({ spaceId, flowId })
    WorkFlowDetail.templateConf.nodes.forEach((item: NodeProp) => {
      if (item.owner.ownerRole?.length <= 0)
        item.owner.ownerRole.push({ id: null, key: '' })

      // 格式化
      item.owner.value = JSON.parse(item.owner.value as unknown as string)
      if (item.owner.value === null || typeof item.owner.value === 'string')
        item.owner.value = { appointedOwner: [], fillOwner: [] }
      if (!item.owner.value.appointedOwner)
        item.owner.value.appointedOwner = []
      item.onReach.map((ele) => {
        ele.condition = JSON.parse(ele.condition)
      })
    })
    ownersConfig.reset(WorkFlowDetail.templateConf.nodes)
    data.value = WorkFlowDetail
    // 初始化流程图
    nodeGraphRef.value.setData(data.value.templateConf, data.value.flowConf)
    // 头部
    flowTitleRef.value.setData(data.value)
    state.loading = false
  }
  catch (error) {
    console.log(error)
  }
  finally {
    state.loading = false
  }
}

async function handleSave() {
  if (isSaving) {
    return
  }
  updateEdges()
  // 只有开始和结束节点
  if (data.value.templateConf.nodes && data.value.templateConf.nodes.length < 3) {
    const modalInstance = Msgbox.warning.l({
      title: `任务流程无法保存`,
      content: `任务流程中，需存在至少一个过程节点`,
      footer: [
        h('div', { class: 'process-create-custom-btn' }, [
          h('div', {
            onClick: () => {
              modalInstance.destroy()
            },
            class: 'ant-btn ant-btn-confirm',
          }, '我知道了'),
        ]),
      ],
    })
    return
  }
  try {
    // 全部节点校验
    try {
      await validate()
    }
    catch (e) {
      // 表单自身校验
      await controlPanelRef.value!.validate()
      throw new Error('全部校验不通过')
    }
  }
  catch (err) {
    const modalInstance = Msgbox.warning.l({
      title: `任务流程无法保存`,
      content: `当前流程中存在过程节点配置不完整，请补充后再尝试保存`,
      footer: [
        h('div', { class: 'process-create-custom-btn' }, [
          h('div', {
            onClick: () => {
              modalInstance.destroy()
            },
            class: 'ant-btn ant-btn-confirm',
          }, '我知道了'),
        ]),
      ],
    })
    return
  }
  // 修改名称, 或者点击新建进入 需要刷新流程列表
  if (isEditedName || isCreated) {
    proxy.mittBus.emit('closeFlowDrawer', true)
  }

  if (!isEdited) {
    state.dialogVisible = false
    return
  }
  isSaving = true
  try {
    const relateCountRes = await getWorkFlowRelationCount({ spaceId: data.value.spaceId, id: data.value.id, scene: 'status_relation' })
    isSaving = false
    // 该流程存在关联任务数
    const relateCount = Number(relateCountRes.data.total) || 0
    const textContentOne = `1.保存后，与此流程关联的任务单可在任务详情 - 右上角点击【升级】按钮，将流程更新至最新`
    const textContentTwo = h('p', null, [
      '2.当前流程尚未结束任务数 ',
      h('span', { class: 'pfm-smoothing pointer error-color', onClick: () => {} }, relateCount),
    ])

    const modalInstance = Msgbox.warning.l({
      title: `是否确认保存修改内容？`,
      content: relateCount ? [h('p', null, textContentOne), h('p', null, textContentTwo)] : ``,
    })
    await modalInstance

    await postWorkFlowData()
  }
  catch (error) {
    isSaving = false
  }
}

async function postWorkFlowData() {
  postWorkFlow({
    spaceId: data.value.spaceId,
    flowId: data.value.id,
    status: data.value.status,
    config: JSON.stringify(data.value.templateConf),
  }).then(() => {
    message.success(`任务流程编辑成功`, 3)
    state.dialogVisible = false
    proxy.mittBus.emit('closeFlowDrawer', true)
  })
}

// 修改流程名称
async function handleEditName(name: string) {
  isEditedName = true
  data.value.name = name
}

// 监听选中节点
async function handleSelectNode(nodeGrpahData: NodeProp) {
  const index = data.value.templateConf.nodes.findIndex(item => item.key === nodeGrpahData.key)
  const nodeData = cloneDeep(unref(index === -1 ? nodeGrpahData : data.value.templateConf.nodes[index]))
  const owner = ownersConfig.ownersConfig.value[nodeData.owner.ownerRole?.[0]?.id as string]
  if (owner)
    nodeData.owner = owner
  currentNode.value = nodeData
  if (index === -1) {
    data.value.templateConf.nodes.push(currentNode.value)
  }
}

function handleNodeGraphRemoveNode(ids: string[]) {
  if (ids.includes(currentNode.value.key))
    currentNode.value = null
  ids.forEach((ele) => {
    const index = data.value.templateConf.nodes.findIndex(item => item.key === ele)
    if (index > -1)
      data.value.templateConf.nodes.splice(index, 1)
  })
}

function handleFormBlur(path: string) {
  switch (path) {
    case 'name':
      nodeGraphRef.value.getFormChange(path, currentNode.value?.name || '', currentNode.value?.key || '')
      break
  }
}

function handleAddNode() {
  nodeGraphRef.value.onAddNode()
}

function updateEdges() {
  const nodesAndEdges = nodeGraphRef.value.getNodesAndEdges()
  if (nodesAndEdges.nodes.length === 2) {
    currentNode.value = null
  }
  data.value.templateConf.connections = nodesAndEdges.edges
}

// 全局表单校验：调用 BForm 的 items，获取 item 的 rules 进行校验
async function validate() {
  const nodes = data.value.templateConf.nodes
  const errKeys: string[] = []
  // 全部节点校验
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (['started', 'ended'].includes(n.key))
      continue

    const items = getFormItems(data, { value: n } as Ref<NodeProp>)

    const itemArr = Object.values(items.value)
    for (let j = 0; j < itemArr.length; j++) {
      const item = itemArr[j]
      if (item.rules) {
        for (let k = 0; k < item.rules.length; k++) {
          const rule = item.rules[k]
          const val = getValueByPath(n, item.field!)

          try {
            // 自定义校验
            rule.validator && await rule.validator(rule, val)
            // 必填校验
            if (rule.required && (!val || (val.length && val.length === 0))) {
              throw new Error('必填错误')
            }
          }
          catch (e) {
            console.log((e as any).message)
            if (!errKeys.includes(n.key))
              errKeys.push(n.key)
          }
        }
      }
    }
  }

  if (errKeys.length > 0) {
    nodeGraphRef.value.changeNodeItemStatus(errKeys)
    return Promise.reject(new Error('校验失败'))
  }

  // 节点名称重复校验
  // const names = new Set()
  // for (const item of nodes) {
  //   if (names.has(item.name)) {
  //     message.error(`节点名称重复`)
  //     return Promise.reject(new Error('节点名称重复'))
  //   }
  //   names.add(item.name)
  // }

  return Promise.resolve(true)
}

function onChangeContronPanel() {
  const index = data.value.templateConf.nodes.findIndex(item => item.key === currentNode.value?.key)
  if (index > -1) {
    data.value.templateConf.nodes[index] = currentNode.value
  }
  else if (currentNode.value) {
    data.value.templateConf.nodes.push(currentNode.value)
  }
  isEdited = true
}

function openDrawer({ spaceId, flowId, isCreating }: { spaceId: string, flowId: string, isCreating: boolean }) {
  getWorkFlowDetail(spaceId, flowId)
  state.dialogVisible = true
  isCreated = isCreating
}

defineExpose({
  openDrawer,
})
</script>

<template>
  <a-drawer
    :open="state.dialogVisible"
    root-class-name="flow-node-drawer-container"
    class="flow-node-drawer"
    :mask-style="{ backgroundColor: 'rgba(0, 0, 0, 0)' }"
    destroy-on-close
    :closable="false"
    :width="drawerWidth"
    :mask-closable="false"
    :push="{
      distance: 0,
    }"
    :z-index="2300"
    @close="handleClose"
    @after-open-change="handleOpen"
  >
    <div class="drawer-header flex-row-between">
      <FlowTitle ref="flowTitleRef" @on-edit-name="handleEditName" />
      <div class="tool gap12 flex-row-start">
        <PreviewWorkflow
          :data="data as unknown as WorkFlowTemplateData"
          :current-key="currentNode?.key"
          @visible-change="updateEdges"
        />
        <a-button class="save-btn" @click="handleSave">
          保存流程
        </a-button>
        <a-button class="tool-btn flex-row-center ml12" @click="handleClose">
          <svg-icon name="drawer-close" size="16" color="#333333" />
        </a-button>
      </div>
    </div>
    <div class="drawer-bodyer">
      <div v-if="state.loading" class="loading">
        <b-table-loading />
      </div>
      <div class="node-graph-container">
        <NodeGraph
          ref="nodeGraphRef"
          @on-select-node="handleSelectNode"
          @on-change-node="(sourceKey: string, newKey: string) => {
            if (sourceKey) {
              const node = data.templateConf.nodes.find(item => item.key === sourceKey)
              if (node)
                data.templateConf.nodes.push(Object.assign(cloneDeep(node), { name: `${node.name}-副本`, key: newKey }))
            }
            isEdited = true
          }"
          @on-change-name="(data) => {
            controlPanelRef?.updateNodeName(data.name)
            onChangeContronPanel()
          }"
          @on-remove-node="handleNodeGraphRemoveNode"
        />
      </div>
      <div class="node-form-container">
        <div class="node-form-container-wrap">
          <ControlPanel
            ref="controlPanelRef"
            :node="currentNode"
            :workflow="data"
            @change="onChangeContronPanel"
            @blur="handleFormBlur"
            @remove-node="(node: NodeProp) => (nodeGraphRef?.onDeleteNode(node.key))"
            @add-node="handleAddNode"
          />
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<style lang="scss">
.process-create-custom-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  .process-create-check {
    .check-text {
      margin-left: 8px;
    }
  }
  .process-create-custom-btn {
    margin-top: 0;
  }
}
.process-create-custom-btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 24px;
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
    &.ant-btn-confirm {
      background-color: #1d74f5;
      color: #fff;
    }
  }
}

.flow-node-drawer-container {
  .flow-node-drawer {
    .ant-drawer-body {
      padding: 0;
    }
    .drawer-header {
      width: 100%;
      height: 64px;
      background: #fff;
      height: 64px;
      padding: 12px 24px 12px 16px;
      background: #ffffff;
      position: relative;
      .tool {
        .tool-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #edeef0;
          border-radius: 6px;
          padding: 0;
          transition: 0.2s;
          &:hover {
            background: rgba(24, 62, 118, 0.03);
            border-color: transparent;
          }
          &:active {
            background: rgba(24, 62, 118, 0.06);
            border-color: transparent;
          }
        }
        .save-btn {
          height: 32px;
          border-radius: 4px;
          padding: 0px 16px;
          background: $color-primary;
          border: 1px solid $color-primary;
          color: #fff;
          font-size: 14px;
        }
      }
    }
    .drawer-bodyer {
      width: 100%;
      height: calc(100vh - 64px);
      position: relative;
      .loading {
        background: #f7f8fa;
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 10000;
      }
      .node-graph-container {
        width: 100%;
        height: 100%;
        background: #f7f8fa;
      }
      .node-form-container {
        width: 328px;
        height: 100%;
        position: absolute;
        right: 0px;
        top: 0px;
        background: #f7f8fa;
        z-index: 9999;
        padding-top: 24px;
        .node-form-container-wrap {
          width: 304px;
          height: calc(100% - 48px);
          border-radius: 8px;
          background: #fff;
        }
      }
    }
  }
}
</style>
