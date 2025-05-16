/**
 * 获取弹窗应该放在 上下左右 哪个位置，弹窗支持上下自动位置，但左右不行，主要解决高度过小左右的选择
 * @param trigger 触发的dom
 * @param size 弹窗的尺寸
 * @returns ''|top|right|bottom|left: 为空表示自动位置
 */
export function getPlacement(trigger: HTMLElement, size: { height: number, width?: number }) {
  const innerHeight = window.innerHeight

  const rect = trigger.getBoundingClientRect()
  // 距离底部 = 屏幕高度 - 自身高度 - y距离
  const top = rect.y
  const right = innerHeight - rect.width - rect.x
  const bottom = innerHeight - rect.height - rect.y
  const left = rect.x
  // 当顶部和底部距离小于 值 时，面板显示在左边
  if (bottom < size.height && top < size.height) {
    if (size.width) {
      if (right > size.width)
        return 'right'
      else if (left > size.width)
        return 'left'
    }
    else {
      return 'left'
    }
  }
  return ''
}
