<!-- 设置强密码 -->
<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import loginInput from './loginInput.vue'
import { userPwdChange } from '@/api/user'

interface Props {
  loginInfo?: {
    password: string
    userName: string
  }
}
interface InputWithCheckContent {
  checkContent: () => Promise<string>
}
const props = withDefaults(defineProps<Props>(), {
  loginInfo: () => {
    return {
      password: '',
      userName: '',
    }
  },
})

const emit = defineEmits(['onBackLogin', 'onChangePassword'])

const passwordRef = ref([
  {
    name: 'password',
    type: 'password',
    label: '密码',
    maxLength: 100,
  },
  {
    name: 'confirmPassword',
    type: 'password',
    checkPassword: 'password',
    label: '确认密码',
    maxLength: 100,
  },
])
const passwordLogin = ref([])
const loading = ref<boolean>(false) // 是否显示loading

// 登录注册表单
const loginForm = reactive<any>({
  password: '',
  confirmPassword: '',
})

// 设置强密码
async function handleSubmit() {
  let contentCheckResult = ''
  for (const child of passwordLogin.value) {
    const inputWithCheckContent = child as InputWithCheckContent
    const result = await inputWithCheckContent.checkContent()
    if (result)
      contentCheckResult = result
  }
  if (contentCheckResult)
    return

  if (loading.value)
    return
  try {
    loading.value = true
    // 登录
    changePassword()
  }
  catch (errorInfo: any) {
    console.log('Failed:', errorInfo)
    document.getElementById(errorInfo.errorFields[0].name[0])?.focus()
    loading.value = false
  }
}

async function changePassword() {
  const pwd = props.loginInfo.password
  const userName = props.loginInfo.userName
  await userPwdChange({ type: 10, newPwd: loginForm.password, username: userName, pwd })
    .then(() => {
      loading.value = false
      emit('onChangePassword', loginForm.password)
    })
    .catch(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="retrieve-psd">
    <div class="animate__animated animate__fadeInRight animate__fast .flex-column-center">
      <p class="title pfm text22">
        设置强密码
      </p>
      <p class="mt12 mb32 main-color text14">
        您是系统管理员，请设置强密码
      </p>
      <div>
        <login-input
          v-for="(item, index) in passwordRef" :key="index"
          ref="passwordLogin"
          v-model:value="loginForm[item.name]"
          :type="item.type"
          :strong-pass="true"
          :name="item.name"
          :label="item.label"
          :check-password="item.checkPassword ? loginForm[item.checkPassword] : ''"
          :maxlength="item.maxLength"
        />
      </div>
      <a-button
        class="next-btn text16 mt8 flex-row-center"
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        确认并登录
      </a-button>
      <div class="regeist-text flex-row-center">
        更换账号？请点击
        <span class="primary-color text14 pointer pfm ml4" @click="$emit('onBackLogin')">
          返回
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-wrap .content .login-box .login-form .login-input-item {
  padding: 0 8px;
  border: 0;
  border-bottom: 1px solid #e1e3e5;
  border-radius: 0;
}
.retrieve-psd {
  width: 100%;
  align-self: center;
  .ai-end {
    align-items: flex-end;
  }

  .title {
    font-size: 22px;
    color: $color-icon;
    line-height: 1;
  }

  .login {
    font-size: 14px;
    color: #1d74f5;
  }

  .text {
    text-align: center;
  }

  .tips-title {
    color: #666666;
    line-height: 30px;
  }

  .color-blue {
    color: #1d74f5;
  }
}

.next-btn {
  height: $login-btn-height;
  border-radius: $login-btn-radius;
  background: $login-btn-bg;
  width: 100%;
}

.color3 {
  color: #333333;
}
</style>

<style lang="scss">
@import '../index.scss';
:deep() {
  .ant-input-affix-wrapper:hover {
    border-color: transparent !important;
  }
}
</style>

<style lang="scss" scoped>
.page-w {
  width: max-content;
}
.login-wrap .content .login-box .login-form .border_red {
  border-bottom: 1px solid #f51d1d;
  box-shadow: none;
}
.errClass {
  color: #e43535;
  font-size: 12px;
  font-weight: initial;
}

.login-input-item {
  width: 280px;
  height: 44px;
  padding: 0 8px;
  border: 0;
  border-bottom: 1px solid #e1e3e5;
  border-radius: 0;
  .ant-input-suffix {
    margin-inline-start: 0px;
  }
  &.ant-input-affix-wrapper-focused {
    border-bottom: 2px solid $color-primary;
    box-shadow: none;
    .ant-input-prefix {
      opacity: 0;
      width: 0;
      margin-inline-end: 0;
    }
  }

  &.ant-input-affix-wrapper-status-error {
    border-bottom: 2px solid #f51d1d;
    box-shadow: none;
  }
  &:focus {
    box-shadow: none;
    background: none;
  }
  .ant-input {
    font-size: 14px;
    font-weight: initial;
    color: $color-title;
    caret-color: $color-primary;
    &::placeholder {
      color: $color-minor;
    }
  }
}
.ant-form-item-explain-error {
  font-size: 12px;
  font-weight: initial;
  letter-spacing: 0em;
  color: $color-error;
  padding-top: 2px;
}
.login-btn {
  width: 100%;
  height: 40px;
  border-radius: 20px;
  font-size: 16px;
}
.tip {
  width: 100%;
  font-size: 14px;
  text-align: center;
  color: $color-title;
  span {
    color: #1d74f5;
    &:hover {
      cursor: pointer;
    }
  }
}
.ant-form-item-explain-error {
  font-size: 12px;
  font-weight: initial;
  letter-spacing: 0em;
  color: $color-error;
  padding-top: 2px;
}
.regeist-text {
  width: 100%;
  font-size: 14px;
  line-height: 1;
  color: #666;
  margin-top: 16px;
  display: flex;
  align-self: flex-start;
}
</style>
