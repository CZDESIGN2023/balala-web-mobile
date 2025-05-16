<script lang="ts" setup>
import { computed } from 'vue'
import router from '@/router'
import emptyIcon from '@/assets/icon/no-data-search.png'
import emptyTask from '@/assets/icon/no-data-task.png'
import smileIcon from '@/assets/svg/smiling.svg'

const props = defineProps({
  // svg 图片名称
  name: {
    type: String,
    default: 'smiling',
  },
  // svg 图片大小
  size: {
    type: Number,
    default: 64,
  },
  // 标题
  title: {
    type: String,
    default: '',
  },
  // 描述
  desc: {
    type: String,
    default: '',
  },
  // 描述文字颜色
  descColor: {
    type: String,
    default: '#666666',
  },
  // 按钮图标名称
  btnIconName: {
    type: String,
    default: '',
  },
  // 按钮图标尺寸
  btnIconSize: {
    type: Number,
    default: 24,
  },
  // 按钮文字
  btnText: {
    type: String,
    default: '',
  },
  // 按钮跳转地址
  btnUrl: {
    type: String,
    default: '',
  },
  // 距离头部距离
  pt: {
    type: String,
    default: '150px',
  },
  // 距离底部距离
  pb: {
    type: String,
    default: '130px',
  },
  // 是否是 svg 图片
  isSvg: {
    type: Boolean,
    default: true,
  },
  // 图片名称
  imgName: {
    type: String,
    default: '',
  },
  // 图片宽度
  imgWidth: {
    type: String,
    default: '72px',
  },
  // 图片宽度
  imgHeight: {
    type: String,
    default: '72px',
  },
  // 图标距离文字距离
  iconMb: {
    type: String,
    default: '20px',
  },
})

const imgSrc = computed(() => {
  let src = ''
  switch (props.imgName) {
    case 'no-data-search.svg':
      src = emptyIcon
      break
    case 'no-data-task':
      src = emptyTask
      break
    default:
      src = smileIcon
      break
  }
  return src
})

function handleJump() {
  router.push(props.btnUrl)
}
</script>

<template>
  <div class="b-empty flex-column-center" :style="{ paddingTop: pt, paddingBottom: pb }">
    <div v-if="imgName" class="icon" :style="{ marginBottom: iconMb }">
      <svg-icon v-if="isSvg" :name="name" :size="size" />
      <img
        v-else
        :src="imgSrc"
        :style="{ width: imgWidth, height: imgHeight }"
        alt=""
      >
    </div>
    <p v-if="title" class="title mb16">
      {{ title }}
    </p>
    <p v-if="desc" class="desc mb20 pfr" :style="{ color: descColor }">
      {{ desc }}
    </p>
    <a-button v-if="btnText" class="b-base-btn" type="primary" @click="handleJump">
      <template #icon>
        <svg-icon class="mr4" name="add" size="14" />
      </template>
      {{ btnText }}
    </a-button>
  </div>
</template>

<style lang="scss" scoped>
.b-empty {
  .title {
    font-size: 28px;
    color: $color-title;
  }
  .desc {
    font-size: 12px;
    color: $color-main;
  }
}
</style>
