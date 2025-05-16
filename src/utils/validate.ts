import type { Rule } from 'ant-design-vue/es/form'
import { userCheckName } from '@/api/user'
import { getTextLength } from '@/utils'
/**
 * 用户名 (字母开头，允许5-20字节，允许字母数字下划线)
 * @param val 当前值字符串
 * @returns 返回 true: 用户名正确
 */
export async function verifyAccount(rule: any, value: any, callback: any, isReg: boolean) {
  const reg = /^(?:\d+|[a-z]+|_+){5,20}$/i
  if (!value) {
    return Promise.reject('用户名不能为空')
  }
  else if (!reg.test(value)) {
    return Promise.reject('5 ~ 20个字符(支持英文/数字/下划线)')
  }
  else {
    if (isReg) {
      try {
        await userCheckName(value)
        return Promise.resolve()
      }
      catch (error) {
        return Promise.reject('当前用户名已被占用，请尝试更换')
      }
    }
    else {
      return Promise.resolve()
    }
  }
}

/**
 * 昵称 (字母开头，允许2-14字节，允许字母数字下划线)
 * @param val 当前值字符串
 * @returns 返回 true: 登录账号正确
 */
export function verifyNickname(rule: any, value: any, callback: any) {
  const reg = /^[\w\u4E00-\u9FA5]+$/
  const length = getTextLength(value)
  if (!value)
    return Promise.reject('昵称不能为空')
  else if (!reg.test(value) || !(length >= 2 && length <= 14))
    return Promise.reject('2 ~ 14个字符(支持中英文/数字/下划线)')
  else
    return Promise.resolve()
}

export function verifyEmail(rule: any, value: any, callback: any) {
  const reg = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!value)
    return Promise.reject('邮箱不能为空')
  else if (!reg.test(value))
    return Promise.reject('请确保邮箱的格式正确')
  else
    return Promise.resolve()
}

/**
 * 强密码 (字母+数字+特殊字符，长度在5-20之间)
 * @param val 当前值字符串
 * @returns 返回 true: 弱密码正确
 * 弱：纯数字，纯字母，纯特殊字符 /^(?:\d+|[a-zA-Z]+|[!@#$%^&\.*]+){6,16}$/
 * 中：字母+数字，字母+特殊字符，数字+特殊字符 /^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&\.*]+$)[a-zA-Z\d!@#$%^&\.*]{6,16}$/
 * 强：字母+数字+特殊字符 /^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&\.*]+$)(?![a-zA-z\d]+$)(?![a-zA-z!@#$%^&\.*]+$)(?![\d!@#$%^&\.*]+$)[a-zA-Z\d!@#$%^&\.*]{6,16}$/
 */
export function verifyPassword(
  rule: any,
  value: any,
  callback: any,
  password: string | undefined,
  isSingle: boolean = false,
) {
  const reg = /[^a-z0-9`~!@#$%&*()\\-_=+[{]\}\\\\|;:'",<.>\/?\]+/gi
  const cnReg = /^[^\u4E00-\u9FA5\uFF00-\uFFEF\u3000-\u303F]+$/g
  const emojReg = /^[^\uD800-\u{10FC00}-\u2600-\u26FF\u2700-\u27BF]+$/gu

  const length = getTextLength(value)
  if (!value)
    return Promise.reject('密码不能为空')
  else if (/\s/.test(value) || reg.test(value) || !cnReg.test(value) || !emojReg.test(value) || !(length >= 5 && length <= 20))
    return Promise.reject(`5 ~ 20个字符(支持英文/数字/符号)`)
  else if (value !== password && password && !isSingle)
    return Promise.reject(`两次输入的密码不一致，请重新输入`)
  else
    return Promise.resolve()
}

/**
 * 强密码 (字母+数字+特殊字符，长度在5-20之间)
 */

export function setVerifyPassword(
  rule: any,
  value: any,
  callback: any,
  password: string | undefined,
  isSingle: boolean = false,
) {
  const length = getTextLength(value)

  if (!value)
    return Promise.reject('密码不能为空')

  const cnReg = /^[^\u4E00-\u9FA5\uFF00-\uFFEF\u3000-\u303F]+$/g
  const emojReg = /^[^\uD800-\u{10FC00}-\u2600-\u26FF\u2700-\u27BF]+$/gu
  const hasLetter = /[a-z]/i.test(value)
  const hasNumber = /\d/.test(value)
  const hasSymbol = /[^a-z0-9]/i.test(value)
  // const hasSymbol = /[^a-zA-Z0-9\\`~!@#$%^&*()\\-_=+\\[{\\]}\\\\|;:'\",<.>\/?]/.test(value);

  // 至少两种组合的校验条件
  const validCombinations = [
    hasLetter && hasNumber,
    hasLetter && hasSymbol,
    hasNumber && hasSymbol,
  ].some(Boolean)

  if (/\s/.test(value) || !(length >= 5 && length <= 20) || !cnReg.test(value) || !emojReg.test(value) || !validCombinations)
    return Promise.reject('5 ~ 20个字符，至少包含两种组合(英文/数字/符号)')
  else if (value !== password && password && !isSingle)
    return Promise.reject('两次输入的密码不一致，请重新输入')
  else
    return Promise.resolve()
}

// 校验项目名称
export function verifySpacename(rule: any, value: any, callback: any) {
  const reg = /^[\w\u4E00-\u9FA5]+$/
  const length = getTextLength(value)
  if (!value)
    return Promise.reject('项目名称不能为空')
  else
    return Promise.resolve()
}

// 必填
export function required(msg: string = '必填字段', trigger: string = 'blur') {
  return { required: true, message: msg, trigger }
}

/**
 * 长度校验
 * @param min 最小长度
 * @param max 最大长度
 * @param trigger 出发方式
 */
export function checkLength(min: number, max: number, trigger: string = 'blur') {
  return {
    validator: (_rule: Rule, value: string) => {
      const length = getTextLength(value)
      if (length >= min && length <= max)
        return Promise.resolve()
      else
        return Promise.reject(new Error(`请输入有效格式(${min} ~ ${max}个字符)`))
    },
    trigger,
  }
}

// 请输入 x ~ y 个字符，支持中英文、数字
export function verifyStatusAndRoleName(text: string = '', minWidth: number = 2, maxWidth: number = 8) {
  const length = getTextLength(text)
  const regex = /^[A-Z0-9\u4E00-\u9FA5]+$/i
  if (!text || length < minWidth || length > maxWidth || !regex.test(text)) {
    return `请输入${minWidth} ~ ${maxWidth}个字符，支持中英文、数字`
  }
  return ''
}
