<script lang="ts" setup>
import { ref } from 'vue'
import example from '../components/example.vue'

const value = ref(['42'])
const value1 = ref(['21'])
const value2 = ref(['94'])
</script>

<template>
  <h1>BusinessPersonSelect 人员选择组件</h1>

  <h2>基本使用</h2>
  <example>
    <BusinessPersonSelect v-model:value="value" space-id="1601" />
  </example>

  <h2>替换当前用户昵称，并前置</h2>
  <example>
    <BusinessPersonSelect v-model:value="value1" space-id="1601" current-label="当前登录用户" />
  </example>

  <h2>增加创建人选项</h2>
  <example>
    <BusinessPersonSelect v-model:value="value2" space-id="1601" creator />
  </example>

  <h2>尺寸：large</h2>
  <example>
    <BusinessPersonSelect v-model:value="value2" space-id="1601" size="large" creator />
  </example>
</template>
