<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { getBadgeColor } from '@/utils/color'

interface Props {
  fontSize?: number
  text?: string
  keyName?: string
  xpadding?: number | string
  ypadding?: number | string
  width?: number | string
  maxWidth?: number | string
  id?: string
  bg?: string
}

const props = withDefaults(defineProps<Props>(), {
  fontSize: 10,
  text: '...',
  keyName: '',
  xpadding: 0,
  ypadding: 0,
  width: 0,
  maxWidth: 125,
  id: '',
  bg: '',
})

let tagStyles = reactive({
  fontSize: `${props.fontSize}px`,
  padding: calcTagPadding(),
  background: calcRandomColr(),
  width: calcTagWidth(),
  maxWidth: `${props.maxWidth}px`,
})

function calcRandomColr() {
  if (props.bg) {
    return props.bg
  }

  return getBadgeColor(props.text)
}

const tagStylesVw = computed({
  get: () => {
    const styles = { ...tagStyles } as any
    Object.keys(styles).forEach((key) => {
      const value = styles[key]
      if (typeof value === 'string' && value.endsWith('px')) {
        const values = value.split(' ')
        const convertedValues = values.map((val) => {
          const num = Number.parseInt(val.replace(/\D/g, ''), 10)
          return `${(num / 390) * 100}vw`
        })
        styles[key] = convertedValues.join(' ')
      }
    })
    return styles
  },
  set: (newStyles: any) => {
    tagStyles = newStyles
  },
})

function calcTagPadding() {
  if (props.width) {
    return `${props.ypadding || 0}px ${0}px`
  }
  return `${props.ypadding || 0}px ${props.xpadding || 0}px`
}

function calcTagWidth() {
  if (props.width) {
    return `${props.width}px`
  }
  return 'fit-content'
}

watchEffect(() => {
  tagStyles.fontSize = `${props.fontSize}px`
  tagStyles.padding = calcTagPadding()
  tagStyles.background = calcRandomColr()
  tagStyles.width = calcTagWidth()
  tagStyles.maxWidth = `${props.maxWidth}px`
})
</script>

<template>
  <div class="default-tag pfm" :style="tagStylesVw">
    {{ props.text }}
  </div>
</template>

<style lang="scss" scoped>
.default-tag {
  line-height: 1;
  border-radius: 4px;
  text-align: center;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
