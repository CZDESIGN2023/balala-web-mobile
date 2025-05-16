<!-- 修改密码 -->
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { message } from 'ant-design-vue'
import type { checkEditPswTpy, passwordFormTyp } from '../types'
import { setVerifyPassword, verifyPassword } from '@/utils/validate'
import { userPwdChange } from '@/api/user'
import { useUserStore } from '@/stores/modules/user'

const emit = defineEmits(['on-close'])

const { userInfo } = useUserStore()

// 表单数据
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive<passwordFormTyp>({
  pwd: '',
  newPwd: '',
  confirmPwd: '',
})

const loading = ref<boolean>(false)

const passwordPlaceholder = ref<string>('请输入原密码')
const npasswordPlaceholder = ref<string>('请输入新密码')
const cpasswordPlaceholder = ref<string>('请再次确认新密码')

const labelCol = { style: { width: '0px', display: 'flex', justifyContent: 'start' } }
const wrapperCol = { style: { width: '320px' } }

// 规则
const rules = reactive<Record<string, Rule[]>>({
  pwd: [
    {
      required: true,
      validator: (rule, value, callback) =>
        verifyPassword(rule, value, callback, passwordForm.pwd, true),
      trigger: 'blur',
    },
  ],
  newPwd: [
    {
      required: true,
      validator: (rule, value, callback) =>
        setVerifyPassword(rule, value, callback, passwordForm.confirmPwd, true),
      trigger: 'blur',
    },
  ],
  confirmPwd: [
    {
      required: true,
      validator: (rule, value, callback) =>
        setVerifyPassword(rule, value, callback, passwordForm.newPwd, false),
      trigger: 'blur',
    },
  ],
})

function inputBlur(msg: string, key: string) {
  changePlaceholder(msg, key)
  if (passwordForm[key])
    checkFirst.value[key] = false

  isCheckFirst(key)
}

// 修改提示语
function changePlaceholder(msg: string, key: string) {
  switch (key) {
    case 'pwd':
      passwordPlaceholder.value = msg
      break

    case 'newPwd':
      npasswordPlaceholder.value = msg
      break

    case 'confirmPwd':
      cpasswordPlaceholder.value = msg
      break
  }
}

// 是否清除指定校验（keyName：需要清除的校验名）
function isCheckFirst(keyName: string) {
  // 如果值未改变且未点击创建按钮，则不校验
  if (checkFirst.value[keyName]) {
    nextTick(() => {
      passwordFormRef.value?.clearValidate(keyName)
    })
  }
}

// 保存按钮是否为禁用
const isDisabel = computed(
  () => !passwordForm.pwd || !passwordForm.confirmPwd || !passwordForm.newPwd,
)

//  提交修改
async function submit() {
  try {
    await passwordFormRef.value?.validateFields()
    loading.value = true

    const { data } = await userPwdChange({
      pwd: passwordForm.pwd,
      newPwd: passwordForm.newPwd,
      comfirmPwd: passwordForm.confirmPwd,
      username: userInfo.userName,
    })

    loading.value = false

    if (data) {
      message.success('密码修改成功', 2)
      for (const key in passwordForm)
        passwordForm[key] = ''

      changeCheckFirst(true)
      emit('on-close')
    }
  }
  catch (errorInfo) {
    console.log('Failed:', errorInfo)
    loading.value = false
  }
}

// 是否为第一次校验
const checkFirst = ref<checkEditPswTpy>({
  pwd: true,
  newPwd: true,
  confirmPwd: true,
})

// 重置所有状态
function changeCheckFirst(isFirst: boolean) {
  for (const key in checkFirst.value)
    checkFirst.value[key] = isFirst
}
</script>

<template>
  <div class="change-psd">
    <div class="flex-row-between mb24">
      <div class="title pfm">
        修改密码
      </div>
      <!-- 关闭图标 -->
      <svg-icon
        class="pointer"
        name="add_member_close"
        size="16"
        color="#666666"
        @click="$emit('on-close')"
      />
    </div>

    <a-form
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="rules"
      size="large"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
      hide-required-mark
    >
      <a-form-item name="pwd">
        <a-input-password
          v-model:value="passwordForm.pwd"
          class="gray-input"
          :placeholder="passwordPlaceholder"
          @focus="passwordPlaceholder = '5 ～ 20个字符（英文/数字/符号）'"
          @blur="inputBlur('请输入原密码', 'pwd')"
        >
          <template #iconRender="v">
            <p v-if="passwordPlaceholder">
              <svg-icon v-if="v" name="eye-open" size="20" color="#999999" class="mt2" />
              <svg-icon v-else name="eye-close" size="20" color="#999999" class="mt2" />
            </p>
          </template>
        </a-input-password>
      </a-form-item>
      <a-form-item name="newPwd">
        <a-input-password
          v-model:value="passwordForm.newPwd"
          class="gray-input"
          :placeholder="npasswordPlaceholder"
          @focus="npasswordPlaceholder = '5 ～ 20个字符（英文/数字/符号组合）'"
          @blur="inputBlur('请输入新密码', 'newPwd')"
        >
          <template #iconRender="v">
            <p v-if="npasswordPlaceholder">
              <svg-icon v-if="v" name="eye-open" size="20" color="#999999" class="mt2" />
              <svg-icon v-else name="eye-close" size="20" color="#999999" class="mt2" />
            </p>
          </template>
        </a-input-password>
      </a-form-item>
      <a-form-item name="confirmPwd">
        <a-input-password
          v-model:value="passwordForm.confirmPwd"
          class="gray-input"
          :placeholder="cpasswordPlaceholder"
          @focus="cpasswordPlaceholder = '5 ～ 20个字符（英文/数字/符号组合）'"
          @blur="inputBlur('请再次确认新密码', 'confirmPwd')"
        >
          <template #iconRender="v">
            <p v-if="cpasswordPlaceholder">
              <svg-icon v-if="v" name="eye-open" size="20" color="#999999" class="mt2" />
              <svg-icon v-else name="eye-close" size="20" color="#999999" class="mt2" />
            </p>
          </template>
        </a-input-password>
      </a-form-item>
      <a-form-item>
        <div class="my-password-foot full-100 mt24 flex-row-end gap12">
          <a-button plain size="default" class="btn cancel-btn mr4" @click="$emit('on-close')">
            取消
          </a-button>
          <a-button
            type="primary"
            class="btn confirm-btn"
            :loading="loading"
            size="default"
            :disabled="isDisabel"
            :class="isDisabel ? 'disabled-btn' : ''"
            @click="submit"
          >
            保存
          </a-button>
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>

<style lang="scss" scoped>
.change-psd {
  height: 320px;
  padding: 16px;

  .title {
    color: #1a1a1a;
    font-size: 16px;
  }
}

.btn {
  width: 60px;
  height: 32px;
  border-radius: 4px;
}

.disabled-btn {
  background: #8dcbff !important;
}

.confirm-btn {
  background: #1d74f5;
  color: #ffffff;
  border: 0;
}
</style>
