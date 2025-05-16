<!-- 修改头像 -->
<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/modules/user'
import { VueCropper } from '@/components/avatarCropper'
import '@/components/avatarCropper/index.css'
import { userAvatarSet, userFileUpload } from '@/api/user'

interface Props {
  isShow: boolean
  headInfo: any
}

interface State {
  src: string
  isShowTip: boolean
  info: any
  dialogVisible: boolean
  scaleIndex: number
  previews: string
}

const props = withDefaults(defineProps<Props>(), {
  isShow: false,
  headInfo: () => {},
})
const emit = defineEmits(['onClose', 'reUpload'])

const userStore = useUserStore()

const state = reactive<State>({
  src: '',
  isShowTip: false,
  info: {},
  dialogVisible: false,
  scaleIndex: 0,
  previews: '',
})

// 点击缩放
const cropperRef = ref()
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
  const aLink = document.createElement('a')
  aLink.download = 'demo'
  // 输出
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

  if (fileAvatar) {
    const resAvatar = await userAvatarSet({
      avatar: fileAvatar.uri,
    })

    if (resAvatar.data) {
      userStore.userInfo.avatar = `${fileAvatar.uri}`
      userStore.setUserInfo(userStore.userInfo)
      message.success('头像保存成功', 2)
      emit('onClose')
    }
  }
}

function getHeadSrc() {
  const imageUrl = URL.createObjectURL(props.headInfo)
  state.src = imageUrl
  state.isShowTip = props.headInfo.size > 5 * 1000 * 1000
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
</script>

<template>
  <b-dialog
    v-model:dialogVisible="state.dialogVisible"
    width="408px"
    title="修改头像"
    class="change-head-style-cover"
    :show-footer="false"
    @on-cancel="$emit('onClose')"
  >
    <!-- 提示 -->
    <div v-if="state.isShowTip" class="tips-box flex-row-start mb24">
      <img class="w16 mr4 ml12" src="@/assets/icon/warning-icon.png" alt="">
      图片大小不能超过 5M
    </div>

    <!-- 头像编辑 -->
    <div class="head-box mb16 mt12">
      <div class="vue-cropper-box">
        <VueCropper
          ref="cropperRef"
          mode="cover"
          auto-crop-width="256"
          auto-crop-height="256"
          :img="state.src"
          :auto-crop="true"
          :fixed-box="true"
          :center-box="false"
          :can-scale="true"
          :can-move="true"
          :can-move-box="false"
          :info="false"
          @real-time="realTime"
        />
      </div>

      <div class="ml24">
        <img class="head-preview" :src="previews" alt="">

        <div class="head-preview-title mt8">
          头像预览
        </div>
      </div>
    </div>

    <!-- 重新上传、放大缩小旋转 -->
    <div class="re-upload-box flex-row-between">
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
      <a-button type="primary" :disabled="state.isShowTip" @click="onSave">
        保存
      </a-button>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.tips-box {
  width: 304px;
  height: 40px;
  border-radius: 4px;
  background: #fff3e0;
  border: 0.5px solid #ff9800;
  color: #333333;
}

.head-box {
  width: 304px;
  display: flex;
  align-items: flex-start;

  .vue-cropper-box {
    width: 200px;
    height: 200px;

    :deep(.cropper-view-box) {
      outline: none;
    }
  }

  .head-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
  }

  .head-preview-title {
    color: #666666;
    text-align: center;
  }
}

.re-upload-box {
  width: 200px;
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
.change-head-style-cover {
  // width: calc(100% - 24px);
  .cropper-crop-box {
    width: 200px !important;
    height: 200px !important;
  }
}
.scale-icon {
  &:hover {
    use {
      fill: #1d74f5 !important;
    }
  }
}
</style>
