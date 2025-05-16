<script lang="ts" setup>
import { ref } from 'vue'
import example from '../components/example.vue'

const value1 = ref(['2024/07/15', '2025/07/15'])
</script>

<template>
  <div>
    <h1>Date Range 日期范围选择器</h1>

    <h2>基本使用</h2>
    <example>
      <BRangePicker v-model:value="value1" />
    </example>

    <h2>宽度不足</h2>
    <example>
      <ul>
        <li>隐藏后缀图标</li>
        <li>超出...增加 tooltip </li>
      </ul>
      <br>
      <BRangePicker v-model:value="value1" suffix-icon="" class="w120" />
    </example>

    <h2>自定义显示格式</h2>
    <example>
      <p>显示为：MM/DD</p>
      <BRangePicker v-model:value="value1" format="MM/DD" suffix-icon="" class="w140" />
    </example>

    <h2>结尾日期 23:59:59</h2>
    <example>
      <p>{{ value1 }}</p>
      <BRangePicker v-model:value="value1" format="MM/DD" suffix-icon="" class="w140" />
    </example>

    <h2>disabled 状态</h2>
    <example>
      <p>{{ value1 }}</p>
      <BRangePicker v-model:value="value1" disabled />
    </example>
  </div>
</template>
