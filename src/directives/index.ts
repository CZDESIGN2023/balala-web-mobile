import type { App, DirectiveBinding } from 'vue'

/**
 * 将指令挂载到元素上，并添加输入事件监听器进行输入值的验证。
 * 如果输入值不符合正则表达式的规则，则清空输入值。
 */
// const inputlimitDirective = {
//   mounted(el: HTMLElement) {
//     el.addEventListener('input', (event: any) => {
//       const inputValue = event?.target.value
//       const regex = /^\d+$/

//       if (!regex.test(inputValue)) {
//         event.target.value = ''
//         return
//       }
//       if (inputValue > 100)
//         event.target.value = 100
//     })
//   },
// }

const inputlimitDirective = {
  mounted(el: HTMLElement, binding: any) {
    el.addEventListener('input', (event: any) => {
      const inputValue = event.target.value
      const regex = /^\d+$/
      const limit = binding.value || 100 // 获取传递给指令的参数

      if (!regex.test(inputValue)) {
        event.target.value = ''
        return
      }
      if (inputValue > limit)
        event.target.value = limit
    })
  },
}

// 点击外部事件
const clickOutside = {
  clickOutsideEvents: new WeakMap<HTMLElement, EventListener>(),
  mounted(el: any, binding: DirectiveBinding) {
    const clickOutsideEvent = (event: MouseEvent) => {
      if (!(el === (event.target as HTMLElement) || el.contains(event.target as HTMLElement)))
        binding.value(event, el)
    }

    el.clickOutsideEvent = clickOutsideEvent
    document.addEventListener('click', clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}

// 自动聚焦
const focus = {
  mounted: (el: HTMLElement) => el.focus(),
}

export function setupCommonDirectives(app: App) {
  app.directive('input-limit', inputlimitDirective)
  app.directive('click-outside', clickOutside)
  app.directive('focus', focus)
}
