<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { changeSystemConfig } from '@/api/user'
import { useUserStore } from '@/stores/modules/user'
import { changeFavicon, fileSizeFormat, getConfigDomain, getTextLength } from '@/utils'
import { ConfigKey } from '@/enum'
import router from '@/router'

const defaultLogo = import.meta.env.VITE_LOGO_URL
const unitList = ['KB', 'MB', 'GB']
const userStore = useUserStore()
const siteTitleRef = ref()
const siteDomainRef = ref()
const attachRef = ref()
const logoCropperRef = ref()
const bgCropperRef = ref()
const state = reactive({
  registerSwitchStatu: false,
  siteTitle: '',
  siteLogo: '',
  siteDomain: '',
  unit: 'MB',
  titleErrorTip: '',
  domainErrorTip: '',
  showLogoCropper: false,
  showBgCropper: false,
  file: null,
  attach: '',
  attachErrorTip: '',
  showAttachPopover: false,
  showUnitPopover: false,
  attachData: {
    value: '',
    unit: 'MB',
  },
  fileType: '',
})

const attachText = computed(() => fileSizeFormat(state.attachData.value, state.attachData.unit))

// 网站 logo 选择文件
function handleFileChange(fileType: string) {
  state.fileType = fileType
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', '.jpg, .png, .jpeg')
  input.onchange = function (e: any) {
    const file = e.target.files[0]
    state.file = file
    if (fileType === 'logo')
      state.showLogoCropper = true

    if (fileType === 'bg')
      state.showBgCropper = true
  }
  input.click()
}

// 保存 logo
function onSaveImg(fileuri: string) {
  if (!fileuri)
    return
  if (state.fileType === 'logo') {
    changeSystemConfig(ConfigKey.LOGO, fileuri).then(async () => {
      getSystemData()
      onCloseImgCropper()
      message.success('网站LOGO更换成功', 3)
    }).finally(() => {
      logoCropperRef.value?.setLoading(false)
    })
  }
  if (state.fileType === 'bg') {
    changeSystemConfig(ConfigKey.BG, fileuri).then(async () => {
      getSystemData()
      onCloseImgCropper()
      message.success('登录背景更换成功', 3)
    }).finally(() => {
      bgCropperRef.value?.setLoading(false)
    })
  }
}

// 监听网站标题输入框失去焦点
function onSiteTitleBlur(e: FocusEvent) {
  const target = e.target as HTMLInputElement
  const length = getTextLength(target.value)
  const isError = !(length >= 2 && length <= 80)
  if (getConfigDomain(ConfigKey.TITLE) === target.value.trim()) {
    state.siteTitle = getConfigDomain(ConfigKey.TITLE)
    state.titleErrorTip = ''
    return
  }
  if (length === 0) {
    state.titleErrorTip = '网站标题不能为空'
    return
  }
  if (isError) {
    state.titleErrorTip = '请输入有效格式(2 ~ 80个字符)'
    return
  }

  // 修改网站标题
  changeSystemConfig(ConfigKey.TITLE, target.value.trim()).then(async () => {
    getSystemData()
    message.success('网站标题更新成功', 3)
  })
  state.titleErrorTip = ''
}

function onSiteTitleEnter() {
  siteTitleRef.value.blur()
}

// 监听网站访问地址输入框失去焦点
function onSiteDomainBlur(e: FocusEvent) {
  const target = e.target as HTMLInputElement
  const domain = getConfigDomain(ConfigKey.NOTIFY_REDIRECT_DOMAIN)
  // if (!target.value) {
  //   state.domainErrorTip = '访问地址不能为空'
  //   return
  // }

  if (domain === target.value.trim()) {
    state.siteDomain = domain
    state.domainErrorTip = ''
    return
  }

  // 修改网站标题
  changeSystemConfig(ConfigKey.NOTIFY_REDIRECT_DOMAIN, target.value.trim()).then(async () => {
    getSystemData()
    message.success('访问地址更新成功', 3)
  })
  state.domainErrorTip = ''
}

function onSiteDomainEnter() {
  siteDomainRef.value.blur()
}

// 修改注册开关状态
function changeRegisterSwitchStatu() {
  const value = state.registerSwitchStatu ? '1' : '0'
  changeSystemConfig(ConfigKey.REGISTER_ENTRY, value).then(async () => {
    getSystemData()
    message.success(value === '1' ? '注册功能已开启' : '注册功能已关闭', 3)
  })
}

// 监听附件大小输入框输入
function handleAttachInput() {
  // 移除开头的0
  const attach = (state.attach as string).replace(/^0+/, '')

  // 如果结果为空或者不是有效的数字，则设置为默认值''
  if (attach === '' || !/^\d+$/.test(attach)) {
    state.attach = ''
  }
  else {
    // 将字符串转换为数字
    const numAttach = Number(attach)
    // 如果数值在1到99999之间，则允许，否则限制为99999
    state.attach = numAttach > 99999 ? '99999' : numAttach.toString()
  }
}

// 监听附件大小输入框失去焦点
function handleAttachBlur() {
  if (state.attach === '') {
    state.attachErrorTip = '附件大小不能为空'
    return
  }

  state.attachErrorTip = ''
}

// 监听附件大小输入框回车
function handleAttachEnter() {
  attachRef.value?.blur()
}

// 修改附件单位
function changeUnit(key: string) {
  state.unit = key
  state.showUnitPopover = false
}

// 保存附件大小
function onSaveAttach() {
  let attachObj = null
  try {
    attachObj = JSON.parse(getConfigDomain(ConfigKey.ATTACH))
  }
  catch (error) {
  }
  try {
    if (state.attach === '') {
      state.attachErrorTip = '附件大小不能为空'
      state.showAttachPopover = true
      return
    }
    if (attachObj && state.attach === attachObj.value && state.unit === attachObj.unit) {
      state.showAttachPopover = false
      return
    }
    const params = {
      value: state.attach,
      unit: state.unit,
    }
    changeSystemConfig(ConfigKey.ATTACH, JSON.stringify(params)).then(async () => {
      getSystemData()
      state.showAttachPopover = false
      message.success('附件大小设置完成', 3)
    })
  }
  catch (error) {
    console.log(error)
  }
}

// 获取系统配置
async function getSystemData() {
  await userStore.getConfig()

  state.siteTitle = getConfigDomain(ConfigKey.TITLE) || 'Balala'
  state.siteDomain = getConfigDomain(ConfigKey.NOTIFY_REDIRECT_DOMAIN)
  state.siteLogo = getConfigDomain(ConfigKey.LOGO)
    ? `${getConfigDomain(ConfigKey.SPACE_FILE_DOMAIN)}${getConfigDomain(ConfigKey.LOGO)}`
    : defaultLogo
  state.registerSwitchStatu = Boolean(Number(getConfigDomain(ConfigKey.REGISTER_ENTRY)))

  attachPopoverOpenChange()
  changeFavicon(state.siteLogo)
  document.title = `${router.currentRoute.value.meta.title} - ${state.siteTitle}项目管理系统 - 协作效率标准化`
}

function onCloseImgCropper() {
  state.showLogoCropper = false
  state.showBgCropper = false
  state.file = null
}

function attachPopoverOpenChange() {
  state.attachErrorTip = ''
  try {
    const attachObj = JSON.parse(getConfigDomain(ConfigKey.ATTACH))
    state.attach = attachObj.value || ''
    state.unit = attachObj.unit || 'MB'
    state.attachData = attachObj
  }
  catch (error) {
    state.attach = ''
    state.unit = 'MB'
    state.attachData = {
      value: '',
      unit: 'MB',
    }
  }
}

// 重置登录背景
function resetLoginBg() {
  changeSystemConfig(ConfigKey.BG, '').then(async () => {
    getSystemData()
    message.success('登录背景重置成功', 3)
  })
}

onMounted(() => {
  getSystemData()
})
</script>

<template>
  <div class="system-wrap">
    <div class="module basic-module">
      <p class="title pfm font-smoothing mb32">
        基础设置
      </p>
      <div class="item">
        <div class="item-head flex-row-between mb16">
          <p class="flex-row-start line14">
            网站LOGO<span class="text13 font-smoothing">设置后将应用至登录页、侧边栏、页签 Favicon</span>
          </p>
        </div>
        <div class="avatar-box pointer mb32" @click="handleFileChange('logo')">
          <div class="camera flex-row-center pointer">
            <svg-icon name="camera" size="16px" color="#333333" />
          </div>
          <img :src="state.siteLogo" alt="">
        </div>
      </div>
      <div class="item">
        <div class="item-head flex-row-between mb16">
          <p class="flex-row-start line14">
            网站标题<span class="text13 font-smoothing">设置网站 title 名，如 XXX 项目管理系统-协作效率标准化</span>
          </p>
        </div>
        <div class="w480">
          <a-input
            ref="siteTitleRef"
            v-model:value="state.siteTitle"
            class="gray-input"
            :class="state.titleErrorTip ? 'ant-input-affix-wrapper-status-error' : ''"
            placeholder="请输入网站标题"
            @blur="onSiteTitleBlur"
            @press-enter="onSiteTitleEnter"
          />
          <p
            v-if="state.titleErrorTip"
            class="error-tip mt8"
          >
            {{ state.titleErrorTip }}
          </p>
        </div>
      </div>
      <div class="item mt32">
        <div class="item-head flex-row-between mb16">
          <p class="flex-row-start line14">
            网站访问地址<span class="text13 font-smoothing">设置后将应用至：消息通知跳转</span>
          </p>
        </div>
        <div class="w480">
          <a-input
            ref="siteTitleRef"
            v-model:value="state.siteDomain"
            class="gray-input"
            :class="state.domainErrorTip ? 'ant-input-affix-wrapper-status-error' : ''"
            placeholder="请输入网站访问地址"
            @blur="onSiteDomainBlur"
            @press-enter="onSiteDomainEnter"
          />
          <p
            v-if="state.domainErrorTip"
            class="error-tip mt8"
          >
            {{ state.domainErrorTip }}
          </p>
        </div>
      </div>
      <div class="item">
        <div class="item-head flex-row-between h26 mt32">
          <p class="flex-row-start">
            登录背景<span class="text13 font-smoothing">设置网站登录背景图 (推荐 1920*1080px)</span>
          </p>
          <div class="tool gap8 flex-row-start">
            <button v-if="getConfigDomain(ConfigKey.BG)" class="link-button" @click="resetLoginBg">
              重置
            </button>
            <button class="default-button" @click="handleFileChange('bg')">
              更换
            </button>
          </div>
        </div>
      </div>
      <div class="line" />
    </div>
    <div class="module extend-module mt32">
      <p class="title pfm font-smoothing mb32">
        拓展设置
      </p>
      <div class="item">
        <div class="item-head flex-row-between mb32">
          <p class="flex-row-start line14">
            注册功能<span class="text13 font-smoothing">{{ state.registerSwitchStatu ? '开启时，登录页将开放注册功能' : '关闭时，登录页将隐藏注册功能' }}</span>
          </p>
          <div class="tool">
            <a-switch
              v-model:checked="state.registerSwitchStatu"
              class="checked-notify"
              size="small"
              @change="changeRegisterSwitchStatu"
            />
          </div>
        </div>
      </div>
      <div class="item">
        <div class="item-head flex-row-between h26">
          <p class="flex-row-start">
            附件大小<span class="text13 font-smoothing">设置任务单内允许上传单个附件文件大小</span>
          </p>
          <div class="tool">
            <span class="text13 tip mr16">当前大小：{{ attachText }}</span>
            <a-popover
              v-model:open="state.showAttachPopover"
              trigger="click"
              placement="bottomRight"
              destroy-tooltip-on-hide
              :align="{ offset: [0, 8] }"
              overlay-class-name="system-file-popover"
              :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
              @open-change="attachPopoverOpenChange"
            >
              <template #content>
                <div class="head pfm font-smoothing flex-row-between">
                  设置附件大小
                  <div class="close-icon flex-row-center pointer br4" @click="state.showAttachPopover = false">
                    <svg-icon color="#666666" name="dialog-close" size="16" />
                  </div>
                </div>

                <div class="input-box">
                  <a-input
                    ref="attachRef"
                    v-model:value="state.attach"
                    v-input-limit="99999"
                    class="gray-input"
                    destroy-tooltip-on-hide
                    :class="state.attachErrorTip ? 'ant-input-affix-wrapper-status-error' : ''"
                    placeholder="请输入 1 ~ 99999 整数"
                    :maxlength="5"
                    @blur="handleAttachBlur"
                    @change="handleAttachInput"
                    @press-enter="handleAttachEnter"
                  />
                  <a-popover
                    v-model:open="state.showUnitPopover"
                    trigger="click"
                    placement="bottomRight"
                    :align="{ offset: [13, 16] }"
                    overlay-class-name="system-attach-popover"
                    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
                  >
                    <template #content>
                      <ul class="attach-list">
                        <li v-for="item in unitList" :key="item" :class="{ active: item === state.unit }" @click="changeUnit(item)">
                          {{ item }} <svg-icon name="gou" size="16" color="#1d74f5" />
                        </li>
                      </ul>
                    </template>
                    <div class="attach flex-row-start pointer">
                      {{ state.unit }} <svg-icon name="arrow-b-16" color="#666666" size="16" />
                    </div>
                  </a-popover>
                </div>
                <p
                  v-if="state.attachErrorTip"
                  class="error-tip mt8"
                >
                  {{ state.attachErrorTip }}
                </p>
                <div class="flex-row-end gap12 mt24">
                  <button class="default-button default" @click="state.showAttachPopover = false">
                    取消
                  </button>
                  <button class="primary-button default" @click="onSaveAttach">
                    保存
                  </button>
                </div>
              </template>
              <button class="default-button">
                设置
              </button>
            </a-popover>
          </div>
        </div>
      </div>
    </div>
  </div>
  <BImgCropper
    v-if="state.showLogoCropper"
    ref="logoCropperRef"
    :is-show="state.showLogoCropper"
    :head-info="state.file"
    mode="cover"
    title="更换网站 LOGO"
    crop-box-width="352px"
    crop-box-height="256px"
    :fixed-box="true"
    :full="false"
    :high="false"
    @on-close="onCloseImgCropper"
    @re-upload="handleFileChange('logo')"
    @on-save="onSaveImg"
  />
  <BImgCropper
    v-if="state.showBgCropper"
    ref="bgCropperRef"
    :is-show="state.showBgCropper"
    :head-info="state.file"
    title="更换登录背景"
    mode="cover"
    crop-box-width="352px"
    crop-box-height="256px"
    :auto-crop-width="1920"
    :fixed-box="false"
    :full="true"
    :fixed="true"
    :fixed-number="[16, 9]"
    @on-close="onCloseImgCropper"
    @re-upload="handleFileChange('bg')"
    @on-save="onSaveImg"
  />
</template>

<style lang="scss" scoped>
.system-wrap {
  width: 800px;
  margin: 0 auto;
  * {
    -webkit-font-smoothing: antialiased;
  }
  .module {
    .title {
      font-size: 14px;
      line-height: 14px;
      color: $color-icon;
    }
    .item {
      .item-head {
        position: relative;
        p {
          font-size: 14px;
          color: $color-icon;
          span {
            margin-left: 16px;
            color: #bfbfbf;
            font-size: 13px;
          }
        }
        .error-tip {
          color: #fd4c4c;
          font-size: 13px;
        }
        .tip {
          color: #bfbfbf;
        }
      }
      .avatar-box {
        width: 72px;
        height: 72px;
        border-radius: 8px;
        position: relative;
        .camera {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          padding: 4px;
          gap: 10px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(4px);
          right: 0;
          bottom: 0;
          transition: all 0.4s;
          z-index: 5;
          &:hover {
            background: rgba(255, 255, 255, 0.55);
          }
        }
        img {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
      }
    }
    .line {
      width: 100%;
      height: 1px;
      background: $color-border-main;
      margin-top: 32px;
    }
  }
}

.error-tip {
  font-size: 13px;
  line-height: 13px;
  color: #fd4c4c;
}

.link-button {
  width: 41px;
  height: 26px;
  border-radius: 4px;
  background: none;
  color: $color-primary;
  border: 0;
  font-size: 12px;
  cursor: pointer;
  &:hover {
    color: #0f87ff;
  }
  &:active {
    color: #2361e2;
  }
  &.default {
    width: 53px;
    height: 32px;
    font-size: 14px;
  }
}
.default-button {
  width: 41px;
  height: 26px;
  border-radius: 4px;
  background: none;
  color: $color-title;
  border: 1px solid $color-border-main;
  font-size: 12px;
  cursor: pointer;
  &:hover {
    color: $color-primary;
    border: 1px solid $color-primary;
  }
  &:active {
    color: #2361e2;
    border: 1px solid #2361e2;
  }
  &.default {
    width: 53px;
    height: 32px;
    font-size: 14px;
  }
}
.primary-button {
  width: 41px;
  height: 26px;
  border-radius: 4px;
  background: $color-primary;
  color: #fff;
  border: 1px solid $color-primary;
  font-size: 12px;
  cursor: pointer;
  &:hover {
    border: 1px solid #0f87ff;
    background: #0f87ff;
  }
  &:active {
    background: #2361e2;
    border: 1px solid #2361e2;
  }
  &.default {
    width: 53px;
    height: 32px;
    font-size: 14px;
  }
}

.checked-notify {
  background: $color-border-main;
  min-width: 24px;
  height: 14px;
  line-height: 14px;
  &:hover {
    background: $color-border-main;
  }
  :deep() {
    .ant-switch-handle {
      width: 10px;
      height: 10px;
    }
    .ant-switch-inner {
      padding-inline-start: 2px !important;
      padding-inline-end: 12px !important;
    }
  }
}

.ant-switch.ant-switch-checked {
  background: #1d74f5 !important;

  :deep() {
    .ant-switch-handle {
      inset-inline-start: calc(100% - 12px);
    }
  }
}
</style>

<style lang="scss">
.system-file-popover {
  padding-top: 0px !important;
  .ant-popover-inner {
    width: 368px;
    padding: 24px;
    border-radius: 8px;
    background: #ffffff;
    position: relative;
    border: 1px solid #f4f5f7;
    box-shadow:
      0px 0px 0px 0px rgba(12, 20, 33, 0.02),
      0px 128px 80px 0px rgba(12, 20, 33, 0.02),
      0px 72px 72px 0px rgba(12, 20, 33, 0.02),
      0px 16px 40px 0px rgba(12, 20, 33, 0.02);
    .head {
      height: 24px;
      font-size: 16px;
      margin-bottom: 24px;
      color: $color-title;
      .close-icon {
        width: 16px;
        height: 16px;
        &:hover {
          background: $color-default-hover;
        }
        &:active {
          background: $color-default-active;
        }
      }
    }
    .input-box {
      position: relative;
      .attach {
        font-size: 14px;
        color: $color-icon;
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        gap: 4px;
      }
    }
  }
}

.system-attach-popover {
  padding-top: 0px !important;
  .ant-popover-inner {
    width: 128px;
    height: 112px;
    border-radius: 8px;
    padding: 8px;
    background: #ffffff;
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow;
    .attach-list {
      li {
        width: 100%;
        height: 32px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding-left: 8px;
        padding-right: 8px;
        .svg-icon {
          display: none;
        }
        &:hover {
          background: $color-default-hover;
        }
        &:active {
          background: $color-default-active;
        }
        &.active {
          .svg-icon {
            display: block;
          }
        }
      }
    }
  }
}
</style>
