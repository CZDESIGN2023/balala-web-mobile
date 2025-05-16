<script lang="ts" setup>
import { computed, inject, nextTick, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { type RouteLocationRaw, useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import loginInput from './loginInput.vue'
import sliderVerify from './sliderVerify.vue'
import setPwd from './setPwd.vue'
import { useUserStore } from '@/stores/modules/user'
import { getLoginVaildCode, userLogin, userRegister } from '@/api/user'
import { getConfigDomain, getTimeState } from '@/utils'
import { HOME_URL } from '@/config'
import { ConfigKey } from '@/enum'

interface InputWithCheckContent {
  checkContent: () => Promise<string>
}

type FormType = 'login' | 'register' | 'setPwd'

interface FormItem {
  name: string
  type: string
  label: string
  maxLength: number
  checkPassword?: string
}

interface checkLoginPswTpy {
  [userName: string]: boolean
  nickName: boolean
  password: boolean
  confirmPassword: boolean
}

interface State {
  formType: FormType
  vaildCode: string
  loginFormItems: Array<FormItem>
  registerFormItems: Array<FormItem>
  loginForm: {
    userName: string
    password: string
    verificationCode: string
    way: number
    pfToken: string
  }
  registerForm: {
    userName: string
    nickName: string
    password: string
    confirmPassword: string
    way: number
    pfToken: string
  }
  checkFirst: checkLoginPswTpy
  loading: boolean
  isCheck: boolean
  isShowVerify: boolean
}

const router = useRouter()
const userStore = useUserStore()
const socketClient: any = inject('socketClient')

const inputLogin = ref([])
const sliderVerifyRef = ref<InstanceType<typeof sliderVerify>>()
const state = reactive<State>({
  formType: 'login',
  vaildCode: '',
  loginFormItems: [
    {
      name: 'userName',
      type: 'text',
      label: '用户名',
      maxLength: 20,
    },
    {
      name: 'password',
      type: 'password',
      label: '密码',
      maxLength: 100,
    },
  ],
  registerFormItems: [
    {
      name: 'userName',
      type: 'text',
      label: '用户名',
      maxLength: 20,
    },
    {
      name: 'nickName',
      type: 'text',
      label: '昵称',
      maxLength: 14,
    },
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
  ],
  loginForm: {
    userName: '',
    password: '',
    verificationCode: '',
    way: 0,
    pfToken: '',
  },
  registerForm: {
    userName: '',
    nickName: '',
    password: '',
    confirmPassword: '',
    way: 0,
    pfToken: '',
  },
  checkFirst: {
    userName: true,
    nickName: true,
    password: true,
    confirmPassword: true,
  },
  loading: false,
  isCheck: false,
  isShowVerify: false,
})

// 表单样式
const calcLoginBoxType = computed(() => {
  if (state.formType === 'register') {
    return 'login-register'
  }
  else {
    return state.vaildCode ? 'login-vaild' : 'login-normal'
  }
})

// 是否显示注册入口
const showRegisterEntry = computed(() => {
  const statu = Number(getConfigDomain(ConfigKey.REGISTER_ENTRY))
  return Boolean(statu) || false
})

// 重置所有状态
function changeCheckFirst(isFirst: boolean) {
  for (const key in state.checkFirst)
    state.checkFirst[key] = isFirst
}

// 重置表单里的值为空
function resetFormValue(obj: State['loginForm'] | State['registerForm']) {
  for (const key in obj) {
    (obj as any)[key] = ''
  }
}

// 获取人机校验码
async function getVaildCode() {
  const { data } = await getLoginVaildCode()
  state.vaildCode = data || ''
}

// 滑块验证通过
function verifySuccess() {
  state.isShowVerify = false
  state.loginForm.verificationCode = state.vaildCode
}

// 修改强密码返回登录
async function onChangePassword(password: string) {
  state.loginForm.password = password
  await nextTick()
  handleLogin(false)
}

// 存储 token 和用户信息
async function getUserInfo(data: any, msg: string, next?: boolean) {
  userStore.setToken(data.jwtToken)
  userStore.setUserInfo(data.user)
  await userStore.getConfig()
  if (next)
    return

  message.success(msg, 2, () => {
    router
      .push((router.currentRoute.value.query.nextPath as RouteLocationRaw) || HOME_URL)
      .then(() => {
        if (getTimeState(data.user.userNickname)) {
          ElNotification({
            dangerouslyUseHTMLString: true,
            message: getTimeState(data.user.userNickname),
            customClass: 'welcome-info',
            duration: 3000,
            offset: 48,
          })
        }
      })
  })
}

// 提交 登录｜注册
async function handleSubmit() {
  const { formType, loginForm, vaildCode, loading } = state
  if (vaildCode && !loginForm.verificationCode && formType === 'login')
    return
  let contentCheckResult = ''
  for (const child of inputLogin.value) {
    const inputWithCheckContent = child as InputWithCheckContent
    const result = await inputWithCheckContent.checkContent()
    if (result)
      contentCheckResult = result
  }
  if (contentCheckResult)
    return

  if (loading)
    return

  changeCheckFirst(false)
  try {
    state.isCheck = true
    state.loading = true
    switch (formType) {
      case 'register': // 注册
        handleRegister()
        break
      case 'login': // 登录
        if (state.vaildCode) {
          if (loginForm.verificationCode) {
            state.isShowVerify = false
          }
          else {
            state.isShowVerify = true
            state.loading = false
            return
          }
        }
        // 登录
        handleLogin(false)
    }
  }
  catch (errorInfo: any) {
    console.log('Failed:', errorInfo)
    document.getElementById(errorInfo.errorFields[0].name[0])?.focus()
    state.loading = false
  }
}

// 注册
async function handleRegister() {
  try {
    // 1.执行注册操作
    await userRegister({ ...state.registerForm })
    // 2.注册成功直接登录
    handleLogin(true)
  }
  catch (error) {
    console.log('register error', error)
  }
  finally {
    state.loading = false
  }
}

// 登录
async function handleLogin(isReg: boolean) {
  try {
    const msg = isReg ? '注册成功，即将进入...' : '登录成功，即将进入...'
    // 1.执行登录操作 存储 token 和用户信息
    const { data } = await userLogin(isReg ? { ...state.registerForm } : { ...state.loginForm })
    // 是否需要设置强密码
    if (data.needUpdatePwd) {
      state.formType = 'setPwd'
      state.loading = false
      return
    }
    getUserInfo(data, msg)
    socketClient.init(data.jwtToken)
  }
  catch (error: any) {
    if (state.formType === 'login') {
      state.loginForm.password = '';
      (inputLogin.value[1] as any)?.getFocus()
    }
    getVaildCode()
    state.loading = false
    sliderVerifyRef.value?.resetStatu()
    state.loginForm.verificationCode = ''
    if (error?.code === 304006 && !isReg)
      (inputLogin.value[0] as any)?.nickNameNotExist()
  }
}

// 切换 登录/注册
async function toggleFormType(type: FormType) {
  state.formType = type
  resetFormValue(state.loginForm)
  resetFormValue(state.registerForm)
  state.loginForm.way = 0
  state.registerForm.way = 0
  state.isCheck = false
  changeCheckFirst(true)
}

onMounted(() => {
  getVaildCode()
})
</script>

<template>
  <!-- <div class="content"> -->
  <div class="login-box" :class="calcLoginBoxType">
    <!-- 登录 -->
    <div v-if="state.formType === 'login'" class="login animate__animated animate__fadeInLeft animate__fast">
      <div class="head mb32">
        <p class="pfm text22 icon-color">
          欢迎登录
        </p>
      </div>
      <div class="login-form">
        <div class="login-module flex-column-between">
          <div class="top">
            <login-input
              v-for="(item, index) in state.loginFormItems"
              :key="index"
              ref="inputLogin"
              v-model:value="(state.loginForm as any)[item.name]"
              :type="item.type"
              :name="item.name"
              :label="item.label"
              :max-length="item.maxLength"
              @on-submit="handleSubmit"
            />
          </div>
          <slider-verify
            v-if="state.vaildCode"
            ref="sliderVerifyRef"
            :is-open="state.isShowVerify"
            @on-success="verifySuccess"
          />
          <div class="bot">
            <a-button
              class="login-btn text16 mt8"
              type="primary"
              :loading="state.loading"
              :style="{ backgroundColor: state.vaildCode && !state.loginForm.verificationCode ? '#BBDFFF' : '' }"
              @click="handleSubmit"
            >
              登录
            </a-button>
            <div v-if="showRegisterEntry" class="regeist-text flex-row-center">
              没有账号？请点击
              <span class="primary-color text14 pointer ml4 pfm" @click="toggleFormType('register')">
                注册
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 注册 / 第三方完善信息 -->
    <div v-if="state.formType === 'register'" class="reg animate__animated animate__fadeInRight animate__fast">
      <div class="head flex-row-between mb32">
        <p class="pfm text22 icon-color">
          欢迎注册
        </p>
      </div>
      <div class="reg-module">
        <login-input
          v-for="(item, index) in state.registerFormItems" :key="index"
          ref="inputLogin"
          v-model:value="(state.registerForm as any)[item.name]"
          :type="item.type"
          :name="item.name"
          :special-holder="true"
          :label="item.label"
          :is-reg="true"
          :check-password="item.checkPassword ? (state.registerForm as any)[item.checkPassword] : ''"
          :maxlength="item.maxLength"
        />
        <a-button
          class="login-btn text16"
          type="primary"
          :loading="state.loading"
          @click="handleSubmit"
        >
          注册
        </a-button>
        <div class="regeist-text flex-row-center">
          已有账号？请点击
          <span class="primary-color text14 pointer ml4 pfm" @click="toggleFormType('login')">
            登录
          </span>
        </div>
      </div>
    </div>
    <!-- 设置强密码 -->
    <setPwd
      v-if="state.formType === 'setPwd'"
      :login-info="state.loginForm"
      @on-back-login="() => {
        state.formType = 'login'
        state.vaildCode
      }"
      @on-change-password="onChangePassword"
    />
  </div>
  <!-- </div> -->
</template>

<style lang="scss" scoped>
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
