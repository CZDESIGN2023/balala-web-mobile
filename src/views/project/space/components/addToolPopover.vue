<script lang="ts" setup>
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getTextLength } from '@/utils'
import { useVersionNameValidateOpts } from '@/hooks/useValidatorOptions'

// 定义Props接口
interface Props {
  title: string
  placeholder: string
}

// 使用withDefaults为Props设置默认值
const props = withDefaults(defineProps<Props>(), {
  title: '',
  placeholder: '',
})

// 定义Emits
const emit = defineEmits(['onAdd'])

const observer = ref<MutationObserver | null>(null)

// 定义需要监听的类名
const targetClassName = 'draging' // 替换为你想要监听的类名

// 定义回调函数来处理类名变化
function classChangeHandler(mutationsList: MutationRecord[]) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      // 检查类名是否存在
      const hasClass = (mutation.target as HTMLElement).classList.contains(targetClassName)
      // console.log(`类名 ${targetClassName}${hasClass ? '已添加' : '已移除'}`)
      if (hasClass) {
        handleCancel()
      }
      // 这里可以根据hasClass的值来执行你的逻辑
    }
  }
}

// 定义响应式变量
const visibleAddPopover = ref(false)
const inputRef = ref()
const addName = ref('')
const errorText = ref('')

function handleCancel() {
  vaildate('')
  addName.value = ''
  visibleAddPopover.value = false
}

function handleBlur() {
  const length = getTextLength(addName.value.trim())
  const { min, max, msg } = useVersionNameValidateOpts()
  if (!addName.value) {
    vaildate(`${props.title}名称不能为空`)
    return false
  }
  if (length < min || length > max) {
    vaildate(msg)
    return false
  }
  else {
    addName.value = addName.value.trim()
    vaildate('')
    return true
  }
}

function handleConfirm() {
  if (!handleBlur()) {
    return
  }
  emit('onAdd', addName.value.trim())
}

// 校验
function vaildate(message: string) {
  errorText.value = message
}

onMounted(() => {
  // 获取目标元素
  const targetElement = document.getElementsByClassName('b-drag-layout')[0]
  if (targetElement) {
    // 创建MutationObserver实例并传入回调函数
    observer.value = new MutationObserver(classChangeHandler)
    // 配置观察器选项
    const config = { attributes: true, attributeFilter: ['class'] }
    // 开始观察目标元素
    observer.value.observe(targetElement, config)
  }
})

onBeforeUnmount(() => {
  // 组件卸载前断开观察器
  if (observer.value) {
    observer.value.disconnect()
  }
})

defineExpose({
  vaildate,
  handleCancel,
})
</script>

<template>
  <BPopover
    v-model:visible="visibleAddPopover"
    placement="bottom-start"
    :width="368"
    trigger="click"
    popper-class="space-add-popover"
    :show-arrow="false"
    transition="zoom-top-left"
    @after-enter="() => inputRef?.focus()"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <template #reference>
      <button class="add-btn flex-row-center text14 w71 h32 br4 pl8 pr8 gap4 pointer ml16" :class="{ active: visibleAddPopover }">
        <b-icon
          name="icon-icon_add_linear_linear_light"
          size="14"
          color="#1D74F5"
        />
        添加
      </button>
    </template>
    <div class="add-box">
      <div class="title h16 flex-row-between mb24">
        <p class="text14 title-color pfm font-smoothing">
          添加{{ props.title }}
        </p>
        <div class="close-icon flex items-center justify-center w24 h24 br4 pointer" @click="handleCancel">
          <b-icon
            name="icon-icon_close_linear_light"
            size="14"
            color="#333333"
          />
        </div>
      </div>
      <b-input2
        ref="inputRef"
        v-model:value="addName"
        :placeholder="props.placeholder"
        :error="errorText.length > 0"
        size="large"
      />
      <p class="error-color mt8 text13">
        {{ errorText }}
      </p>
    </div>
  </BPopover>
</template>

<style lang="scss" scoped>
.add-btn {
  background: #ffffff;
  border: 0;
  --uno: text-primary;
  &:hover,
  &.active {
    background: $color-default-hover;
  }
  &:active {
    background: $color-default-active;
  }
}

.add-box {
  .close-icon {
    &:hover {
      background: $color-default-hover;
    }
    &:active {
      background: $color-default-active;
    }
  }
}
</style>

<style lang="scss">
.el-popover.el-popper.space-add-popover {
  border: 1px solid $tool-drop-box-border;
  box-shadow: $tool-drop-box-shadow2;
  background: #fff !important;
  padding: 0px;
  & > div:first-child {
    padding: 24px;
  }
  button {
    border-radius: 4px;
    padding: 4px 11.22px;
  }
  .cancel-btn {
    border-color: #edeef0;
  }
}
</style>
