<script setup lang="ts">
import { ref } from 'vue'
import example from '../components/example.vue'
import api from '../components/Api.vue'

const selectSyncRef = ref()
const options: any = ref([])

function onSetOptions() {
  options.value = [{ label: 'yes', value: 1 }]
}

// 同步获取
function queryOptions() {
  console.log('同步获取下拉列表')
  if (options.value.length > 0)
    return options.value

  return 'waiting'
}

// 异步获取
function queryOptionsPromise() {
  console.log('执行')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([{ label: 'yes', value: 1 }])
    }, 3000)
  })
}

// setOptions 设置下拉
function onExposeSetOptions() {
  selectSyncRef.value.setOptions([{ label: '新的下拉列表', value: 'new' }])
}
</script>

<template>
  <h1>BSelectSync 异步下拉</h1>

  <h2>同步获取下拉列表</h2>
  <p>按下蓝色按钮给下拉列表赋值，如果返回的列表是 string，每隔 100 毫秒会重新调用 prop queryOptions 来获取下拉列表。</p>
  <example>
    <a-button type="primary" @click="onSetOptions">
      设置下拉列表
    </a-button>
    <br>
    <br>
    <b-select-sync :query-options="queryOptions" placeholder="请选择一个项目" />
  </example>

  <h2>异步获取下拉列表</h2>
  <p>当传入的 queryOptions 参数是一个 Promise，就会等待 Promise 给值。</p>
  <example>
    <b-select-sync :query-options="queryOptionsPromise" placeholder="请选择一个项目" />
  </example>

  <h2>动态设置下拉列表</h2>
  <p>通过 expose 方法 setOptions 设置下拉列表。</p>
  <example>
    <a-button type="primary" @click="onExposeSetOptions">
      设置下拉列表
    </a-button>
    <br>
    <br>
    <b-select-sync ref="selectSyncRef" :query-options="queryOptionsPromise" placeholder="请选择一个项目" />
  </example>

  <h2>插槽</h2>
  <p>支持原生 a-select 插槽，下例中自定义了 clearIcon 插槽。</p>
  <example>
    <b-select-sync :query-options="queryOptionsPromise" placeholder="请选择一个项目" allow-clear>
      <template #clearIcon>
        c
      </template>
    </b-select-sync>
  </example>

  <h2>API</h2>
  <api
    :data="[
      ['query-options', '获取 options 列表的 方法', 'function'],
    ]"
    title="Props"
    p="支持原生 a-select 的 props。"
    default
  />
  <api
    :data="[
      ['setOptions', '设置 options 列表的 方法', 'function'],
    ]"
    title="Expose"
  />
  <api
    title="Events"
    p="支持原生 a-select 的 Event。"
  />
</template>
