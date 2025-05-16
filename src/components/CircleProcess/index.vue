<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref, shallowReactive, watch } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0,
  },
  progressVal: {
    type: Number,
    default: 0,
  },
})

const progressVal = ref(0)
watch(
  () => props.progress,
  (newVal) => {
    progressVal.value = newVal
  },
  {
    immediate: true,
  },
)

const curIndex = ref(0)
function getTxt(val: number) {
  // 异常
  if (props.progressVal >= 40) {
    curIndex.value = 4
    return '异常'
  }
  if (val >= 0 && val <= 59) {
    curIndex.value = 0
    return '一般'
  }
  else if (val >= 60 && val <= 79) {
    curIndex.value = 1
    return '健康'
  }
  else if (val >= 80 && val <= 94) {
    curIndex.value = 2
    return '良好'
  }
  else if (val >= 95 && val <= 100) {
    curIndex.value = 3
    return '优秀'
  }
}

const colorArr = [
  {
    color1: '#F57B1D',
    color2: '#FFAB6B',
    title: '一般',
  },
  {
    color1: '#13BED1',
    color2: '#5AE5F4',
    title: '健康',
  },
  {
    color1: '#1D74F5',
    color2: '#6BA7FF',
    title: '良好',
  },
  {
    color1: '#2EBC90',
    color2: '#48DC96',
    title: '优秀',
  },
  {
    color1: '#F55A1D',
    color2: '#FF875F',
    title: '异常',
  },
]

const colorArr2 = [
  {
    color1: '#F69B55',
    color2: '#FFCFAA',
    title: '一般',
  },
  {
    color1: '#52D5E4',
    color2: '#87EEF9',
    title: '健康',
  },
  {
    color1: '#5193F4',
    color2: '#98C0FC',
    title: '良好',
  },
  {
    color1: '#5DC5A5',
    color2: '#7BE2B1',
    title: '优秀',
  },
  {
    color1: '#F9743F',
    color2: '#FFAC90',
    title: '异常',
  },
]

const isOver = ref(true)
function handleMouseOver() {
  isOver.value = false
}

function handleMouseOut() {
  isOver.value = true
}
</script>

<template>
  <div
    class="circle-process flex-row-center"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <svg width="192" height="112">
      <linearGradient v-if="isOver" id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" :style="{ stopColor: colorArr[curIndex].color1, stopOpacity: 1 }" />
        <stop offset="30%" :style="{ stopColor: colorArr[curIndex].color2, stopOpacity: 1 }" />
      </linearGradient>

      <linearGradient v-else id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" :style="{ stopColor: colorArr2[curIndex].color1, stopOpacity: 1 }" />
        <stop offset="30%" :style="{ stopColor: colorArr2[curIndex].color2, stopOpacity: 1 }" />
      </linearGradient>

      <circle
        cx="96"
        cy="85"
        r="64"
        stroke="#edeef0"
        stroke-width="9"
        fill="none"
        stroke-dasharray="201"
        stroke-dashoffset="-201"
        stroke-linecap="round"
      />
      <circle
        v-if="progressVal > 0"
        cx="96"
        cy="85"
        r="64"
        stroke="url(#gradientId)"
        class="progress-circle"
        stroke-width="12"
        fill="none"
        :stroke-dasharray="`${progressVal * 2} ${201}`"
        stroke-dashoffset="-201"
        stroke-linecap="round"
      />
    </svg>
    <div class="text flex-column-center">
      <p class="pfm icon-color text16">
        {{ getTxt(progressVal) }}
      </p>
      <span class="minor-color text13">项目进度 {{ progressVal }}%</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.circle-process {
  position: relative;
  cursor: pointer;
  transform: translateX(-10px);
  .text {
    width: 128px;
    position: absolute;
    left: 50%;
    bottom: 20px;
    transform: translate(-50%, 0%);
  }
}
</style>
