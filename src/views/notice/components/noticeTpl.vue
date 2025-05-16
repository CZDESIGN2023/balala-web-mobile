<script lang="ts" setup>
import dayjs from 'dayjs'
import { getCurrentInstance, ref } from 'vue'
import { useNoticeStore } from '@/stores/modules/notice'
import { TASK_STATUS } from '@/utils/constant'
import router from '@/router'

const props = withDefaults(defineProps<Props>(), {
  item: () => {},
  // 类型: todo 待办  comment 评论  system 系统
  tabKey: 'todo',
  // 骨架屏加载
  loading: false,
  index: -1,
})
defineEmits(['onClose', 'onSave'])
const noticeStore = useNoticeStore()
const currentIndex = ref(-1)
const { proxy } = getCurrentInstance() as any

interface Props {
  item?: any
  tabKey: string
  loading: boolean
  index: number
}

// 获取通知时间
function getTime() {
  const item = props.item
  let time: number | string = ''
  switch (props.tabKey) {
    case 'todo':
      time
        = Number(item?.lastStatusAt) === 0
          ? Number(item.updatedAt) * 1000
          : Number(item.lastStatusAt) * 1000
      break

    case 'comment':
      time = item?.date
      break

    case 'system':
      time = item?.data.notification.date
      break

    default:
      break
  }
  return dayjs(time).format('YYYY/MM/DD HH:mm')
}

// 点击打开详情弹窗
function openDetails(index: number) {
  let info = {} as any
  switch (props.tabKey) {
    case 'todo':
      info = {
        spaceId: props.item.spaceId,
        workItemId: props.item.id,
        type: 'task',
        isChildTask: props.item.pid ? Number(props.item.pid) !== 0 : false,
      }
      handleType(info)
      return

    case 'comment':
      info = {
        spaceId: props.item.spaceId.toString(),
        workItemId: props.item.object.data.id.toString(),
        type: 'comment',
        isChildTask: props.item.object.data.pid || 0,
      }
      handleType(info)
      return

    case 'system':
      currentIndex.value = index
      setTimeout(() => {
        noticeStore.removeNoticeItem(index)
      }, 700)
      const noticeData = props.item.link
      const noticeInfo = {
        spaceId: noticeData.spaceId,
        workItemId: noticeData.workItemId,
        type: noticeData.type,
        isChildTask: noticeData.isChildTask,
      }
      handleType(noticeInfo)
      break

    default:
      break
  }
}

function handleType(linkInfo: any) {
  switch (linkInfo.type) {
    // 评论
    case 'comment':
      goToLink(linkInfo, 'table', 'comment')
      break

    // 流程
    case 'flow':
      goToLink(linkInfo, 'flow', 'process')
      break

    // 详情
    case 'task':
      goToLink(linkInfo, 'table', 'base')
      break

    // 简介
    case 'space':
      goToLink(linkInfo, 'intro')
      break

    default:
      break
  }
}

// 跳转到对应页面
async function goToLink(linkInfo: any, type: string = 'table', tabKey?: string) {
  if (type === 'table') {
    if (linkInfo && linkInfo.spaceId) {
      const link: string = `/project/${linkInfo.spaceId}`
      router.push(link).then(() => {
        proxy.mittBus.emit('openTaskDialog', {
          openType: linkInfo.isChildTask ? 'child_detail' : 'detail',
          taskTabKey: tabKey,
          taskParams: {
            spaceId: linkInfo.spaceId,
            workItemId: linkInfo.workItemId,
          },
        })
      })
      // proxy.mittBus.emit('openTaskDialog', {
      //   openType: linkInfo.isChildTask ? 'child_detail' : 'detail',
      //   taskTabKey: tabKey,
      //   taskParams: {
      //     spaceId: linkInfo.spaceId,
      //     workItemId: linkInfo.workItemId,
      //   },
      // })
    }
    return
  }

  if (type === 'flow') {
    const link: string = `/project/${linkInfo.spaceId}`
    router.push(link).then(() => {
      proxy.mittBus.emit('openProjectSpace', { isShow: true, type: tabKey })
    })
    return
  }

  const link: string = `/project/${linkInfo.spaceId}` + `?type=${type}`
  window.localStorage.setItem(`projectTab${linkInfo.spaceId}`, type)

  if (!tabKey) {
    router.push(link)
    return
  }

  router.push({
    path: link,
    query: {
      workItemId: linkInfo.workItemId,
      tabKey,
    },
  })
}
</script>

<template>
  <a-skeleton :paragraph="false" :loading="loading">
    <div
      class="tpl_item pointer"
      :class="
        currentIndex === index ? 'animate__animated animate__fadeOutLeft animate__faster' : ''
      "
      style="animation-delay: 0.3s;"
      @click="openDetails(index)"
    >
      <div v-if="false" class="item_mask">
        <span>该条已完成</span>
      </div>
      <!-- 左侧图标、头像 -->
      <div class="ptoImg">
        <!-- 重启任务 -->
        <img
          v-if="tabKey === 'todo' && Number(item.restartAt) > 0"
          class="w32 h32"
          src="@/assets/notice/reset.png"
          alt=""
        >
        <!-- 任务 -->
        <svg-icon v-else name="task_icon" size="16" color="#fff" />
        <!-- 评论 -->
        <b-head
          v-if="tabKey === 'comment'"
          :id="String(item?.subject?.data.id)"
          width="32px"
          fs="text14"
          :name="item?.subject?.data.nickName"
          :src="item?.subject?.data.avatar"
        />

        <!-- 系统 -->
        <component :is="item.icon" v-if="tabKey === 'system'" />
      </div>

      <div class="item_info">
        <!-- 待办 -->
        <template v-if="tabKey === 'todo'">
          <!-- 任务名称 -->
          <div class="title pfm">
            {{ item.workItemName }}
          </div>

          <!-- 项目名称 -->
          <div class="project-name mb6">
            {{ item?.spaceName }}
          </div>
          <p v-if="item.pid === '0'">
            当前节点：{{ item.flowNode.name }}
          </p>
          <p>排期时间：{{ item.formatTime }}</p>
        </template>

        <!-- 评论 -->
        <template v-else-if="tabKey === 'comment'">
          <!-- 标题 -->
          <div class="title pfm">
            {{ item?.subject?.data.nickName }} <span>({{ item?.subject?.data.name }})</span> 在
            {{ item?.object?.data?.name }} {{ item.suffix }}
          </div>

          <!-- 评论内容 -->
          <p class="mt6 break-all ellipsis-desc">
            {{ item?.describe }}
          </p>
        </template>

        <!-- 系统 -->
        <div v-else-if="tabKey === 'system'" v-html="item.description" />

        <!-- 时间、查看详情 -->
        <p class="dataTime">
          <span>{{ getTime() }}</span>
          <span>查看详情>></span>
        </p>
      </div>
    </div>
  </a-skeleton>
</template>

<style scoped lang="scss">
.tpl_item {
  border-bottom: 1px solid #f2f3f5;
  padding: 12px;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
  margin-top: -4px;
  .item_mask {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    span {
      color: #666666;
      font-size: 12px;
      background: $color-border-main;
      width: 84px;
      height: 28px;
      border-radius: 4px;
      text-align: center;
      line-height: 28px;
    }
  }
  .ptoImg {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(180deg, #6ba7ff 0%, #1d74f5 100%);
    margin-right: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .item_info {
    flex: 1;
    .title {
      font-size: 14px;
      font-weight: 500;
      color: #333333;
      line-height: 22px;
      letter-spacing: 0em;
      word-break: break-all;
      span {
        color: #999999;
      }
    }
    p {
      color: #333333;
      font-size: 14px;
      line-height: 22px;
      letter-spacing: 0em;
    }
    p.dataTime {
      color: #999999;
      font-size: 13px;
      margin-top: 6px;
      line-height: 21px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
  }
}

.project-name {
  color: #999999;
  font-size: 14px;
  line-height: 22px;
}

.break-all {
  word-break: break-all;
}
</style>
