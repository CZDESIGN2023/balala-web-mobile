<script lang="ts" setup>
import { Loading3QuartersOutlined } from '@ant-design/icons-vue'
import { h } from 'vue'
import type { LogItem } from '@/api/interface/system'

withDefaults(defineProps<Props>(), {
  list: () => [],
  loading: false,
})

const indicator = h(Loading3QuartersOutlined, {
  style: {
    fontSize: '24px',
  },
  spin: true,
})

interface Props {
  list: LogItem[]
  loading: boolean
}
</script>

<template>
  <div class="log-wrap mt15">
    <div v-if="list.length > 0" class="list">
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in list"
          :key="index"
          color="#bfbfbf"
          hide-timestamp
        >
          <p class="box text14 text-gray-400 flex-row-start pfr" /><p class="time mb7 text-gray-800 text14">
            {{ item.info.createdAt }}
          </p>
          <p class="wordbreak-ba minor-color pr10">
            {{ item.info.operNickname }}（{{ item.info.operName }}）<span class="msg" v-html="item.info.operMsg" />
          </p>
        </el-timeline-item>
      </el-timeline>
    </div>
    <div v-if="loading" class="h35 flex-row-start">
      <a-spin :spinning="loading" :indicator="indicator" />
    </div>
    <b-empty
      v-if="!loading && list.length === 0"
      img-name="no-data-search.svg"
      :is-svg="false"
      icon-mb="5px"
      desc="暂无操作日志"
    />
  </div>
</template>

<style lang="scss" scoped>
  .log-wrap {
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
.wordbreak-ba {
  word-break: break-all;
  --uno: text-gray-700;
  .msg {
    --uno: text-gray-400;
    :deep(span) {
      --uno: text-gray-700;
    }
  }
}
</style>

<style lang="scss">
.log-wrap {
  .el-timeline-item {
    &:last-child {
      padding-bottom: 0;
    }
  }
  .el-timeline-item__tail {
    left: 4.5px;
  }
}
</style>
