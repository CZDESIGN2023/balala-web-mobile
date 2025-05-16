<script lang="ts" setup>
import { nextTick, ref, shallowReactive, shallowRef, watch } from 'vue'

const { placeholder } = defineProps({
  placeholder: {
    type: String,
    default: '请输入关键字查询',
  },
})

const emits = defineEmits<{
  /**
   * 更新数据
   * @param val
   */
  change: [val: any, isChange: boolean]
}>()

interface TSSeachSRt {
  // 是否显示查找按钮
  showBtn: boolean
  // 输入内容
  searchVal: string
}

const taskSearchSRt = shallowReactive<TSSeachSRt>({
  showBtn: true,
  searchVal: '',
})
// 旧的搜索内容
let old_search: string
let inputAnimateTimer: ReturnType<typeof setTimeout> | null = null
let inputFocusTimer: ReturnType<typeof setTimeout> | null = null
// ref-输入框
const task_input_ref = ref()
const inputAnimate = ref<boolean>(true)

watch(taskSearchSRt, (newVal) => {
  if (!newVal.showBtn) {
    inputAnimate.value = newVal.showBtn
    return
  }
  if (inputAnimateTimer)
    clearTimeout(inputAnimateTimer)

  if (inputFocusTimer)
    clearTimeout(inputFocusTimer)

  inputAnimateTimer = setTimeout(() => {
    inputAnimate.value = newVal.showBtn
  }, 30)
  inputFocusTimer = setTimeout(() => {
    task_input_ref.value.blur()
  }, 400)
})

/**
 * 切换输入
 */
async function changeShowBtn() {
  taskSearchSRt.showBtn = false
  old_search = ''
  await nextTick()
  task_input_ref.value.focus()
}

/**
 * 更新数据
 * @param isChange
 * @param val
 */
function updateData(isChange: boolean, val?: any) {
  if (old_search !== taskSearchSRt.searchVal) {
    old_search = taskSearchSRt.searchVal
    emits('change', val, isChange)
  }
}

/**
 * 关闭查找
 * @param isChange
 */
function clearOption(isChange: boolean) {
  taskSearchSRt.searchVal = ''
  requestAnimationFrame(() => {
    task_input_ref.value.focus()
    taskSearchSRt.showBtn = true
  })
  updateData(isChange)
}
/**
 * 失去焦点
 */
function handleBlur() {
  if (taskSearchSRt.showBtn)
    return

  taskSearchSRt.searchVal = taskSearchSRt.searchVal.trim()
  updateData(true, taskSearchSRt.searchVal)

  if (!taskSearchSRt.searchVal) {
    task_input_ref.value.focus()
    taskSearchSRt.showBtn = true
  }
}

defineExpose({
  clearOption,
})
</script>

<template>
  <div class="input-find-con">
    <div v-if="inputAnimate" class="look-item item flex-row-center animate__animated animate__fadeIn" @click="changeShowBtn">
      <svg-icon color="#808080" name="search" size="14" />
      <p class="name ml4 flex-one ss-line-1">
        查找
      </p>
    </div>
    <div class="search-con">
      <a-input
        ref="task_input_ref"
        v-model:value="taskSearchSRt.searchVal"
        class="task-input"
        :class="{ 'task-animate': !taskSearchSRt.showBtn }"
        allow-clear
        :bordered="false"
        :placeholder="placeholder"
        @keyup.enter="(evt: any) => evt.target.blur()"
        @blur="handleBlur"
      >
        <template #clearIcon>
          <el-tooltip effect="dark" placement="top" :show-after="100">
            <div class="flex items-center justify-center text-gray-500 hover:text-gray-700">
              <svg-icon color="#999" name="mobile-close" size="16" />
            </div>
            <template #content>
              清空
            </template>
          </el-tooltip>
        </template>
      </a-input>
      <el-tooltip :show-after="100" :hide-after="0" effect="dark" placement="top">
        <div class="input-close flex-row-center" :class="{ 'close-animate': !taskSearchSRt.showBtn }" @mousedown="clearOption(true)">
          <svg-icon color="#666" name="close" size="20" />
        </div>
        <template #content>
          关闭查找
        </template>
      </el-tooltip>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input-find-con {
  min-width: 7px;
  min-height: 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  .look-item {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 2;
    cursor: pointer;
    font-size: 14px;
    height: 32px;
    color: $color-icon;
    padding: 0 8px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      --uno: bg-hover;
    }
    &:active {
      --uno: bg-active;
    }
  }
  .search-con {
    display: flex;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
  }
}
.task-split {
  width: 1px;
  height: 16px;
  margin: 0 12px 0 4px;
  background: $color-border-main;
}
.task-animate {
  width: 140px !important;
  opacity: 1 !important;
}
.task-input {
  width: 76px;
  opacity: 0;
  padding: 3px 8px !important;
  border-radius: 4px;
  background: rgba(29, 116, 245, 0.08);
  border: 2px solid transparent !important;
  box-shadow: none !important;
  transition:
    width 0.4s cubic-bezier(0.4, 0, 0, 1),
    opacity 0.4s cubic-bezier(0.4, 0, 0, 1);
  &.ant-input-affix-wrapper-focused {
    border: 2px solid #1d74f5 !important;
    background: none !important;
    :deep() {
      .ant-input-suffix {
        opacity: 1;
        pointer-events: auto;
      }
      .ant-input {
        color: rgba(0, 0, 0, 0.88) !important;
      }
    }
  }
  :deep() {
    .ant-input-suffix {
      opacity: 0;
      pointer-events: none;
    }
    .ant-input-clear-icon {
      color: $tool-close-icon-bg;
      display: flex;
      &:hover {
        color: $tool-close-icon-hover;
      }
    }
    .ant-input {
      color: #1d74f5 !important;
    }
  }
}

.input-close {
  transform: scale(0.1);
  opacity: 0;
  width: 0;
  height: 24px;
  margin-left: 2px;
  border-radius: 4px;
  transition: transform 0.6s;
  cursor: pointer;
  &.close-animate {
    width: 24px;
    transform: scale(1) !important;
    opacity: 1 !important;
  }
  &:hover {
    background: $tool-hover-bg;
  }
}
</style>
