<script lang="ts" setup>
import { computed } from 'vue'
import { getAssetsFile, throttle } from '@/utils'

const props = withDefaults(defineProps<Props>(), {
  // 是否显示
  dialogVisible: false,
  // 是否可拖动
  draggable: false,
  // 是否显示头部
  showHeader: true,
  // 是否显示底部
  showFooter: true,
  // 宽度
  width: '480px',
  top: '15vh',
  // 是否显示关闭按钮
  showClose: true,
  // 是否显示标题左侧图标
  titleIcon: '',
  // 标题
  title: '',
  // 关闭按钮图标
  closeIcon: 'dialog-close',
  // 关闭图标大小
  closeSize: '16',
  // 关闭图标颜色
  closeColor: '#666666',
  // 确定按钮颜色 'danger' 或者 '#333'
  confirmBtnColor: 'primary',
  // 确定按钮文字
  confirmBtnText: '确认',
  // 确定按钮颜色 'danger' 或者 '#333'
  cancelBtnColor: '',
  // 取消按钮边框颜色
  cancelBorderColor: '',
  // 确定按钮文字
  cancelBtnText: '取消',
  // 是否是透明按钮
  isPlain: true,
  // 头部间距
  headerPadding: '23px 24px',
  // 内容间距
  mainPadding: '0px 24px',
  // 底部间距
  footerPadding: '24px',
  // 是否显示取消按钮
  showCancelBtn: true,
})
const emits = defineEmits(['update:dialogVisible', 'onOpen', 'onCancel', 'onConfirm', 'onBtnCancel', 'onClosed'])
interface Props {
  dialogVisible: boolean
  draggable?: boolean
  showHeader?: boolean
  showFooter?: boolean
  width?: string
  top?: string
  showClose?: boolean
  titleIcon?: string
  title?: string
  closeIcon?: string
  closeSize?: string
  closeColor?: string
  confirmBtnColor?: string
  confirmBtnText?: string
  cancelBtnColor?: string
  cancelBorderColor?: string
  cancelBtnText?: string
  isPlain?: boolean
  headerPadding?: string
  mainPadding?: string
  footerPadding?: string
  showCancelBtn?: boolean
}

// 监听弹框打开
function openDialog() {
  emits('onOpen')
}

// 监听弹框关闭
function onDialogClosed() {
  emits('onClosed')
}

// 点击取消按钮
function cancelDialog() {
  emits('update:dialogVisible')
  emits('onCancel')
}

function btnCancelDialog() {
  emits('update:dialogVisible')
  emits('onCancel')
  emits('onBtnCancel')
}

// 点击确认按钮
const confirmDialog = throttle(() => {
  emits('onConfirm')
}, 200)

const cancelButtonStyle = computed(() => {
  if (props.cancelBorderColor) {
    return {
      borderColor: props.cancelBorderColor,
    }
  }
  return {}
})
</script>

<template>
  <el-dialog
    v-bind="$attrs"
    class="b-dialog"
    :show-close="false"
    :width="width"
    :top="top"
    :draggable="draggable"
    :model-value="dialogVisible"
    :before-close="cancelDialog"
    append-to-body
    destroy-on-close
    :align-center="true"
    @open="openDialog"
    @closed="onDialogClosed"
  >
    <template #header>
      <div
        v-if="showHeader"
        class="flex-row-between b-dialog-header title-color text16"
        :style="{ padding: headerPadding }"
      >
        <div class="flex-row-start gap5">
          <img v-if="titleIcon" class="w20" :src="getAssetsFile(titleIcon)" alt="">
          <p v-if="title" class="pfm font-smoothing line24" v-html="title" />
        </div>
        <div
          v-if="showClose"
          class="close-icon flex-row-center"
        >
          <svg-icon
            class="pointer"
            :name="closeIcon"
            :size="closeSize"
            :color="closeColor"
            @click="cancelDialog"
          />
        </div>
      </div>
    </template>
    <div class="b-dialog-main" :style="{ padding: mainPadding }">
      <slot />
    </div>
    <template #footer>
      <div
        v-if="showFooter"
        class="b-dialog-footer flex-row-between"
        :style="{ padding: footerPadding }"
      >
        <div class="left">
          <slot name="footer-left" />
        </div>
        <div class="right">
          <el-button
            v-if="showCancelBtn"
            class="btn cancel-btn"
            :type="cancelBtnColor"
            :style="cancelButtonStyle"
            size="default"
            :plain="isPlain"
            @click="btnCancelDialog"
          >
            {{ cancelBtnText }}
          </el-button>
          <el-button
            class="btn confirm-btn"
            size="default"
            :type="confirmBtnColor"
            @click="confirmDialog"
          >
            {{ confirmBtnText }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss">
.b-dialog {
  width: calc(100vw - 32px);
  border-radius: 8px !important;
  padding: 0;
  .el-dialog__header {
    padding: 0;
    margin-right: 0;
  }
  .el-dialog__body {
    padding: 0px;
  }
  .el-dialog__footer {
    padding: 0;
  }
  .b-dialog-footer {
    .btn {
      border-radius: 4px;
      padding: 8px 15px;
      font-size: 14px;
    }
  }
  .b-dialog-header {
    .close-icon {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      &:hover {
        background: $color-default-hover;
      }
      &:active {
        background: $color-default-active;
      }
      .svg-icon {
        transition: all 0.2s;
      }
    }
  }
}
</style>
