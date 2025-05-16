import twitter from 'twitter-text'
import { Md5 } from 'ts-md5'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import type { RendererElement, RendererNode, VNode } from 'vue'
import { PRIORITY_LIST, RANDOM_COLOR, TAG_RANDOM_COLOR, TASK_STATUS, TASK_TYPES } from './constant'
import { useUserStore } from '@/stores/modules/user'
import { FileSuffix } from '@/enum'

import welcome_after from '@/assets/welcome/after.png'
import welcome_moning from '@/assets/welcome/moning.png'
import welcome_middle from '@/assets/welcome/middle.png'
import welcome_night from '@/assets/welcome/night.png'
import { TaskStatus, TaskStatusKey } from '@/enum/TaskStatus'

function getWelDesc(cDate: any, cImg: any, desc: string) {
  const nDay = cDate.getDay()

  let zhDay

  switch (nDay) {
    case 1:
      zhDay = '星期一'
      break
    case 2:
      zhDay = '星期二'
      break
    case 3:
      zhDay = '星期三'
      break
    case 4:
      zhDay = '星期四'
      break
    case 5:
      zhDay = '星期五'
      break
    case 6:
      zhDay = '星期六'
      break
    case 0:
      zhDay = '星期日'
      break
  }

  return `
    <div style="display: flex; align-items: center;">
      <img src="${cImg}" style="width: 40px; height: 40px; margin-right: 12px;"/>
      <div>
        <div style="font-size: 14px; color: #666;">${
          cDate.getMonth() + 1
        } 月 ${cDate.getDate()} 日，${zhDay}</div>
        <div class="pfm" style="font-size: 20px; color: #1A1A1A;">${desc}</div>
      </div>
    </div>
  `
}
export function getApiUrl() {
  const isHttps = window.location.protocol === 'https:'
  return isHttps ? import.meta.env.VITE_API_URL_HTTPS : import.meta.env.VITE_API_URL
}
/**
 * @description 获取当前时间对应的提示语
 */
export function getTimeState(name: string) {
  const timeNow = new Date()
  const hours = timeNow.getHours()
  if (hours >= 7 && hours < 12)
    return getWelDesc(timeNow, welcome_moning, `早上好，${name}`)
  if (hours >= 12 && hours < 14)
    return getWelDesc(timeNow, welcome_middle, `中午好，${name}`)
  if (hours >= 14 && hours < 17)
    return getWelDesc(timeNow, welcome_after, `下午好，${name}`)
  if (hours >= 17 && hours < 19)
    return getWelDesc(timeNow, welcome_night, `傍晚好，${name}`)
  if (hours >= 19 && hours < 23)
    return getWelDesc(timeNow, welcome_night, `晚上好，${name}`)
  if (hours >= 0 && hours < 7)
    return getWelDesc(timeNow, welcome_night, `夜深了，${name}`)
}

// 时间
export function formatDate(time: string | number | undefined, format: string = 'YYYY/MM/DD', _default: string = '长期') {
  const timeLen = String(time).length
  if (timeLen === 10)
    return dayjs(Number(time) * 1000).format(format)
  else if (timeLen === 13)
    return dayjs(Number(time)).format(format)
  else
    return _default
}

// 节流
export function throttle(fn: { apply: (arg0: any, arg1: any[]) => void }, t: number) {
  let flag = true
  const interval = t || 500
  return function (this: any, ...args: any) {
    if (flag) {
      fn.apply(this, args)
      flag = false
      setTimeout(() => {
        flag = true
      }, interval)
    }
  }
}

// 防抖
export function debounce(fn: { apply: (arg0: any, arg1: any) => void }, t: number) {
  let timeId: any = null
  const delay = t || 500
  return function (this: any, ...args: any) {
    if (timeId)
      clearTimeout(timeId)

    timeId = setTimeout(() => {
      timeId = null
      fn.apply(this, args)
    }, delay)
  }
}

function checkFirstAndSecondChar(str: string) {
  // 检查第一个字符是否不是中文
  const firstCharNotChinese = !/^[\u4E00-\u9FFF]/.test(str[0])
  // 检查第二个字符是否是中文
  const secondCharChinese = /^[\u4E00-\u9FFF]/.test(str[1])

  // 如果第一个字符不是中文，第二个字符是中文，则返回true
  return firstCharNotChinese && secondCharChinese
}

// 字符串截取
export function stringSub(str: string, start: number = 0, _end: number = 1): string {
  const regex = /^[\u4E00-\u9FA5]/
  if (checkFirstAndSecondChar(str))
    return str && str.substring(start, 1)

  if (regex.test(str))
    return str && str.substring(start, 1)
  else
    return str && str.substring(start, 2)
}

// 字符串按字符截取
export function truncateString(str: string, maxLength: number): string {
  let length = 0
  let result = ''

  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i)

    // 中文字符算作两个长度
    if (/[\u4E00-\u9FA5]/.test(char))
      length += 2
    else
      length += 1

    if (length <= maxLength)
      result += char
    else
      break
  }

  return result
}

// 对象拷贝
export function deepCopy<T>(value: T): any {
  if (Array.isArray(value)) {
    return value.map(item => deepCopy(item as any))
  }
  else if (typeof value === 'object' && value !== null) {
    return Object.assign(
      {},
      value,
      ...Object.entries(value).map(([key, val]) => ({ [key]: deepCopy(val as any) })),
    )
  }
  else {
    return value
  }
}

// 辅助函数，用于检查一个值是否为对象
export function isObject(object: any): object is object {
  return object != null && typeof object === 'object'
}

// 深度比对两个对象
export function deepEqual<T extends object>(obj1: T, obj2: T): boolean {
  // 获取两个对象的属性名数组
  const keys1 = Object.keys(obj1) as Array<keyof T>
  const keys2 = Object.keys(obj2) as Array<keyof T>

  // 如果属性数量不同，直接返回 false
  if (keys1.length !== keys2.length)
    return false

  // 遍历所有属性
  for (const key of keys1) {
    const val1 = obj1[key]
    const val2 = obj2[key]
    const areObjects = isObject(val1) && isObject(val2)

    // 检查两个值是否都是对象
    if ((areObjects && !deepEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
      // 如果是对象，递归检查；如果不是对象，直接比较
      return false
    }
  }

  // 如果所有属性都匹配，返回 true
  return true
}

// 流量单位转换
export function convertTrafficUnit(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let result: number = bytes
  let unitIndex: number = 0

  while (result >= 1024 && unitIndex < units.length - 1) {
    result /= 1024
    unitIndex++
  }

  return `${result.toFixed(2)} ${units[unitIndex]}`
}

// 文件图标处理
export function getFileIcon(fix: string) {
  // 图片类型
  const pics = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'raw', 'heif', 'heic', 'dng', 'psd']
  // 视频类型
  const videos = ['mov', 'mp4', 'rmvb', 'avi', 'flv', 'f4v', 'rm', 'm4v']
  // 音频类型
  const musics = ['mp3', 'wav', 'wma', 'flac', 'midi', 'ra', 'ape', 'aac', 'cda']
  // 结果
  let result = ''
  if (fix.includes('doc'))
    result = FileSuffix.WORD
  else if (fix.includes('xls'))
    result = FileSuffix.EXCEL
  else if (fix.includes('ppt'))
    result = FileSuffix.PPT
  else if (fix === 'pdf')
    result = FileSuffix.PDF
  else if (fix === 'txt')
    result = FileSuffix.TXT
  else if (pics.includes(fix.toLowerCase()))
    result = FileSuffix.PIC
  else if (videos.includes(fix.toLowerCase()))
    result = FileSuffix.VIDEO
  else if (fix === 'zip')
    result = FileSuffix.ZIP
  else if (musics.includes(fix.toLowerCase()))
    result = FileSuffix.MUSIC
  else
    result = FileSuffix.UNKOWN

  return result
}

// 获取可预览的类型
export function getPicIcon(fix: string) {
  // 结果
  let result = ''

  // 图片类型
  const pics = ['jpg', 'jpeg', 'png', 'gif', 'webp']

  if (pics.includes(fix.toLowerCase()))
    result = FileSuffix.PIC

  return result
}

// 判断对象里面的所有值是不是都是空
export function isEmptyObject(obj: any): boolean {
  // 检查输入是否为对象
  if (typeof obj !== 'object' || obj === null)
    return false

  // 遍历对象的所有键，检查值是否为空
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !isEmpty(obj[key]))
      return false
  }

  return true
}

// 辅助函数，用于检查值是否为空
function isEmpty(value: any): boolean {
  if (Array.isArray(value))
    return value.length === 0
  else if (typeof value === 'object')
    return isEmptyObject(value)
  else
    return value === null || value === undefined || value === ''
}

// 获取优先级颜色
export function formatTaskPriority(val: any) {
  return PRIORITY_LIST.filter(item => item.value === val)[0]
}

// 获取任务状态
export function formatTaskStatu(val: number) {
  return TASK_STATUS.filter(item => Number(item.value) === val)[0]
}

// 获取任务流程
export function formatTaskType(val: number) {
  return TASK_TYPES.filter(item => Number(item.value) === val)[0]
}

// 判断数组中是否包含某个字段
export function containsField(array: any[], field: string, key: string): boolean {
  const filter = array.filter(item => item[key] === field)
  return filter.length === 0
}

// 获取数组下面 children 的数量
// export function getTotalChildrenCount(arr: any[]): number {
//   const totalCount = arr.filter(item => item.childKey !== '' && item.pid === '0').length
//   return totalCount || 0
// }

// 随机获取数组里的一项
export function randomColor(id: string) {
  const idx = Number(id) % 4
  const randomElement = RANDOM_COLOR[idx]
  return randomElement
}

// 获取本地资源文件
export function getAssetsFile(url: string, custom?: string) {
  console.log('urk', url)
  if (custom)
    return new URL(`../assets/${custom}/${url}`, import.meta.url).href
  else
    return new URL(`../assets/svg/${url}`, import.meta.url).href
}

// 根据屏幕宽度修改宽度
export function getDrawerWidth(width: number): number {
  const MIN = 680
  const MAX = 960
  let result = 0
  if (width <= 1450) {
    result = MIN
  }
  else if (width > 1450) {
    result = 0
  }
  else if (width <= 2560 && width >= 1920) {
    result = MAX
  }
  return result
}

// 获取视觉层面，字符长度
// return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length

// 获取字符数量
export function getTextLength(text: string = ''): number {
  return twitter.getTweetLength(text.trim()) || 0
}

// 获取文件链接文件名
export function getFileNameFromUrl(url: string): string {
  const urlParts = url.split('/')
  const fileName = urlParts.pop()
  return fileName as string
}

// 获取附件资源路径
export function getConfigDomain(key: string): string {
  const { config } = useUserStore()
  const filterItem = config.filter(item => item.configKey === key)[0]
  return filterItem?.configValue || ''
}

// 判断数组里的某个值是不是都是空
export function checkArrValIsEmpty(arr: any[], key: string) {
  // 遍历数组中的每个对象
  for (const obj of arr) {
    // 检查 thirdVal 属性是否为 null 或空数组
    if (obj[key] !== undefined && obj[key] !== null && obj[key].length !== 0) {
      // 如果不是，则返回 false
      return false
    }
  }
  // 如果所有对象的 thirdVal 属性都是 null 或空数组，则返回 true
  return true
}

/**
 * 计算时间戳显示对应文字
 * @param timestamp 时间戳
 * @param _lang 语言
 * @param statu 任务状态
 */
export function getTimediff(timestamp: string | number, _lang: boolean = false, statu?: TaskStatusKey, week?: string) {
  const timeLen = String(timestamp).length
  const time = timeLen === 10 ? Number(timestamp) * 1000 : Number(timestamp)
  let diff = 0
  const endDate = Date.now() // 当前时间
  if (week) {
    const workingDays = week // 工作日时间
    diff = calculateSecondsBetweenDatesTime(
      new Date(time),
      new Date(endDate),
      JSON.parse(workingDays),
    )
  }
  else {
    diff = calculateSecondsBetweenDatesTime(
      new Date(time),
      new Date(endDate),
      [1, 2, 3, 4, 5, 6, 7],
    )
    // diff = Math.round((new Date().getTime() - Number(time)) / 1000)
  }

  let text = ''

  if (statu === TaskStatusKey.COMPLETED)
    text = '任务已完成 '
  else if (statu === TaskStatusKey.TERMINATED)
    text = '任务已终止 '
  else if (statu === TaskStatusKey.CLOSE)
    text = '任务已关闭 '

  if (diff / 1 < 60)
    return statu ? `${text} 几秒` : '几秒'

  const arr = ['个月', '天', '小时', '分钟', '秒']
  const arrn = [2592000, 86400, 3600, 60, 1]

  for (let i = 0; i < arrn.length; i++) {
    let inm: any = Math.floor(diff / arrn[i])

    if (inm !== 0) {
      // 月份超出两位数显示99+
      if (!i && inm > 99)
        inm = '99+'

      if (statu)
        return `${text} ${inm} ${arr[i]}`
      else
        return `${inm} ${arr[i]}`
    }
  }
}

// 获取当前周
export function getCurrentWeek() {
  const startOfWeek = `${dayjs().day(1).format('YYYY/MM/DD')} 00:00:00`
  const endOfWeek = `${dayjs().day(7).format('YYYY/MM/DD')} 23:59:59`
  return {
    start: startOfWeek,
    end: endOfWeek,
  }
}
function calculateSecondsBetweenDatesTime(
  startDate: Date,
  endDate: Date,
  includeWeekDays: number[],
): number {
  let totalSeconds = 0
  // 检查开始和结束日期是否为同一天
  const isSameDay = startDate.toDateString() === endDate.toDateString()

  // 如果是同一天，直接计算时间差
  if (isSameDay && includeWeekDays.includes(startDate.getDay()))
    return Math.round((endDate.getTime() - startDate.getTime()) / 1000)

  // 将开始日期时间调整到当天的开始（即午夜）
  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  // 结束日期调整到结束当天的23:59:59，以便正确计算最后一天
  const adjustedEndDate = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
    23,
    59,
    59,
  )

  while (currentDate <= adjustedEndDate) {
    if (includeWeekDays.includes(currentDate.getDay())) {
      // 计算当前日期是开始、结束或中间的一天
      if (currentDate.toDateString() === startDate.toDateString()) {
        // 第一天
        totalSeconds
          += (23 - startDate.getHours()) * 3600
          + (59 - startDate.getMinutes()) * 60
          + (60 - startDate.getSeconds())
      }
      else if (currentDate.toDateString() === adjustedEndDate.toDateString()) {
        // 最后一天
        totalSeconds += endDate.getHours() * 3600 + endDate.getMinutes() * 60 + endDate.getSeconds()
      }
      else {
        // 中间的一整天
        totalSeconds += 24 * 60 * 60
      }
    }
    // 移动到下一天
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return totalSeconds
}

// 复制文本功能
export function useCopy(text: any, msg?: string | VNode<RendererNode, RendererElement, { [key: string]: any }>) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
  }
  else {
    // 降级处理
    fallbackCopyTextToClipboard(text)
  }
  msg && message.success(msg, 2)
}

function fallbackCopyTextToClipboard(text: string) {
  const tempInput = document.createElement('textarea')
  tempInput.value = text
  document.body.appendChild(tempInput)
  tempInput.select()
  document.execCommand('copy')
  document.body.removeChild(tempInput)
}

export async function getCopy() {
  try {
    const text = await navigator.clipboard.readText()
    return text
  }
  catch (err) {
    console.log(err, '...')
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.select()
    document.execCommand('paste')
    return input.value
  }
}

export function getTimeColor(endTime: number = 0, taskStatus: TaskStatus) {
  if (!endTime || !taskStatus)
    return

  const timestamp = Math.floor(Date.now() / 1000)
  // 获取当前时间
  const currentTime = new Date()
  // 将时间戳转换为日期对象
  const targetTime = new Date(endTime * 1000)

  // 计算时间差（以毫秒为单位）
  const timeDifference = currentTime.getTime() - targetTime.getTime()

  // 计算相差的小时数
  const hoursDifference = Math.abs(timeDifference) / (1000 * 60 * 60)

  // 完成/终止
  if ([TaskStatus.CLOSE, TaskStatus.COMPLETED, TaskStatus.TERMINATED].includes(taskStatus)) {
    return 'grey-time'
  }
  else if (timestamp > endTime) {
    return 'red-time'
  }
  else if (hoursDifference < 3) {
    return 'yellow-time'
  }
  else {
    return 'default-time'
  }
}

/**
 * 将给定的文本截断以适应指定的宽度。
 * 如果文本长度超过宽度，则在末尾添加省略号。
 *
 * @param {string} text - 需要截断的文本。
 * @param {number} width - 截断后的最大宽度。
 * @returns {string} - 截断后的文本。
 */
export function truncateText(text: string, width: number): string {
  const ellipsis = '…'
  if (getTextWidth(text) <= width)
    return text // 如果文本宽度不超过指定宽度，则返回原文本

  let truncatedText = ''

  // 遍历文本中的每个字符
  for (const char of text) {
    // const charWidth = getTextWidth(char)

    // 检查添加当前字符和省略号后是否超过宽度
    if (getTextWidth(truncatedText + char) <= width)
      truncatedText += char
    else
      break
  }

  return truncatedText + ellipsis
}

// 获取文本宽度
export function getTextWidth(text: string, increment: number = 0, fontSize = 14): number {
  const canvas = document.createElement('canvas')
  const context: any = canvas.getContext('2d')
  context.font = `${fontSize}px sans-serif` // 设置字体大小和字体样式
  const metrics = context.measureText(text)
  return increment > 0 ? metrics.width + increment : metrics.width
}

// 获取节点文本宽度
export function getNodeTextWidth(text: string, fontSize = 14): number {
  const canvas = document.createElement('canvas')
  const context: any = canvas.getContext('2d')
  context.font = `${fontSize}px sans-serif` // 设置字体大小和字体样式
  context.letterSpacing = '0.04em'
  const metrics = context.measureText(text)
  return metrics.width
}

export function splitList(list: any[], _parentWidth: number): [string[], string[]] {
  let contentWidth = 0
  const windowWidth = window.innerWidth
  const maxWidth = windowWidth < 1440 ? 390 : windowWidth >= 1440 && windowWidth <= 1920 ? 560 : 960
  // 计算内容的宽度总和
  for (const item of list)
    contentWidth += getTextWidth(item.tagName, 35)

  if (contentWidth <= maxWidth) {
    // 如果内容宽度总和小于等于总宽度，则返回原数组
    return [list, []]
  }
  else {
    let currentWidth = 0
    let splitIndex = 0

    // 找到拆分点的索引，使得拆分后的内容宽度总和尽可能接近总宽度
    for (let i = 0; i < list.length; i++) {
      currentWidth += getTextWidth(list[i].tagName, 35)
      if (currentWidth > maxWidth) {
        splitIndex = i
        break
      }
    }

    // 拆分数组
    const firstArray = list.slice(0, splitIndex)
    const secondArray = list.slice(splitIndex)
    return [firstArray, secondArray]
  }
}

/** 断言函数 */
export function assert(expression: any, message?: string) {
  if (!expression)
    throw new Error(message || 'Expression assertion failed')
}

/** 等待条件满足函数 */
export async function waitUntil(
  condition: () => boolean,
  args: {
    timeout?: number
    interval?: number
  } = {},
): Promise<void> {
  const timeout = args.timeout ? args.timeout : 0
  const interval = args.interval ? args.interval : 50
  let waitHandler: any
  let timeoutHandler: any
  return new Promise<void>((resolve, reject) => {
    const waitFn = function () {
      if (condition()) {
        if (timeoutHandler)
          clearTimeout(timeoutHandler)
        resolve()
      }
      else {
        waitHandler = setTimeout(waitFn, interval)
      }
    }
    waitHandler = setTimeout(waitFn, interval)
    if (timeout > 0) {
      const timeoutFn = function () {
        if (waitHandler)
          clearTimeout(waitHandler)
        reject({ code: 'TIMEOUT', message: 'timeout' })
      }
      timeoutHandler = setTimeout(timeoutFn, timeout)
    }
  })
}

/** 获取文件md5 */
export async function getFileMd5(file: File): Promise<string | Int32Array | undefined> {
  const buffer = await file.arrayBuffer()
  const input = new Uint8Array(buffer)
  const md5 = new Md5()
  md5.appendByteArray(input)
  return md5.end()
}

/**
 *
 * @param array 接受一个对象数组、一个属性名和一个比对值，然后检查数组中是否存在具有匹配属性值的对象。如果找到匹配的对象，则返回 true；否则，返回 false
 * @param propertyName 属性名
 * @param compareValue 比对值
 * @returns Boolean
 */
export function findObjectWithProperty<T extends Record<string, any>>(
  array: T[],
  propertyName: string,
  compareValue: any,
): boolean {
  // 检查数组中是否有对象的属性与给定的比对值匹配
  const filterList = array.filter(item => item[propertyName] === compareValue.trim())
  return filterList.length > 0
}

// 获取当前节点是否延期
export function getIsDelay(completeAt: any): boolean {
  const currentTimestamp = Math.floor(new Date().getTime() / 1000)
  if (completeAt === '0')
    return false

  return currentTimestamp > Number(completeAt)
}

/**
 * @description 判断一个对象里面的所有值是不是都是空，排除指定的key
 * @param obj 传入对象
 * @param excludeKeys 排除的key
 */
export function isEmptyObjectByExclude(obj: any, excludeKeys: string[] = []): boolean {
  // 定义一个函数来检查一个值是否为空
  function isEmpty(value: any): boolean {
    return (
      value === null
      || value === undefined
      || (typeof value === 'string' && value.trim() === '')
      || (Array.isArray(value) && value.length === 0)
      || (typeof value === 'object' && Object.keys(value).length === 0)
    )
  }

  // 递归检查对象的所有属性
  function checkProperties(obj: any): boolean {
    for (const key in obj) {
      if (excludeKeys.includes(key)) {
        // 如果key在排除列表中，则不检查
        continue
      }
      const value = obj[key]
      if (typeof value === 'object' || Array.isArray(value)) {
        // 如果是对象，递归检查
        if (!checkProperties(value))
          return false
      }
      else if (!isEmpty(value)) {
        // 如果不是空值，返回false
        return false
      }
    }
    return true
  }

  return checkProperties(obj)
}

// 检查两个数组是否相等
export function areArraysEqual<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length)
    return false

  for (const key in array1) {
    if (!array2.includes(array1[key]))
      return false
  }
  return true
  // return array1.every((value, index) => value === array2[index])
}

// 比较两个数组的差异
export function compareArrays(raw: string[], now: string[]): { add: string[], remove: string[] } {
  const add: string[] = now.filter(item => !raw.includes(item))
  const remove: string[] = raw.filter(item => !now.includes(item))
  return { add, remove }
}

// 获取时区
export function getBrowserTimeZoneAbbreviation() {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZoneName: 'short',
  })
  const formatted = formatter.formatToParts(new Date())
  const timeZonePart = formatted.find(part => part.type === 'timeZoneName')
  return timeZonePart?.value
}

export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength))

  return result
}

export function changeFavicon(link: string) {
  let $favicon: any = document.querySelector('link[rel="icon"]')
  if ($favicon !== null) {
    $favicon.href = link
  }
  else {
    $favicon = document.createElement('link')
    $favicon.rel = 'icon'
    $favicon.href = link
    document.head.appendChild($favicon)
  }
}

// 随机生成 n 位密码
export function generatePassword(length: number = 8): string {
  const password = Array.from({ length }, () => {
    let char
    do
      char = String.fromCharCode(Math.floor(Math.random() * 94) + 33) // ASCII 33-126 范围内的字符
    while (!/[\w!@#$%^&*()+\-=[\]{};':"\\|,.<>/?]/.test(char)) // 确保字符是允许的
    return char
  }).join('')

  return password
}

export function generateNumberPassword(length: number = 8): string {
  let password = ''
  for (let i = 0; i < length; i++)
    password += Math.floor(Math.random() * 10)

  return password
}

/**
 * 根据 文件尺寸 和 单位 获取格式化文件大小
 * @param attach 文件尺寸
 * @param unit 单位： KB|MB|GB
 * @returns string
 */
export function fileSizeFormat(attach: string, unit: string) {
  let size
  switch (unit) {
    case 'MB':
      size = Number.parseFloat(attach) * 1024
      break
    case 'GB':
      size = Number.parseFloat(attach) * 1024 * 1024
      break
    default:
      size = Number.parseFloat(attach)
  }
  if (Number.isNaN(size))
    return ''

  let newSize = size
  let newUnit = 'KB'
  if (size >= 1024 * 1024) {
    newSize = size / (1024 * 1024)
    newUnit = 'GB'
  }
  else if (size >= 1024) {
    newSize = size / 1024
    newUnit = 'MB'
  }

  return newSize.toString().replace(/(\d+\.\d)\d*/, '$1').replace(/\.0$/, '') + newUnit
}
