<script setup lang="ts">
import { type Ref, computed, onMounted, reactive, ref, toRef, watch } from 'vue'
import pinyin from 'pinyin'
import type { NodeProp, Workflow } from '../types'
import modalReason from './modalReason.vue'
import { getMemberListById } from '@/api/project'
import router from '@/router'
import type { ProjectMemberListItem } from '@/api/interface'
import { useOwners } from '@/views/flowNode/utils/useOwners'
import { getFormItems } from '@/views/flowNode/utils/formItems'

interface Props {
  workflow: Workflow
  node: NodeProp
}

const props = withDefaults(defineProps<Props>(), {
  workflow: () => {
    return {} as Workflow
  },
  node: () => null as unknown as NodeProp,
})

const emit = defineEmits(['change', 'blur', 'removeNode', 'addNode'])

const $node = ref(props.node)
const $workflow = ref(props.workflow) as Ref<Workflow>
const formRef = ref()
const spaceId = router.currentRoute.value.params.id as string
const memberList = ref<ProjectMemberListItem[]>([])
const ownersConfig = useOwners()
const state = reactive({ activeTab: 'node' })
const workflow2Ref = toRef(() => props.workflow)
const items = getFormItems(workflow2Ref, $node)

watch(() => props.node, (n) => {
  $node.value = n
  // // 重置表单校验红色样式
  formRef.value?.clearValidate()
}, { immediate: true })

watch(() => props.workflow, (n) => {
  $workflow.value = n
}, { immediate: true })

watch(() => { return props.node?.owner.usageMode }, () => {
  if (!props.node)
    return
  if (props.node.owner.usageMode === 'none') {
    items.value.appointedOwner.show = false
    items.value.fillOwner.show = true
  }
  else {
    items.value.appointedOwner.show = true
    if (props.node.owner.value.appointedOwner.length > 0) {
      items.value.fillOwner.show = true
    }
    else {
      items.value.fillOwner.show = false
    }
  }
}, { immediate: true, deep: true })

const roleCount = computed(() => {
  const currentId = props.node.owner.ownerRole?.[0]?.id
  if (!currentId)
    return 0
  return props.workflow.templateConf.nodes.filter((item: NodeProp) => { return item.owner.ownerRole?.[0]?.id === currentId }).length
})

onMounted(() => {
  getMemberList()
})

// 更改分配方式
function onChangeUseMode(val: string) {
  switch (val) {
    case 'none':
      $node.value.owner.value.appointedOwner = []
      $node.value.owner.value.fillOwner = []
      break
    case 'appointed':
      items.value.fillOwner.show = false
      $node.value.owner.value.fillOwner = []
      break
  }
  emit('change', 'owner.usageMode', val)
}

function onFocus(field: string) {
  switch (field) {
    case 'name':
      items.value.name.placeholder = '请输入节点名称 (2 ~ 30个字符)'
      break
    case 'doneOperationDisplayName':
      items.value.doneOperationDisplayName.placeholder = '请输入按钮名称 (2 ~ 8个字符)'
      break
  }
}

function onBlur(field: string) {
  switch (field) {
    case 'name':
      items.value.name.placeholder = '请输入节点名称'
      break
    case 'doneOperationDisplayName':
      items.value.doneOperationDisplayName.placeholder = '请输入按钮名称'
      break
  }
  emit('blur', field)
}

function validate() {
  return formRef.value.validate()
}

function onInput(path: string, val: any, options?: any) {
  switch (path) {
    case 'onReach.0.targetSubState.id':
      const stateItem = options.find((item: any) => item.id === val)
      $node.value.onReach[0].targetSubState = { id: stateItem.id, key: stateItem.key, val: stateItem.val }
      break

    case 'owner.ownerRole.0.id':
      const { id, key } = options.find((item: any) => item.id === val)
      const newRole = { id, key }
      const owner = ownersConfig.ownersConfig.value[id]
      if (owner) { $node.value.owner = owner }
      else {
        $node.value.owner = ownersConfig.create([newRole])
        ownersConfig.ownersConfig.value[id] = $node.value.owner
      }

      break
  }
  emit('change', path, val)
}

function getMemberList() {
  getMemberListById({ spaceId: router.currentRoute.value.params.id as string }).then((d) => {
    memberList.value = d.data.list.map((item) => {
      return {
        value: item.userId,
        avatar: item.avatar,
        label: item.userNickname,
        username: item.userName,
        pinyin: pinyin(item.userNickname, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
        isCreator: item.isCreator,
        currentUser: false,
        type: 'user',
      } as unknown as ProjectMemberListItem
    })
  })
}

function onUpdateAppointedOwner(val: string[], options: any[]) {
  items.value.fillOwner.show = val.length > 0
  const r: any[] = []
  val.forEach((item) => {
    const option = options.find(ele => ele.value === item)
    r.push({
      value: option.value,
      type: option.value === '_creator' ? 'role' : 'user',
    })
  })
  $node.value.owner.value.appointedOwner = r
  emit('change', 'owner.value.appointedOwner', r)
  $node.value.owner.value.fillOwner = $node.value.owner.value.fillOwner.filter((item: any) => val.includes(item.value))
}

function onUpdateFillOwner(val: string[], options: any[]) {
  const r: any[] = []
  val.forEach((item) => {
    const user = options.find(ele => ele.value === item)
    r.push({ value: user.value, type: user.type })
  })
  $node.value.owner.value.fillOwner = r
  emit('change', 'owner.value.fillOwner', r)
}

function updateNodeName(newName: string) {
  $node.value.name = newName
}

defineExpose({ validate, updateNodeName })
</script>

<template>
  <div class="node-form">
    <a-tooltip v-if="props.node && state.activeTab === 'node'">
      <template #title>
        删除
      </template>
      <SvgIcon
        class="delete-node-icon cursor-pointer"
        name="delete-tag"
        size="16"
        color="#999"
        @click="$emit('removeNode', node)"
      />
    </a-tooltip>
    <a-tabs v-model:activeKey="state.activeTab" class="tabs w-full h-full">
      <a-tab-pane key="node" tab="节点配置">
        <div class="content h-full">
          <el-scrollbar v-if="$node && workflow.templateConf.nodes && workflow.templateConf.nodes.length > 2" always>
            <div class="pl16 pr16">
              <a-config-provider
                :theme="{
                  token: { colorPrimary: '#1D74F5' },
                  components: {
                    Button: { colorPrimary: '#1D74F5' },
                    Select: { paddingXXS: '8px' },
                    Tabs: { colorText: '#999' },
                  },
                }"
              >
                <BForm
                  ref="formRef"
                  v-bind="$attrs"
                  v-model="$node"
                  :items="items"
                  layout="vertical"
                  @focus="onFocus"
                  @blur="onBlur"
                  @input="onInput"
                >
                  <template v-if="roleCount > 1" #owner-ownerRole-0-id-label-right>
                    <div class="primary-color pointer-events-none">
                      已共用节点·{{ roleCount }}个
                    </div>
                  </template>
                  <template #owner-usageMode>
                    <b-select v-model:value="$node.owner.usageMode" :options="items.usageMode.options" @change="onChangeUseMode">
                      <template #option="scope">
                        <div class="tow-line-option">
                          <div class="option-line1">
                            {{ scope.label }}
                          </div>
                          <div class="option-line2">
                            {{ scope.des }}
                          </div>
                        </div>
                      </template>
                    </b-select>
                  </template>

                  <template #owner-value-appointedOwner="scope">
                    <BusinessPersonSelect
                      v-bind="scope"
                      :value="$node.owner.value.appointedOwner.map((item: any) => item.value)"
                      :space-id="spaceId"
                      :max-tag-count="1"
                      clear-not-restore
                      @update:value="onUpdateAppointedOwner"
                    />
                  </template>

                  <template #owner-value-fillOwner="scope">
                    <BusinessPersonSelect
                      v-bind="scope"
                      :value="$node.owner.value.fillOwner.map((item: any) => item.value)"
                      :space-id="spaceId"
                      :max-tag-count="1"
                      :display-range="$node.owner.value.appointedOwner.map((item: any) => item.value)"
                      clear-not-restore
                      :creator="$node.owner.usageMode === 'none'"
                      @update:value="onUpdateFillOwner"
                    />
                  </template>
                  <template #enableRollback-label-right>
                    <b-switch
                      :checked="$node.enableRollback" size="small" @update:checked="(val: boolean) => {
                        $node.enableRollback = val
                        $emit('change', 'enableRollback', val)
                      }"
                    />
                  </template>

                  <template #enableRollback>
                    <modalReason
                      v-if="$node.enableRollback"
                      v-model="$node.rollbackReasonOptions"
                      :other-options="$node.enableRollbackReasonOtherOption"
                      name="回滚"
                      @update:model-value="val => $emit('change', 'rollbackReasonOptions', val)"
                    />
                  </template>

                  <template #enableClose-label-right>
                    <b-switch
                      :checked="$node.enableClose" size="small" @update:checked="(val: boolean) => {
                        $node.enableClose = val
                        $emit('change', 'enableClose', val)
                      }"
                    />
                  </template>

                  <template #enableClose>
                    <modalReason
                      v-if="$node.enableClose"
                      v-model="$node.closeReasonOptions"
                      name="关闭"
                      :other-options="$node.enableCloseReasonOtherOption"
                      @update:model-value="val => $emit('change', 'closeReasonOptions', val)"
                    />
                    <modalReason
                      v-if="$node.enableClose"
                      v-model="$node.restartReasonOptions"
                      name="重启"
                      :other-options="$node.enableRestartReasonOtherOption"
                      @update:model-value="val => $emit('change', 'doneOperationReasonOptions', val)"
                    />
                  </template>
                </BForm>
              </a-config-provider>
            </div>
          </el-scrollbar>
          <div v-else class="h-full flex items-center justify-items-center flex-col leading-none" style="font-size: 14px;">
            <div class="pfm pb8" style="color:#333;">
              尚未选中节点
            </div>
            <div class="mb16" style="font-size: 12px;color: #999">
              流程中至少需包含一个过程节点
            </div>
            <a-button class="inset-node" @click="$emit('addNode')">
              插入节点
              <template #icon>
                <svg-icon name="add" size="14" color="#1D74F5" class="mr4" />
              </template>
            </a-button>
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="process" tab="流程配置" force-render>
        <div class="pl16 pr16">
          <b-form
            :model-value="workflow.templateConf"
            :items="[
              { label: '原因配置', type: 'group', tips: '配置的原因将在执行操作时作为选项体现，选择“其它”选项时，可手动输入原因' },
              { label: '终止、恢复原因', type: 'slot', field: 'terminatedReasonOptions' },
              { label: '重启原因', type: 'slot', field: 'rebootReasonOptions' },
            ]"
            layout="vertical"
          >
            <template #terminatedReasonOptions>
              <modalReason
                v-model="$workflow.templateConf.terminatedReasonOptions"
                :other-options="$workflow.templateConf.enableTerminatedReasonOtherOption"
                name="终止"
                @update:model-value="val => $emit('change', 'terminatedReasonOptions', val)"
              />
              <modalReason
                v-model="$workflow.templateConf.resumeReasonOptions"
                :other-options="$workflow.templateConf.enableResumeReasonOtherOption"
                name="恢复"
                @update:model-value="val => $emit('change', 'resumeReasonOptions', val)"
              />
            </template>

            <template #rebootReasonOptions>
              <modalReason
                v-model="$workflow.templateConf.rebootReasonOptions"
                :other-options="$workflow.templateConf.enableRebootReasonOtherOption"
                name="重启"
                @update:model-value="val => $emit('change', 'rebootReasonOptions', val)"
              />
            </template>
          </b-form>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style lang="scss" scoped>
.node-form {
  height: 100%;
  display: flex;
  flex-flow: column;
  position: relative;
  .delete-node-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 30;
    &:hover {
      :deep(use) {
        fill: #fd4c4c;
      }
    }
  }
  .content {
    flex: 1;
    min-height: 0;
  }
  .tabs {
    > :deep(.ant-tabs-nav) {
      margin: 0;
      .ant-tabs-tab {
        color: #999;
        font-size: 14px;
        + .ant-tabs-tab {
          margin-left: 24px;
        }
      }
      .ant-tabs-nav-list {
        margin-left: 16px;
      }
      .ant-tabs-tab-btn {
        font-family: 'CustomFont-Medium' !important;
        line-height: 24px;
      }
    }
  }
  :deep(.ant-tabs-content),
  :deep(.ant-tabs-tabpane) {
    height: 100%;
  }
}
.tow-line-option {
  .option-line1 {
    color: #333;
  }
  .option-line2 {
    font-size: 12px;
    color: #666;
  }
}
.inset-node {
  width: 100px;
  border-radius: 4px;
  color: #1d74f5;
  border: 1px solid #edeef0;
  &:hover {
    color: #0f87ff;
    border: 1px solid #1d74f5;
  }
  &:focus {
    color: #2361e2;
    border: 1px solid #2361e2;
  }
}
.filter-select {
  :deep(.ant-select-selector) {
    height: 32px;
    &:hover {
      background-color: #edeef0;
    }
  }
}
</style>
