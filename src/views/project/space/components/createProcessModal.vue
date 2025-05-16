<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { DefaultOptionType } from 'ant-design-vue/es/cascader'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/modules/project'
import { getWorkFlowPageList, getWorkFlowSelectList } from '@/api/project'
import { createWorkFlow, setWorkFlowCopy } from '@/api/workflow'
import { checkLength } from '@/utils/validate'
import { SpaceRole } from '@/enum'

const emit = defineEmits(['success'])

const params = useRoute().params
const projectStore = useProjectStore()
const state = reactive({
  visible: false,
  reuseEnable: false,
  loading: false,
})
const form = ref({
  name: '',
  flowId: [],
  status: '0',
})
const formRef = ref()
const flowIdFormRef = ref()
const options = ref([])
const formItems = [
  {
    label: '流程名称',
    type: 'input',
    field: 'name',
    placeholder: '请输入流程名称',
    rules: [
      { required: true, message: '请输入流程名称', trigger: ['blur'] },
      checkLength(2, 30, 'blur'),
      { validator: (rule: any, value: any, callback: any) => {
        getWorkFlowPageList(params.id as string, 0)
          .then((res) => {
            if (res.data.list.some((item: any) => item.name === value)) {
              callback(new Error('流程名称已存在'))
            }
            else {
              callback()
            }
          })
          .catch(() => {
            callback(new Error('校验失败，请重试'))
          })
      }, trigger: ['blur'] },
    ],
  },
  {
    label: '复用现有任务流程',
    type: 'slot',
    field: 'flowId',
  },
]

watch(() => projectStore.projectList, () => {
  options.value = projectStore.projectList.filter((item: any) => {
    return Number(item.roleId) === SpaceRole.CREATOR || Number(item.roleId) === SpaceRole.SUPER_MANAGER
  }).map((item: any) => ({
    value: item.id,
    label: item.spaceName,
    isLeaf: false,
  }))
}, {
  immediate: true,
})

function openDialog() {
  state.visible = true
}

function loadProcess(selectedOptions: DefaultOptionType[]) {
  const targetOption = selectedOptions[selectedOptions.length - 1]
  targetOption.loading = true
  getWorkFlowSelectList(targetOption.value as string)
    .then((res) => {
      targetOption.children = res.sort((a: any, b: any) => {
        // 流程排序
        if (Number(b.status) !== Number(a.status)) {
          return Number(b.status) - Number(a.status)
        }
        else {
          return Number(b.ranking) - Number(a.ranking)
        }
      }).map((item: any) => ({
        label: item.name,
        value: item.id,
      }))
    })
    .finally(() => {
      targetOption.loading = false
    })
}

async function onOk() {
  await Promise.all([formRef.value.validate(), flowIdFormRef.value?.validate()])
  state.loading = true
  if (state.reuseEnable) {
    // 复制流程
    setWorkFlowCopy({
      name: form.value.name,
      spaceId: params.id as string,
      flow_id: form.value.flowId[form.value.flowId.length - 1],
      status: form.value.status,
    }).then((res) => {
      emit('success', res.data.flowId)
      onCancel()
    }).finally(() => {
      state.loading = false
    })
  }
  else {
    // 新建流程
    createWorkFlow({
      spaceId: params.id as string,
      name: form.value.name,
      status: Number(form.value.status),
    }).then((res) => {
      emit('success', res.data.flowId as string)
      onCancel()
    }).finally(() => {
      state.loading = false
    })
  }
}

function onCancel() {
  state.visible = false
  state.reuseEnable = false
  form.value.status = '0'
  formRef.value.resetFields()
}
</script>

<template>
  <div class="process-add" @click="openDialog">
    <b-icon name="icon-icon_add_linear_linear_light" size="14" color="#1D74F5" />
    <div class="add-text">
      新建
    </div>
  </div>
  <BDialogV2
    v-model:open="state.visible"
    :ok-button-props="{ loading: state.loading }"
    title="新建流程"
    ok-text="新建"
    centered
    @ok="onOk"
    @cancel="onCancel"
  >
    <BForm
      ref="formRef"
      v-model="form"
      :items="formItems"
      :class="{ pb16: state.reuseEnable, pb4: !state.reuseEnable }"
      size="large"
      layout="vertical"
      class="w432 pb16"
      last-item-no-margin
    >
      <template #flowId-label-right>
        <BSwitch v-model:checked="state.reuseEnable" size="small" />
      </template>
      <template #flowId>
        <a-form-item-rest v-if="state.reuseEnable">
          <BForm
            ref="flowIdFormRef"
            v-model="form"
            :items="[{
              label: '',
              type: 'slot',
              field: 'flowId',
              rules: [{ required: true, message: '请选择任务流程', trigger: ['blur'] }],
              hideLabel: true,
            }]"
            last-item-no-margin
          >
            <template #flowId>
              <BBaseCascader
                v-model:value="form.flowId"
                :options
                :load-data="loadProcess"
                :allow-clear="false"
                placeholder="请选择任务流程"
              />
            </template>
          </BForm>
        </a-form-item-rest>
      </template>
    </BForm>
    <template #button-left>
      <BCheckbox :checked="form.status === '1'" class="modal__checkbox" @update:checked="form.status = $event ? '1' : '0'">
        默认启用该流程
      </BCheckbox>
    </template>
  </BDialogV2>
</template>

<style lang="scss" scoped>
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
.modal__checkbox {
  font-size: 14px;
  color: #1a1a1a;
}
</style>
