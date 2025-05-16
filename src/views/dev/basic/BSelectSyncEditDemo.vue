<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import example from '../components/example.vue'
import api from '../components/Api.vue'
import { useProjectStore } from '@/stores/modules/project'

const projectStore = useProjectStore()
const value = ref()

// 获取列表
async function onQueryOptions() {
  const temp = await projectStore.getProjectModuleList('708')
  return temp?.map((item) => {
    return Object.assign(item, { label: item.workObjectName, value: item.id })
  })
}

// 获取列表
async function onQueryOptionsAndPreset() {
  const temp = await projectStore.getProjectModuleList('708')
  return [
    ...temp!.map((item) => {
      return Object.assign(item, { label: item.workObjectName, value: item.id })
    }),
    { label: '预设项目预设项目预设项目预设项目预设项目', value: '1', preset: true },
  ]
}

async function onUpdateLabel(moduleItem: any) {
  console.log(moduleItem)
  message.warning(`更新item: ${moduleItem.label}`)
}

function onAdd(name: string) {
  message.warning(`新增item: ${name}`)
}
</script>

<template>
  <h1>BSelectSyncEdit 异步下拉 + 编辑</h1>
  <h2>基本使用</h2>
  <example>
    <b-select-sync-edit
      v-model="value"
      :query-options="onQueryOptions"
      style="width: 220px;"
      search-placeholder="搜索模块名称"
      edit-placeholder="请输入模块名"
      placeholder="请选择任务所属模块"
      add-text="添加模块"
      edit
      create
      @update-label="onUpdateLabel"
      @add="onAdd"
    />
  </example>

  <h2>配置预设项</h2>
  <example>
    <b-select-sync-edit
      v-model="value"
      :query-options="onQueryOptionsAndPreset"
      style="width: 220px;"
      search-placeholder="搜索模块名称"
      placeholder="请选择任务所属模块"
      add-text="添加模块"
      edit
      create
      @update-label="onUpdateLabel"
      @add="onAdd"
    />
  </example>

  <h2>API</h2>
  <api
    :data="[
      ['v-model/model-value', '指定当前选中的条目', 'string|number', 'null'],
      ['query-options', '获取 options 列表的方法', 'function|promise', '() => []'],
      ['edit', '是否可编辑', 'boolean', 'false'],
      ['create', '是否可新增', 'boolean', 'false'],
      ['validator', '值校验方法', 'function', '默认校验:2 ~ 14个字符'],
    ]"
    title="Props"
    default
  />

  <api
    :data="[
      ['update:model-value', '更新值'],
      ['update-label', '编辑 item 后的回调，参数: (当前item)'],
      ['add', '新增 item 后的回调，参数: (item名称)'],
    ]"
    title="Events"
  />
</template>
