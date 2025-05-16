<template>
  <div class="log-wrap mt9">
    <div class="list pt24">
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in state.logList"
          :key="index"
          color="#999999"
          hide-timestamp
        >
          <p class="box text14 minor-color flex-row-start pfr">
            <p class="time mb7 icon-color text14">{{ item.info.createdAt }}</p>
            <p class="wordbreak-ba">{{ item.info.operNickname }}（{{ item.info.operName }}）{{ item.info.operMsg }}</p>
          </p>
        </el-timeline-item>
      </el-timeline>
    </div>
    <b-empty
      v-if="state.operateNoData"
      imgName="no-data-search.svg"
      :isSvg="false"
      iconMb="5px"
      pt="240px"
      desc="暂无操作日志"
    ></b-empty>
    <div class="h40 flex-row-center" v-if="state.loading">
      <a-spin :spinning="state.loading" :indicator="indicator" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Loading3QuartersOutlined } from '@ant-design/icons-vue'
import { h, ref, onMounted, reactive } from 'vue'
import { getOpLog } from '@/api/system'
import type { LogItem, LogList } from '@/api/interface/system'
import { formatDate, debounce } from '@/utils'
const indicator = h(Loading3QuartersOutlined, {
  style: {
    fontSize: '24px'
  },
  spin: true
})
interface TaskParamType {
  spaceId?: string
  workItemId?: string
}
interface State {
  loading: boolean;
  operateNoData: boolean,
  logList: LogItem[];
}
type Props = {
  taskParams: TaskParamType;
}
const props = withDefaults(defineProps<Props>(), {
  taskParams: () => ({})
})
const state = reactive<State>({
  loading: false,
  operateNoData: false,
  logList: []
})
const logObj = ref<LogList>({ hasNext: true, nextPos: '', items: []})
const size = 30
const renderValue = Math.random()

const init = () => {
  getOperationList()
}
const getOperationList = debounce(async () => {
  // 没有下一页 || 正在加载
  if (!logObj.value?.hasNext || state.loading) {
    return
  }
  state.loading = true
  const res = await getOpLog(Number(props.taskParams.spaceId), size , Number(logObj.value?.nextPos), 5, Number(props.taskParams.workItemId) , JSON.stringify(JSON.parse(String(renderValue))))
  state.loading = false
  state.operateNoData = res.data.items.length ? false : true
  res.data.items.map((item) => {
    item.info.createdAt = formatDate(item.info.createdAt, 'YYYY/MM/DD HH:mm:ss')
  })
  // 时间格式转换
  logObj.value = res.data
  state.logList = [...state.logList, ...res.data.items]
}, 300)

onMounted(() => {
  init()
})
defineExpose({
  getOperationList
})
</script>

<style lang="scss" scoped>
  .log-wrap {
    padding: 24px;
    padding-top: 0;
    :deep(.el-timeline-item__wrapper) {
      top: -6px !important;
    }
  }
  .box {
    align-items: start;
    flex-direction: column;
  }
  .time {
    width: 150px;
    flex-shrink: 0;
  }

  .wordbreak-ba{
    word-break: break-all;
  }
</style>
