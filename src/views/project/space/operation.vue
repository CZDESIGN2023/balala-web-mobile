<script lang="ts" setup>
import { h, onMounted, reactive, ref } from 'vue'
import { Loading3QuartersOutlined } from '@ant-design/icons-vue'
import type { LogList } from '@/api/interface/system'
import { formatDate } from '@/utils'
import router from '@/router'
import { getSpaceOpLog } from '@/api/project'

const emits = defineEmits(['handleLoading'])

const activities = ref<any>([])

onMounted(() => {
  getLogList()
})
const indicator = h(Loading3QuartersOutlined, {
  style: {
    fontSize: '24px',
  },
  spin: true,
})
const scrollFun = ref()
const logRef = ref()
const logObj = ref<LogList>()
const loading = ref<boolean>(false)
const windowInnerHeight = document.documentElement.clientHeight
const size = Math.ceil((windowInnerHeight - 170) / 36.8)
const isFirstInTab = ref<boolean>(true) // 第一次进入tab才显示钟摆loading
// 获取操作日志列表
async function getLogList() {
  loading.value = true
  isFirstInTab.value && emits('handleLoading', true)
  const spaceId = Number(router.currentRoute.value.params.id)
  const { data } = await getSpaceOpLog(spaceId, size, Number(logObj.value?.nextPos), 0, 0, '', 0)
  data.items.forEach((item) => {
    item.info.createdAt = formatDate(item.info.createdAt, 'YYYY/MM/DD HH:mm:ss')
  })
  emits('handleLoading', false)
  loading.value = false
  isFirstInTab.value = false
  activities.value = [...activities.value, ...data.items]
  logObj.value = data
}
function handleScroll(e: any) {
  // 滚动到底部时
  if (
    scrollFun.value.wrapRef.clientHeight + e.scrollTop
    >= scrollFun.value.wrapRef.scrollHeight - 40
  ) {
    if (logObj.value?.hasNext && !loading.value)
      getLogList()
  }
}
</script>

<template>
  <div class="project-operation-module">
    <el-scrollbar ref="scrollFun" max-height="100%" @scroll="handleScroll">
      <el-timeline ref="logRef">
        <el-timeline-item
          v-for="(item, index) in activities"
          :key="index"
          :timestamp="item?.info?.operMsg"
          hide-timestamp
          color="#bfbfbf"
        >
          <div class="text14 text-gray-800 mb4">
            <span class="mr6">{{ item?.info?.createdAt }}</span>
          </div>
          <p class="wordbreak-ba minor-color pr10">
            <span>{{ item?.info?.operNickname }}（{{ item?.info?.operName }}）</span><span class="msg" v-html="item.info.operMsg" />
          </p>
        </el-timeline-item>
      </el-timeline>
    </el-scrollbar>
    <div v-if="loading && !isFirstInTab" class="h35 loading-pos">
      <a-spin :spinning="loading" :indicator="indicator" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-pos {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 40px;
  transform: translateY(-11px);
}
.project-operation-module {
  height: calc(100vh - 100px);
  padding: 18px 24px 0 24px;
  overflow: hidden;
  :deep() {
    .el-timeline-item {
      padding-bottom: 16px;
    }
    .el-timeline-item__content {
      word-break: break-all;
    }
    .el-timeline-item__timestamp {
      color: #999999;
      font-size: 14px;
      line-height: 22px;
      word-break: break-all;
      padding-right: 10px;
    }
    .el-timeline-item__tail,
    .el-timeline-item__node--normal {
      top: 5px;
    }
  }

  .wordbreak-ba {
    word-break: break-all;
    line-height: 22px;
    --uno: text-gray-700;
    .msg {
      --uno: text-gray-400;
      :deep(span) {
        --uno: text-gray-700;
      }
    }
  }
}
</style>
