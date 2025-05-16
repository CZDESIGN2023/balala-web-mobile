<script setup lang="ts">
import { ref } from 'vue'
import example from '../components/example.vue'
import api from '../components/Api.vue'

const statusRef = ref()
const data = ref()
const spaceId = ref('1601')
</script>

<template>
  <h1>SelectStatus 任务状态下拉</h1>
  <p>自定义 spaceId 测试：<a-input v-model:value="spaceId" class="w100" /></p>
  <example>
    <SelectStatus ref="statusRef" v-model="data" :space-id="spaceId" edit create class="w260" />
    <a-button type="primary" class="ml8" @click="() => statusRef.refresh()">
      刷新
    </a-button>
  </example>
</template>
