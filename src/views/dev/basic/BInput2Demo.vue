<script setup lang="ts">
import { ref } from 'vue'
import example from '../components/example.vue'

const text = ref()
const rollbackRef = ref()
</script>

<template>
  <div>
    <h1>BInput2 输入框</h1>
    <p>除样式外，Props、Events、Exposes 与 AInput 一致，插槽支持：suffix，其它暂未增加，需要可以自行增加。</p>

    <h2>基本用法</h2>
    <example>
      <p>1. 默认尺寸</p>
      <b-input2 v-model:value="text" placeholder="请输入内容..." />
      <br>
      <p>2. 大尺寸</p>
      <b-input2 v-model:value="text" placeholder="请输入内容..." size="large" />
    </example>

    <h2>suffix 插槽</h2>
    <example>
      <p>1. 同时带后缀图标和清空按钮</p>
      <b-input2 v-model:value="text" placeholder="请输入内容..." size="large" allow-clear>
        <template #suffix>
          <svg-icon name="search3" size="16px" />
        </template>
      </b-input2>
      <br>
      <p>2. 只有清空按钮，默认尺寸</p>
      <b-input2 v-model:value="text" placeholder="可清空..." allow-clear />
      <br>
      <p>2. 只有清空按钮，大尺寸</p>
      <b-input2 v-model:value="text" placeholder="可清空..." size="large" allow-clear />
    </example>

    <h2>回滚到上一次修改的值</h2>
    <example>
      <p>先修改，再回滚</p>
      <b-input2 ref="rollbackRef" v-model:value="text" placeholder="可清空..." allow-clear />
      <br>
      <br>
      <a-button type="primary" @click="rollbackRef?.rollback">
        回滚
      </a-button>
    </example>
  </div>
</template>
