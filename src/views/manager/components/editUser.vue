<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form'
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { verifyNickname } from '@/views/login/config/validate'
import { editUserNickname } from '@/api/system'

const emits = defineEmits(['onUpdate'])

const formConfig = {
  name: 'manager-user-add',
  validateOnRuleChange: true,
  labelCol: { style: { width: '67px', height: '40px', display: 'flex', justifyContent: 'start', alignItems: 'center' } },
  size: 'large',
}

// 规则
const rules = reactive<Record<string, Rule[]>>({
  nickname: [
    {
      required: true,
      validator: (_rule: Rule, value: string) => {
        const vaildate = verifyNickname(value)
        if (vaildate)
          return Promise.reject(vaildate)
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
})
let originName = ''
const userFormRef = ref()
const state = reactive({
  visible: false,
  dialogTitle: '',
  submitLoading: false,
  visiblePassword: true,
  userForm: {
    nickname: '',
    userId: '',
  },
  nicknamePlaceholder: '请输入昵称',
})

function openDialog(data: any) {
  originName = data.nickname || ''
  state.userForm.nickname = data.nickname || ''
  state.userForm.userId = data.userId || ''
  state.dialogTitle = `编辑用户 ${data.nickname || ''} 昵称`
  state.visible = true
}

function resetAndUpdate(isUpdate: boolean = true) {
  state.userForm = {
    nickname: '',
    userId: '',
  }
  state.submitLoading = false
  if (isUpdate)
    emits('onUpdate')
}

// 提交保存
async function handleConfirm() {
  const params = {
    value: state.userForm.nickname,
    userId: state.userForm.userId,
  }
  if (originName === state.userForm.nickname) {
    state.visible = false
    return
  }
  if (state.submitLoading)
    return
  try {
    await userFormRef.value?.validateFields()
    state.submitLoading = true
    await editUserNickname(params)
    message.success(`用户昵称修改成功`, 3)
    state.submitLoading = false
    state.visible = false
    resetAndUpdate()
  }
  catch (errorInfo) {
    state.submitLoading = false
  }
}

// 取消
function handleCancel() {
  state.visible = false
  resetAndUpdate(false)
}

defineExpose({
  openDialog,
})
</script>

<template>
  <div>
    <!-- 设置管理员 -->
    <b-dialog
      v-model:dialogVisible="state.visible"
      :title="state.dialogTitle"
      confirm-btn-text="确认"
      @on-confirm="handleConfirm"
      @on-cancel="handleCancel"
    >
      <a-form
        ref="userFormRef"
        class="manager-user-form"
        hide-required-mark
        :model="state.userForm"
        :rules="rules"
        :label-col="formConfig.labelCol"
      >
        <a-form-item label="昵称" name="nickname">
          <a-input
            id="nickname"
            v-model:value="state.userForm.nickname"
            autocomplete="new-password"
            :bordered="false"
            allow-clear
            class="gray-input"
            :placeholder="state.nicknamePlaceholder"
            @focus="state.nicknamePlaceholder = '2 ~ 14个字符(支持中英文/数字/下划线)'"
            @blur="state.nicknamePlaceholder = '请输入昵称'"
          >
            <template #clearIcon>
              <el-tooltip content="清空" placement="top" effect="dark" :offset="10">
                <img class="delete-icon w16" src="@/assets/svg/input-close.svg">
              </el-tooltip>
            </template>
          </a-input>
        </a-form-item>
      </a-form>
    </b-dialog>
  </div>
</template>

<style scoped lang="scss">
.manager-user-form {
  .ant-form-item {
    &:last-child {
      margin-bottom: 8px !important;
    }
  }
}
</style>
