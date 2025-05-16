<!-- 修改头像 -->
<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import type { Props, State } from './types'
import { VueCropper } from '@/components/avatarCropper'
import '@/components/avatarCropper/index.css'
import { userFileUpload } from '@/api/user'

const props = withDefaults(defineProps<Props>(), {
  isShow: false,
  isPreview: false,
  headInfo: () => {},
  cropBoxWidth: '256px',
  cropBoxHeight: '256px',
  fixedNumber: () => ([1, 1]),
  autoCropWidth: 256,
  autoCropHeight: 256,
  autoCrop: true,
  fixedBox: false,
  centerBox: false,
  canScale: false,
  canMove: true,
  canMoveBox: false,
  info: false,
  full: false,
  high: true,
  mode: 'contain',
  maxImgSize: '400',
  title: '修改头像',
  width: '400px',
  fixed: false,
  enlarge: 1,
  original: false,
})
const emits = defineEmits(['onClose', 'reUpload', 'onSave'])

const cropperRef = ref()
const state = reactive<State>({
  src: '',
  isShowTip: false,
  info: {},
  dialogVisible: false,
  scaleIndex: 0,
  previews: '',
  loading: false,
})

// 点击缩放
function changeScale(num: number) {
  if (state.scaleIndex === 0 && num === -1)
    return
  num = num || 1
  cropperRef.value?.changeScale(num)
  state.scaleIndex = state.scaleIndex + num
}

// 顺时针旋转
function rotateRight() {
  cropperRef.value?.rotateRight()
}

// 预览图片/滚轮缩放
const previews = ref<string>('')
function realTime() {
  cropperRef.value?.getCropBlob((data: Blob) => {
    previews.value = window.URL.createObjectURL(data)
  })
}

// 点击保存
function onSave() {
  // const aLink = document.createElement('a')
  // aLink.download = 'demo'
  state.loading = true
  cropperRef.value?.getCropBlob((data: Blob) => {
    const file = new File([data], state.info.name, { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('files', file)
    formData.append('scene', 'avatar')
    fnUploadFiles(file, formData)
  })
}

//  修改头像
async function fnUploadFiles(file: any, formData: any) {
  const resFile: any = await userFileUpload(formData)

  const fileAvatar = resFile[file.name]

  if (fileAvatar)
    emits('onSave', fileAvatar.uri)
}

function getHeadSrc() {
  const imageUrl = URL.createObjectURL(props.headInfo)
  state.src = imageUrl
  state.isShowTip = props.headInfo.size > 5 * 1024 * 1024
  state.info = props.headInfo

  nextTick(() => {
    cropperRef.value?.$el.addEventListener('mousewheel', handleWheel) // 监听滚轮事件
  })
}

// 监听滚轮事件
function handleWheel(event: any) {
  event.preventDefault() // 防止默认滚动行为发生
  const delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail)) // 获取滚轮滚动值
  if (delta > 0) {
    // 向上滚动时的操作
    changeScale(1)
  }
  else {
    // 向下滚动时的操作
    changeScale(-1)
  }
}

function setLoading(isShow: boolean) {
  state.loading = isShow
  state.dialogVisible = isShow
}

watch(
  () => props,
  (data) => {
    state.dialogVisible = data.isShow
    if (!data.isShow)
      return
    getHeadSrc()
  },
  {
    immediate: true,
    deep: true,
  },
)

defineExpose({
  setLoading,
})
</script>

<template>
  <b-dialog
    v-model:dialogVisible="state.dialogVisible"
    :width="props.width"
    :title="props.title"
    :show-footer="false"
    @on-cancel="$emit('onClose')"
  >
    <!-- 提示 -->
    <div v-if="state.isShowTip" class="tips-box flex-row-start mb24">
      <img class="w16 mr4 ml12" src="@/assets/icon/warning-icon.png" alt="">
      图片大小不能超过 5M
    </div>

    <!-- 头像编辑 -->
    <div class="head-box mb16 mt12 flex-row-center" :style="{ width: props.cropBoxWidth }">
      <div class="vue-cropper-box" :style="{ width: `${props.autoCropWidth}px`, height: `${props.autoCropHeight}px` }">
        <VueCropper
          ref="cropperRef"
          :mode="props.mode"
          :fixed-number="props.fixedNumber"
          :auto-crop-width="props.autoCropWidth"
          :auto-crop-height="props.autoCropHeight"
          :img="state.src"
          :auto-crop="props.autoCrop"
          :fixed-box="props.fixedBox"
          :center-box="props.centerBox"
          :can-scale="props.canScale"
          :can-move="props.canMove"
          :can-move-box="props.canMoveBox"
          :info="props.info"
          :full="props.full"
          :high="props.high"
          :original="props.original"
          :fixed="props.fixed"
          :max-img-size="props.maxImgSize"
          @real-time="realTime"
        />
      </div>

      <div v-if="isPreview" class="ml24">
        <img class="head-preview" :src="previews" alt="">

        <div class="head-preview-title mt8">
          头像预览
        </div>
      </div>
    </div>

    <!-- 重新上传、放大缩小旋转 -->
    <div class="re-upload-box flex-row-between" :style="{ width: props.cropBoxWidth }">
      <div class="pointer re-upload scale-icon flex-row-center" @click="$emit('reUpload')">
        <svg-icon name="re-upload" size="16" color="#333333" />
        <span class="ml4">重新上传</span>
      </div>

      <div class="flex-row-between">
        <!-- 放大 -->
        <el-tooltip :show-after="100" effect="dark" content="放大" placement="top">
          <svg-icon
            class="pointer scale-icon"
            name="amplify"
            size="16"
            color="#666666"
            @click="changeScale(1)"
          />
        </el-tooltip>

        <!-- 缩小-禁用 -->
        <svg-icon
          v-if="state.scaleIndex === 0"
          class="mr16 ml16 no-drop"
          name="reduce"
          size="16"
          color="#BFBFBF"
        />
        <!-- 缩小-非禁用 -->
        <el-tooltip v-else :show-after="100" effect="dark" content="缩小" placement="top">
          <svg-icon
            class="mr16 ml16 pointer scale-icon"
            name="reduce"
            size="16"
            color="#666666"
            @click="changeScale(-1)"
          />
        </el-tooltip>

        <!-- 顺时针旋转 -->
        <el-tooltip :show-after="100" effect="dark" content="旋转" placement="top">
          <svg-icon
            class="pointer scale-icon"
            name="rotate"
            size="16"
            color="#333333"
            @click="rotateRight"
          />
        </el-tooltip>
      </div>
    </div>

    <div class="btn-box flex-row-end mt40 pb24">
      <a-button class="mr16" @click="$emit('onClose')">
        取消
      </a-button>
      <a-button type="primary" :loading="state.loading" :disabled="state.isShowTip" @click="onSave">
        保存
      </a-button>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.tips-box {
  width: 360px;
  height: 40px;
  border-radius: 4px;
  background: #fff3e0;
  border: 0.5px solid #ff9800;
  color: #333333;
}

.head-box {
  // width: 360px;
  background: #f5f6f7;
  border: 1px solid $color-border-main;
  display: flex;
  align-items: flex-start;

  .vue-cropper-box {
    width: 256px;
    height: 256px;

    :deep(.cropper-view-box) {
      outline: none;
    }
    :deep(.cropper-modal) {
      background: #f5f6f7;
    }
  }

  .head-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
  }

  .head-preview-title {
    color: #666666;
    text-align: center;
  }
}

.re-upload-box {
  width: 256px;
  color: #1a1a1a;
  user-select: none;

  .re-upload:hover {
    color: #1d74f5;
  }
}

.btn-box {
  :deep(.ant-btn-primary:disabled) {
    background: #f2f3f5;
    border: 0;
    color: #bfbfbf;
    border: 1px solid #f2f3f5;
  }
}

.no-drop {
  cursor: no-drop;
}
</style>

<style lang="scss">
.scale-icon {
  &:hover {
    use {
      fill: #1d74f5 !important;
    }
  }
}
</style>
