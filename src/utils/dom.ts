
import type { CSSProperties } from 'vue'

export function getParentElementByClass(dom: HTMLElement, className: string) {
  const currentClassName = dom.parentElement?.className
  const exist = typeof currentClassName === 'string' ? currentClassName.includes(className) : false
  if (exist)
    return dom.parentElement
  else if (dom.parentElement?.parentElement)
    return getParentElementByClass(dom.parentElement, className)
  else
    return null
}



export function disableScrollFromElement(element: HTMLElement): ScrollState[] {
  const scrollStates: ScrollState[] = []

  while (element) {
    const overflowY = window.getComputedStyle(element).overflowY
    const overflowX = window.getComputedStyle(element).overflowX

    if (overflowY === 'scroll' || overflowY === 'auto' || overflowX === 'scroll' || overflowX === 'auto') {
      scrollStates.push({
        element,
        overflowX,
        overflowY,
      })
      element.style.overflowY = 'hidden'
      element.style.overflowX = 'hidden'
    }
    element = element.parentElement as HTMLElement
  }

  return scrollStates
}

// 方法2/2：恢复滚动状态
export function restoreScrollState(scrollStates: ScrollState[]): void {
  scrollStates.forEach(({ element, overflowX, overflowY }) => {
    element.style.overflowY = overflowY
    element.style.overflowX = overflowX
  })
}
// 方法: 1/2 添加CSS规则

export function addCSSRules(rules: [string, CSSProperties][]): HTMLStyleElement {
  const styleSheet: HTMLStyleElement = document.createElement('style')
  styleSheet.type = 'text/css'
  document.head.appendChild(styleSheet)

  const sheet: CSSStyleSheet = styleSheet.sheet as CSSStyleSheet

  rules.forEach(([selector, properties]) => {
    const cssText = Object.entries(properties)
      .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
      .join(' ')

    if (sheet.insertRule) {
      sheet.insertRule(`${selector} { ${cssText} }`, sheet.cssRules.length)
    }
    else if ((sheet as any).addRule) {
      (sheet as any).addRule(selector, cssText)
    }
  })

  return styleSheet
}

// 方法: 2/2 删除CSS规则
export function removeCSSRules(styleSheet: HTMLStyleElement, rules?: [string, string][]): void {
  const sheet: CSSStyleSheet = styleSheet.sheet as CSSStyleSheet
  const cssRules: CSSRuleList = sheet.cssRules || (sheet as any).rules

  if (rules) {
    rules.forEach(([selector]) => {
      for (let i = 0; i < cssRules.length; i++) {
        const rule = cssRules[i] as CSSStyleRule
        if (rule.selectorText === selector) {
          sheet.deleteRule(i)
          break
        }
      }
    })
  }
  else {
    // 删除所有规则
    while (sheet.cssRules.length > 0) {
      sheet.deleteRule(0)
    }
  }

  // 删除样式表
  document.head.removeChild(styleSheet)
}

export function getElementOrParentWithClass(dom: HTMLElement, className: string): HTMLElement | null {
  // 首先检查当前元素是否包含指定的类名
  if (dom.classList.contains(className)) {
    return dom
  }
  // 如果当前元素不包含，则递归检查父元素
  const parent = dom.parentElement
  if (parent) {
    return getParentElementByClass(parent, className)
  }
  // 如果没有找到包含指定类名的元素，则返回null
  return null
}
/**
 * 将字符串中的尖括号、引号、& 移除，简单解决 xss 问题
 * @param str strin
 * @returns string
 */
export function escapeHTML(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 定义一个类型来存储滚动状态
export interface ScrollState {
  element: HTMLElement
  overflowX: string
  overflowY: string
}
