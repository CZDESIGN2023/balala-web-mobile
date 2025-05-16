<script lang="ts" setup>
import { ref } from 'vue'
import example from '../components/example.vue'

const test = ref([{ value: '42', label: '42自造数据', avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png' }])

function onQueryOptions() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          value: '42',
          label: '42自造数据',
          description: 'userName42',
          avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png',
        },
        {
          value: '43',
          label: '43自造数据3',
          description: 'userName43',
          avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png',
        },
        {
          value: '44',
          label: '44自造数据3',
          description: 'userName44',
          avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png',
        },
        {
          value: '45',
          label: '45自造数据',
          description: 'userName45',
          avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png',
        },
        {
          value: '46',
          label: '46自造数据3',
          description: 'userName46',
          avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png',
        },
        {
          value: '47',
          label: '47自造数据',
          description: 'userName47',
          avatar: 'https://api.balala.eatdesk.net/avatar/20240329/212/fbabfe54fb6de1384ebfd3f9d3fe5558_150612.png',
        },
      ])
    }, 1000)
  })
}
</script>

<template>
  <h1>BFormPersonSelect 成员选择</h1>
  <h2>基本使用</h2>
  <example>
    <p>尺寸: 默认</p>
    <BFormPersonSelect
      v-model:value="test"
      :query-options="onQueryOptions"
      :max-tag-count="1"
      placeholder="请选择..."
      style="width: 260px;"
    />
    <br>
    <br>
    <BFormPersonSelect
      :value="[]"
      :query-options="onQueryOptions"
      :max-tag-count="1"
      placeholder="请选择..."
      style="width: 260px;"
    />
    <br>
    <br>
    <p>尺寸: large</p>
    <BFormPersonSelect
      :value="[]"
      :query-options="onQueryOptions"
      size="large"
      placeholder="请选择..."
      style="width: 260px;"
    />
    <br>
    <br>
    <BFormPersonSelect
      v-model:value="test"
      :query-options="onQueryOptions"
      size="large"
      placeholder="请选择..."
      style="width: 260px;"
    />
  </example>

  <h2>单选</h2>
  <example>
    <p>{{ test }}</p>
    <BFormPersonSelect
      v-model:value="test"
      :query-options="onQueryOptions"
      :max-tag-count="1"
      placeholder="请选择..."
      style="width: 260px;"
      single
    />
  </example>

  <h2>显示删除 x</h2>
  <example>
    <BFormPersonSelect
      v-model:value="test"
      :query-options="onQueryOptions"
      placeholder="请选择..."
      closable
    />
  </example>

  <h2>限制显示范围</h2>
  <example>
    <BFormPersonSelect
      v-model:value="test"
      :query-options="onQueryOptions"
      :display-range="['43', '44', '45']"
      placeholder="请选择..."
    />
  </example>
</template>
