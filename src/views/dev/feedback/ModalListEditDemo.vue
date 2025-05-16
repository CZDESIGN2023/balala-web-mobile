<script setup lang="ts">
import { ref } from 'vue'
import example from '../components/example.vue'
import api from '../components/Api.vue'

const arr = ref([{ label: '自定义原因1', value: Math.random() }, { label: '预设不可编辑', value: Math.random(), default: true },
])
</script>

<template>
  <h1>ModalListEdit 弹窗列表编辑</h1>

  <h2>基本使用</h2>
  <example>
    <ModalListEdit
      v-model="arr"
      name="重启"
      title="重启原因"
      add-text="增加原因"
      :validate="(val: any) => {
        return 'abc'
      }"
    />
  </example>

  <h2>自定义按钮</h2>
  <p>默认插槽可自定义显示按钮。</p>
  <example>
    <ModalListEdit v-model="arr" name="重启" title="重启原因" add-text="增加原因">
      <template #default="{ open }">
        <a-button type="primary" @click="open">
          自定义按钮
        </a-button>
      </template>
    </ModalListEdit>
  </example>

  <h2>API</h2>
  <api
    :data="[
      ['model-value/v-model', '选项列表', 'array', []],
      ['title', '弹窗标题', 'string', ''],
      ['add-text', '增加按钮文本', 'string', ''],
      ['search-placeholder', '搜索 placeholder', 'string', ''],
    ]"
    title="Props"
    default
  />
</template>
