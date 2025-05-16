<script setup lang="ts">
import { message } from 'ant-design-vue'
import { onMounted, ref } from 'vue'
import type { TableTaskItem } from '@/api/interface'
import { editWorkProgress } from '@/api/project'

const props = withDefaults(defineProps<Props>(), {
  row: () => {
    return {} as TableTaskItem
  },
})

const emit = defineEmits(['removeItem', 'success'])

interface Props {
  row: TableTaskItem
}

const BInputNumberRef = ref()
onMounted(() => {
  BInputNumberRef.value.focus()
})

// 失焦更改进度值
async function changeRate() {
  const record = props.row
  await editWorkProgress(record.spaceId as string, record.key as string, record.processRate)
  message.success('进度修改成功', 2)
  emit('success', [record.key])
  emit('removeItem')
}
</script>

<template>
  <div class="processrate-box processrate-input">
    <BInputNumber
      ref="BInputNumberRef"
      v-model:value="row.processRate"
      suffix="%"
      size="large"
      clear-restore
      view
      @change="changeRate"
    />
  </div>
</template>

<style lang="scss" scoped>
.processrate-box {
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  position: absolute;
  background: #fff;
  z-index: 88;
  left: 2px;
  top: 2px;
  &:hover {
    div {
      color: $color-primary;
    }
  }
  :deep(.b-input2) {
    width: 100%;
    height: 100%;
    border-radius: 0;
    padding-left: 6px;
    caret-color: $color-primary;
    padding-left: 6px !important;
    background: #fff;
    &:hover,
    .ant-input:hover,
    .ant-input {
      background: #fff !important;
    }
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
    &:hover {
      background: #fff;
    }
  }
}
</style>
