<script setup lang="ts">
import { reactive, ref } from 'vue'
import example from '../components/example.vue'
import api from '../components/Api.vue'

const form1Ref = ref()
const data1 = ref({
  name: '',
  names: [],
  sex: 1,
  enable: true,
  deep: {
    value: '',
  },
  class: '1',
  date: null,
})

const state = reactive({
  size: 'default',
  view: false,
  labelAlign: 'right',
})

const itemsObj = ref({
  group: { type: 'group', label: '节点信息' },
  sex: { field: 'sex', type: 'select', label: '性别', tips: '小提示', options: [{ label: '显示', value: 1 }, { label: '隐藏', value: 0 }] },
  name: { field: 'name', type: 'input', label: '名称', tips: '这是一个小提示！', placeholder: '请输入名称', rules: [{ required: true, message: '名称不能为空' }], show: true },
})

// 字段更新时的回调
function onChange(path: string, val: any) {
  if (path === 'sex')
    itemsObj.value.name.show = !!val
}

// 异步获取 select-sync 的下拉列表
function queryOptionsPromise() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([{ label: '一班', value: '1' }, { label: '二班', value: '2' }])
    }, 3000)
  })
}
</script>

<template>
  <div>
    <h1>BForm 高级表单</h1>

    <h2>基本使用</h2>
    <example>
      表单值：{{ data1 }}<br><br>
      尺寸：
      <a-radio-group v-model:value="state.size">
        <a-radio value="default">
          default
        </a-radio>
        <a-radio value="large">
          large
        </a-radio>
      </a-radio-group>
      <br><br>
      查看模式：<a-switch v-model:checked="state.view" :checked-value="true" :un-checked-value="false" checked-children="开" un-checked-children="关" />
      <br><br>
      Label 对齐方式：
      <a-radio-group v-model:value="state.labelAlign">
        <a-radio value="left">
          left
        </a-radio>
        <a-radio value="right">
          right
        </a-radio>
      </a-radio-group>
      <br><br>

      <b-form
        ref="form1Ref"
        v-model="data1"
        :items="[
          { label: '名称', field: 'name', type: 'input', width: '100%', placeholder: '请输入名称...', tips: '这是一个小提示！', rules: [{ required: true, message: '名称不能为空' }] },
          { label: '性别', field: 'sex', type: 'select', width: '100%', options: [{ label: '男', value: 1 }, { label: '女', value: 0 }], rules: [{ required: true, message: '' }] },
          { label: '班级', field: 'class', type: 'select-sync', width: '100%', tips: '测试', queryOptions: queryOptionsPromise },
          { label: '启用', field: 'enable', type: 'switch', width: '100%', tips: '测试2', style: 'justify-content: center;', rules: [{ required: true, message: '' }] },
          { label: '深度对象', field: 'deep.value', type: 'input', width: '100%', placeholder: '支持对象路径作为field，如: deep.value', rules: [{ required: true, message: '必填字段' }] },
          { label: '深度对象2', field: 'deep.value', type: 'input', width: '100%', placeholder: '支持对象路径作为field，如: deep.value', rules: [{ required: true, message: '必填字段' }] },
          { field: 'names', type: 'personSelect', label: '禁用项', disabled: true, width: '100%' },
          { field: '进度', type: 'input-number', label: '进度', suffix: '%', inputSuffix: '%', width: '100%' },
          { field: 'date', type: 'range-picker', label: '新版日期选择', suffix: '%', inputSuffix: '%', width: '100%' },
        ]"
        :label-col="{ style: { width: '80px' } }"
        :size="state.size"
        :label-align="state.labelAlign"
        :view="state.view"
        column
      />
      <a-button type="primary" style="margin-left: 120px" @click="() => form1Ref?.validate()">
        确定
      </a-button>
    </example>

    <h2>垂直布局</h2>
    <example>
      <b-form
        v-model="data1"
        :items="[
          { field: 'name', type: 'input', label: '名称', tips: '这是一个小提示！', rules: [{ required: true, message: '名称不能为空' }] },
          { field: 'sex', type: 'select', label: '性别', options: [{ label: '男', value: 1 }, { label: '女', value: 0 }], rules: [{ required: true, message: '' }], disabled: true },
          { field: 'enable', type: 'switch', label: '启用', rules: [{ required: true, message: '' }] },
        ]"
        layout="vertical"
      />
    </example>

    <h2>自定义插槽</h2>
    <p>
      1. item 内容插槽：名称为 field 字段值，但是如果插槽字段 field 的值为路径(如: deep.value)，路径中的点替换为 "-" (如: deep-value);<br>
      2. label 插槽：${field}-label (如: deep-value-label);<br>
      3. label 右侧插槽：${field}-label-right (如: deep-value-label-right);
    </p>
    <example>
      <b-form
        v-model="data1"
        :items="[
          { field: 'name', type: 'input', label: '名称', rules: [{ required: true, message: '名称不能为空' }] },
          { field: 'sex', type: 'select', label: '性别', options: [{ label: '男', value: 1 }, { label: '女', value: 0 }], rules: [{ required: true, message: '' }] },
          { field: 'enable', type: 'switch', label: '启用', labelRight: '在 items 中直接传入 labelRight 参数', rules: [{ required: true, message: '' }] },
          { field: 'deep.value', type: 'slot', label: '节点支持关闭、重启', tips: '这是一个小提示！' },
        ]"
        layout="vertical"
        style="width: 386px"
      >
        <template #name-label>
          ${field}-label 插槽
        </template>
        <template #sex-label-right>
          ${field}-label-right 插槽：<a-button type="link">
            Link Button
          </a-button>
        </template>
        <template #deep-value-label-right>
          ${field}-label-right 插槽：<a-switch />
        </template>
        <template #deep-value>
          <a-button style="width: 100%;">
            ${field} 内容插槽
          </a-button>
        </template>
      </b-form>
    </example>

    <h2>分组标题、分隔线</h2>
    <example style="padding-top: 0;padding-bottom: 0;padding-left: 16px;">
      <b-form
        ref="form1Ref"
        v-model="data1"
        :items="[
          { type: 'group', label: '节点信息' },
          { field: 'name', type: 'input', label: '名称', tips: '这是一个小提示！', rules: [{ required: true, message: '名称不能为空' }] },
          { field: 'sex', type: 'select', label: '性别', options: [{ label: '男', value: 1 }, { label: '女', value: 0 }], rules: [{ required: true, message: '' }] },
          { type: 'line' },
          { type: 'group', label: '节点信息' },
          { field: 'enable', type: 'switch', label: '启用', rules: [{ required: true, message: '' }] },
          { field: 'deep.value', type: 'input', label: '深度对象', placeholder: '支持对象路径作为field，如: deep.value', rules: [{ required: true, message: '名称不能为空' }] },
        ]"
        layout="vertical"
        style="width: 386px"
      />
    </example>

    <h2>动态显示、隐藏 item</h2>
    <p>⚠️ Ant 组件暂未支持</p>
    <br>
    <example style="padding-top: 0;padding-bottom: 0;padding-left: 16px;">
      <b-form
        ref="form1Ref"
        v-model="data1"
        :items="itemsObj"
        layout="vertical"
        style="width: 386px"
        @change="onChange"
      />
    </example>

    <!-- <h2>字段高亮</h2>
    <br>
    <example style="padding-top: 0;padding-bottom: 0;padding-left: 16px;">
      <br>
      <a-button type="primary" @click="itemsObj.sex.highlight = true">
        性别高亮
      </a-button>
      <b-form
        ref="form1Ref"
        v-model="data1"
        :items="itemsObj"
        layout="vertical"
        style="width: 386px"
        @change="onChange"
      />
    </example> -->

    <h2>API</h2>
    <api
      :data="[
        ['v-model/modelValue', '绑定对象值', 'object', '{}'],
        ['items', '字段配置，详情查看下面的 Props.items', 'array', '[]'],
      ]"
      title="Props"
      p="支持原生 a-form Props。"
      default
    />
    <api
      :data="[
        ['change', '字段更新的回调，参数：(path: 字段路径, value: 新值)', ''],
      ]"
      title="Events"
      p="支持原生 a-form Event。"
    />
    <api
      :data="[
        ['field', '绑定对象值key', 'string', ''],
        ['type', '显示类型，如: input|select|select-sync|switch|group|line', 'string', ''],
        ['label', '表单label', 'string'],
        ['options?', 'type为select时的选项数组', 'array'],
        ['rules?', '表单校验规则', 'array'],
        ['tips?', 'label右侧的小提示', 'string'],
        ['labelRight?', '垂直排列时右侧文本', 'string'],
        ['show?', '是否显示，undefined 和 true 为显示', 'boolean'],
      ]"
      title="Props.items"
    />
    <api
      :data="[
        ['${field}', '表单item内容'],
        ['${field}-label', '表单item的 label 区域'],
        ['${field}-label-right', '表单item的 label 的右侧区域'],
      ]"
      title="Slots"
    />
    <api
      :data="[['validate', '表单校验', 'function', '{}']]"
      title="Exposes"
    />
  </div>
</template>
