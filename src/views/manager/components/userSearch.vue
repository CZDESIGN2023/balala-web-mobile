<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, shallowReactive, shallowRef, watch } from 'vue'

interface TSSeachSRt {
  // 是否显示查找按钮
  showBtn: boolean
  // 输入内容
  searchVal: string
}

const emits = defineEmits<{
  /**
   * 更新数据
   * @param val
   */
  change: [val: any, isChange: boolean]
}>()
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
const findAnimate = ref<string>('')

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
  findAnimate.value = 'animate__animated animate__fadeIn'
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
  // eslint-disable-next-line regexp/no-unused-capturing-group
  const regex = /^#(\d+)$/
  const isTaskId = regex.test(taskSearchSRt.searchVal)
  updateData(
    true,
    taskSearchSRt.searchVal
      ? {
          field: isTaskId ? 'work_item_id' : 'work_item_name',
          values: [isTaskId ? taskSearchSRt.searchVal.replace('#', '') : taskSearchSRt.searchVal],
          operator: isTaskId ? 'EQ' : 'INCLUDE',
          field_type: '',
          space_id: '',
        }
      : undefined,
  )

  if (!taskSearchSRt.searchVal) {
    task_input_ref.value.focus()
    taskSearchSRt.showBtn = true
  }
}

onUnmounted(() => {
  findAnimate.value = ''
})

defineExpose({
  clearOption,
})
</script>

<template>
  <div class="input-find-con">
    <div v-if="inputAnimate" class="look-item item flex-row-center" :class="findAnimate" @click="changeShowBtn">
      <svg-icon name="tool_search" color="#333333" size="16" />
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
        placeholder="输入用户名或昵称，回车查找"
        @keyup.enter="(evt: any) => evt.target.blur()"
        @blur="handleBlur"
      >
        <template #clearIcon>
          <el-tooltip effect="dark" placement="top" :show-after="100">
            <svg-icon class="clear-close" name="task-search-clear" size="13" />
            <template #content>
              清空
            </template>
          </el-tooltip>
        </template>
      </a-input>
      <el-tooltip :show-after="100" :hide-after="0" effect="dark" placement="top">
        <div class="input-close flex-row-center" :class="{ 'close-animate': !taskSearchSRt.showBtn }" @mousedown="clearOption(true)">
          <svg-icon name="task-search-close" size="16" color="#666" />
        </div>
        <template #content>
          关闭
        </template>
      </el-tooltip>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input-find-con {
  font-size: 14px;
  height: 32px;
  color: #333333;
  padding: 0 8px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
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
      background: $color-default-hover;
    }
    &:active {
      background: $color-default-active;
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
  background: #bfbfbf;
}
.task-animate {
  width: 240px !important;
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
  margin-left: 7px;
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
