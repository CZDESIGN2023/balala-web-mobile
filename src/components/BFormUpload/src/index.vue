<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue'
import { type UploadChangeParam, type UploadProps, message } from 'ant-design-vue'
import { useUserStore } from '@/stores/modules/user'
import { convertTrafficUnit, fileSizeFormat, getAssetsFile, getConfigDomain, getFileIcon, getPicIcon } from '@/utils'
import { editWorkFile, getdownloadFile, getdownloadFileToken } from '@/api/project'
import { ConfigKey } from '@/enum'

defineOptions({ name: 'BFormUpload' })

const props = withDefaults(defineProps<Props>(), {
  icon: 'upload',
  // title: '点击上传或拖拽文件到这',
  title: '点击上传',
  desc: '支持任意类型文件，最多上传 50 份，单份文件大小不超过 2.0GB',
  limit: 50,
  multiple: true,
  drag: true,
  spaceId: '',
  workItemId: '',
  value: () => [],
  taskMode: false,
  status: '0',
  disabled: false,
  isReadonly: false,
})

const emits = defineEmits(['onUpload', 'onUploadFile', 'onRemoveFile', 'onChangeFile'])

interface File {
  createdAt: string
  fileInfoId: string
  fileName: string
  fileUri: string
  id: string
  spaceId: string
  fileSize: string
}

interface Props {
  icon?: string
  title?: string
  desc?: string
  limit?: number
  multiple?: boolean
  drag?: boolean
  spaceId?: string
  workItemId?: string
  value?: File[]
  taskMode?: boolean
  status?: string
  disabled?: boolean
  isReadonly?: boolean
}

const userStore = useUserStore()
const deleteDialogVisible = ref<boolean>(false)

const uploadFileList = ref<UploadProps['fileList']>([])
const headers = { Authorization: `Bearer ${userStore.token}` }
const action = computed(() => {
  return `${import.meta.env.VITE_API_URL}/file/upload?scene=space_file&sub_scene=attach&spaceId=${props.spaceId || ''}`
})
const deleteTitle = ref('是否确认删除附件？')
const currentFile = ref<any>({})
const currentActions = ref<any>()
const deleteMode = ref('')
const previewVisible = ref(false)
const previewVideoVisible = ref(false)
const previewImage = ref('')
const previewVideo = ref('')
const previewTitle = ref('')

// 判断鼠标是否在区域内
const dragEnter = ref<boolean>(false)
const uploadRef = ref<HTMLDivElement>()

const view = inject('view', false)

const fileSize = computed(() => {
  let attachObj = null
  try {
    attachObj = JSON.parse(getConfigDomain(ConfigKey.ATTACH))
  }
  catch (error) {
    attachObj = {
      value: 100,
      unit: 'MB',
    }
  }
  return attachObj
})

// 文件状态改变时
function handleChange({ file, fileList }: UploadChangeParam) {
  uploadFileList.value = fileList
  if (file.status === 'done') {
    if (props.taskMode) {
      if (Object.prototype.toString.call(file.response) === '[object Object]') {
        const ids = [String(file.response[file.name].id)]
        // emits('onChangeFile', ids, 'add')
        handleEditFile(ids, 'add')
      }
    }
  }
}

async function beforeUpload(file: any) {
  await userStore.getConfig()
  if (fileSize.value === null)
    return
  const maxSize = fileSize.value.value // {value: 300, unit: 'mb'}
  const units: any = {
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  }
  const unit: any = fileSize.value.unit.toLowerCase()
  const maxSizeInBytes = maxSize * (units[unit] || 0) // 将单位转换为字节

  const isSizeValid = file.size <= maxSizeInBytes
  if (!isSizeValid)
    message.error('文件大小超过限制', 2)

  return isSizeValid
}

// 移除文件
function deleteFile(actions: any, file: any) {
  if (props.taskMode && file.status === 'done') {
    deleteTitle.value = '是否确认删除附件？'
    deleteMode.value = 'single'
    currentFile.value = file
    currentActions.value = actions
    deleteDialogVisible.value = true
  }
  else {
    actions.remove()
  }
}

// 下载文件
async function downloadFile(file: any) {
  let fileId = ''
  if (Object.prototype.toString.call(file.response) === '[object Object]')
    fileId = String(file.response[file.name].id)
  else
    fileId = file.fileInfoId

  const res: any = await getdownloadFileToken('space_file', file.spaceId, props.workItemId, fileId)
  const filename: any = await getdownloadFile('space_file', res.data)
  const fileURL = window.URL.createObjectURL(new Blob([filename]))
  const fileLink = document.createElement('a')
  fileLink.href = fileURL
  fileLink.setAttribute('download', file.name)
  document.body.appendChild(fileLink)
  fileLink.click()
}

// 清空
function clearAll() {
  if (props.taskMode) {
    deleteTitle.value = '是否确认清空所有附件？'
    deleteMode.value = 'multiple'
    deleteDialogVisible.value = true
  }
  else {
    uploadFileList.value = []
  }
}

// 确认删除
function confirmDelete() {
  if (deleteMode.value === 'single') {
    // 删除单个
    if (props.taskMode) {
      if (currentFile.value.response) {
        if (Object.prototype.toString.call(currentFile.value.response) === '[object Object]') {
          const ids = [String(currentFile.value.response[currentFile.value.name].id)]
          handleEditFile(ids, 'remove')
        }
      }
      else {
        const ids = [String(currentFile.value.fileInfoId)]
        handleEditFile(ids, 'remove')
      }
    }
  }
  else {
    // 清空
    if (props.taskMode) {
      const list: any[]
        = uploadFileList.value?.map((item: any) => {
          if (item.status === 'done') {
            if (Object.prototype.toString.call(item.response) === '[object Object]')
              return String(item.response[item.name]?.id)
            else
              return String(item?.fileInfoId)
          }
        }) || []
      handleEditFile(list, 'remove')
    }
    else {
      uploadFileList.value = []
    }
  }
  deleteDialogVisible.value = false
}

async function handleEditFile(list: string[], type: string) {
  const newList = list.filter(item => item) // 过滤无效的文件
  const file = type === 'add' ? { add: newList } : { remove: newList }
  if (newList.length > 0)
    await editWorkFile(props.spaceId || '', props.workItemId || '', file)
  if (type === 'remove' && deleteMode.value === 'single')
    currentActions.value.remove()
  else if (type === 'remove' && deleteMode.value === 'multiple')
    uploadFileList.value = []

  message.success(type === 'add' ? '附件上传成功' : '附件移除成功', 2)
}

// 预览
async function previewImg(file: any) {
  const isVideo = formatIcon(file.name) === 'video' && file.status
  const isImage = formatIcon(file.name, true) === 'pic' && file.status

  if (!isVideo && !isImage) {
    message.warning('该附件不支持预览', 2)
    return
  }

  let fileURL: any = ''
  if (Object.prototype.toString.call(file.response) === '[object Object]') {
    const fileUri = file.response[file.name].uri
    const link = `${getConfigDomain('space.file.domain')}${fileUri}`
    fileURL = link
  }
  else {
    const link = `${getConfigDomain('space.file.domain')}${file.url}`
    fileURL = link
  }

  if (isVideo) {
    previewVideo.value = fileURL
    previewVideoVisible.value = true
  }

  if (isImage) {
    previewImage.value = fileURL
    previewVisible.value = true
    previewTitle.value = getFileName(file)
  }
}

function getFileName(file: any) {
  return file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
}

function handleCancel() {
  previewVisible.value = false
  previewVideoVisible.value = false
  previewTitle.value = ''
}

// 鼠标拖入
function dragover(e: DragEvent) {
  if (e)
    dragEnter.value = true
}

// 鼠标移出
function dragleave(e: DragEvent) {
  if (e)
    dragEnter.value = false
}

// function dragend(e: DragEvent) {
//   dragEnter.value = false
// }

// 处理名字和后缀
function formatName(file: any) {
  let name = ''
  if (Object.prototype.toString.call(file.response) === '[object Object]')
    name = file.response[file.name]?.name || ''
  else
    name = file.name

  const prefix = name.replace(/\.[^/.]+$/, '')
  const suffix = name.match(/\.[^.]+$/g)?.[0]
  return {
    prefix,
    suffix,
  }
}

// 获取图标
function formatIcon(name: string, isImage: boolean = false) {
  const fix = name.substring(name.lastIndexOf('.') + 1)
  if (isImage)
    return getPicIcon(fix)

  return getFileIcon(fix)
}

watch(
  uploadFileList,
  (newVal) => {
    if (newVal) {
      const list: string[] = []
      newVal.forEach((item: any) => {
        if (item.status === 'done') {
          if (Object.prototype.toString.call(item.response) === '[object Object]') {
            if (String(item.response[item.name]?.id))
              list.push(String(item.response[item.name]?.id))
          }
        }
      })
      // if (list.length > 0)
      emits('onUpload', list)
    }
  },
  {
    deep: true,
    immediate: true,
  },
)

watch(
  props,
  (newVal) => {
    if (newVal.value) {
      if (newVal.value.length > 0) {
        uploadFileList.value = newVal.value.map((item) => {
          return {
            uid: item.id,
            name: item.fileName,
            status: 'done',
            size: Number(item.fileSize),
            spaceId: item.spaceId,
            fileInfoId: item.fileInfoId,
            url: item.fileUri,
          }
        })
      }
    }
  },
  {
    deep: true,
    immediate: true,
  },
)

defineExpose({
  clearAll,
})
</script>

<template>
  <div
    id="b-form-upload"
    ref="uploadRef"
    class="b-form-upload transition"
    :class="{ 'dragstatu': dragEnter, isReadonly, 'b-form-upoload-view': view }"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="dragleave"
  >
    <a-upload-dragger
      v-model:fileList="uploadFileList"
      class="upload-box"
      :class="{ hide: uploadFileList?.length === 0 }"
      name="files"
      :multiple="multiple"
      :max-count="limit"
      :action="action"
      :before-upload="beforeUpload"
      :headers="headers"
      @change="handleChange"
    >
      <svg-icon :name="icon" size="24" color="#1D74F5" class="flex-shrink-0" style="vertical-align: bottom !important;" />
      <p class="title text12 line12 title-color pfm-smoothing mt8">
        {{ title }}
      </p>
      <p v-if="dragEnter" class="text12 line12 primary-color">
        松手开始上传
      </p>
      <!-- <p v-else class="desc text12 minor-color font-smoothing leading-normal">
        支持任意类型文件，最多上传 50 份，单份文件大小不超过 {{ fileSizeFormat(fileSize.value, fileSize.unit) }}
      </p> -->
      <div
        v-if="uploadFileList && uploadFileList?.length > 0"
        class="clear-container bar h43 flex-row-between mt30 cursor-d"
        @click.stop=""
      >
        <p class="text12 minor-color font-smoothing">
          已上传文件：<span class="icon-color">{{ uploadFileList?.length }} 份</span>
        </p>
        <p
          v-if="!['2', '3', '8'].includes(status) && !disabled"
          class="text12 primary-color pointer font-smoothing"
          @click="clearAll"
        >
          清空
        </p>
      </div>
      <template #itemRender="{ file, actions }">
        <div class="file-item flex" @click="previewImg(file)">
          <div class="icon preview-icon flex-shrink-0 flex-row-center pointer">
            <img :src="getAssetsFile(`${formatIcon(file.name)}.svg`)" alt="">
          </div>
          <div class="info flex-one">
            <div class="name text14 line24 flex">
              <p class="ss-line-1  icon-color pfm-smoothing">
                {{ formatName(file)?.prefix }}
              </p>
              <p class="icon-color pfm-smoothing">
                {{ formatName(file)?.suffix }}
              </p>
            </div>
            <div class="bot flex gap5">
              <template v-if="file.status === 'done'">
                <div class="flex-row-start gap5">
                  <template v-if="!file.spaceId">
                    <img src="@/assets/svg/success.svg" alt="">
                    <p class="statu-text font-smoothing">
                      上传完成
                    </p>
                  </template>
                  <p class="size font-smoothing ml3">
                    {{ convertTrafficUnit(file.size) }}
                  </p>
                </div>
              </template>
              <template v-if="file.status === 'uploading'">
                <div class="progress">
                  <el-progress
                    :percentage="file.percent"
                    :stroke-width="4"
                    color="#08C479"
                    :show-text="false"
                  />
                </div>
                <p>
                  {{ convertTrafficUnit(file.size * (file.percent / 100)) }}/{{
                    convertTrafficUnit(file.size)
                  }}
                </p>
              </template>
              <template v-if="file.status === 'error' || !file.status">
                <div class="flex-row-start gap5">
                  <img class="w14" src="@/assets/svg/error.svg" alt="">
                  <p class="statu-text font-smoothing">
                    上传失败
                  </p>
                  <p class="size font-smoothing ml3">
                    {{ convertTrafficUnit(file.size) }}
                  </p>
                </div>
              </template>
            </div>
          </div>
          <div v-if="file.status !== 'uploading'" class="tool flex-shrink-0 gap4">
            <div v-if="file.fileInfoId" class="w24 h24 tool-item" @click.stop="downloadFile(file)">
              <svg-icon
                name="download"
                class="pointer download-icon"
                size="16"
                color="#999999"
              />
            </div>
            <div
              v-if="!['2', '3', '8'].includes(status) && !disabled"
              class="w24 h24 tool-item delete-item"
              @click.stop="deleteFile(actions, file)"
            >
              <svg-icon
                name="delete"
                class="pointer"
                size="16"
                color="#999999"
              />
            </div>
          </div>
        </div>
      </template>
    </a-upload-dragger>
    <!-- 删除二次确认 -->
    <b-dialog
      v-model:dialogVisible="deleteDialogVisible"
      width="360px"
      title-icon="warning.svg"
      :title="deleteTitle"
      confirm-btn-color="danger"
      confirm-btn-text="删除"
      @on-confirm="confirmDelete"
    />
    <a-modal
      :open="Boolean(previewVisible && previewImage)"
      :title="previewTitle"
      :footer="null"
      width="40%"
      @cancel="handleCancel"
    >
      <img alt="example" style="width: 100%" :src="previewImage">
    </a-modal>
    <a-modal wrap-class-name="video-modal" :open="previewVideoVisible && previewVideo" :footer="null" width="40%" @cancel="handleCancel">
      <video class="video-player" controls :src="previewVideo" />
    </a-modal>
  </div>
</template>

<style lang="scss">
.b-form-upload {
  width: 100%;
  position: relative;
  &.isReadonly {
    cursor: not-allowed;
    div {
      pointer-events: none;
      .download-icon {
        pointer-events: all;
        cursor: pointer;
      }
    }
    .bar {
      pointer-events: all;
    }
    .ant-upload-list {
      pointer-events: all;
      cursor: default;
      div {
        pointer-events: all;
      }
    }
  }
  &.b-form-upoload-view {
    .ant-upload-drag {
      position: relative;
      background-color: white !important;
    }
  }
  .upload-box {
    width: 100%;
    height: 100%;
    .el-upload-list {
      width: 320px;
    }
    .ant-upload {
      width: 100%;
      height: 100%;
      .ant-upload-btn {
        padding: 0;
        display: flex;
        align-items: center;
        flex-flow: column;
        justify-content: center;
      }
    }
    .ant-upload-drag {
      border: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 70px;
      border-radius: 6px;
      padding: 13px 12px;
      gap: 8px;
      background: $color-input;
      border: 1px dashed $color-border-main;
      &:hover {
        border-color: #edeef0;
      }
      &:active {
        background: rgba(29, 116, 245, 0.08);
        border: 1px dashed $color-primary;
      }
    }
    .ant-upload-list {
      padding-top: 44px;
      .ant-upload-list-item-container {
        margin-bottom: 16px;
      }
    }
    .file-item {
      height: 60px;
      border-radius: 8px;
      padding: 12px;
      gap: 12px;
      background: $color-input;
      position: relative;
      &:hover {
        cursor: pointer;
        background: $color-input-hover;
      }
      .icon {
        width: 35px;
        height: 100%;
        pointer-events: all;
      }
      .info {
        .name {
          max-width: calc(100% - 60px);
          p {
            max-width: 160px;
          }
        }
        .bot {
          height: 12px;
          align-items: center;
          margin-top: 4px;
          .progress {
            width: 94px;
            height: 4px;
            position: relative;
            .el-progress {
              position: static;
              .el-progress-bar__outer {
                background-color: rgba(0, 0, 0, 0.08);
              }
            }
            .el-progress--line {
              width: 100%;
            }
          }
          p {
            font-size: 12px;
            color: #9e9e9e;
          }
        }
      }
      .tool {
        position: absolute;
        right: 12px;
        top: 12px;
        display: flex;
        .tool-item {
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            .svg-icon {
              use {
                fill: $color-main;
              }
            }
          }
        }
        .delete-item {
          &:hover {
            .svg-icon {
              use {
                fill: #fd4c4c;
              }
            }
          }
        }
      }
    }
    &.hide {
      .ant-upload-list {
        padding-top: 0;
      }
    }
  }
  &.dragstatu {
    .ant-upload-drag {
      background: rgba(29, 116, 245, 0.08);
      border: 1px dashed $color-primary;
    }
  }
  .clear-container {
    position: absolute;
    top: 10.2vw;
    width: 100%;
  }
}
.video-player {
  width: 100%;
}
.video-modal {
  .ant-modal-close {
    .ant-modal-close-x {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    background: rgba(0, 0, 0, 0.4);
    .anticon svg {
      width: 12px;
      height: 12px;
      fill: #fff;
    }
    &:hover {
      background: rgba(0, 0, 0, 0.6);
    }
  }
}
</style>

<style lang="scss" scoped>
.cursor-d {
  cursor: default;
}
</style>
