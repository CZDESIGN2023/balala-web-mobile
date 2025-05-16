<!-- 输入框 -->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  // 样式名
  className: '',
  // 聚焦后样式
  focusClass: 'foucus-white',
  // 默认值
  value: '',
  width: 258,
  height: 40,
  placeholder: '',
  // 图标
  suffix: '',
  // 字体大小
  fs: '14',
  // 是否空值校验
  validateInput: false,
})

const emits = defineEmits(['on-check'])

interface Props {
  className?: string
  focusClass?: string
  value?: string
  width?: number | string
  height?: number | string
  placeholder?: string
  suffix?: string
  fs?: string
  validateInput?: boolean
}

const inputOldValue = ref<string>('')
const inputValue = ref<string>('')

function getClassNames() {
  isEditStu.value = props.suffix == 'edit'
  classNames.value = props.validateInput ? 'red-border' : props.className
}

// 输入框失焦
function onBlur() {
  getClassNames()
  const isChange = inputValue.value === inputOldValue.value
  emits('on-check', isChange, inputOldValue.value, inputValue.value)
  inputOldValue.value = inputValue.value
}

let isEditStu = ref<boolean>(false)
const editRef = ref<any>(null)
// 修改编辑状态
function changeEditStu() {
  isEditStu.value = false

  nextTick(() => {
    editRef.value?.focus()
  })
}

let classNames = ref<string>('')

watch(
  () => props.value,
  (newVal) => {
    inputValue.value = newVal
  },
  {
    immediate: true,
  },
)

watch(
  () => props.suffix,
  (newVal) => {
    isEditStu.value = newVal == 'edit'
  },
  {
    immediate: true,
  },
)

watch(
  () => props.className,
  (newVal) => {
    classNames.value = newVal
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <!-- 仅可读 -->
  <div v-if="isEditStu" class="b-input edit-icon" :class="classNames">
    <a-input
      v-model:value="inputValue"
      :style="{ width: `${width}px`, height: `${height}px`, fontSize: `${fs}px` }"
      :placeholder="placeholder"
      readonly
    >
      <template #suffix>
        <!-- 悬浮显示编辑 -->
        <svg-icon
          v-if="classNames.includes('hover-block')"
          class="pointer edit-svg"
          name="edit"
          size="16"
          color="#333333"
          @click="changeEditStu"
        />

        <svg-icon
          v-else
          class="pointer"
          name="edit"
          size="16"
          color="#333333"
          @click="changeEditStu"
        />
      </template>
    </a-input>
  </div>

  <!-- 可编辑 -->
  <div v-else class="b-input" :class="classNames">
    <a-input
      ref="editRef"
      v-model:value="inputValue"
      :style="{ width: `${width}px`, height: `${height}px`, fontSize: `${fs}px` }"
      :placeholder="placeholder"
      @focus="classNames = focusClass || className"
      @blur="onBlur"
    >
      <template #suffix />
    </a-input>
  </div>
</template>

<style lang="scss" scoped>
.b-input {
  .ant-input-affix-wrapper {
    caret-color: #1d74f5;
  }

  // .ant-input-affix-wrapper:hover {
  //     border: 2px solid #1D74F5;
  // }
}

// 无边框
.no-border {
  :deep() {
    .ant-input-affix-wrapper {
      border: 2px solid #fff;
      box-sizing: border-box;
    }
  }
}

// 灰色背景
.gray-bg {
  :deep() {
    .ant-input {
      background-color: $color-border-main;
    }

    .ant-input-affix-wrapper {
      border: 2px solid #fff;
      background-color: $color-border-main;
    }
  }
}

// 浅灰色
.light-gray {
  :deep() {
    .ant-input {
      background-color: #f7f8fa;
    }

    .ant-input-affix-wrapper {
      border: 2px solid #fff;
      background-color: #f7f8fa;
    }
  }
}

// 悬浮显示编辑
.edit-svg {
  display: none;
}

.hover-block:hover {
  .edit-svg {
    display: block;
  }
}

// 悬浮-灰色
.hover-gray {
  :deep() {
    .ant-input-affix-wrapper:hover {
      background-color: $color-border-main;
      border: 2px solid #fff;

      .ant-input {
        background-color: $color-border-main;
      }
    }
  }
}

// 聚焦-白色
.foucus-white {
  :deep() {
    .ant-input-affix-wrapper {
      border: 2px solid #1d74f5;
      background-color: #fff;
      box-shadow: none;

      .ant-input {
        background-color: #fff;
      }
    }
  }
}

// 编辑带图标
.edit-icon {
  :deep() {
    .ant-input-affix-wrapper-focused {
      box-shadow: none;
    }
  }
}
</style>
