<script lang="ts" setup>
import { h, reactive, ref } from 'vue'
import { SvgIcon } from '@/components/SvgIcon'

interface Props {
  isOpen: boolean
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emits = defineEmits(['onSuccess', 'onReset'])
const verifyRef = ref()
const sliderRef = ref()
const btnRef = ref()
const verifyData = reactive<{
  isVerified: boolean
  text: string
  startX: number
  isDragging: boolean
  btnBorderWidth: number
}>({
  // 是否验证通过
  isVerified: false,
  // 提示文字
  text: '请按住滑块，拖动到最右边验证',
  // 滑块起始位置
  startX: 0,
  // 是否在拖动滑块
  isDragging: false,
  btnBorderWidth: 4,
})

function rangeMove(event: MouseEvent | TouchEvent) {
  if (verifyData.isVerified)
    return

  // 阻止默认行为和事件冒泡
  event.preventDefault()
  event.stopPropagation()

  const touchEvent = 'touches' in event ? event.touches[0] : event
  verifyData.startX = touchEvent.clientX
  verifyData.isDragging = true

  document.addEventListener('touchmove', startMove, { passive: false })
  document.addEventListener('touchend', stopMove, { passive: false })
}

function startMove(event: MouseEvent | TouchEvent) {
  if (verifyData.isDragging) {
    event.preventDefault()
    event.stopPropagation()

    const touchEvent = 'touches' in event ? event.touches[0] : event
    const offset = touchEvent.clientX - verifyData.startX
    const containerWidth = verifyRef.value?.clientWidth
    const btnWidth = btnRef.value?.offsetWidth
    const maxOffset = containerWidth - btnWidth - verifyData.btnBorderWidth
    const normalizedOffset = Math.max(0, Math.min(offset, maxOffset))

    sliderRef.value.style.width = `${normalizedOffset + btnWidth}px`
    btnRef.value.style.left = `${normalizedOffset}px`

    if (normalizedOffset >= maxOffset) {
      verifyData.isVerified = true
      verifyData.text = '验证通过'
      stopMove()
      emits('onSuccess')
    }
  }
}

function stopMove() {
  verifyData.isDragging = false

  document.removeEventListener('touchmove', startMove)
  document.removeEventListener('touchend', stopMove)

  if (!verifyData.isVerified) {
    btnRef.value.style.left = '0px'
    sliderRef.value.style.width = `${btnRef.value?.offsetWidth}px`
  }
}

// 重置验证状态
function resetStatu() {
  verifyData.isVerified = false
  verifyData.text = '请按住滑块，拖动到最右边验证'
  btnRef.value.style.left = '0px'
  sliderRef.value.style.width = `${btnRef.value?.offsetWidth}px`
  emits('onReset')
}

// 动态渲染拖动图标
function renderIcon() {
  const iconProps = {
    name: verifyData.isVerified ? 'verify-success' : 'verify-arrow',
    size: verifyData.isVerified ? 16 : 20,
    color: verifyData.isVerified ? '#08C479' : '#999',
  }

  return h(SvgIcon, iconProps)
}

defineExpose({
  resetStatu,
})
</script>

<template>
  <div
    ref="verifyRef"
    class="verify-box flex-row-end"
    :class="{ 'slide-success': verifyData.isVerified }"
  >
    <div ref="sliderRef" class="slider">
      <div
        ref="btnRef"
        class="btn flex-row-center select-none"
        @touchstart="rangeMove"
        @mousedown.left="rangeMove"
      >
        <component :is="renderIcon" />
      </div>
    </div>
    <p class="text mr37">
      {{ verifyData.text }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.verify-box {
  width: 100%;
  height: 44px;
  background: #f7f8fa;
  border-radius: $login-input-radius;
  position: relative;
  margin-bottom: 24px;
  .slider {
    width: 40px;
    height: 40px;
    left: 2px;
    top: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 6px;
    position: absolute;
    background: #fff;
    .btn {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 4px;
      z-index: 1;
      background: #fff;
      border: 1px solid $color-border-main;
      box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.06);
      cursor: pointer;
    }
  }
  .text {
    font-size: 14px;
    color: #999999;
    user-select: none;
    text-align: center;
    width: 100%;
    transform: translateX(40px);
    -webkit-user-select: none;
  }
  &.slide-success {
    .text {
      color: #08c479;
      transform: translateX(0px);
    }
  }
}
</style>
