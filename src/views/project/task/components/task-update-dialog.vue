<script lang="ts" setup>
import { type Ref, computed, getCurrentInstance, h, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { getWorkFlowOwner } from '../utils/task'
import taskUpdateFail from './task-update-fail.vue'
import NodePanel from '@/views/flowNode/components/nodePanel.vue'
import { getAllWorkItemId, getWorkFlow, workItemUpdate, workItemUpdateAll } from '@/api/workflow'
import type { NodeProp } from '@/views/flowNode/types'
import { Msgbox } from '@/utils/msgbox'
import type { WorkDetailData } from '@/api/interface'
import { SvgIcon } from '@/components/SvgIcon'

interface Props {
  dialogVisible?: boolean
  workFlowId?: string
  workItemId: string
  workFlowName?: string
  templateConf: any
  spaceId: string
  isAllUpdate: boolean // 是否批量升级
}

interface workUpdateResult {
  workItemId: string
  message: string
}

const props = withDefaults(defineProps<Props>(), {
  dialogVisible: false,
  workFlowId: '',
  workItemId: '',
  workFlowName: '流程',
  templateConf: null,
  spaceId: '',
  isAllUpdate: false,
})

const emits = defineEmits([
  'update:dialogVisible',
  'updateProcessSuccess',
])
const SLCE_SIZE = 20
const { proxy } = getCurrentInstance() as any
const formRef = ref()
const currentNode = ref({}) as any

const state = reactive({
  dialogStatuType: '',
  dialogTitle: '是否将此任务的流程升级至最新',
  confirmText: '确认升级',
  isAllUpdate: false,
  items: [] as any,
  templateConf: {} as any,
  retryNum: 0,
  allIdLen: 0,
  progressDialogShow: false,
  progressRate: 0,
  taskFailDialogVisible: false,
  successResult: [] as workUpdateResult[],
  errorResult: [] as workUpdateResult[],
  form: {} as WorkDetailData,
})

const progressRate = computed(() => {
  return Math.floor((state.successResult.length / state.allIdLen) * 100)
})

function progresClose() {
  state.successResult = []
}

function clearMessageResult() {
  state.successResult = []
  state.errorResult = []
}

function handleCancel() {
  emits('update:dialogVisible')
}

async function handleConfirm() {
  clearMessageResult()
  await formRef.value?.validate()
  if (state.isAllUpdate) {
    Msgbox.warning.l({
      title: `是否批量升级至最新流程`,
      okText: `确认`,
      cancelText: `取消`,
      zIndex: 9999,
    }).then(async () => {
      const ids = await getAllIds()
      if (!ids || !ids.length) {
        message.warning('当前已无可升级任务', 3)
        return
      }
      updateWorkFlowAll(ids)
    }).catch(() => {
    })
  }
  else {
    await updateWorkFlowSingle()
  }
}
// 获取所有任务id
async function getAllIds() {
  const res = await getAllWorkItemId({ spaceId: props.spaceId, flowId: props.workFlowId })
  return res.data.ids
}

function splitArrayIntoChunks(arr: string[], chunkSize: number) {
  const chunks = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize))
  }
  return chunks
}
// 更新所有任务流程
async function updateWorkFlowAll(ids: string[]) {
  const roleDirectors = state.items.map((item: any) => ({
    roleId: item.roleId,
    roleKey: item.roleKey,
    directors: currentNode.value[item.roleKey] || [],
  }))

  state.allIdLen = ids.length
  const sliceIds = splitArrayIntoChunks(ids, SLCE_SIZE)
  // 分批请求所有数据
  for (const idsSlice of sliceIds) {
    const data = {
      spaceId: props.spaceId,
      flowId: props.workFlowId,
      workItemIds: idsSlice,
      roleDirectors,
    }
    try {
      // 批量更新任务单
      state.progressDialogShow = true
      const res = await workItemUpdateAll(data)
      res.data.result.forEach((item: any) => {
        // 升级成功
        if (item.code === '200') {
          state.successResult.push(item)
        }
        // 普通异常
        else {
          state.errorResult.push(item)
        }
      })
    }
    catch (error: any) {
      // 处理系统异常
      idsSlice.forEach((item: any) => {
        state.errorResult.push({
          workItemId: item,
          message: error.message,
        })
      })
    }
  }
  // 升级过程完成, 关闭进度条
  state.progressDialogShow = false
  // 如果存在错误
  if (state.errorResult.length) {
    state.taskFailDialogVisible = true
  }
  else {
    emits('updateProcessSuccess')
    const modalInstance = Msgbox.warning.l({
      title: `任务流程批量升级完成`,
      content: h('div', null, [
        '已成功批量升级任务单 ',
        h('span', { class: 'pfm-smoothing' }, state.successResult.length),
      ]),
      footer: [
        h('div', { class: 'process-update-custom-btn' }, [
          h('div', {
            onClick: () => {
              modalInstance.destroy()
              handleCancel()
            },
            class: 'ant-btn ant-btn-confirm',
          }, '我知道了'),
        ]),
      ],
      zIndex: 9999,
    })
  }
}
// 整理升级失败任务,进行重试
function retryUpdate() {
  const ids = state.errorResult.map(item => item.workItemId)
  clearMessageResult()
  updateWorkFlowAll(ids)
}

// 更新单个任务流程
async function updateWorkFlowSingle() {
  const roleDirectors = state.items.map((item: any) => ({
    roleId: item.roleId,
    roleKey: item.roleKey,
    directors: currentNode.value[item.roleKey] || [],
  }))
  const data = {
    spaceId: props.spaceId,
    workItemId: props.workItemId,
    roleDirectors,
  }

  try {
    const res = await workItemUpdate(data)
    if (res.data.result[0].code !== '200') {
      throw new Error(res.data.result[0].message)
    }
    emits('updateProcessSuccess')
    const modalInstance = Msgbox.warning.m({
      title: `当前任务已完成升级`,
      okText: `我知道了`,
      zIndex: 9999,
      footer: [
        h('div', { class: 'process-update-custom-btn' }, [
          h('div', {
            onClick: () => {
              modalInstance.destroy()
              proxy.mittBus.emit('onRefreshTable', [])
              handleCancel()
            },
            class: 'ant-btn ant-btn-confirm',
          }, '我知道了'),
        ]),
      ],
    })
  }
  catch (error: any) {
    const modalInstance = Msgbox.warning.l({
      title: `任务升级失败`,
      footer: [
        h('div', { class: 'process-update-custom-btn' }, [
          h('div', {
            onClick: () => {
              modalInstance.destroy()
              updateWorkFlowSingle()
            },
            class: 'ant-btn ant-btn-default',
          }, '重试'),
          h('div', {
            onClick: () => {
              modalInstance.destroy()
              handleCancel()
            },
            class: 'ant-btn ant-btn-confirm',
          }, '我知道了'),
        ]),
      ],
      zIndex: 9999,
      content: `失败原因: ${error.message}`,
    })
  }
}
// 获取流程模板和表单数据
async function initWorkFlowData(spaceId: string, flowId: string) {
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
  })
  // 流程模板
  state.templateConf = WorkFlowDetail.templateConf
  // 表单数据
  state.items = await getWorkFlowOwner(WorkFlowDetail)
  state.items.forEach((item: any) => {
    currentNode.value[item.roleKey] = item.directorIds
  })
}

async function init() {
  await initWorkFlowData(props.spaceId, props.workFlowId)
  state.isAllUpdate = props.isAllUpdate
}
onMounted(() => {
  init()
})
</script>

<template>
  <!-- 升级进度弹窗 -->
  <a-modal
    v-model:open="state.progressDialogShow"
    centered
    class="update-process-progress-modal"
    :footer="null"
    z-index="9999"
    :closable="false"
    @cancel="progresClose"
  >
    <div class="progress-box">
      <div class="box-title">
        <span class="pfm-smoothing">任务流程批量升级中 {{ state.successResult.length }}</span>
        <span class="all-color pfm-smoothing">/{{ state.allIdLen }} ...</span>
      </div>
      <div class="box-bar">
        <div class="bar-line" :style="{ width: `${progressRate}%` }" />
      </div>
    </div>
  </a-modal>
  <!-- 升级弹窗 -->
  <b-dialog
    :dialog-visible="dialogVisible"
    width="776px"
    title-icon="orange.svg"
    header-padding="24px 24px"
    footer-padding="24px 24px"
    :title="state.dialogTitle"
    :confirm-btn-text="state.confirmText"
    z-index="1005"
    confirm-btn-color="primary"
    cancel-border-color="#EDEEF0"
    @on-confirm="handleConfirm"
    @on-cancel="handleCancel"
  >
    <div class="update-box">
      <div class="box-process">
        <div class="box-process-title">
          <div class="title pfm-smoothing">
            流程
          </div>
          <div class="name">
            {{ props.workFlowName }}
          </div>
          <SvgIcon class="new" name="process_new" size="39.4" color="#1D74F5" />
        </div>
        <NodePanel
          v-if="state.templateConf && state.templateConf.nodes"
          id="preview"
          :nodes="state.templateConf.nodes"
          :connections="state.templateConf.connections"
          :config="{
            fitCenter: false,
            nodeHeight: 32,
            nodePadding: 16,
            lineWidth: 2,
            nodeTextSize: 14,
          }"
          select
        />
      </div>
      <div v-if="state.items.length" class="box-tip">
        <SvgIcon name="modal-exclamation" size="16" color="#FF9800" />
        <div class="tip">
          升级新流程节点变更，请补充以下负责人信息：
        </div>
      </div>
      <div v-if="state.items.length" class="box-person">
        <BForm
          ref="formRef"
          :model-value="currentNode"
          :items="Object.values(state.items)"
          :label-col="{ style: { width: '40px', display: 'flex', justifyContent: 'start' } }"
          label-align="left"
          size="large"
          column
        />
      </div>
    </div>
    <template #footer-left>
      <div v-if="!isAllUpdate" class="flex-row-center process-update-box-footer-left">
        <a-checkbox v-model:checked="state.isAllUpdate">
          <span class="text14 title-color">批量升级任务</span>
        </a-checkbox>
        <a-tooltip overlay-class-name="task-tooplip-title tooltip-title-center">
          <template #title>
            同【{{ props.workFlowName }}】下，批量将尚未升级的任务升级至最新流程
          </template>
          <div class="tips-svg">
            <SvgIcon
              class="tips-no-hover"
              name="tips-icon"
              size="16"
              color="rgba(0, 0, 0, 0.65)"
            />
          </div>
        </a-tooltip>
      </div>
    </template>
  </b-dialog>
  <!-- 升级失败弹窗 -->
  <taskUpdateFail
    v-model:taskFailDialogVisible="state.taskFailDialogVisible"
    :fail-list="state.errorResult"
    :success-list="state.successResult"
    @retry-update="retryUpdate"
    @on-confirm="handleCancel"
  />
</template>

<style lang="less">
.update-process-progress-modal {
  width: 400px !important;
  .ant-modal-content {
    padding: 40px 0 48px;
    box-sizing: border-box;
  }
}

.process-update-box-footer-left {
  .ant-checkbox-wrapper {
    span {
      padding-inline-start: 0;
      padding-inline-end: 0;
    }
    .title-color {
      padding-inline-start: 8px;
      padding-inline-end: 4px;
    }
  }
  .ant-tooltip-inner {
    text-align: center;
  }
  .tips-svg {
    height: 22px;
    &:hover {
      .svg-icon {
        use {
          fill: #000;
        }
      }
    }
  }
}

.process-update-custom-btn {
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
</style>

<style lang="scss" scoped>
.progress-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #333;
  .box-title {
    font-size: 16px;
    line-height: 1;
    margin-bottom: 32px;
    text-align: center;
    .all-color {
      color: #808080;
    }
  }
  .box-bar {
    position: relative;
    width: 320px;
    height: 4px;
    background: #edeef0;
    border-radius: 2px;
    .bar-line {
      background: #1d74f5;
      border-radius: 2px;
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
  .box-progress {
    margin-top: 16px;
    font-size: 14px;
    line-height: 14px;
  }
}
.ant-form-item {
  margin-bottom: 16px !important;
  :deep(.ant-row) {
    .ant-form-item-label {
      min-width: 84px;
      text-align: left;
      label {
        height: 40px;
      }
    }
    .ant-form-item-control {
      padding-left: 24px;
    }
    .ant-col {
      .ant-form-item-required {
        &:after {
          content: '';
        }
        &:before {
          position: absolute;
          right: -15px;
          top: 50%;
          transform: translateY(-50%);
        }
      }
    }
  }
}
.update-box {
  .box-process {
    width: 100%;
    height: 150px;
    background: #f9fafc;
    border-radius: 8px;
    position: relative;
    .box-process-title {
      position: absolute;
      top: 17px;
      left: 24px;
      display: flex;
      align-items: center;
      color: #333;
      .title {
        font-size: 14px;
        line-height: 1;
        position: relative;
        margin-right: 6px;
        &:before {
          content: '';
          position: absolute;
          width: 2px;
          height: 14px;
          background-color: $color-primary;
          left: -6px;
        }
      }
      .new {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: -40px;
      }
      .name {
        margin-right: 2px;
        font-size: 14px;
        line-height: 1;
      }
      .icon {
        padding: 4px 6px;
        background: rgba(29, 116, 245, 0.08);
        color: $color-primary;
        font-size: 14px;
        line-height: 1;
        border-radius: 12px;
      }
    }
  }
  .box-tip {
    color: #333;
    font-size: 14px;
    line-height: 22px;
    margin: 24px 0;
    background-color: #fff3e0;
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding: 12px;
    .tip {
      font-size: 12px;
      line-height: 22px;
      margin-left: 4px;
    }
  }
  .box-foot-left {
    :deep(.ant-checkbox + span) {
      padding-inline-start: 4px;
      padding-inline-end: 4px;
    }
  }
}
</style>
