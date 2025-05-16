<script setup lang="ts">
import { type Ref, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import type { NodeProp, Workflow } from '../types'
import { useOwners } from '../utils/useOwners'
import NodePanel from './nodePanel.vue'
import type { ItemProps } from '@/components/form/BForm/src/BForm.vue'
import type { PlanTime, WorkDetailData } from '@/api/interface'
import { useUserStore } from '@/stores/modules/user'
import { getFormItems } from '@/views/project/task/utils/task'
import type { TaskPermission } from '@/hooks/useTaskPermission'
import { NodeStatus } from '@/enum/NodeStatus'
import type { WorkFlowTemplateData } from '@/api/project/types'

const props = withDefaults(defineProps<Props>(), {
  data: () => ({}) as WorkFlowTemplateData,
  currentKey: '',
})

const emit = defineEmits(['visibleChange'])

interface Props {
  data: WorkFlowTemplateData
  currentKey: string
}

const nodePanelRef = ref()
const itemsRef = ref()
const { userInfo } = useUserStore()
const roleOwner = useOwners()
const currentNode = ref({}) as unknown as Ref<NodeProp>
let currentRole = ''
const formData = ref({
  priority: 'P3',
  creator: {},
  $creator: [userInfo.id],
  processRate: 0,
  tagIds: [],
}) as unknown as Ref<WorkDetailData>

const state = reactive({
  visible: false,
  tooltipVisible: false,
  loading: false,
  items: {} as { [key: string]: ItemProps },
  currentItems: [
    { label: '节点负责人', type: 'personSelect', field: '$owner', width: '365px', placeholder: '请选择 节点 负责人', maxTagCount: 1, dropdownMatchSelectWidth: 393, rules: [{ required: true, message: '' }] },
    { label: '节点排期', type: 'dateRange', field: 'planTime', placeholder: '起始日期 ~ 截止日期', width: '274px', classType: ' detail notIcon' },
  ] as ItemProps[],
})

async function onVisible() {
  state.loading = true
  emit('visibleChange', true)
  state.items = await getFormItems(props.data, { id: '', workItemStatus: {}, creator: { userId: userInfo.id } } as WorkDetailData, { allowEdit: true } as TaskPermission) as { [key: string]: ItemProps }
  try {
    state.items.$creator.labelCol = { style: { width: '59px' } }
  }
  catch (e) {
    console.log('可能没有角色')
  }
  state.items.files.disabled = true
  state.items.files.isReadonly = true
  state.items.priority.hideLabel = true
  state.items.processRate.hideLabel = true
  delete state.items.childTaskTable
  // 填充默认值
  Object.values(state.items).forEach((item: ItemProps) => {
    if (item.type === 'personSelect' && Object.keys(roleOwner.ownersConfig.value).includes(item.roleId)) {
      formData.value[item.field!] = roleOwner.ownersConfig.value[item.roleId].value.fillOwner.map(item => item.value)
    }
    // 移除校验
    if (item.rules)
      item.rules = [{ required: true, message: '' }]
  })
  setTimeout(() => {
    state.loading = false
    state.visible = true
    state.tooltipVisible = false
  }, 100)
  nodePanelRef.value?.refresh()
}

function onSelectNode(val: NodeProp) {
  // 1. 找到当前角色名称，从 formData 里面拿值，赋值给currentNode.$owner
  currentNode.value = val
  state.currentItems[0].displayRange = currentNode.value.owner.usageMode === 'appointed' ? currentNode.value.owner.value.appointedOwner.map(item => item.value) : []
  const roleKey = val.owner.ownerRole[0].key
  if (roleKey) {
    currentRole = roleKey
    currentNode.value.$owner = formData.value[roleKey]
    currentNode.value.planTime = val.planTime ? val.planTime : { planStartAt: '0', planCompleteAt: '0' } as PlanTime
  }
  // try {
  //   highlightRole(val.owner.ownerRole[0].key)
  // }
  // catch (e) {
  //   console.error('可能未找到角色key', e)
  // }
}

function onCurrentNodeInput(field: string, val: any) {
  if (field === '$owner')
    formData.value[currentRole] = val
}

function onCurrentNodeChange(field: string, val: any) {
  if (field === 'planTime')
    currentNode.value.planTime = { planStartAt: dayjs(val.planStartAt).unix(), planCompleteAt: dayjs(val.planCompleteAt).unix() } as unknown as PlanTime
  // {const current props.data.templateConf.nodes.find(item => item.key === currentNode.value.key)}
}

function onFormInput(field: string, val: any) {
  if (field === currentRole)
    currentNode.value.$owner = val
}

// ===== 高亮暂时注释 👇 =====
// function highlightRole(roleKey: string) {
//   // state.items
//   try {
//     for (const key in state.items) {
//       if (state.items[key].highlight) {
//         state.items[key].highlight = false
//       }
//     }
//     state.items[roleKey].highlight = true
//   }
//   catch (e) {
//     console.error('可能未找到表单', e)
//   }
// }

// function onFocus(field: string) {
//   itemsRef.value.clearHighlight(field)
//   nodePanelRef.value.selectNodesByRole(field)
// }
// ===== 高亮暂时注释 👆 =====
</script>

<template>
  <el-tooltip v-model:visible="state.tooltipVisible" effect="dark" content="预览" placement="top" :offset="9" :hide-after="0">
    <a-button :loading="state.loading" class="tool-btn flex-row-center" @click="onVisible">
      <template #icon>
        <svg-icon name="flow-preview" size="16" color="#333333" />
      </template>
    </a-button>
  </el-tooltip>
  <a-modal
    v-model:open="state.visible"
    :title="`${data.name} 任务流程`"
    :footer="null"
    :width="776"
    class="preview-workflow-modal"
    destroy-on-close
    centered
    @cancel="() => {
      itemsRef?.resetFields()
      currentNode.planTime = {} as PlanTime
    }"
  >
    <template #closeIcon>
      <svg-icon name="drawer-close" size="16" color="#333333" />
    </template>
    <el-scrollbar max-height="calc(100vh - 80px - 64px)" always>
      <div class="pl16 pr16">
        <div class="h136">
          <NodePanel
            id="preview"
            ref="nodePanelRef"
            :nodes="data.templateConf.nodes.map(item => {
              if (item.key === 'started') {
                item.$flowNodeStatus = NodeStatus.COMPLETED
              }
              else {
                item.$flowNodeStatus = NodeStatus.UNSTARTED
              }
              return item
            })"
            :connections="data.templateConf.connections"
            :config="{
              fitCenter: false,
              nodeHeight: 32,
              nodePadding: 16,
              lineWidth: 2,
              nodeTextSize: 14,
            }"
            :default-key="currentKey"
            status-circle
            select
            legend
            @on-select-node="onSelectNode"
          />
        </div>
        <div class="current-node h64 mb48 flex items-center pl16 pr16">
          <BForm
            :model-value="currentNode"
            :items="state.currentItems"
            size="large"
            class="w-full"
            column
            view
            @input="onCurrentNodeInput"
            @change="onCurrentNodeChange"
          >
            <template #$owner-append>
              <el-tooltip content="催一下" :disabled="true" placement="top">
                <div
                  class="w32 h32 br16 node-reminder flex-row-center ml24 mr28 disabled"
                >
                  <div class="m-circle m-progress">
                    <svg class="rate-circle w32 h32 mr8">
                      <circle stroke="#ffffff" />
                      <circle stroke="#BFBFBF" style="stroke-dasharray: calc(0), 1000; opacity: 0;" />
                    </svg>
                  </div>
                  <svg-icon
                    class="reminder-icon"
                    name="reminder"
                    size="16"
                    :color="!true ? '#BFBFBF' : '#FFB74B'"
                  />
                </div>
              </el-tooltip>
            </template>
          </BForm>
        </div>
        <BForm
          ref="itemsRef"
          :model-value="formData" :items="Object.values(state.items)"
          :label-col="{ style: { width: '100px' } }"
          label-align="left"
          size="large"
          column
          @input="onFormInput"
        />
      </div>
    </el-scrollbar>
  </a-modal>
</template>

<style lang="scss">
.preview-workflow-modal {
  .ant-modal-title {
    font-size: 20px;
    padding-left: 24px;
    height: 64px;
    line-height: 64px;
  }
  .ant-modal-header {
    margin-bottom: 0;
  }
  .ant-modal-content {
    padding: 0;
  }
  .ant-modal-close {
    width: 32px;
    height: 32px;
    border: 1px solid #edeef0;
    border-radius: 6px;
    padding: 0;
    transition: 0.2s;
    inset-inline-end: 24px;
    &:hover {
      background: rgba(24, 62, 118, 0.03);
      border-color: transparent;
    }
    &:active {
      background: rgba(24, 62, 118, 0.06);
      border-color: transparent;
    }
    .ant-modal-close-x {
      line-height: 14px;
    }
  }
}
</style>

<style lang="scss" scoped>
.current-node {
  border: 1px solid #edeef0;
  border-radius: 8px;
  :deep(.b-form.ant-form-large .ant-form-item) {
    margin-bottom: 0 !important;
  }
}

.current-node {
  :deep(.b-form) {
    > div:first-child .ant-form-item {
      .ant-form-item-control-input-content {
        display: flex;
        align-items: center;
      }
    }
  }
}

.node-reminder {
  background: #ffffff;
  border: 1px solid #e3e4e5;
  position: relative;
  flex-shrink: 0;
  &.disabled {
    cursor: not-allowed;
  }
  .m-circle {
    width: 32px;
    height: 32px;
    position: absolute;
    top: -1px;
    left: -1px;
    opacity: 0;
    // border: 1px solid #fff;
    .rate-circle {
      width: 32px;
      height: 32px;
      transform: rotate(-90deg);
      circle {
        cx: 16px;
        cy: 16px;
        r: 15px;
        stroke-linecap: round;
        fill: none;
        stroke-width: 1px;
      }
      .dasharray {
        transition: stroke-dasharray 0.4s linear;
      }
    }
  }

  &:hover {
    :deep(.svg-icon) {
      use {
        fill: #ff9800;
      }
    }
  }
}
</style>
