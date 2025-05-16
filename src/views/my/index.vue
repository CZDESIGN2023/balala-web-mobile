<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { checkEditPswTpy } from './types'
import myUser from './components/myUser.vue'
import changePsd from './components/changePsd.vue'
import changePsdAdmin from './components/changePsdAdmin.vue'
import accountCancel from './components/accountCancel.vue'
import { getMyInfo, myBind, myUnbind, setSpaceNotify } from '@/api/user'
import { useProjectStore } from '@/stores/modules/project'
import { useUserStore } from '@/stores/modules/user'
import router from '@/router'

// import imLogin from '@/views/login/components/imLogin.vue'
import { getTextLength, truncateString } from '@/utils'
import { testUserWidthProject } from '@/mixins/condition'
import { Local } from '@/utils/storage'
import { LOGIN_URL } from '@/config'
import { useNoticeStore } from '@/stores/modules/notice'

const userStore = useUserStore()
const useNotice = useNoticeStore()
const projectStore = useProjectStore()
const userInfo = computed(() => userStore.userInfo)

// 用户项目列表
const projectList = computed(() => projectStore.projectList)

const ref_leave_dialog = ref()

// 2绑定
const isBinDing = ref<boolean>(false)
const isBinDingChange = ref<boolean>(false)
const BinDingTyp = ref(0)
const dialogVisible = ref(false)
const isMoreBinDing = ref(false)

// 注销账户用
const nickName = ref('')

// 修改项目通知是否打开
async function setNotify(spaceId: string, notify: number) {
  try {
    await setSpaceNotify(spaceId, notify === 1 ? 0 : 1)
    await projectStore.getList()
    message.success(`消息推送已${notify === 0 ? '开启' : '关闭'}`, 3)
  }
  catch (error) {}
}

const isTransfer = ref<boolean>(false)
async function leaveProject(row: any) {
  isTransfer.value = row.userId === userStore.userInfo.id

  // 离开项目
  if (!isTransfer.value) {
    const { id } = row
    const r = await testUserWidthProject(id, userStore.userInfo.id, userStore.userInfo.userNickname)
    if (r) {
      return
    }
  }

  ref_leave_dialog.value.leaveShow(row)
}

function toProject(id: string) {
  router.push(`/project/${id}`)
}

// 是否显示气泡卡片
const showChangePsd = ref<boolean>(false)

onMounted(() => {
  getUserInfo()
})

// 获取用户信息
const imNickName = ref('')
const imId = ref('')
async function getUserInfo() {
  const { data } = await getMyInfo()
  if (data?.bindAccounts.length) {
    BinDingTyp.value = data?.bindAccounts[0]?.pfCode
    imNickName.value = data?.bindAccounts[0]?.pfUserName
    imId.value = data?.bindAccounts[0]?.pfUserAccount
  }
  else {
    BinDingTyp.value = 0
  }
}

// 确认解绑,绑定成功刷新
async function saveBinDing() {
  await myUnbind(3)
  message.success('已解除第三方账号关联')
  if (Local.get('im_token')) {
    router.replace(LOGIN_URL)
    userStore.setToken('')
    userStore.reset()
    projectStore.$reset()
    useNotice.reset(false)
    Local.remove('im_token')
  }
  isBinDing.value = false
  isBinDingChange.value = false
  dialogVisible.value = false
  isMoreBinDing.value = false
  getUserInfo()
}

function unbindClick() {
  dialogVisible.value = true
}

// 注销账号
const destructionShow = ref(false)
function accountCancelClick() {
  destructionShow.value = true
}

const isBinded = computed(() => {
  return BinDingTyp.value === 3
})
</script>

<template>
  <div class="my-wrap">
    <navbar title="个人设置" />
    <div class="con-wrapper">
      <div class="con pt24">
        <my-user />
        <div v-if="isBinded" id="code-wrapper" class="module bind-module mb32">
          <div class="tit pfm flex-row-between">
            账号关联
          </div>
          <div class="flex-row-between mt16 mb16">
            <div class="left pfm text14 flex-row-start">
              IM
              <span class="line" />
              <p class="text14 main-color" style="color: #666">
                {{ imNickName }}
              </p>
            </div>
            <div class="binding flex-row-center">
              <div class="right-btn binBtn" @click.stop="unbindClick()">
                解绑
              </div>
            </div>
            <!-- 解绑确认框 -->
            <b-dialog
              v-model:dialogVisible="dialogVisible"
              width="360px"
              title-icon="orange.svg"
              title="是否确认进行第三方账号解绑"
              confirm-btn-color="primary"
              confirm-btn-text="确认"
              @on-confirm="saveBinDing"
              @on-cancel="isMoreBinDing = false"
            />
          </div>
        </div>
        <div class="module secure-module mb32">
          <div class="tit pfm flex-row-between">
            安全设置
            <a-tooltip title="注销成功后该账号将无法使用" effect="dark">
              <div class="account-cancel pointer" @click="accountCancelClick">
                注销账号
              </div>
            </a-tooltip>
          </div>
          <div class="h65 flex-row-between">
            <p class="text14 minor-color">
              登录密码 <span class="ml27 icon-color">********</span>
            </p>

            <!-- 普通用户 -->
            <a-popover
              v-if="Number(userInfo.role) < 50"
              v-model:open="showChangePsd"
              trigger="click"
              destroy-tooltip-on-hide
              placement="bottomRight"
              overlay-class-name="my-project-popover full-popover"
            >
              <template #content>
                <changePsd @on-close="showChangePsd = false" />
              </template>
              <div class="right-btn">
                修改密码
              </div>
            </a-popover>
            <!-- 管理员 -->
            <a-popover
              v-else
              v-model:open="showChangePsd"
              trigger="click"
              placement="bottomRight"
              destroy-tooltip-on-hide
              overlay-class-name="my-project-popover full-popover"
            >
              <template #content>
                <changePsdAdmin @on-close="showChangePsd = false" />
              </template>
              <div class="right-btn">
                修改密码
              </div>
            </a-popover>
          </div>
        </div>
        <div class="module project-module">
          <p class="tit pfm flex-row-start">
            项目信息
            <span v-if="projectList.length === 0" class="ml16">暂时没有参与任何项目</span>
          </p>
          <div class="project-list mt4 ">
            <div v-for="item in projectList" :key="item" class="item mt12 flex-row-between">
              <p class="text14 icon-color flex-row-center maxw200" @click.stop="toProject(item.id)">
                <b-ellipsis-text :content="item.spaceName" />
                <img
                  v-if="item.userId === userStore.userInfo.id"
                  class="w14 ml1"
                  src="@/assets/icon/creator-icon.png"
                  alt=""
                >
              </p>
              <div class="text14 minor-color flex-row-center flex-shrink-0">
                <span>消息推送</span>
                <a-switch
                  v-model:checked="item.checkedNotify"
                  class="mr12 ml8 checked-notify"
                  size="small"
                  @change="setNotify(item.id, item.notify)"
                />
                <a-popover
                  trigger="hover"
                  placement="bottom"
                  :align="{ offset: [34, -8] }"
                  overlay-class-name="my-project-popover"
                >
                  <template #content>
                    <p class="option" @click.stop="leaveProject(item)">
                      {{ item.userId === userStore.userInfo.id ? '转移项目' : '离开项目' }}
                    </p>
                  </template>
                  <div class="more-icon flex-row-center pointer br4">
                    <svg-icon name="my-more" :size="16" color="#333333" />
                  </div>
                </a-popover>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <b-leave-dialog ref="ref_leave_dialog" :is-transfer="isTransfer" />
    <accountCancel
      v-if="destructionShow"
      :project-list="projectList"
      :nick-name="nickName"
      @on-close="destructionShow = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.module {
  position: relative;
}
.my-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
  .con-wrapper {
    width: 100%;
    height: 100%;
    .line {
      width: 1px;
      height: 14px;
      background: $color-minor;
      margin: 0 16px;
    }
  }
  .con {
    width: 100%;
    margin: 0 auto;
    .binding {
      position: relative;
      .more-icon {
        width: 20px;
        height: 20px;
        &:hover {
          background: $color-bg-hover;
        }
      }
    }
    .right-btn {
      width: 65px;
      // padding: 0 8px;
      height: 26px;
      border-radius: 4px;
      font-size: 12px;
      color: $color-title;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid $color-border-main;
      cursor: pointer;

      &:hover {
        color: #1d74f5;
        border: 1px solid #1d74f5;
      }
      &.binBtn {
        width: 41px;
        height: 26px;
        padding: 0;
      }
    }

    .bind-module,
    .secure-module {
      border-bottom: 1px solid $color-border-minor;
    }
    .project-list {
      .item {
        width: 100%;
        height: 32px;
        display: flex;
        p {
          cursor: pointer;
          &:hover {
            color: $color-primary;
          }
        }
        .more-icon {
          width: 20px;
          height: 20px;
          &:hover {
            background: $color-bg-hover;
          }
        }
      }
    }
    .my-password-form {
      :deep(.el-form-item) {
        .el-form-item__label {
          font-size: 14px;
          color: $color-minor;
        }
      }
      // .ant-input{
      //   letter-spacing: 1px;
      // }
      .ant-form-item-label > label {
        color: #999999;
      }
    }
    .my-password-foot {
      .btn {
        border-radius: 6px;
        padding: 0px 21px;
      }
    }
  }
}
.tit {
  width: 100%;
  height: 32px;
  font-size: 14px;
  color: $color-title;
  span {
    font-size: 14px;
    color: $color-minor;
  }
}
.leave-dialog-main {
  .agree {
    .el-checkbox {
      color: $color-minor;
      font-weight: initial;
    }
  }
}

.avatar-box {
  position: relative;
}
.avatar-file {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
}

.account-cancel {
  width: 65px;
  height: 26px;
  line-height: 26px;
  font-size: 12px;
  color: #1a1a1a;
  text-align: center;
  &:hover {
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.04);
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
  }
}

.ant-switch.ant-switch-checked {
  background: #1d74f5 !important;

  :deep() {
    .ant-switch-handle {
      inset-inline-start: calc(100% - 13px);
    }
  }
}
</style>

<style lang="scss">
// 项目右侧更多弹出框
.my-project-popover {
  &.full-popover {
    width: calc(100vw - 32px);
  }
  .ant-popover-inner {
    border-radius: 8px;
    padding: 7px;
    border: 1px solid #e5e5e5;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
    .option {
      height: 32px;
      padding: 0px 8px;
      font-size: 14px;
      border-radius: 4px;
      color: $color-icon;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        background: $color-bg-hover;
      }
    }
  }
  .binBtn {
    width: 52px;
    height: 32px !important;
    text-align: center;
    line-height: 32px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px !important;
    border: none !important;
    &:hover {
      background: $color-bg-hover;
    }
  }
}

.sel-list {
  width: 68px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: #fff;
  /* 鼠标右键弹出样式 */
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);
  position: absolute;
  left: 0;
  bottom: 23px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  span {
    width: 100%;
    height: 32px;
    line-height: 32px;
    font-size: 14px;
    font-weight: initial;
    color: #333333;
    display: block;
    text-align: center;
    cursor: pointer;
  }
}
.pointer {
  cursor: pointer;
}

.popoverClass {
  .ant-popover-inner {
    padding: 0;
  }
}
</style>
