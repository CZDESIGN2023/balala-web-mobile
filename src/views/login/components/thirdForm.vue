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
import { getConfigDomain, getTextLength, getTimeState, truncateString } from '@/utils'
import { HOME_URL } from '@/config'
import { ConfigKey } from '@/enum'
import { useGetThirdToken } from '@/hooks/useGetThirdToken'
import quickLoading from '@/assets/quickLogin/loading.gif'

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
    avatar: string
    confirmPassword: string
    way: number
    pfToken: string
  }
  checkFirst: checkLoginPswTpy
  loading: boolean
  isCheck: boolean
  isShowVerify: boolean
  quickLoading: boolean
}

const router = useRouter()
const userStore = useUserStore()
const socketClient: any = inject('socketClient')

const inputLogin = ref([])
const sliderVerifyRef = ref<InstanceType<typeof sliderVerify>>()
const state = reactive<State>({
  formType: 'register',
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
    // {
    //   name: 'password',
    //   type: 'password',
    //   label: '密码',
    //   maxLength: 100,
    // },
    // {
    //   name: 'confirmPassword',
    //   type: 'password',
    //   checkPassword: 'password',
    //   label: '确认密码',
    //   maxLength: 100,
    // },
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
    avatar: '',
    password: '',
    confirmPassword: '',
    way: 3,
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
  quickLoading: false,
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
// const showRegisterEntry = computed(() => {
//   const statu = Number(getConfigDomain(ConfigKey.REGISTER_ENTRY))
//   return Boolean(statu)
// })

// 重置所有状态
function changeCheckFirst(isFirst: boolean) {
  for (const key in state.checkFirst)
    state.checkFirst[key] = isFirst
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
  state.loginForm.pfToken = ''
  await nextTick()
  handleLogin(false, '登录成功，即将进入...')
}

// 存储 token 和用户信息
async function getUserInfo(data: any, msg: string, next?: boolean) {
  userStore.setToken(data.jwtToken)
  userStore.setUserInfo(data.user)
  await userStore.getConfig()
  if (next)
    return

  message.success(msg, 3, () => {
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

// 点击跳过 直接注册
// function handleSkipToRegister() {
//   state.quickLoading = true
//   setTimeout(() => {
//     handleRegister('登录成功，即将进入...')
//   }, 600)
// }

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
        handleRegister('注册成功，即将进入...')
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
        state.loginForm.way = 0
        handleLogin(false, '登录成功，即将进入...')
    }
  }
  catch (errorInfo: any) {
    console.log('Failed:', errorInfo)
    document.getElementById(errorInfo.errorFields[0].name[0])?.focus()
    state.loading = false
  }
}

// 注册
async function handleRegister(msg: string = '注册成功，即将进入...') {
  try {
    // 1.执行注册操作
    await userRegister({ ...state.registerForm })
    // 2.注册成功直接登录
    state.loginForm.way = 3
    handleLogin(true, msg)
  }
  catch (error) {
    state.quickLoading = false
    console.log('register error', error)
  }
  finally {
    state.loading = false
  }
}

// 需要注册（完善用户信息，用于第三方登录）
async function needReigster(data: any) {
  let pfUserData: any = {}
  try {
    pfUserData = JSON.parse(data.pfUserInfo)
  }
  catch (error) {
    pfUserData = {}
  }
  state.formType = 'register'
  state.loading = false
  state.registerForm.nickName = processNickName(pfUserData.nickname || '')
  state.registerForm.userName = processNickName(pfUserData.username || '', 20)
  state.registerForm.avatar = pfUserData.avatar
}

function processNickName(nickName: string, maxLength: number = 14) {
  const length = getTextLength(nickName)
  const isVaildNicknameLength = length >= 2 && length <= maxLength
  if (!nickName || !isVaildNicknameLength) {
    return truncateString(nickName, maxLength)
  }
  return nickName
}

// 登录
async function handleLogin(isReg: boolean, msg: string) {
  try {
    // 1.执行登录操作 存储 token 和用户信息
    const { data } = await userLogin({ ...state.loginForm })
    // 是否需要注册（完善用户信息，用于第三方登录）
    if (data.needRegister) {
      needReigster(data)
      return
    }
    // 是否需要设置强密码
    if (data.needUpdatePwd) {
      state.formType = 'setPwd'
      state.loading = false
      return
    }
    state.quickLoading = true
    getUserInfo(data, msg as string)
    socketClient.init(data.jwtToken)
  }
  catch (error: any) {
    if (state.formType === 'login') {
      state.loginForm.password = '';
      (inputLogin.value[1] as any)?.getFocus()
    }
    getVaildCode()
    state.loading = false
    state.quickLoading = false
    sliderVerifyRef.value?.resetStatu()
    state.loginForm.verificationCode = ''
    if (error?.code === 304006 && !isReg)
      (inputLogin.value[0] as any)?.nickNameNotExist()
  }
}

// 切换 登录/注册
async function toggleFormType(type: FormType) {
  state.formType = type
  state.loginForm.userName = ''
  state.loginForm.password = ''
  state.loginForm.way = 0
  state.registerForm.way = 3
  state.isCheck = false
  changeCheckFirst(true)
}

onMounted(() => {
  getVaildCode()
  const { im_token } = useGetThirdToken()
  if (im_token) {
    state.loginForm.pfToken = im_token.value as string
    state.registerForm.pfToken = im_token.value as string
    state.loginForm.way = 3
    handleLogin(false, '登录成功，即将进入...')
  }
})
</script>

<template>
  <div class="content">
    <div class="login-box" :class="calcLoginBoxType">
      <!-- 登录 loading -->
      <div v-if="state.quickLoading" class="loading-box flex-column-center">
        <!-- 加载中 -->
        <div class="w48 h48 flex-row-center mb8">
          <img class="w35 h35 quick-loading" :src="quickLoading" alt="">
        </div>
        <p class="text16 icon-color">
          账号登录中
        </p>
      </div>
      <template v-if="!state.quickLoading">
        <!-- 登录 -->
        <div v-if="state.formType === 'login'" class="login animate__animated animate__fadeInLeft animate__fast">
          <div class="head flex-row-between mb56">
            <p class="pfm text28 title-color">
              账号登录
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
                  登录并关联
                </a-button>
                <div class="regeist-text flex-row-center">
                  没有账号？请点击
                  <span class="primary-color text14 pointer ml4 pfm flex-one" @click="toggleFormType('register')">
                    返回
                  </span>
                  <a-tooltip title="请联系系统管理员" effect="dark">
                    <span class="primary-color text14 pointer ml4 pfm">
                      忘记密码
                    </span>
                  </a-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 第三方完善信息 -->
        <div v-if="state.formType === 'register'" class="reg animate__animated animate__fadeInRight animate__fast">
          <div class="head flex-row-between">
            <p class="pfm text28 title-color mb56">
              确认账号信息
            </p>
          </div>
          <div class="user_pic flex-row-center">
            <img :src="state.registerForm.avatar" alt="">
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
              :is-third-login="true"
              :check-password="item.checkPassword ? (state.registerForm as any)[item.checkPassword] : ''"
              :maxlength="item.maxLength"
            />
            <a-button
              class="login-btn text16 mt8"
              type="primary"
              :loading="state.loading"
              @click="handleSubmit"
            >
              注册并关联
            </a-button>
            <div class="regeist-text flex-row-center">
              已有账号？请点击
              <span class="primary-color text14 pointer ml4 pfm flex-one" @click="toggleFormType('login')">
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
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.regeist-text {
  width: 100%;
  font-size: 14px;
  color: #666;
  margin-top: 16px;
  display: flex;
  align-self: flex-start;
}
</style>
