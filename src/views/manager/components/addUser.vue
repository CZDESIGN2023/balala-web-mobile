<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form'
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { validateUserName, verifyNickname, verifyPassword } from '@/views/login/config/validate'
import { addUser } from '@/api/system'
import { generateNumberPassword } from '@/utils'

const emits = defineEmits(['onUpdate'])

const formConfig = {
  name: 'manager-user-add',
  validateOnRuleChange: true,
  labelCol: { style: { width: '67px', height: '40px', display: 'flex', justifyContent: 'start', alignItems: 'center' } },
  size: 'large',
}

// 规则
const rules = reactive<Record<string, Rule[]>>({
  username: [
    {
      required: true,
      validator: async (_rule: Rule, value: string) => {
        const vaildate = await validateUserName(value, true)
        if (vaildate)
          return Promise.reject(vaildate)
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
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
  password: [
    {
      required: true,
      validator: (_rule: Rule, value: string) => {
        const vaildate = verifyPassword(value)
        if (vaildate)
          return Promise.reject(vaildate)
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
})

const userFormRef = ref()
const state = reactive({
  visible: false,
  isContinue: false,
  submitLoading: false,
  visiblePassword: true,
  userForm: {
    username: '',
    nickname: '',
    password: '',
  },
  usernamePlaceholder: '请输入用户名',
  nicknamePlaceholder: '请输入昵称',
  passwordPlaceholder: '请输入密码',
})

function openDialog() {
  state.visiblePassword = true
  state.userForm.password = generateNumberPassword()
  state.visible = true
}

function resetAndUpdate(isUpdate: boolean = true) {
  state.userForm = {
    username: '',
    nickname: '',
    password: '',
  }
  state.submitLoading = false
  if (isUpdate)
    emits('onUpdate')
}

// 提交保存
async function handleConfirm() {
  if (state.submitLoading)
    return
  try {
    await userFormRef.value?.validateFields()
    state.submitLoading = true
    await addUser(state.userForm)
    message.success(`用户 ${state.userForm.nickname} 创建成功`, 3)
    state.submitLoading = false
    if (state.isContinue) {
      // 连续添加
      resetAndUpdate()
      state.userForm.password = generateNumberPassword()
    }
    else {
      state.visible = false
      state.isContinue = false
      resetAndUpdate()
    }
  }
  catch (errorInfo) {
    state.submitLoading = false
  }
}

// 取消
function handleCancel() {
  state.visible = false
  state.isContinue = false
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
      title="添加新用户"
      confirm-btn-text="确认"
      header-padding="24px"
      footer-padding="4px 24px 24px"
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
        <a-form-item label="用户名" name="username">
          <a-input
            id="username"
            v-model:value="state.userForm.username"
            :bordered="false"
            :placeholder="state.usernamePlaceholder"
            class="gray-input"
            autocomplete="off"
            allow-clear
            @focus="state.usernamePlaceholder = '5 ~ 20个字符(支持英文/数字/下划线)'"
            @blur="state.usernamePlaceholder = '请输入用户名'"
          >
            <template #clearIcon>
              <el-tooltip content="清空" placement="top" effect="dark" :offset="10">
                <img class="delete-icon w16" src="@/assets/svg/input-close.svg">
              </el-tooltip>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="昵称" name="nickname">
          <a-input
            id="nickname"
            v-model:value="state.userForm.nickname"
            autocomplete="off"
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
        <a-form-item label="密码" name="password">
          <a-input
            v-model:value="state.userForm.password"
            autocomplete="off"
            :bordered="false"
            class="gray-input"
            :placeholder="state.passwordPlaceholder"
            @focus="state.passwordPlaceholder = '5 ~ 20个字符(支持英文/数字/符号)'"
            @blur="state.passwordPlaceholder = '请输入密码'"
          >
            <!-- <template #iconRender="v">
              <p v-if="state.passwordPlaceholder">
                <svg-icon v-if="v" name="password_show" size="18" color="#BFBFBF" class="mt2" />
                <svg-icon v-else name="password_hide" size="18" color="#BFBFBF" class="mt2" />
              </p>
            </template> -->
          </a-input>
        </a-form-item>
      </a-form>
      <template #footer-left>
        <a-checkbox v-model:checked="state.isContinue">
          <span class="text14 title-color">连续添加</span>
        </a-checkbox>
      </template>
    </b-dialog>
  </div>
</template>

<style scoped lang="scss">
.manager-user-form {
  .ant-form-item {
    &:last-child {
      min-height: 60px;
      margin-bottom: 0 !important;
    }
  }
}
.gray-input {
  &.ant-input-status-error {
    box-shadow: 0 0 0 1.6px $color-error inset;
    background: none;
    border: 0;
  }
}

:global(.ant-tooltip) {
  z-index: 9999;
}
</style>
