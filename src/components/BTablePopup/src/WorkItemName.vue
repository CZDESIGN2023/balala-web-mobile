<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { getTextLength } from '@/utils'
import { editWorkName } from '@/api/project'
import type { TableRowData } from '@/views/project/types/table'

interface Props {
  row: TableRowData
}

const props = withDefaults(defineProps<Props>(), {
  row: () => {
    return {} as TableRowData
  },
})

const emit = defineEmits(['removeItem', 'success'])

const inputRef = ref()
let rawWorkItemName = ''

async function changeName() {
  const record = props.row
  // 任务名称失去焦点
  const name = (record.workItemName as string).trim()
  record.workItemName = name
  const length = getTextLength(name)
  // 任务名称为空或者任务名称没有变化
  if (!/\S/.test(record.workItemName as string) || record.workItemName === rawWorkItemName) {
    record.workItemName = rawWorkItemName
  }
  else if (!(length >= 2 && length <= 200)) {
    message.error('请输入任务名称(2 ~ 200个字符)', 3)
    record.workItemName = rawWorkItemName
  }
  else {
    // 更改
    try {
      await changeTaskName(record, name)
    }
    catch (e) {
      record.workItemName = rawWorkItemName
    }
  }
}

// 更改任务名称
async function changeTaskName(record: TableRowData, name: string) {
  await editWorkName(record.spaceId || '', record.id || '', name)
  message.success('任务名称修改成功', 2)
  emit('success', [record.id])
}

function onFocus() {
  rawWorkItemName = props.row.workItemName
}
</script>

<template>
  <div class="taskname-box taskname-input">
    <a-input
      ref="inputRef"
      v-model:value="row.workItemName"
      v-bind="$attrs"
      v-focus
      :data-name="row.workItemName"
      :bordered="false"
      class="pl12 text14 title-color"
      placeholder="任务名称"
      @focus="onFocus"
      @blur="changeName"
      @press-enter="inputRef.blur()"
    />
  </div>
</template>

<style lang="scss" scoped>
.taskname-box {
  width: 100%;
  height: 36px;
  position: relative;
  top: 0px;
  left: 0;
  z-index: 2;

  .ant-input {
    width: 100%;
    height: 100%;
    border-radius: 0;
    padding-left: 12px;

    &:focus {
      box-shadow: 0 0 0 2px $color-primary;

      &:hover {
        background: #fff;
      }
    }

    &:read-only {
      box-shadow: 0 0 0 0px $color-primary;
      cursor: pointer;
    }
  }

  .reseted-btn {
    width: 52px;
    height: 20px;
    border-radius: 12px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0px 8px;
    margin-right: 2px;
    background: $color-input;
    font-size: 12px;
    color: $color-main;
    transform: translateY(-1px);
  }

  &:hover {
    div {
      color: $color-primary;
    }
  }
}

.taskname-input {
  width: calc(100% - 3.2px);
  height: calc(100% - 3.2px);
  position: absolute;
  background: #fff;
  z-index: 88;
  left: 1.6px;
  top: 1.6px;
}
</style>
