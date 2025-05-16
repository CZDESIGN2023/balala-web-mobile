<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue'
import draggable from 'vuedraggable'
import { useProjectStore } from '@/stores/modules/project'
import router from '@/router'
import { setSpaceOrder } from '@/api/user'
import { useNoticeStore } from '@/stores/modules/notice'
import { useUserStore } from '@/stores/modules/user'
import { useSpaceStore } from '@/stores/modules/space'
import { useAppStore } from '@/stores/modules/app'

const useNotice = useNoticeStore()
const projectStore = useProjectStore()
const spaceStore = useSpaceStore()
const projectList = computed(() => projectStore.projectList)
const appStore = useAppStore()

const isShowDot = computed(() => {
  const { userInfo } = useUserStore()
  const userNoticeCounts = useNotice.userNoticeCounts[userInfo.id]
  if (!userNoticeCounts)
    return false

  return (
    userNoticeCounts.sysIndex > 0
    || userNoticeCounts.commentIndex > 0
    || userNoticeCounts.todoIndex > 0
  )
})

// 跳转
function jump(url: string) {
  appStore.setSideBarExpanded(false)
  router.push(url)
}

function toProject(data: any) {
  const id = Number(data.id)
  const roleId = Number(data.roleId)
  if (id === Number(useNotice.joinSpaceId)) {
    useNotice.setJoinTooltip(false)
  }
  spaceStore.setUserStatus(roleId)
  nextTick(() => {
    router.push(`/project/${id}`)
  }).then(() => {
    appStore.setSideBarExpanded(false)
  })
}

// 移动列表
const drag = ref<boolean>(false)
function onMoveProject(data: any) {
  const moved = data.moved
  fnSetSpaceOrder(moved.oldIndex, moved.newIndex)
}

// 移动后请求接口
async function fnSetSpaceOrder(fromIdx: number, toIdx: number) {
  await setSpaceOrder(fromIdx, toIdx)
  const source = projectList.value[fromIdx]
  projectList.value.splice(fromIdx, 1)
  projectList.value.splice(toIdx, 0, source)
}

function dragStart() {
  drag.value = true
}
function dragEnd() {
  drag.value = false
}
</script>

<template>
  <div class="app-sidebar-menu">
    <div class="list">
      <div class="item dashboard-item flex-row-center" @click="jump('/home')">
        <svg-icon name="dashboard-outline" size="24" color="#333333" />
        <p class="text14 icon-color flex-one ml8 line14">
          工作台
        </p>
        <svg-icon name="sidebar-arrow-r" size="16" color="#999999" />
      </div>
      <div class="item dashboard-item flex-row-center" @click="jump('/notice')">
        <svg-icon name="notice_ico" size="24" color="#333333" />
        <p class="text14 icon-color flex-one ml8 line14">
          待办通知
        </p>
        <span v-if="isShowDot" class="red-icon" />
        <svg-icon name="sidebar-arrow-r" size="16" color="#999999" />
      </div>
      <div class="item group-item flex-row-center">
        <svg-icon name="book" size="24" color="#333333" />
        <p class="text14 icon-color flex-one ml8 line16">
          项目列表
        </p>
      </div>
      <!-- <el-scrollbar v-if="projectList.length > 0" height="100%"> -->
      <div v-if="projectList.length > 0" height="100%" class="scroll-list">
        <draggable
          v-model="projectList"
          item-key="id"
          chosen-class="ghost"
          ghost-class="ghostClass"
          :force-fallback="true"
          :fallback-on-body="true"
          :disabled="true"
          handle=".handle"
          @start="dragStart"
          @end="dragEnd"
          @change="onMoveProject"
        >
          <template #item="{ element }">
            <transition-group name="slide" tag="ul">
              <div :key="element.id">
                <div
                  class="item project-item flex-row-start text14 icon-color"
                  :class="{ active: $route.params.id === element.id }"
                  @click.stop="toProject(element)"
                >
                  <!-- <svg-icon
                      v-show="!drag"
                      class="drag-icon handle select-none"
                      name="drag_icon"
                      size="16"
                      color="#999"
                    /> -->
                  <b-ellipsis
                    content-class="font-smoothing pfm"
                    style="font-size: 3.58974vw;"
                    :content="element.spaceName"
                  />
                  <svg-icon name="sidebar-arrow-r" size="16" color="#999999" />
                </div>
              </div>
            </transition-group>
          </template>
        </draggable>
      </div>
      <!-- </el-scrollbar> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slide-move {
  transition: transform 0.5s ease-in-out;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.5s ease-in-out;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.app-sidebar-menu {
  flex: 1;
  overflow: hidden;
  .red-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    background: $color-error;
    color: #fff;
    font-size: 12px;
    margin-right: 4px;
  }
  .list {
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    .tooltip {
      position: absolute;
      z-index: 10;
      top: 46px;
      right: 0px;
      display: flex;
      flex-direction: row;
      justify-content: start;
      align-items: center;
      padding-left: 4px;
      padding-right: 8px;
      gap: 8px;
      font-size: 13px;
      color: #333333;
      width: 216px;
      height: 40px;
      border-radius: 6px;
      background: radial-gradient(
          28% 102% at 0% 0%,
          #fff3e0 0%,
          rgba(255, 255, 255, 0) 100%
        ),
        #ffffff;
      box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.06);
      .triangle {
        position: absolute;
        content: '';
        width: 0px;
        height: 0px;
        margin: auto;
        border: 7px solid transparent;
        border-top: 7px solid #fff;
        bottom: -14px;
        left: 36px;
        position: absolute;
      }
      .icon {
        width: 14px;
        height: 14px;
        border-radius: 2px;
        &:hover {
          background: $color-bg-hover;
        }
      }
    }
  }
  .scroll-list {
    flex: 1;
    overflow-y: scroll;
  }
  .item {
    width: 100%;
    margin: 4px auto;
    height: 36px;
    border-radius: 6px;
    transition: all 0.2s;
    margin-top: 4px;
    cursor: pointer;
    position: relative;
    padding: 0 4px;
    .drag-icon {
      position: absolute;
      left: 8px;
      opacity: 0;
      cursor: grab;
      &:active {
        cursor: grabbing;
      }
    }

    &:hover {
      background: $color-default-hover;
      .drag-icon {
        opacity: 1;
      }
    }
    // &:active {
    //   background: $color-default-active;
    // }
    // &.active {
    //   background: $color-default-bg;
    // }
    p {
      word-break: break-all;
    }
  }

  .project-item {
    padding-left: 38px;
    .content {
      flex: 1;
    }
  }

  .group-item {
    width: 100%;
    height: 40px;
    &:hover {
      background: none;
    }
    .add-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
      &.bg {
        background: $color-bg-hover;
      }
    }
  }
  .dashboard-item {
    height: 40px;
    margin-top: 0;
    &.active {
      p {
        font-family: 'CustomFont-Medium';
        -webkit-font-smoothing: antialiased;
      }
    }
  }
}

.creat-icon {
  :global(.creat-icon .ant-popover-inner) {
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
    box-shadow: $tool-drop-box-shadow;
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
}

.sortable-drag {
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07) !important;
  border: 1px solid $color-border-main !important;
  opacity: 1 !important;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding-left: 8px;
  .drag-icon {
    display: none !important;
  }
}

.ghostClass {
  border-top: 2px solid #1d74f5;
  .item {
    background: #fafbfc !important;
    cursor: grabbing !important;
  }
}
</style>

<style lang="scss">
.drag-icon {
  &:hover {
    use {
      fill: #666666 !important;
    }
  }
}
</style>
