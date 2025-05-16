// import { default_random_color, preset_flow_color, preset_status_color } from './constant'
import { default_random_color } from './constant'

// 预设任务流程颜色
const preset_flow_color: { [key: string]: string } = {
  设计: '#FFE6C4', // 设计
  需求: '#D6F1F7', // 需求
  Bug: '#FFD4D1', // bug
  走查: '#FAE4FA', // 走查
}

// 预设任务状态颜色
const preset_status_color: { [key: string]: string } = {
  进行中: '#D4E5FF', // 进行中
  已完成: '#CCF3CC', // 已完成
  已终止: '#E6E7EB', // 已终止
  测试中: '#FAE4FA', // 测试中
  验收中: '#D6F1F7', // 验收中
  待确认: '#FFE6C4', // 待确认
  已关闭: '#E6E7EB', // 已关闭
  已重启: '#E6E7EB', // 已重启
  策划中: '#D4E5FF', // 策划中
  设计中: '#F1E5F9', // 设计中
}

const preset_priority_color: { [key: string]: string } = {
  P0: '#FFD4D1',
  P1: '#FFE6C4',
  P2: '#E0FAD9',
  P3: '#D6F1F7',
  P4: '#FAE4FA',
  P5: '#F9F0D5',
  P6: '#F0E8FF',
  P7: '#FAE4F3',
  P8: '#DFF7F2',
  P9: '#E9F7DF',
  待定: '#DBEAFF',
  暂定: '#E6E7EB',
}

export function getBadgeColor(name: string): string {
  const colors = { ...preset_flow_color, ...preset_status_color, ...preset_priority_color }
  const randomColor = default_random_color
  // 检查 key 是否在预设颜色中
  if (Object.prototype.hasOwnProperty.call(colors, name)) {
    return colors[name]
  }
  const id = simpleHash(name)
  // 如果不在预设颜色中，使用 id 对 11 取模获取颜色
  const colorIndex = Number(id) % 11
  return randomColor[colorIndex]
}

function simpleHash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
