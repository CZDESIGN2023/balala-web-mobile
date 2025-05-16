<script lang="ts" setup>
import { computed, inject, ref } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { userLogout } from '@/api/user'
import router from '@/router'
import { LOGIN_URL } from '@/config'
import { useProjectStore } from '@/stores/modules/project'
import { useNoticeStore } from '@/stores/modules/notice'
import { useAppStore } from '@/stores/modules/app'

withDefaults(defineProps<Props>(), {
  isCollapse: false,
})

const socketClient: any = inject('socketClient')

interface Props {
  isCollapse?: boolean
}

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
// 是否显示退出登录
const dialogVisible = ref<boolean>(false)
const projectStore = useProjectStore()
const useNotice = useNoticeStore()
const appStore = useAppStore()

// 退出登录
async function logout() {
  await userLogout()

  router.replace(LOGIN_URL)
  userStore.reset()
  projectStore.customReset()
  useNotice.reset(false)
  socketClient.closeWebsocket()
}
// 跳转
function jump(url: string) {
  router.push(url)
  appStore.setSideBarExpanded(false)
}
</script>

<template>
  <div class="app-sidebar-foot">
    <div class="user-item full-100 flex-row-start" @click="jump('/my')">
      <b-head :id="userInfo.id" width="6.15385vw" :name="userInfo.userNickname" :src="userInfo.avatar" />
      <p class="name text14 ml8 flex-one pointer ss-line-1">
        {{ userInfo.userNickname }}
      </p>
      <svg-icon name="sidebar-arrow-r" size="16" color="#999999" />
    </div>

    <div class="list mt4">
      <div class="item flex-row-center" @click="jump('/system')">
        <div class="w24 h24 flex-row-center">
          <svg-icon name="menu-set" size="16" color="#333333" />
        </div>
        <p class="text14 icon-color flex-one ml8 line14">
          系统设置
        </p>
        <svg-icon name="sidebar-arrow-r" size="16" color="#999999" />
      </div>
      <div class="item flex-row-center" @click="dialogVisible = true">
        <div class="w24 h24 flex-row-center">
          <svg-icon name="logout" size="16" color="#333333" />
        </div>
        <p class="text14 icon-color flex-one ml8 line14">
          退出登录
        </p>
        <svg-icon name="sidebar-arrow-r" size="16" color="#999999" />
      </div>
    </div>
  </div>

  <!-- 退出登录弹框 -->
  <b-dialog
    v-model:dialogVisible="dialogVisible"
    width="360px"
    title-icon="warning.svg"
    title="确认退出登录项目管理系统吗？"
    confirm-btn-color="danger"
    confirm-btn-text="退出"
    @on-confirm="logout"
  />
</template>

<style lang="scss" scoped>
.app-sidebar-foot {
  width: 100%;
  padding: 0 4px;
  position: sticky;
  bottom: 0;
  &:after {
    content: '';
    position: absolute;
    left: -12px;
    right: 0;
    top: -1px;
    height: 1px;
    background-color: #f2f3f5;
    width: calc(100% + 24px);
  }
  .user-item {
    width: 100%;
    height: 40px;
    background: #fff;
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: #fff;
    }
    .name {
      font-size: 14px;
      color: $color-icon;
    }
  }
  .list {
    .item {
      width: 100%;
      height: 40px;
      margin-top: 4px;
    }
  }
}
</style>
