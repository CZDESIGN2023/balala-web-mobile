<script lang="ts" setup>
import { computed, h, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { offset } from 'caret-pos'
import taskStatuDialog from './task-statu-dialog.vue'
import taskUpdateDialog from './task-update-dialog.vue'
import { useCopy } from '@/utils'
import { SvgIcon } from '@/components/SvgIcon'
import { deleteWork, editWorkStateTerminate, taskFollow } from '@/api/project'
import { permCheck, permCheckIsArchived } from '@/utils/permission'
import { WorkItemPerm } from '@/enum'
import type { WorkDetailData, WorkItemStatus } from '@/api/interface'
import useFlowTemplate from '@/hooks/useFlowTemplate'
import { NodeStatus } from '@/enum/NodeStatus'

const props = defineProps({
  tabKey: {
    type: String,
    default: 'base',
  },
})

const emits = defineEmits(['update:followed', 'onRefreshTable', 'updateProcessSuccess'])

const { initFlowTemplate, flowTemplateInfo } = useFlowTemplate()
const taskStatuDialogRef = ref()
const formPermission = ref<Record<string, boolean>>({})
const state = reactive({
  followed: false,
  spaceId: '',
  workItemId: '',
  workItemStatus: {} as WorkItemStatus,
  workItemName: '',
  workFlow: {} as any,
  taskStatuDialogVisible: false,
  taskUpdateDialogVisible: false,
  deleteTaskDialogVisible: false,
})

// 关注图标显示数据
const followTooltipData = computed(() => {
  const isFollowed = state.followed || false
  const followTooltipData = {
    followed: {
      title: '取消关注',
      name: 'follow',
      color: '#FF9800',
    },
    notFollowed: {
      title: '关注任务',
      name: 'unfollow',
      color: '#333333',
    },
  }
  return isFollowed ? followTooltipData.followed : followTooltipData.notFollowed
})

// 更多下拉数据
const dropDownData = computed(() => {
  const isTerminate = permCheckIsArchived(
    formPermission.value,
    WorkItemPerm.WORK_ITEM_CHANGE_STATE,
    state.workItemStatus.key,
  )
  const isDelete = permCheck(formPermission.value, WorkItemPerm.WORK_ITEM_DELETE)
  const isUpdate = permCheck(formPermission.value, WorkItemPerm.FLOW_UPGRADE)
  const isShowDropdown = isTerminate || isDelete || isUpdate || !state.workFlow.isLatestVersion
  return {
    isShow: isShowDropdown,
    isTerminate,
    isDelete,
    isUpdate,
  }
})

// 关注/取消关注任务
async function changeFollow(followed: boolean) {
  try {
    await taskFollow(state.workItemId || '', followed)
    const msg = followed ? '取消关注成功！' : '关注任务成功！'
    message.success(msg, 2)
    state.followed = !state.followed
    // emits('onRefreshTable', [state.workItemId])
  }
  catch (error) {}
}

// 复制链接
function handleCopyLink() {
  const href = window.location.href.split('?')[0]
  const title = `#${state.workItemId} 丨 ${state.workItemName}`
  const link = `${href}?workItemId=${state.workItemId}&tabKey=${props.tabKey}&spaceId=${state.spaceId}&openType=detail`
  const content = `${title}\n${link}`
  useCopy(content, '链接已复制到剪贴板')
}

// 复制任务ID
function handleCopyTaskId(id: string) {
  const message = h('div', {
    innerHTML: `<div  style="color: #333333;">已复制 ID <span class="pfm">「${id}」</span></div>`,
  })
  const copyId = `#${id}`
  useCopy(copyId, message)
}

// 点击终止
function handleTerminate() {
  taskStatuDialogRef.value?.setData({
    type: 'terminate',
    title: '终止',
  })
  state.taskStatuDialogVisible = true
}

function showUpdateBox() {
  if (!dropDownData.value.isUpdate) {
    return
  }
  state.taskUpdateDialogVisible = true
}

// 终止任务
async function handleTaskTerminate(reason: string) {
  try {
    const { data } = await editWorkStateTerminate(state.spaceId, state.workItemId, reason)
    message.success(
      {
        content: h('div', {
          innerHTML: `<div>任务 <span style="color: #1D74F5;">#${state.workItemName}</span> 已终止</div>`,
        }),
      },
      2,
    )
    state.taskStatuDialogVisible = false
    emits('onRefreshTable', data.ids)
  }
  catch (error) {}
}

// 删除任务
async function handleTaskDelete() {
  try {
    await deleteWork(state.spaceId, state.workItemId)
    message.success('任务删除成功', 2)
    state.deleteTaskDialogVisible = false
    emits('onRefreshTable', [])
  }
  catch (errorInfo) {
    state.deleteTaskDialogVisible = false
  }
}

// 任务升级完成
function updateProcessSuccess() {
  emits('updateProcessSuccess')
}

// 抛出事件获取所需数据
async function setData(data: WorkDetailData) {
  const { followed, operationPermissions } = data
  state.followed = followed as boolean
  state.spaceId = data.spaceId
  state.workItemId = data.id
  state.workItemStatus = data.workItemStatus
  state.workItemName = data.workItemName as string
  state.workFlow = data.template
  try {
    formPermission.value = JSON.parse(operationPermissions as string)
  }
  catch (error) {
    formPermission.value = {}
  }
  await initFlowTemplate(data.spaceId, data.template.templateId, data.nodes?.find(item => item.flowNodeStatus === NodeStatus.INPROGRESS)?.flowNodeCode)
}

defineExpose({
  setData,
})
</script>

<template>
  <a-dropdown
    :align="{ offset: [0, 5] }"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    trigger="click"
  >
    <div class="tool-box flex-row-center">
      <SvgIcon name="more" color="#333333" size="6.15385vw" />
      <div v-if="!state.workFlow.isLatestVersion && dropDownData.isUpdate" class="dot" />
    </div>
    <template #overlay>
      <div class="more">
        <div
          class="id flex-row-center pl8 pr8 pointer"
          :class="dropDownData.isShow ? '' : 'border0'"
        >
          <div
            class="idbox w144 h32 br4 flex-row-start pl8"
            @click="handleCopyTaskId(state.workItemId)"
          >
            ID: #{{ state.workItemId }}
          </div>
        </div>
        <div class="ul pr8 pt8 pb8">
          <div
            class="control-item w144 h32 br4 flex-row-start pl8 gap8 pointer"
            @click="changeFollow(state.followed as boolean)"
          >
            <SvgIcon
              :name="followTooltipData.name"
              :color="followTooltipData.color"
              size="4.10256vw"
            />
            {{ followTooltipData.title }}
          </div>

          <div class="control-item w144 h32 br4 flex-row-start pl8 gap8 pointer" @click="handleCopyLink">
            <SvgIcon name="link" color="#333333" size="16" />
            复制链接
          </div>
          <template v-if="dropDownData.isShow">
            <div
              v-if="!state.workFlow.isLatestVersion"
              class="control-item w144 h32 br4 flex-row-start pl8 gap8 pointer"
              :class="{ disabled: !dropDownData.isUpdate }"
              @click="showUpdateBox"
            >
              <SvgIcon
                name="node-edit-update"
                size="4.10256vw"
                color="#666"
              />
              升级任务流程
              <div v-if="!state.workFlow.isLatestVersion && dropDownData.isUpdate" class="dot" />
            </div>

            <div
              v-if="dropDownData.isTerminate"
              class="control-item w144 h32 br4 flex-row-start pl8 gap8 pointer"
              @click="handleTerminate"
            >
              <SvgIcon
                name="node-edit-disabled"
                size="4.10256vw"
                color="#666666"
              />
              终止
            </div>
            <div
              v-if="dropDownData.isDelete"
              class="control-item error-color w144 h32 br4 flex-row-start pl8 gap8 pointer"
              @click="state.deleteTaskDialogVisible = true"
            >
              <SvgIcon
                name="node-edit-del"
                size="4.10256vw"
                color="#FD4C4C"
              />
              删除
            </div>
          </template>
        </div>
      </div>
    </template>
  </a-dropdown>
  <!-- 任务升级弹窗 -->
  <taskUpdateDialog
    v-if="state.taskUpdateDialogVisible"
    v-model:dialogVisible="state.taskUpdateDialogVisible"
    :space-id="state.spaceId"
    :work-item-id="state.workItemId"
    :work-flow-id="state.workFlow.workFlowId"
    :work-flow-name="state.workFlow.workFlowName"
    @update-process-success="updateProcessSuccess"
  />
  <!-- 任务状态变更弹框 -->
  <taskStatuDialog
    ref="taskStatuDialogRef"
    v-model:dialogVisible="state.taskStatuDialogVisible"
    :terminated-reason="flowTemplateInfo.templateConf.terminatedReasonList"
    @on-terminate="handleTaskTerminate"
  />
  <!-- 删除任务弹框 -->
  <!-- 提示弹窗 -->
  <b-dialog
    v-model:dialogVisible="state.deleteTaskDialogVisible"
    width="480px"
    title="确认删除任务吗？"
    title-icon="warning.svg"
    confirm-btn-color="danger"
    confirm-btn-text="删除"
    @on-confirm="handleTaskDelete"
  >
    <div>
      <div>1. 删除后，该任务的所涉及成员将收到任务删除的通知。</div>
      <div>
        2.
        删除后，该任务的所有数据将不可访问，且不可恢复，其中，关联该任务的链接也将自动移除，链接将不可访问。
      </div>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.tool-box {
  position: relative;
  .dot {
    position: absolute;
    top: 1px;
    right: 1px;
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background: #fd4c4c;
  }
}

.tool-link {
  border-radius: 6px 0px 0px 6px;
  border-right: 0;
}

.more {
  width: 160px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid $tool-drop-box-border;
  box-shadow: $tool-drop-box-shadow;
  padding: 0 8px;
  .id {
    width: 100%;
    height: 48px;
    padding: 8px 0;
    display: flex;
    color: $color-icon;
    align-items: center;
    border-bottom: 1px solid $color-border-minor;
    .idbox {
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
    }
  }
  .ul {
    .control-item {
      position: relative;
      margin-bottom: 4px;
      border-radius: 4px;
      &.disabled {
        color: #bfbfbf;
        :deep(.svg-icon) {
          use {
            fill: #bfbfbf !important;
          }
        }
      }
      .dot {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 8px;
        height: 8px;
        width: 8px;
        border-radius: 50%;
        background: #fd4c4c;
      }
      &:last-of-type {
        margin-bottom: 0;
      }
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
    }
  }
}
</style>
