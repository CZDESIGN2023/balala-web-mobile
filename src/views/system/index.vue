<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import OperateLog from './operateLog.vue'
import LoginLog from './loginLog.vue'
import { getLoginLog, getOpLog } from '@/api/system'
import type { LogItem, LogList, LoginItem, LoginList } from '@/api/interface/system'
import { formatDate } from '@/utils'
import { useUserStore } from '@/stores/modules/user'

const { userInfo } = useUserStore()

const activeName = ref('operate')
const maxHeight = ref(`${document.documentElement.clientHeight - 143}px`)

// 登录日志数据
const loginRef = ref()
const loginList = ref<LoginItem[]>([])
const loginObj = ref<LoginList>()

const logRef = ref()
const logList = ref<LogItem[]>([])
const logObj = ref<LogList>()

const loading = ref<boolean>(false)

function changeTab(name: string) {
  if (name === 'login') {
    loginList.value = []
    loginObj.value = {} as any
    getLoginList()
  }
  else {
    logList.value = []
    logObj.value = {} as any
    getLogList()
  }
}

const windowInnerHeight = document.documentElement.clientHeight
const size = Math.ceil((windowInnerHeight - 170) / 36.8)

// 获取登录日志列表
async function getLoginList() {
  loading.value = true
  const { data } = await getLoginLog(size, Number(loginObj.value?.nextPos))
  data.items.map((item) => {
    item.info.createdAt = formatDate(item.info.createdAt, 'YYYY/MM/DD HH:mm:ss')
  })
  setTimeout(() => {
    loading.value = false
    loginList.value = [...loginList.value, ...data.items]
    loginObj.value = data
  }, 1000)
}

// 获取操作日志列表
async function getLogList() {
  loading.value = true

  const { data } = await getOpLog(0, size, Number(logObj.value?.nextPos), 0, 0, '', userInfo.id)
  data.items.map((item) => {
    item.info.createdAt = formatDate(item.info.createdAt, 'YYYY/MM/DD HH:mm:ss')
  })
  setTimeout(() => {
    loading.value = false
    logList.value = [...logList.value, ...data.items]
    logObj.value = data
  }, 1000)
}

// 监听滚动
function handleScroll(e: { scrollLeft: number, scrollTop: number, scrollBottom: number }) {
  if (activeName.value === 'operate') {
    const scrollHeight = logRef.value.$el.offsetTop
    // 滚动到底部时
    if (scrollHeight <= e.scrollTop) {
      if (logObj.value?.hasNext && !loading.value)
        getLogList()
    }
  }
  else {
    const scrollHeight = loginRef.value.$el.offsetTop
    // 滚动到底部时
    if (scrollHeight <= e.scrollTop) {
      if (loginObj.value?.hasNext && !loading.value)
        getLoginList()
    }
  }
}

onMounted(() => {
  getLogList()
})
</script>

<template>
  <div class="my-wrap flex-row-center">
    <navbar title="系统设置" />
    <div class="con">
      <el-tabs v-model="activeName" class="system-tab" @tab-change="changeTab">
        <el-tab-pane label="操作日志" name="operate">
          <template #label>
            <div class="flex-row-center">
              <span class="font-400">操作日志</span>
            </div>
          </template>
          <el-scrollbar max-height="85vh" @scroll="handleScroll">
            <OperateLog ref="logRef" :list="logList" :loading="loading" />
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="登录日志" name="login">
          <template #label>
            <div class="flex-row-center">
              <span class="font-400">登录日志</span>
            </div>
          </template>
          <el-scrollbar key="login" max-height="85vh" @scroll="handleScroll">
            <LoginLog ref="loginRef" :list="loginList" :loading="loading" />
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.my-wrap {
  flex-direction: column;
  .con {
    width: 100%;
    margin-top: -10px;
  }
}
</style>

<style lang="scss">
.system-tab {
  .el-tabs__item {
    margin-right: 24px;
  }
}
</style>
