<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { debounce } from 'lodash'
import noticeTpl from './components/noticeTpl.vue'
import type { CommentList } from './types'
import { myPendingWork, notifyCount, relatedCommentByIds, relatedCommentIds } from '@/api/user'
import { getTableByid } from '@/mixins/vtable'
import type { TableTaskItem } from '@/api/interface'
import { useNoticeStore } from '@/stores/modules/notice'
import { useUserStore } from '@/stores/modules/user'
import NotificationTemplate from '@/socket/notification'
import type { NotificationData } from '@/socket/notification/type'

const useNotice = useNoticeStore()
const toDoTotal = ref<number>(0)
const { userInfo } = useUserStore()
const toDoIndex = computed(() => useNotice.userNoticeCounts[userInfo.id]?.todoIndex || 0)
const commentIndex = computed(() => useNotice.userNoticeCounts[userInfo.id]?.commentIndex || 0)
const sysIndex = computed(() => useNotice.userNoticeCounts[userInfo.id]?.sysIndex || 0)

const state = reactive({
  isEmpty: false,
  loading: false,
  showCleanPopover: false,
  activeTab: 'todo',
})

const scrollRef = ref()
const visibleListRef = ref()
const refList: any = ref<any[]>([])

const loadIndex = ref<number>(0)

// 展示的列表
const dataArr = ref<TableTaskItem[] | string[]>([])
// 所有id列表
const allDataIdArr = ref([])

// 通知 tab 列表
const noticeTabs = computed(() => {
  return [
    {
      key: 'todo',
      text: '待办',
      count: toDoTotal.value,
      showRedIco: toDoIndex.value > 0 && toDoTotal.value > 0,
    },
    {
      key: 'comment',
      text: '评论',
      count: commentIndex.value,
      showRedIco: commentIndex.value > 0,
    },
    {
      key: 'system',
      text: '系统',
      count: 0,
      showRedIco: sysIndex.value > 0,
    },
  ]
})

// 空状态文字
const emptyText = computed(() => {
  if (state.activeTab === 'system')
    return '暂无通知'
  else if (state.activeTab === 'comment')
    return '暂无评论'
  else if (state.activeTab === 'todo')
    return '暂无待办'
  else
    return '暂无通知'
})

onMounted(() => {
  getNotifyCount()
  getTodoList()
})

// 获取 待办 列表数据
async function getTodoList() {
  try {
    state.loading = true
    const response = await myPendingWork()
    const { items = [] } = response.data
    allDataIdArr.value = items
    dataArr.value = items
    state.isEmpty = !items.length

    if (items.length === 0) {
      // changeTab('todo')
      useNotice.setUserNoticeCounts(0, 'todo')
    }

    if (typeof enListeningVisible === 'function')
      nextTick(enListeningVisible)
  }
  catch (error) {
    state.loading = false
    state.isEmpty = true
  }
}

// 获取 评论 列表数据
async function getCommentList() {
  try {
    state.loading = true
    const response = await relatedCommentIds()
    const { items = [] } = response.data
    allDataIdArr.value = items
    dataArr.value = items
    state.isEmpty = !items.length
    refList.value = []

    if (typeof enListeningVisible === 'function')
      nextTick(enListeningVisible)
  }
  catch (error) {
    state.loading = false
    state.isEmpty = true
  }
}

// 评论详情列表
async function getCommentInfo(ids: string[]) {
  const { data } = await relatedCommentByIds(ids)
  if (!data?.items?.length)
    return

  data?.items.forEach((item: CommentList) => {
    const infoIndex = dataArr.value.findIndex((id: string | TableTaskItem) => id === item.id)
    if (infoIndex === -1)
      return
    const info = JSON.parse(item.doc)
    const suffix = info.relation.includes('COMMENT_AT') ? ' 中@了你' : ' 中发布评论'
    dataArr.value[infoIndex] = {
      id: item.id,
      ...info.notification,
      suffix,
      spaceId: info.space.spaceId,
    }
  })
  state.loading = false
}

// 根据id（数组）获取详情列表
const getIdList = debounce(() => {
  const length = (dataArr.value as any[]).filter((find: any) => find?.id)?.length || 0
  const ids = allDataIdArr.value?.slice(length, loadIndex.value)
  if (!ids?.length)
    return
  if (state.activeTab === 'todo')
    getItemList(ids)
  else if (state.activeTab === 'comment')
    getCommentInfo(ids)
}, 300)

// 待办详情列表
async function getItemList(ids: string[]) {
  const list = await getTableByid(ids, '')
  if (!list?.length)
    return

  list.forEach((item: any) => {
    const infoIndex = dataArr.value.findIndex((id: string | TableTaskItem) => id === item.id)
    if (infoIndex === -1)
      return
    dataArr.value[infoIndex] = item
  })
  state.loading = false
}

// 监听元素是否可见
function enListeningVisible(minItemsToLoad: number = 2) {
  const list = visibleListRef.value && visibleListRef.value.querySelectorAll('.visible-item')
  setTimeout(() => {
    if (!list?.length)
      return

    let itemsLoaded = 0 // 已加载的项数
    list?.forEach((item: any) => {
      useIntersectionObserver(item, ([{ isIntersecting }]) => {
        if (isIntersecting) {
          loadIndex.value++
          itemsLoaded++
          getIdList()
        }
      })
    })
    // 如果已加载的项数小于保底加载的数量，则手动触发加载
    if (itemsLoaded < minItemsToLoad) {
      for (let i = itemsLoaded; i < minItemsToLoad; i++) {
        loadIndex.value++
        getIdList()
      }
    }
  }, 200)
}
// 获取 待办 通知计数
async function getNotifyCount() {
  const { data } = await notifyCount()
  toDoTotal.value = data?.pending || 0
}

// 切换tab页
const preIndex = ref('todo')
function changeTab(tabKey: string) {
  scrollRef.value?.scrollTo(0, 0)
  refList.value = []
  preIndex.value = state.activeTab
  state.activeTab = tabKey
  if (tabKey === 'system') {
    const list: NotificationData[] = useNotice.getMessagesForUser(userInfo.id)
    state.loading = false
    state.isEmpty = !list.length
    dataArr.value = handleNotice(list)
    useNotice.setUserNoticeCounts(0, 'system')
  }
  else if (tabKey === 'comment') {
    getCommentList()
    useNotice.setUserNoticeCounts(0, 'comment')
  }
  else if (tabKey === 'todo') {
    getTodoList()
    getNotifyCount()
    useNotice.setUserNoticeCounts(0, 'todo')
  }
}

// 处理通知数据
function handleNotice(list: NotificationData[]) {
  const newList: any = []
  if (!list?.length) {
    dataArr.value = []
    return
  }
  state.isEmpty = false
  list.forEach((item: any, index: number) => {
    const notificationTemplate = new NotificationTemplate(item)
    const notification = notificationTemplate.renderNotification()
    newList[index] = notification
  })

  return newList
}

const noticeList = computed(() => {
  const list: NotificationData[] = useNotice.getMessagesForUser(userInfo.id)
  return handleNotice(list)
})

const listData = computed(() => {
  if (['todo', 'comment'].includes(state.activeTab))
    return dataArr.value
  return noticeList.value
})

// 清除数据
function cleanData() {
  dataArr.value = []
  allDataIdArr.value = []
  loadIndex.value = 0
}

function onCleanNotice() {
  // useNotice.clearNoticeList()
  useNotice.clearMessagesForUser(userInfo.id)
  state.showCleanPopover = false
  state.isEmpty = true
  cleanData()
}

const skeletonCount = computed(() => {
  return Math.max(4 - listData.value.length, 0) // 至少渲染4个骨架屏
})
</script>

<template>
  <div class="notice-wrap">
    <navbar is-back title="待办通知" @on-back="(callback: Function) => callback() " />
    <div class="header flex-row-between">
      <a-tabs v-model:activeTab="state.activeTab" @tab-click="changeTab">
        <a-tab-pane v-for="item in noticeTabs" :key="item.key">
          <template #tab>
            <div class="item flex-row-start" :class="{ redIco: item.showRedIco }">
              {{ item.text }}
              <p v-if="Number(item.count) > 0" class="count text13 ml4 main-color">
                {{ item.count }}
              </p>
            </div>
          </template>
        </a-tab-pane>
      </a-tabs>

      <div class="tool flex-row-center">
        <a-popover
          v-if="state.activeTab === 'system'"
          v-model:open="state.showCleanPopover"
          trigger="click"
          placement="bottomLeft"
        >
          <template #content>
            <div class="mb24 mt12 text16 pfm ml12 mr4 title-color">
              确认一键已读【所有消息】？
            </div>
            <div class="flex-row-end mb12 mr12">
              <a-button class="mr12" @click="state.showCleanPopover = false">
                取消
              </a-button>
              <a-button type="primary" @click="onCleanNotice">
                确认
              </a-button>
            </div>
          </template>

          <div class="tool-clean flex-row-center pointer" :class="{ 'no-drop': !listData?.length }" @click="state.showCleanPopover = listData?.length">
            <svg-icon name="notice-clean" size="16" :color="listData?.length ? '#666' : '#D8D8D8'" />
          </div>
        </a-popover>
      </div>
    </div>
    <!-- 内容 -->
    <div v-if="!listData || state.isEmpty" class="mt235 text-center flex-column-center">
      <img class="w72 h72 flex" src="@/assets/icon/no-data-search.png" alt="">
      <div class="none mt16">
        {{ emptyText }}
      </div>
    </div>
    <div v-else ref="visibleListRef" class="bodyer">
      <!-- <el-scrollbar ref="scrollRef" height="100%"> -->
      <div
        v-for="(item, index) in listData"
        :key="item.id ? item.id : item"
        class="visible-item"
      >
        <noticeTpl
          :index="index"
          :item="item"
          :tab-key="state.activeTab"
          :loading="typeof item === 'string' || state.loading"
        />
      </div>
      <div v-if="listData.length" class="temp-skelton">
        <a-skeleton v-for="(item, index) in skeletonCount" :key="index" :paragraph="false" :loading="state.loading" />
      </div>
      <!-- </el-scrollbar> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/_base';
.notice-wrap {
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  .header {
    width: 100%;
    height: 48px;
    border-bottom: 1px solid #f2f3f5;
    padding-right: 16px;
    position: sticky;
    top: 44px;
    background: #fff;
    z-index: 10;
    :deep(.ant-tabs) {
      height: 48px;
      flex: 1;
      .ant-tabs-nav {
        margin-bottom: 0;
        &::before {
          border: 0;
        }
        .ant-tabs-nav-wrap {
          overflow: visible;
        }
        .ant-tabs-tab {
          height: 48px;
          .item {
            color: #333333;
            font-size: 14px;
            position: relative;
            cursor: pointer;
            &.redIco::after {
              content: '';
              width: 8px;
              height: 8px;
              border-radius: 100px;
              background-color: #fd4c4c;
              position: absolute;
              right: -5px;
              top: -1px;
            }
          }
          &.ant-tabs-tab-active {
            .item {
              color: $color-primary;
              @extend .pfm-smoothing;
            }
          }
        }
        .ant-tabs-nav-operations {
          display: none;
        }
        .ant-tabs-ink-bar {
          background: $color-primary;
        }
      }
      .ant-tabs-content-holder {
        display: none;
      }
    }
    .tool {
      .tool-clean {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        &:not(.no-drop) {
          &:hover {
            background: $color-default-hover;
          }
          &:active {
            background: $color-default-active;
          }
        }
        &.no-drop {
          cursor: not-allowed;
        }
      }
      .tool-close {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        &:hover {
          background: $color-default-hover;
        }
        &:active {
          background: $color-default-active;
        }
      }
    }
    :deep() {
      .ant-popover .ant-popover-inner {
        padding: 24px 14px 24px 24px;
      }
    }
  }
  .bodyer {
    height: calc(100% - 72px);
    .el-scrollbar {
      height: 100% !important;
    }
    .temp-skelton {
      :deep(.ant-skeleton-content) {
        .ant-skeleton-title {
          margin: 0 auto 12px;
        }
      }
    }
    :deep(.ant-skeleton-content) {
      padding: 0;
      .ant-skeleton-title {
        background-color: #f9fafc !important;
        width: 100%;
        height: 146px !important;
        margin: 0 auto;
      }
    }
  }
}

.visible-item:hover {
  background: $tool-hover-bg;
  border-radius: 4px;
  :deep(.tpl_item) {
    border-bottom: 1px solid transparent !important;
  }
}
.visible-item {
  margin: 0 0px 12px;
  &:first-of-type {
    margin-top: 8px;
    :deep(.tpl_item) {
      margin-top: 0;
    }
  }
  &:last-of-type {
    margin-bottom: 0;
    :deep(.tpl_item) {
      border-bottom: 1px solid transparent !important;
    }
  }
}

.icon-hover {
  background: #fff;
}
.icon-hover:hover {
  border-radius: 4px;
  background: $tool-hover-bg !important;
}

.none {
  font-size: 14px;
  color: #999999;
}

.text-center {
  text-align: center;
}

.slide-rigth-enter-active,
.slide-rigth-leave-active {
  transition: transform 0.2s;
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.1s;
  opacity: 0;
}

.slide-left-enter,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 1;
}

.slide-right-enter,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 1;
}
</style>
