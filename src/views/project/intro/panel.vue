<script lang="ts" setup>
import { inject, onMounted, onUnmounted, ref } from 'vue'
import type { WorkbenchCount } from '@/api/interface/system'
import { getProjectCount } from '@/api/project'
import router from '@/router'

const handleChangeTab: Function = inject('handleChangeTab') as Function
const handleChangeFollow: Function = inject('handleChangeFollow') as Function

/** DATA */
const isLoading = ref<boolean>(false)
const countData = ref<WorkbenchCount>({
  completeRate: '0',
  completed: '0',
  processing: '0',
  total: '0',
  followed: '0',
})
const progressVal = ref(0)
const isScrolling = ref<boolean>(false)
const scrollTimeout = ref()
const titleTip = ref('')

/** FUNCTION */

// 获取数量
async function getCount() {
  isLoading.value = true
  const id = router.currentRoute.value.params.id as string
  const { data } = await getProjectCount(id)
  countData.value = data
  isLoading.value = false
  progressVal.value = Number(data?.processingAndExpiredRate)

  const val = Number(data?.completeRate)
  if (Number(data?.processingAndExpiredRate) >= 40) {
    titleTip.value = '异常  逾期任务数量/任务总数/100 ≥ 40%'
    return
  }
  if (val >= 0 && val <= 59)
    titleTip.value = '当前项目进度 0% ≤ 一般 ≤ 59%'
  else if (val >= 60 && val <= 79)
    titleTip.value = '当前项目进度 60% ≤ 健康 ≤ 79%'
  else if (val >= 80 && val <= 94)
    titleTip.value = '当前项目进度 80% ≤ 良好 ≤ 94%'
  else if (val >= 95 && val <= 100)
    titleTip.value = '当前项目进度 95% ≤ 优秀 ≤ 100%'
}

// 跳转表格
function toTable(type: string, count: string | undefined) {
  return
  if (Number(count) === 0)
    return
  switch (type) {
    case 'processing':
      handleChangeTab && handleChangeTab(countData.value?.processingConditionGroup)
      break
    case 'completed':
      handleChangeTab && handleChangeTab(countData.value?.doneConditionGroup)
      break
    case 'followed':
      handleChangeFollow && handleChangeFollow(countData.value?.followedConditionGroup)
      break
    case 'total':
      handleChangeTab && handleChangeTab({ conditions: [], conjunction: 'AND', groups: [] })
      break
  }
}

// 判断是否在滚动
function handleScroll() {
  // 设置标志表示正在滚动
  isScrolling.value = true
  // 清除之前的计时器
  clearTimeout(scrollTimeout.value)
  // 设置一个新的计时器，当滚动停止后500毫秒，将isScrolling设置为false
  scrollTimeout.value = setTimeout(() => {
    isScrolling.value = false
  }, 500)
}

onMounted(() => {
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll)
  getCount()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

defineExpose({
  getCount,
})
</script>

<template>
  <div class="panel flex-row-between skeleton-style">
    <a-skeleton :paragraph="false" :loading="isLoading" active>
      <circle-process
        :progress="Number(countData.completeRate)"
        :progress-val="progressVal"
      />
    </a-skeleton>
    <div class="right">
      <div
        class="item flex-row-center"
        @click="toTable('processing', countData?.processing)"
      >
        <p class="label">
          待办任务
        </p>
        <h2 v-if="countData?.processing !== '0'" class="value ddin">
          {{ countData?.processing }}
        </h2>
        <h2 v-else class="value value-none">
          暂无
        </h2>
      </div>
      <div
        class="item flex-row-center"
        @click="toTable('completed', countData?.completed)"
      >
        <p class="label">
          完成任务
        </p>
        <h2 v-if="countData?.completed !== '0'" class="value ddin">
          {{ countData?.completed }}
        </h2>
        <h2 v-else class="value value-none">
          暂无
        </h2>
      </div>
      <div
        class="item flex-row-center"
        @click="toTable('total', countData?.total || '')"
      >
        <p class="label">
          任务总数
        </p>
        <h2 v-if="countData?.total !== '0'" class="value ddin">
          {{ countData?.total }}
        </h2>
        <h2 v-else class="value value-none">
          暂无
        </h2>
      </div>
      <div
        class="item flex-row-center"
        @click="toTable('followed', countData?.followed || '')"
      >
        <p class="label">
          我关注的
        </p>
        <h2 v-if="countData?.followed !== '0'" class="value ddin">
          {{ countData?.followed }}
        </h2>
        <h2 v-else class="value value-none">
          暂无
        </h2>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:global(.task-tool-width) {
  max-width: 330px !important;
}
.panel {
  width: 100%;
  background: #ffffff;
  .right {
    flex: 1;
  }
  .item {
    height: 20px;
    border-radius: 8px;
    z-index: 0;
    cursor: pointer;
    transition: all 0.2s;
    background: none;
    padding: 8px;
    justify-content: space-between;

    .value {
      font-size: 13px;
      color: $color-title;
    }

    .value-none {
      font-size: 13px;
      color: #999999;
    }

    .label {
      font-size: 13px;
      color: $color-minor;
    }
  }
}
</style>
