<script setup lang="ts">
import { type Ref, inject, ref } from 'vue'
import { ClickOutside as vClickOutside } from 'element-plus'

// PROPS
interface Props {
  cancelText?: string
  confirmText?: string
  visible?: boolean
  showBtn?: boolean
  closeBtn?: boolean
}

withDefaults(defineProps<Props>(), {
  cancelText: '取消',
  confirmText: '确认',
  visible: undefined,
  showBtn: true,
  closeBtn: false,
})

defineEmits(['cancel', 'confirm'])

const lockScroll = inject('lockScroll') as Ref<number>
const popoverRef = ref()
function updatePosition() {
  popoverRef.value.popperRef.popperInstanceRef.update()
}

defineExpose({ updatePosition })
</script>

<template>
  <ElPopover
    ref="popoverRef"
    :visible="visible"
    v-bind="$attrs"
    popper-class="b-popover"
    placement="top"
    transition="el-zoom-in-bottom"
    width="260"
    @before-enter="() => {
      lockScroll++
    }"
    @before-leave="() => {
      lockScroll--
    }"
  >
    <div v-click-outside="() => $emit('cancel')">
      <slot />
      <div v-if="showBtn" class="table-popover-foot flex-row-end gap12">
        <a-config-provider :auto-insert-space-in-button="false">
          <a-button class="btn cancel-btn flex-shrink-0" @click="$emit('cancel')">
            {{ cancelText }}
          </a-button>
          <a-button type="primary" class="btn confirm-btn flex-shrink-0" @click="$emit('confirm')">
            {{ confirmText }}
          </a-button>
        </a-config-provider>
      </div>
      <div
        v-if="closeBtn"
        class="table-popover-close w24 h24 flex-row-center pointer"
        @click="$emit('cancel')"
      >
        <svg-icon name="close" size="24" color="#999999" />
      </div>
    </div>
  </ElPopover>
</template>

<style lang="scss">
.b-popover {
  border: 1px solid $tool-drop-box-border !important;
  box-shadow: $tool-drop-box-shadow2 !important;
  background: #fff !important;
  .el-popper__arrow {
    &::before {
      background: #fff !important;
    }
  }
}
.table-popover-foot {
  margin-top: 24px;
}
.table-popover-close {
  position: absolute;
  top: 24px;
  right: 24px;
}
</style>
