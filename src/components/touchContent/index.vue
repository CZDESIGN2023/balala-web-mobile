<script lang="ts" setup>
import { ref } from 'vue'
import { throttle } from '@/utils'

const props = defineProps({
  direction: {
    type: String,
    default: 'left',
  },
})

const emit = defineEmits(['onSwiper'])

const startX = ref(0)
const startY = ref(0)
const isVerticalSwipe = ref(false)

const confirmDialog = throttle(() => {
  emit('onSwiper')
}, 1000)

function handleTouchStart(event: TouchEvent) {
  startX.value = event.touches[0].clientX
  startY.value = event.touches[0].clientY
  isVerticalSwipe.value = false
}

function handleTouchMove(event: TouchEvent) {
  if (event.touches.length > 1)
    return

  const touch = event.touches[0]
  const moveX = touch.clientX
  const moveY = touch.clientY

  // 判断是否是垂直滑动
  if (!isVerticalSwipe.value) {
    const distanceX = Math.abs(moveX - startX.value)
    const distanceY = Math.abs(moveY - startY.value)

    // 如果垂直滑动的距离大于水平滑动的距离，则认为是垂直滑动
    if (distanceY > distanceX) {
      isVerticalSwipe.value = true
    }
  }

  // 如果是垂直滑动，则不处理
  if (isVerticalSwipe.value)
    return

  // 阻止默认事件，例如滚动
  event.preventDefault()

  // 根据滑动方向判断是否触发滑动事件
  if ((props.direction === 'left' && moveX < startX.value) || (props.direction === 'right' && moveX > startX.value)) {
    confirmDialog()
  }
}
function handleTouchEnd() {
  startX.value = 0
  startY.value = 0
  isVerticalSwipe.value = false
}
</script>

<template>
  <div
    class="touch-content"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <slot />
  </div>
</template>
