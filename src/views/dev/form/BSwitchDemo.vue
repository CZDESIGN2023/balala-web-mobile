<script setup lang="ts">
import { ref } from 'vue'
import example from '../components/example.vue'

const value = ref(true)
</script>

<template>
  <div>
    <h1>BSwitch 开关</h1>

    <h2>基本用法</h2>
    <example>
      <p>小尺寸</p>
      <BSwitch v-model:checked="value" size="small" />
      <p>默认尺寸</p>
      <BSwitch v-model:checked="value" />
    </example>

    <h2>禁用状态</h2>
    <example>
      <p>小尺寸</p>
      <BSwitch v-model:checked="value" size="small" disabled />
    </example>
  </div>
</template>
