<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  isFoot?: boolean
  isClose?: boolean
  align?: any
  cancelText?: string
  confirmText?: string
  confirmBackground?: string
  // 弹窗唯一标识
  workItemId?: string
  spaceId?: string
  workCode?: string
  workType?: number
  // 关闭问题 | 确认问题
  operationName?: string
  // 任务名称
  displayName?: string
  // 验证失败的提示
  validTip?: string
  notAllow?: boolean
  status?: number
  isCheck?: boolean
  placement?: string
  triggerType?: string
  customClass?: string
}
const props = withDefaults(defineProps<Props>(), {
  isFoot: true,
  isClose: false,
  align: {
    offset: [0, 0],
  },
  cancelText: '取消',
  confirmText: '确认',
  confirmBackground: '#1D74F5',
  isCheck: false,
  placement: 'top',
  triggerType: 'click',
  customClass: '',
})

const emits = defineEmits<{
  /**
   * 显示隐藏的回调
   * @param isShow 是否显示
   * @param workItemId 弹窗唯一标识
   */
  onChange: [isShow: boolean, params?: any]
  onConfirm: [workItemId?: string, spaceId?: string]
  onCancel: []
}>()
// 是否显示 弹窗
const visible = ref<boolean>(false)
// 是否显示 验证提示
const validShow = ref<boolean>(false)

// 点击取消
function handleCancel() {
  visible.value = false

  // 关闭后没有 显示隐藏的回调, 所以 这里需要触发回调
  emits('onChange', false)
}

function handleConfirm() {
  // 校验未通过不关闭弹窗
  if (props.isCheck) {
    emits('onConfirm', props?.workItemId, props?.spaceId)
    return
  }

  if (props.validTip) {
    validShow.value = true
    return
  }

  emits('onConfirm', props?.workItemId, props?.spaceId)
  !props.notAllow && handleCancel()
}

watch(
  () => props.validTip,
  (val) => {
    if (!val) {
      validShow.value = false
    }
  },
)

function closePop() {
  visible.value = false
}

/**
 * 显示隐藏的回调
 * @param isShow 是否显示
 */
function beChange(isShow: boolean) {
  emits('onChange', isShow, {
    workItemId: props?.workItemId,
    workCode: props?.workCode,
    operationName: props?.operationName,
    displayName: props?.displayName,
    workType: props?.workType,
    status: props?.status,
  })
}

defineExpose({
  closePop,
})
</script>

<template>
  <a-popover
    v-model:open="visible"
    :trigger="props.triggerType"
    :overlay-class-name="`table-popover` + ` ${customClass}`"
    :align="align"
    destroy-tooltip-on-hide
    :placement="placement"
    @open-change="beChange"
  >
    <template #title>
      <div class="flex-row-between">
        <slot name="title" />
        <div
          v-if="props.isClose"
          class="table-popover-close w24 h24 flex-row-center pointer"
          @click="handleCancel"
        >
          <svg-icon name="close" size="24" color="#999999" />
        </div>
      </div>
    </template>
    <template #content>
      <slot name="content" />
      <div v-if="isFoot" class="table-popover-foot flex-row-end gap12">
        <div class="valid-tip">
          <span v-if="validShow">{{ props.validTip }}</span>
        </div>

        <a-config-provider :auto-insert-space-in-button="false">
          <a-button class="btn cancel-btn flex-shrink-0" @click="handleCancel">
            {{
              cancelText
            }}
          </a-button>
          <a-button
            class="btn confirm-btn flex-shrink-0"
            :style="{
              'background-color': confirmBackground,
              'border-color': confirmBackground,
            }"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </a-button>
        </a-config-provider>
      </div>
    </template>
    <slot />
    <!-- <slot name="trigger"></slot> -->
  </a-popover>
</template>

<style lang="scss">
.table-popover {
  width: 100%;
  padding: 0 4.102565vw;
}
</style>

<style lang="scss" scoped>
.table-popover-foot {
  margin-top: 24px;
  .btn {
    width: 60px;
    height: 32px;
    border-radius: 4px;
    padding: 0px;
    background: #ffffff;
    border: 1px solid $color-border-main;
    font-size: 14px;
    &.confirm-btn {
      background: $color-primary;
      color: #fff;
      border: 1px solid $color-primary;
    }
  }
}
.valid-tip {
  width: 100%;
  margin-top: -54px;
  color: $color-error;
  font-size: 12px;
}
</style>
