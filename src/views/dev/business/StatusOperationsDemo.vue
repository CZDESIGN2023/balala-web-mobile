<script setup lang="ts">
import example from '../components/example.vue'
import type { TableTaskItem } from '@/api/interface'

const data = [
  { text: '状态1', status: 1, allowNode: true },
  { text: '状态2', status: 2, allowNode: true },
  { text: '状态3', status: 3, allowNode: true },
  { text: '状态4', status: 4, allowNode: true },
  { text: '状态5', status: 5, allowNode: true },
  { text: '状态6', status: 6, allowNode: true },
  { text: '状态7', status: 7, allowNode: true },
  { text: '状态8', status: 8, allowNode: true },
  { text: '状态9', status: 9, allowNode: true },
  { text: '状态10', status: 10, allowNode: true },
  { text: '子任务，状态2(父任务已完成)', status: 2, parentStatus: 2, allowNode: true },
  { text: '子任务，状态2(父任务进行中)', status: 2, parentStatus: 1, allowNode: true },
  { text: '状态1（无权限）', status: 1 },
]
</script>

<template>
  <div>
    <h1>Status Operations 表格列状态操作</h1>
    <h2>基本使用</h2>
    <example>
      <template v-for="d in data" :key="d.text">
        {{ d.text }}：<BStatusOperations :row="d as unknown as TableTaskItem" />
      </template>
    </example>

    <h2>宽度不足</h2>
    <example>
      <template v-for="d in data" :key="d.text">
        {{ d.text }}：
        <div style="width: 40px;">
          <BStatusOperations :row="d as unknown as TableTaskItem" text-wrap="wrap" mini-hover />
        </div>
      </template>
    </example>
  </div>
</template>
