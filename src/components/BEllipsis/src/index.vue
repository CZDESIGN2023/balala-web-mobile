<!-- 文本省略，悬浮显示全部 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { escapeHTML } from '@/utils/dom'

defineOptions({ name: 'BEllipsis' })

const props = withDefaults(defineProps<Props>(), {
  // 内容
  content: '',
  // 显示宽度
  width: '100%',
  // 字体大小
  fs: '14',
  // 字体样式
  contentClass: '',
  // 父级样式
  parentClass: '',
  // 父级偏移宽度
  offsetWidth: 1,
  ellipsis: false,
  chinese: false,
  highlight: '',
})

// const emit = defineEmits(['mouseOverBack'])

interface Props {
  content?: string
  fs?: string
  spanStyle?: {
    [key: string]: string
  }
  contentClass?: string
  parentClass?: string
  offsetWidth?: number
  ellipsis?: false
  chinese?: false
  highlight?: string
}

// 使用isShow来控制tooltip是否显示
const ellipsisRef = ref()

const text = computed(() => {
  const content = props.ellipsis ? '...' : escapeHTML(props.content)
  if (!props.highlight)
    return content
  return content.replace(new RegExp(props.highlight, 'g'), `<span style='color: #1D74F5'>${props.highlight}</span>`)
})

// function isShowTooltip(e: MouseEvent) {
//   const chineseWidth = props.content.length * Number.parseFloat(props.fs) * 1.02
//   if (((props.chinese ? chineseWidth : ellipsisRef.value.scrollWidth) > ellipsisRef.value.clientWidth || props.ellipsis) && e.currentTarget) {
//     emit('mouseOverBack', e)
//   }
//   else {
//     emit('mouseOverBack', {
//       currentTarget: {
//         getBoundingClientRect() {
//           return {}
//         },
//       },
//     })
//   }
// }
</script>

<template>
  <div
    ref="ellipsisRef"
    class="content"
    :class="parentClass"
    :style="{ fontSize: /vw$/.test(fs) ? fs : `${fs}px` }"
  >
    <!-- @mouseover="isShowTooltip" -->

    <span :class="contentClass" :style="spanStyle" v-html="text" />
  </div>
</template>

<style lang="scss" scoped>
.content {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  /* 修复safari被选中, 必须加webkit */
  user-select: none;
  -webkit-user-select: none;

  span {
    user-select: auto;
    -webkit-user-select: auto;
    white-space: pre;
  }
}

:global(.tool-width) {
  max-width: 297px !important;
}

:global(.tool-width .ant-tooltip-inner) {
  padding: 9.5px 12px !important;
}
</style>
