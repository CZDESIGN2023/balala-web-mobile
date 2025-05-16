import { userCheckName } from '@/api/user'
import { getTextLength } from '@/utils'

// 验证用户名
export async function validateUserName(username: string, isReg: boolean): Promise<string> {
  const reg = /^\w+$/
  const length = getTextLength(username)
  if (!username) {
    return '用户名不能为空'
  }
  else if (!reg.test(username) || !(length >= 5 && length <= 20)) {
    return '5 ~ 20个字符(支持英文/数字/下划线)'
  }
  else {
    if (isReg) {
      try {
        await userCheckName(username)
      }
      catch (error) {
        return '当前用户名已被占用，请尝试更换'
      }
    }
    return ''
  }
}

// 验证密码
export function verifyPassword(
  value: any,
  password: string | undefined = undefined,
  isSingle: boolean | undefined = true,
) {
  // eslint-disable-next-line regexp/no-obscure-range
  const reg = /[^a-z0-9`~!@#$%&*()\\-_=+[{]\}\\\\|;:'",<.>\/?\]+/gi
  const cnReg = /^[^\u4E00-\u9FA5\uFF00-\uFFEF\u3000-\u303F]+$/g
  const emojReg = /^[^\uD800-\u{10FC00}-\u2600-\u26FF\u2700-\u27BF]+$/gu

  const length = getTextLength(value)
  if (!value) { return '密码不能为空' }
  else if (/\s/.test(value) || reg.test(value) || !cnReg.test(value) || !emojReg.test(value) || !(length >= 5 && length <= 20)) { return `5 ~ 20个字符(支持英文/数字/符号)` }
  else if (!isSingle) {
    if (password && value !== password)
      return `两次输入的密码不一致，请重新输入`
  }

  // 确保函数在所有条件判断结束后都返回一个空字符串
  return ''
}
// 强密码校验
export function setVerifyPassword(
  value: any,
  password: string | undefined = undefined,
  isSingle: boolean | undefined = true,
) {
  const length = getTextLength(value)
  const cnReg = /^[^\u4E00-\u9FA5\uFF00-\uFFEF\u3000-\u303F]+$/g
  const emojReg = /^[^\uD800-\u{10FC00}-\u2600-\u26FF\u2700-\u27BF]+$/gu

  const hasLetter = /[a-z]/i.test(value)
  const hasNumber = /\d/.test(value)
  const hasSymbol = /[^a-z0-9]/i.test(value)
  // 至少两种组合的校验条件
  const validCombinations = [
    hasLetter && hasNumber,
    hasLetter && hasSymbol,
    hasNumber && hasSymbol,
  ].some(Boolean)
  if (!value) { return '密码不能为空' }
  else if (/\s/.test(value) || !(length >= 5 && length <= 20) || !validCombinations || !cnReg.test(value) || !emojReg.test(value)) {
    return '5 ~ 20个字符，至少包含两种组合(英文/数字/符号)'
  }
  else if (!isSingle) {
    if (password && value !== password)
      return `两次输入的密码不一致，请重新输入`
  }

  return ''
}

export function verifyNickname(value: any) {
  const reg = /^[\w\u4E00-\u9FA5]+$/
  const length = getTextLength(value)
  if (!value)
    return '昵称不能为空'
  else if (!reg.test(value) || !(length >= 2 && length <= 14))
    return '2 ~ 14个字符(支持中英文/数字/下划线)'

  return ''
}
