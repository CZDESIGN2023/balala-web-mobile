<script setup lang="ts">
import example from '../components/example.vue'

const options = [
  { label: '选项1', value: 1 },
  { label: '选项2', value: 2 },
  { label: '选项3', value: 3 },
]
</script>

<template>
  <div>
    <h1>BSelect 选择器</h1>
    <p>除样式外，Props、Events、Exposes、插槽与 ASelect 一致。</p>
    <example>
      <p>默认尺寸</p>
      <b-select
        :options="options"
        style="width: 220px;"
        placeholder="请选择..."
      />
      <p>大尺寸</p>
      <b-select
        :options="options"
        style="width: 220px;"
        placeholder="请选择..."
        size="large"
      />
    </example>
  </div>
</template>
