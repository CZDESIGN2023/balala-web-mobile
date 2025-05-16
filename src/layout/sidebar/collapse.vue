<!-- 收起面板 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import router from '@/router'
import Foot from '@/layout/sidebar/foot.vue'
import Logo from '@/layout/sidebar/logo.vue'
import { useNoticeStore } from '@/stores/modules/notice'
import { useProjectStore } from '@/stores/modules/project'
import { useUserStore } from '@/stores/modules/user'

const useNotice = useNoticeStore()
const projectStore = useProjectStore()

const { userInfo } = useUserStore()
const commentIndex = computed(() => useNotice.userNoticeCounts[userInfo.id]?.commentIndex || 0)
const sysIndex = computed(() => useNotice.userNoticeCounts[userInfo.id]?.sysIndex || 0)

const projectList = computed(() => projectStore.projectList)
const showProjectList = ref<boolean>(false)
function toProject(id: string) {
  router.push(`/project/${id}`)
}

const showCreat = ref<boolean>(false)
function toCreateProject() {
  showCreat.value = false
  router.push(`/project/add`)
}
</script>

<template>
  <div class="collapse-box">
    <div class="collapse-main">
      <div>
        <!-- 项目logo -->
        <Logo :is-collapse="true" />
        <!-- 展开面板图标 -->
        <el-tooltip content="展开" placement="right" :offset="8">
          <div
            class="collapse-icon pointer flex-row-center"
            @click="$emit('changeCollapse', false)"
          >
            <svg-icon name="arrow-r" size="16" color="#666666" />
          </div>
        </el-tooltip>

        <div class="icon-list">
          <!-- 工作台 -->
          <router-link
            to="/"
            class="icon-hover flex-row-center"
            :class="{ active: $route.path === '/home' }"
          >
            <svg-icon :name="$route.path === '/home' ? 'dashboard' : 'dashboard-outline'" size="24" color="#333333" />
          </router-link>

          <!-- 通知 -->
          <div
            class="notice-box icon-hover flex-row-center mt12"
            :class="{ active: useNotice.showNotice }"
            @click="useNotice.setShowNotice()"
          >
            <span v-if="sysIndex > 0 || commentIndex > 0" class="unread" />
            <svg-icon :class="{'swing-animate': sysIndex > 0 || commentIndex > 0}" name="notice_ico" size="16" color="#333333" />
          </div>

          <!-- 项目列表 -->
          <a-popover
            v-model:open="showProjectList"
            placement="rightTop"
            :align="{ offset: [9, 2] }"
            overlay-class-name="collapse-project-list"
            :z-index="900"
          >
            <template #content>
              <div v-if="projectList?.length === 0" class="project-none">
                暂无项目
              </div>
              <el-scrollbar max-height="252px" class="pr6" always>
                <div
                  v-for="item in projectList"
                  :key="item.id"
                  class="project-list-item pfm pointer ss-line-1"
                  @click="toProject(item.id)"
                >
                  {{ item?.spaceName || '' }}
                </div>
              </el-scrollbar>
            </template>
            <div class="icon-hover flex-row-center mt12 mb12" :class="{ active: $route.name === 'project' }">
              <svg-icon name="book" size="24" color="#333333" />
              <span v-if="useNotice.isShowJoinTooltip" class="unread" />
            </div>
          </a-popover>

          <!-- 创建项目 -->
          <a-popover
            v-model:open="showCreat"
            placement="rightTop"
            :align="{ offset: [9, 8] }"
            overlay-class-name="collapse-creat-icon"
            :z-index="900"
          >
            <template #content>
              <div class="creat-project pointer" @click="toCreateProject">
                <div class="creat-project-box flex-row-start">
                  <svg-icon name="project-add" size="16" color="#333333" />
                  <div class="creat-title ml8 text14">
                    创建项目
                  </div>
                </div>
              </div>
            </template>
            <div class="icon-hover flex-row-center pointer" :class="{ active: $route.name === 'projectAdd' }">
              <svg-icon name="add" size="16" color="#333333" />
            </div>
          </a-popover>
        </div>
      </div>

      <!-- 底部头像 -->
      <div class="mb24 mt12">
        <Foot :is-collapse="true" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.collapse-box {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: $sidebar-width-is-collapse;
  height: 100%;
  background: $sidebar-bg;
  z-index: 999;

  .collapse-main {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
}

.collapse-icon {
  right: -12px;
}

.icon-list {
  width: 32px;
  margin: auto;

  .icon-hover {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    .unread {
      position: absolute;
      right: 2px;
      top: 2px;
      width: 8px;
      height: 8px;
      border-radius: 100px;
      background: #fd4c4c;
      z-index: 3;
    }
    &.active {
      background: $color-default-bg;
      &:hover {
        background: $color-default-bg;
      }
    }

    &:hover {
      background: $color-default-hover;
    }
    &:active {
      background: $color-default-active;
    }
  }
}

.collapse-creat-icon {
  :global(.collapse-creat-icon .ant-popover-inner) {
    border-radius: 8px;
    box-shadow: none;
    padding: 0;
  }

  .creat-title {
    color: #333333;
  }

  .creat-project {
    width: 160px;
    height: 48px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid $tool-drop-box-border;
    padding: 8px;
    box-shadow:$tool-drop-box-shadow;
    display: flex;
    align-items: center;
    .creat-project-box {
      width: 100%;
      height: 100%;
      border-radius: 4px;
      padding-left: 8px;
    }
    &:hover {
      .creat-project-box {
        background: $color-default-hover;
      }
    }
    &:active {
      .creat-project-box {
        background: $color-default-hover;
      }
    }
  }

  .add-icon {
    &:hover {
      background: $color-default-hover;
    }
  }
}

.collapse-project-list {
  :global(.collapse-project-list .ant-popover-inner) {
    width: 240px;
    min-height: 52px;
    padding: 8px;
    padding-right: 0px;
    padding-left: 6px;
    border-radius: 8px;
    background: #FFFFFF;
    border: 1px solid $tool-drop-box-border;
    box-shadow: $tool-drop-box-shadow;
	
  }

  .project-list-item {
    width: 224px;
    height: 36px;
    padding: 0px 8px;
    border-radius: 4px;
    line-height: 36px;

    &:hover {
      background: $color-default-hover;
    }
    &:active {
      background: $color-default-active;
    }
  }

  .project-none {
    width: 224px;
    height: 64px;
    line-height: 64px;
    text-align: center;
    color: #666666;
  }
}

.notice-box {
  position: relative;
  &.active {
    background: rgba(29, 116, 245, 0.08);
    &:hover {
      background: rgba(29, 116, 245, 0.08);
    }
  }
  .unread {
    position: absolute;
    right: 2px;
    top: 2px;
    width: 8px;
    height: 8px;
    border-radius: 100px;
    background: #fd4c4c;
    z-index: 3;
  }
}
</style>
