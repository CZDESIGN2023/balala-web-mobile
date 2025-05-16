<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { myPendingWork } from '@/api/user'

const state = reactive({
  loading: false,
  list: [] as any[],
})

// 获取 待办 骨架数据
async function getTodoIds() {
  try {
    state.loading = true
    const response = await myPendingWork()
    const { items = [] } = response.data
    state.list = items
  }
  catch (error) {
    state.loading = false
  }
}

onMounted(() => {
  getTodoIds()
})
</script>

<template>
  <div class="notice-todo">
    <el-scrollbar height="635px">
      <div class="list">
        <div v-for="item in state.list" :key="item" :data-id="item" class="item">
          <BSkeleton :loading="true" mode="avatar" height-class="h121">
            231
          </BSkeleton>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.notice-todo {
  .list {
    padding: 0 12px;
  }
  .item {
    width: 100%;
    margin-top: 8px;
    padding: 0px 12px;
  }
}
</style>
