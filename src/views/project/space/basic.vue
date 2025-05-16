<script lang="ts" setup>
import { inject, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import BasicWeekday from './components/basicWeekday.vue'
import router from '@/router'
import { useProjectStore } from '@/stores/modules/project'
import {
  deleteProject,
  editProjectDescribe,
  getProjectInfo,
  setProjectCommentDeletable,
  setProjectName,
  setProjectNotify,
  setProjectWorkingDay,
} from '@/api/project'
import type { ProjectInfoData } from '@/api/interface'
import { getTextLength } from '@/utils'
import { Perm } from '@/enum/permission'
import { usePermission } from '@/hooks/usePermission'
import { useUserStore } from '@/stores/modules/user'
import { testUserWidthProject } from '@/mixins/condition'
import { useSpaceStore } from '@/stores/modules/space'

const emits = defineEmits(['handleLoading'])
/** STORE */
const projectStore = useProjectStore()
const spaceStore = useSpaceStore()
const loadingEnd = ref<boolean>(false)
const leaveSpace: Function = inject('leaveSpace') as Function
const { checkPerm } = usePermission()

/** DATA */
const spaceNameRef = ref() // 项目名称DOM
const spaceInfo = ref<ProjectInfoData>() // 项目基本信息
const spaceName = ref<string>('') // 项目名称
const describe = ref<string>('') // 项目描述
const checkedNotify = ref<number>(0) // 通知是否打开
const checkedComment = ref<number>(0) // 评论功能是否打开
const spaceNamePlaceholder = ref<string>('给项目起一个好名字') // 空间名称 placeholder
const spaceWorkingDay = ref<number[]>([]) // 工作日数组
const popVisible = ref<boolean>(false) // 修改工作日弹框
const spaceNameFocused = ref<boolean>(false)
const removeDialog: {
  // 删除弹框数据
  visible: boolean
  checked: boolean
  spaceName: string
} = reactive({
  visible: false,
  checked: false,
  spaceName: '',
})
// 获取项目基本信息
async function getInfo(isShowLoading: boolean = false) {
  try {
    if (isShowLoading)
      emits('handleLoading', true)
    if (router.currentRoute.value) {
      const { data } = await getProjectInfo({ spaceId: router.currentRoute.value.params.id as string })
      if (data) {
        setTimeout(() => {
          emits('handleLoading', false)
          loadingEnd.value = true
          spaceInfo.value = data
          checkedNotify.value = Number(data.notify)
          checkedComment.value = Number(data.commentDeletable)
          spaceName.value = data.spaceName as string
          spaceStore.setUserStatus(Number(data.roleId))
          spaceWorkingDay.value = JSON.parse(data.workingDay as string) || []
        }, 400)
      }
    }
  }
  catch (err) {
    loadingEnd.value = true
    emits('handleLoading', false)
  }
}

// 获取描述信息
function getContent(content: string) {
  describe.value = content
}

function editorBlur(describe: string) {
  // 修改信息
  editProjectDesc(describe)
}

// 修改项目描述
async function editProjectDesc(describe: string) {
  if (describe === spaceInfo.value?.describe)
    return
  try {
    await editProjectDescribe({
      spaceId: spaceInfo.value?.id,
      describe,
    })
    message.success('项目描述修改成功')
  }
  finally {
    // emits('onUpdate', 'describe')
    getInfo()
  }
}

// 项目名称失去焦点
function spaceNameBlur() {
  const length = getTextLength(spaceName.value.trim())
  // const isError = !(length >= 2 && length <= 20)
  spaceNameFocused.value = false
  // const reg = /^[a-zA-Z0-9\u4E00-\u9FA5_]+$/
  if (spaceName.value === spaceInfo.value?.spaceName)
    return
  if (length === 0) {
    message.error('项目名称不能为空', 3)
    spaceName.value = spaceInfo.value?.spaceName as string
    return
  }
  // || !reg.test(spaceName.value)
  // if (isError) {
  //   const msg = length ? '请输入 2 ~ 20个字符' : '项目名称不能为空'
  //   message.error(msg, 2)
  //   spaceName.value = spaceInfo.value?.spaceName as string
  //   return
  // }
  editSpaceName()
}

function spaceNameFocus() {
  spaceNamePlaceholder.value = '请输入项目名称'
  spaceNameFocused.value = true
}

// 修改项目名称
async function editSpaceName() {
  try {
    await setProjectName(spaceInfo.value?.id as string, spaceName.value.trim())
    message.success('项目名称修改成功', 3)
    getInfo()
  }
  catch (error) {
    spaceName.value = spaceInfo.value?.spaceName as string
  }
}

// 项目名称按下回车
function spaceNamePressEnter() {
  spaceNameRef.value?.blur()
}

// 修改项目通知是否打开
async function setNotify(spaceId: string, notify: number) {
  try {
    await setProjectNotify(spaceId, notify)
    message.success(notify === 0 ? '消息推送已关闭' : '消息推送已开启', 3)
  }
  catch (error) {}
}

// 修改项目评论是否开启
async function setComment(spaceId: string, commentDeletable: number) {
  try {
    await setProjectCommentDeletable(spaceId, commentDeletable)
    message.success(commentDeletable === 0 ? '评论删除已关闭' : '评论删除已开启', 3)
  }
  catch (error) {}
}

// 修改工作日
async function onChangeWorkingDay(weekDays: number[]) {
  try {
    await setProjectWorkingDay(spaceInfo.value?.id || '', weekDays)
    message.success('工作日周期修改成功', 3)
    popVisible.value = false
    getInfo()
  }
  catch (error) {}
}

// 请求删除项目接口
async function confirmDelete() {
  if (removeDialog.spaceName === '') {
    message.error('请输入项目名称', 3)
    return
  }
  else if (removeDialog.spaceName !== spaceInfo.value?.spaceName) {
    message.error('项目名称输入错误', 3)
    return
  }
  else if (!removeDialog.checked) {
    message.error('请确认已知悉删除项目的风险', 3)
    return
  }
  try {
    await deleteProject(spaceInfo.value?.id || '', removeDialog.spaceName)
    message.success('项目删除成功', 3)
    router.push('/')
    await projectStore.getList()
  }
  catch (error) {}
}

// 取消删除项目
function cancelDelete() {
  removeDialog.spaceName = ''
  removeDialog.checked = false
}

// 离开项目
async function handleLeaveSpace() {
  const { userInfo } = useUserStore()
  const spaceId = spaceInfo.value?.id as string
  const r = await testUserWidthProject(spaceId, userInfo.id, userInfo.userNickname)
  if (r) {
    return
  }

  leaveSpace && leaveSpace()
}

onMounted(() => {
  getInfo(true)
})
</script>

<template>
  <div v-if="loadingEnd" class="project-space-basic pt8">
    <div class="cell">
      <div class="h42 text14 icon-color flex-row-start pfm">
        项目名称
      </div>
      <a-input
        ref="spaceNameRef"
        v-model:value="spaceName"
        :disabled="!checkPerm(Perm.ModifySpaceName)"
        allow-clear
        class="gray-input"
        :class="{ 'not-focused': !spaceNameFocused }"
        :placeholder="spaceNamePlaceholder"
        @focus="spaceNameFocus"
        @blur="spaceNameBlur"
        @press-enter="spaceNamePressEnter"
      >
        <template #clearIcon>
          <el-tooltip effect="dark" placement="top" :show-after="100" content="清空">
            <img class="delete-icon w16" src="@/assets/svg/input-close.svg">
          </el-tooltip>
        </template>
      </a-input>
    </div>
    <div class="cell mt20">
      <div class="h42 text14 icon-color flex-row-start pfm">
        项目描述
      </div>
      <div class="editor-box">
        <b-editor
          v-if="spaceInfo?.id"
          mode="spaceBasic"
          :mode-key="`spaceBasic${spaceInfo?.id}`"
          :value="spaceInfo?.describe"
          :space-id="spaceInfo?.id"
          :readonly="!checkPerm(Perm.ModifySpaceDesc)"
          type="space-basic-editor"
          placeholder="知识库就像书一样,让多篇文档结构化,方便知识的创作与沉淀"
          read-content="知识库就像书一样,让多篇文档结构化,方便知识的创作与沉淀"
          :min-height="120"
          :max-height="480"
          @get-content="getContent"
          @editor-blur="editorBlur"
        />
      </div>
    </div>
    <div class="cell mt32">
      <div class="h32 text14 icon-color flex-row-start pfm">
        消息推送
      </div>
      <div class="h32 flex-row-between text13 minor-color">
        {{
          checkedNotify
            ? '通知已打开，项目成员将会收到当前项目产生的通知'
            : '通知已关闭，项目成员将不会收到当前项目产生的通知'
        }}
        <a-switch
          v-model:checked="checkedNotify"
          :disabled="!checkPerm(Perm.ModifySpaceNotify)"
          :checked-value="1"
          :un-checked-value="0"
          class="ml8 checked-notify"
          size="small"
          @change="setNotify(spaceInfo?.id as string, checkedNotify)"
        />
      </div>
    </div>
    <div class="cell mt32">
      <div class="h32 text14 icon-color flex-row-start pfm">
        评论配置
      </div>
      <div class="h32 flex-row-between text13 minor-color">
        {{
          checkedComment
            ? '开启时, 当前项目任务评论支持删除'
            : '关闭时, 当前项目任务评论不可删除'
        }}
        <a-switch
          v-model:checked="checkedComment"
          :disabled="!checkPerm(Perm.ModifySpaceComment)"
          :checked-value="1"
          :un-checked-value="0"
          class="ml8 checked-notify"
          size="small"
          @change="setComment(spaceInfo?.id as string, checkedComment)"
        />
      </div>
    </div>
    <div class="cell mt32">
      <div class="h32 text14 icon-color flex-row-between pfm">
        工作日周期
        <a-popover
          v-model:open="popVisible"
          :align="{
            offset: [0, -5],
          }"
          overlay-class-name="space-weekday-popover"
          placement="bottomRight"
          destroy-tooltip-on-hide
          trigger="click"
        >
          <a-button v-if="checkPerm(Perm.ModifySpaceWorkingDay)" class="space-btn w81 h32">
            修改设置
          </a-button>
          <template #content>
            <div class="top h24 flex-row-between mb24">
              <p class="text16 title-color pfm">
                修改工作日周期
              </p>
              <span class="close-icon pointer" @click="popVisible = false">
                <svg-icon name="filter-close" color="#666666" size="16" />
              </span>
            </div>
            <BasicWeekday
              v-if="spaceWorkingDay.length > 0"
              :is-edit="true"
              :working-day="spaceWorkingDay"
              @on-change="onChangeWorkingDay"
              @on-cancel-change="popVisible = false"
            />
          </template>
        </a-popover>
      </div>
      <p class="h32 flex-row-start text14 minor-color">
        任务状态将会根据工作日时间进行计算
      </p>
      <div class="weekday-box mt8 flex-row-start">
        <BasicWeekday
          v-if="spaceWorkingDay.length > 0"
          :working-day="spaceWorkingDay"
        />
      </div>
    </div>
    <div class="bottom flex-row-end">
      <a-button
        v-if="checkPerm(Perm.DeleteSpace)"
        class="space-btn delete-btn w106 text14"
        @click="removeDialog.visible = true"
      >
        <svg-icon class="mr4" name="delete-line" size="14" color="#FD4C4C" />
        删除项目
      </a-button>
      <a-button v-else-if="checkPerm(Perm.QuitSpace)" class="space-btn w88" @click="handleLeaveSpace">
        离开项目
      </a-button>
    </div>
  </div>

  <!-- 删除项目弹框 -->
  <b-dialog
    v-model:dialogVisible="removeDialog.visible"
    width="480px"
    confirm-btn-text="删除"
    title="是否确认删除项目？"
    confirm-btn-color="danger"
    title-icon="warning.svg"
    @on-confirm="confirmDelete"
    @on-cancel="cancelDelete"
  >
    <div class="delete-dialog-main">
      <p class="desc text14 icon-color mb16">
        1. 点击“删除”后，该项目的所有管理员将收到项目删除的消息。<br>
        2.
        删除后，该项目的所有数据将不可访问，且不可恢复，其中，关联该项目其他数据/链接也将自动清除关联值，链接将不可访问。
      </p>
      <a-input
        v-model:value="removeDialog.spaceName"
        class="gray-input"
        placeholder="输入项目名称"
      />
      <div class="agree text14 minor-color mt4 el-checkobx-label-color">
        <el-checkbox v-model="removeDialog.checked" size="large">
          我已知悉删除项目的风险
        </el-checkbox>
      </div>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
.gray-input {
  &.not-focused {
    padding: 0 0 0 0 !important;
    :deep(.ant-input) {
      padding-left: 12px !important;
      border-radius: 6px;
    }
    :deep(.ant-input-suffix) {
      display: none;
    }
  }
  :deep(.ant-input) {
    padding-left: 0 !important;
    border-radius: 6px;
  }
}
.project-space-basic {
  padding-top: 8px;
  padding-bottom: 104px;
  .bottom {
    width: 100%;
    height: 80px;
    padding: 16px 24px;
    border-width: 1px 0px 0px 0px;
    border-style: solid;
    border-color: $color-border-main;
    background: #fff;
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 999;
  }
}
.checked-notify {
  background: $color-border-main;
  min-width: 30px;
  height: 18px;
  line-height: 18px;
  :deep(.ant-switch-handle) {
    width: 14px;
    height: 14px;
  }
  &:hover {
    background: $color-border-main;
  }
  &.ant-switch-checked {
    background: $color-primary;
    :deep(.ant-switch-handle) {
      inset-inline-start: calc(100% - 16px);
    }
  }
}

.space-btn {
  height: 32px;
  border-radius: 4px;
  display: flex;
  // flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border: 1px solid $color-border-main;
  font-size: 14px;
  color: $color-title;
  &:hover {
    color: $color-title;
    background: $color-default-hover;
    border: 1px solid transparent;
  }
  &:active {
    background: $color-default-active;
  }
  &.delete-btn {
    color: #fd4c4c;
    border: 1px solid $color-border-main;
    display: flex;
    align-items: center;
    padding: 0;
    &:hover {
      background: $color-bg-hover;
      border: 1px solid transparent;
    }
  }
}
</style>

<style lang="scss">
.space-weekday-popover {
  width: calc(100% - 30px) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  .ant-popover-inner {
    padding: 16px;
  }
  .btn {
    width: 60px;
    height: 32px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: $color-title;
    &:hover {
      color: $color-title;
    }

    &.cancel {
      border: 1px solid $color-border-main;
    }
    &.confirm {
      background: $color-primary;
      color: #fff;
      margin-left: 12px;
      border: 1px solid $color-primary;
    }
  }
}
</style>
