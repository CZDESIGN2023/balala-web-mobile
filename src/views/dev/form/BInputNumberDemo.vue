<script setup lang="ts">
import { ref } from 'vue'
import example from '../components/example.vue'

const value = ref(10)
</script>

<template>
  <div>
    <h1>BInputNumber 数字输入框</h1>

    <h2>基本用法</h2>
    <example>
      <b-input-number v-model:value="value" :min="0" :max="100" suffix="%" placeholder="请输入内容..." style="height: 36px" />
    </example>
  </div>
</template>
