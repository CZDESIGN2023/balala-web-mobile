<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { setVerifyPassword, validateUserName, verifyNickname, verifyPassword } from '../config/validate'
import { SvgIcon } from '@/components/SvgIcon'

interface Props {
  name: string
  type?: string
  value?: string
  label?: string
  checkPassword?: string // 是否需要检测密码是否一致
  strongPass?: boolean // 强密码校验
  maxLength?: number
  specialHolder?: boolean
  isReg?: boolean // 用于注册
  isThirdLogin?: boolean // 是否三方登录
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  type: 'text',
  value: '',
  label: '用户名',
  checkPassword: '',
  strongPass: false,
  maxLength: 100,
  specialHolder: false,
  isReg: false,
  isThirdLogin: false,
})
const emits = defineEmits(['update:value', 'onVaildCheck', 'onSubmit'])

const placeholderText = ref(props.label)
const inputLabel = ref(props.label)
const inputType = ref(props.type)
const errorTip = ref<string>('')
const inputRef = ref()
const inputIsFocus = ref(false)
const errorTipShow = ref<boolean>(false)

function blurLableName(label: string) {
  return label
}

function focusLableName(label: string) {
  return label
}

function focusPlaceHolderNmae() {
  if (props.isReg) {
    if (props.name === 'userName')
      placeholderText.value = `5 ~ 20个字符(支持英文/数字/下划线)`
    else if (props.name === 'nickName')
      placeholderText.value = `2 ~ 14个字符(支持中英文/数字/下划线)`
    else if (props.name === 'password')
      placeholderText.value = `5 ~ 20个字符(支持英文/数字/符号)`
    else if (props.name === 'confirmPassword')
      placeholderText.value = `5 ~ 20个字符(支持英文/数字/符号)`
  }
  else if (props.strongPass) {
    if (props.name === 'password')
      placeholderText.value = `5 ~ 20个字符(英文/数字/符号组合)`
    else if (props.name === 'confirmPassword')
      placeholderText.value = `5 ~ 20个字符(英文/数字/符号组合)`
  }
  else {
    placeholderText.value = `请输入${props.label}`
  }
}
// 校验输入内容
async function validateField(name: string, value: string, strongPass?: boolean, checkPassword?: string) {
  let result = ''
  if (name === 'userName')
    result = await validateUserName(value, props.isReg)
  else if (name === 'nickName')
    result = verifyNickname(value)
  else if (name === 'password')
    result = strongPass ? setVerifyPassword(value, checkPassword, true) : verifyPassword(value, checkPassword, true)
  else if (name === 'confirmPassword')
    result = strongPass ? setVerifyPassword(value, checkPassword, false) : verifyPassword(value, checkPassword, false)

  return result
}

function onFocus() {
  inputLabel.value = focusLableName(props.label)
  inputIsFocus.value = true
  focusPlaceHolderNmae()
}

async function onBlur(event: Event) {
  inputLabel.value = blurLableName(props.label)
  const target = event.target as HTMLInputElement
  emits('update:value', target.value)
  const result = await validateField(props.name, target.value, props.strongPass, props.checkPassword)
  if (target.value) {
    if (!result) {
      errorTipShow.value = false
    }
    else {
      errorTipShow.value = true
      errorTip.value = result
    }
  }
  else {
    errorTip.value = ''
    errorTipShow.value = false
  }
  setTimeout(() => {
    inputIsFocus.value = false
  }, 100)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emits('update:value', target.value)
  if (!target.value) {
    errorTip.value = ''
    errorTipShow.value = false
  }
}

async function clearValue() {
  emits('update:value', '')
  getFocus()
  errorTipShow.value = false
}

async function checkContent() {
  const result = await validateField(props.name, props.value, props.strongPass, props.checkPassword)
  if (!result) {
    errorTipShow.value = false
  }
  else {
    errorTipShow.value = true
    if (props.value)
      errorTip.value = result

    if (!props.value)
      inputLabel.value = `${props.name === 'confirmPassword' ? '请再次' : '请输入'}${props.label}`
  }
  return result
}

function nickNameNotExist() {
  if (!props.isReg && props.name === 'userName') {
    errorTip.value = '用户名不存在'
    errorTipShow.value = true
  }
}

function handelSubmit() {
  if (props.name === 'password') {
    getBlur() // enter登录会导致密码丢失
    emits('onSubmit')
  }
}

function getFocus() {
  inputRef.value && inputRef.value.focus()
}

function getBlur() {
  inputRef.value && inputRef.value.blur()
}

// 切换密码可视
function toggleVisibility() {
  inputType.value = inputType.value === 'password' ? 'text' : 'password'
}

const showCloseIcon = computed(() => {
  return ['userName', 'nickName'].includes(props.name) && props.value && inputIsFocus.value
})

const showPassWordIcon = computed(() => {
  return ['password', 'confirmPassword'].includes(props.name)
})

const calcInputPb = computed(() => {
  if (errorTipShow.value && props.value && errorTip.value) {
    return 'input-group-pb78'
  }
  return ''
})

const calcInputValue = computed(() => {
  return props.value ? 'input-has-value' : ''
})

const calcInputStatus = computed(() => {
  return errorTipShow.value ? 'error' : 'normal'
})

const calcLoginType = computed(() => {
  if (!errorTipShow.value && props.value && props.isThirdLogin) {
    return 'input-third-style'
  }
  return ''
})

onMounted(async () => {
})

defineExpose({
  checkContent,
  nickNameNotExist,
  getFocus,
  getBlur,
})
</script>

<template>
  <div class="input-group" :class="[calcInputPb, calcLoginType]">
    <input
      ref="inputRef"
      autocomplete="new-password"
      :maxlength="maxLength"
      :class="[calcInputStatus, calcInputValue]"
      :type="inputType"
      :value="props.value" :placeholder="placeholderText"
      @keyup.enter="handelSubmit"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    >
    <label for="name">{{ inputLabel }}</label>
    <p class="input-error" :class="{ 'trans-show': errorTipShow && props.value }">
      {{ errorTip }}
    </p>
    <div class="input-icon">
      <div
        v-show="showCloseIcon"
        class="icon-item"
        @click="clearValue"
      >
        <div class="order-icon-close flex-row-center pointer">
          <SvgIcon name="close" size="16" />
        </div>
      </div>
      <div v-if="showPassWordIcon" class="icon-item" @click="toggleVisibility">
        <SvgIcon v-if="inputType === 'password'" name="password_hide" size="18" color="#BFBFBF" />
        <SvgIcon v-else name="password_show" size="18" color="#BFBFBF" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$holder-font-size: 14px;
::-webkit-input-placeholder {
  color: $login-input-holder-color;
  font-size: $holder-font-size;
  letter-spacing: 0.02em;
}
:-moz-placeholder {
  color: $login-input-holder-color;
  font-size: $holder-font-size;
  letter-spacing: 0.02em;
}
::-moz-placeholder {
  color: $login-input-holder-color;
  font-size: $holder-font-size;
  letter-spacing: 0.02em;
}
:-ms-input-placeholder {
  color: $login-input-holder-color;
  font-size: $holder-font-size;
  letter-spacing: 0.02em;
}
.input-group {
  position: relative;
  width: 100%;
  padding-bottom: 60px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &.input-group-pb78 {
    padding-bottom: 78px;
  }
  &.input-third-style {
    input {
      &:not(:focus) {
        background-color: $login-input-normal-bg !important;
        border: 2px solid transparent !important;
        color: #bfbfbf;
        & + label {
          opacity: 0;
          transform: translateY(15px) !important;
        }
      }
    }
  }
  input {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 44px;
    border: 2px solid transparent;
    border-radius: 6px;
    background-color: $login-input-normal-bg;
    padding: 0 12px;
    font-size: 14px;
    outline: none;
    &::placeholder {
      opacity: 0;
      transform: translateY(2px);
    }
    &:focus::placeholder {
      opacity: 1;
      transform: translateY(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transition-delay: 0.1s;
    }
    &::-ms-reveal {
      display: none;
    }
    &::-webkit-credentials-auto-fill-button {
      display: none !important;
      visibility: hidden;
      pointer-events: none;
      position: absolute;
      right: 0;
    }
    &:focus::-webkit-contacts-auto-fill-button {
      opacity: 0;
    }
    &:hover {
      background-color: $login-input-hover-bg;
    }
    &:focus,
    &.input-has-value {
      background-color: #fff;
      border: 2px solid #1d74f5;
      & + label {
        color: #1d74f5;
        transform: translateY(-9px) scale(0.9);
        background-color: #fff;
      }
      // 这里用来解决密码自动填充带来的背景问题
      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus,
      &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
        background-clip: content-box !important;
        -webkit-text-fill-color: #333 !important;
      }
      &:-webkit-autofill {
        -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 1) inset;
      }
    }
    &.error {
      background-color: #fff;
      border: 2px solid #fd4c4c;
      & + label {
        color: #fd4c4c;
        background-color: #fff;
      }
    }
  }
  label {
    font-size: 14px;
    position: absolute;
    left: 2px;
    padding: 0 4px;
    margin-left: 8px;
    pointer-events: none;
    color: #bfbfbf;
    transform: translateY(13px);
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.1s ease;
    transform-origin: left center;
  }
  .input-error {
    position: absolute;
    z-index: -1;
    left: 0;
    top: 46px;
    color: #fd4c4c;
    font-size: 13px;
    padding: 0 12px;
    white-space: nowrap;
    transform: translateY(-20px);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    &.trans-show {
      transform: translateY(6px);
    }
  }
  .input-icon {
    position: absolute;
    top: 13px;
    right: 12px;
    background: none;
    border: none;
    display: flex;
    align-items: center;
    z-index: 10;
    .icon-item {
      width: 18px;
      height: 18px;
      margin-left: 13px;
      .order-icon-close {
        width: 16px;
        height: 16px;
        border-radius: 100%;
        background: rgba(0, 0, 0, 0.4);
        flex: none;
        color: #fff;
      }
    }
  }
}
</style>
