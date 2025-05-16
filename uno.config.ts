// uno.config.ts
import { defineConfig, transformerDirectives } from 'unocss'

/**
 * 使用说明：
 * 1. template 中使用类名
 * 2. css 中:
 *   - --uno: text-primary bg-primary 使用属性
 *   - @apply text-primary bg-primary 使用属性
 *   - theme('colors.primary') 使用值
 */

const directionMap = {
  t: 'top',
  r: 'right',
  b: 'bottom',
  l: 'left',
}

function createDirectionalStyle(property, dir, num) {
  const direction = directionMap[dir]
  return { [`${property}-${direction}`]: `${num}px` }
}

const gray = {
  94: '#EDEEF0',
}
export default defineConfig({
  transformers: [
    transformerDirectives(),
  ],
  rules: [
    [/^w([.\d]+)$/, ([_, num]) => ({ width: `${num}px` })],
    [/^maxw([.\d]+)$/, ([_, num]) => ({ 'max-width': `${num}px` })],
    [/^maxwi([.\d]+)$/, ([_, num]) => ({ 'max-width': `${num}px !important` })],
    [/^h([.\d]+)$/, ([_, num]) => ({ height: `${num}px` })],
    [/^m([trbl])([.\d]+)$/, ([_, dir, num]) => createDirectionalStyle('margin', dir, num)],
    [/^mx([.\d]+)$/, ([_, num]) => ({ 'margin-left': `${num}px`, 'margin-right': `${num}px` })],
    [/^p([trbl])([.\d]+)$/, ([_, dir, num]) => createDirectionalStyle('padding', dir, num)],
    [/^p([.\d]+)$/, ([_, num]) => ({ padding: `${num}px` })],
    [/^px([.\d]+)$/, ([_, num]) => ({ 'padding-left': `${num}px`, 'padding-right': `${num}px` })],
    [/^py([.\d]+)$/, ([_, num]) => ({ 'padding-top': `${num}px`, 'padding-bottom': `${num}px` })],
    [/^text([.\d]+)$/, ([_, num]) => ({ 'font-size': `${num}px` })],
    [/^line([.\d]+)$/, ([_, num]) => ({ 'line-height': `${num}px` })],
    [/^gap([.\d]+)$/, ([_, num]) => ({ gap: `${num}px` })],
    [/^br([.\d]+)$/, ([_, num]) => ({ 'border-radius': `${num}px` })],
    [/^ty([.\d]+)$/, ([_, num]) => ({ transform: `translateY(+ ${num}px)` })],
  ],
  theme: {
    fontFamily: {
      bold: 'CustomFont-Medium',
    },
    colors: {
      'primary': '#1D74F5', // 主色、蓝色
      'danger': '#fd4c4c', // 错误文字
      'warning': '#ff9800', // 提示文字

      // 灰色
      'gray-900': '#1a1a1a', // 标题文字
      'gray-800': '#333333', // 重要文字、icon
      'gray-700': '#666666', // 主要文字 1
      'gray-600': '#808080', // 主要文字 2
      'gray-500': '#999999', // 次要文字
      'gray-400': '#bfbfbf', // 弱文字

      // 蓝色
      'blue-700': '#1D74F5',
    },
    borderColor: {
      'primary': '#1D74F5', // 主色、蓝色

      'gray-88': '#DCDDE0',
      'gray-90': '#E3E4E5',
      'gray-92': '#E8E9EB',
      'gray-94': gray['94'],
      'gray-96': '#F2F3F5',
      'gray-97': '#F4F5F7',
      'gray-98': '#F7F8FA',
      'gray-99': '#F9FAFC',

      // selected hover active
      'selected': 'rgba(29, 116, 245, 0.08)',
      'hover': 'rgba(24, 62, 118, 0.03)',
      'active': 'rgba(24, 62, 118, 0.06)',
    },
    backgroundColor: {
      // 功能色
      'primary': '#1D74F5', // 主色、蓝色
      'danger': '#FD4C4C', // 失败、红色
      'success': '#08C479', // 成功、绿色
      'warning': '#FF9800', // 提示、橙色

      'gray-90': '#E3E4E5',
      'gray-94': gray['94'],
      'gray-98': '#F7F8FA',
      'gray-96': '#F2F3F5',

      'gray-input': '#f7f8fa', // 填充色/输入框
      'gray-input-hover': '#f1f4f7', // 填充色/输入框

      'blue-600': '#0F87FF',
      'blue-700': '#1D74F5',

      // selected hover active
      'selected': 'rgba(29, 116, 245, 0.08)',
      'hover': 'rgba(24, 62, 118, 0.03)',
      'active': 'rgba(24, 62, 118, 0.06)',
    },
    boxShadow: {
      'level1': '0px 4px 24px 0px rgba(12, 20, 33, 0.01), 0px 4px 4px 0px rgba(12, 20, 33, 0.02)',
      'level2': '0px 0px 0px 0px rgba(12, 20, 33, 0.02), 0px 128px 80px 0px rgba(12, 20, 33, 0.02), 0px 72px 72px 0px rgba(12, 20, 33, 0.02), 0px 16px 40px 0px rgba(12, 20, 33, 0.02)',
      'dialog1': '0px 4px 24px 0px rgba(12, 20, 33, 0.01),0px 4px 4px 0px rgba(12, 20, 33, 0.02)',
      'form-border': '0 0 0 2px #bbdfff, 0 0 0 1px #0096ff inset',
      'form-border-error': '0 0 0 2px #FFCDD2, 0 0 0 1px #FD4C4C inset',
      'medium': '0px 8px 24px 0px rgba(0, 0, 0, 0.04),0px 4px 4px 0px rgba(0, 0, 0, 0.02)',
    },
  },
})
