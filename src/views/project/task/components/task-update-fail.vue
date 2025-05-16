<script lang="ts" setup>
import { reactive } from 'vue'

interface Props {
  taskFailDialogVisible?: boolean
  successList: any
  failList?: any
}
withDefaults(defineProps<Props>(), {
  taskFailDialogVisible: false,
  successList: [],
  failList: [],
})

const emits = defineEmits(['update:taskFailDialogVisible', 'retryUpdate', 'onConfirm'])

const state = reactive({
  dialogTitle: '任务流程批量升级完成',
  confirmText: '我知道了',
  cancelBtnText: '重试',
})

function handleCancel() {
  emits('update:taskFailDialogVisible')
}

function handleBtnCancel() {
  emits('update:taskFailDialogVisible')
  emits('retryUpdate')
}

function handleConfirm() {
  emits('update:taskFailDialogVisible')
  emits('onConfirm')
}
</script>

<template>
  <b-dialog
    :dialog-visible="taskFailDialogVisible"
    width="480px"
    title-icon="orange.svg"
    header-padding="22px 22px"
    footer-padding="24px 24px"
    :title="state.dialogTitle"
    :confirm-btn-text="state.confirmText"
    :cancel-btn-text="state.cancelBtnText"
    cancel-border-color="#EDEEF0"
    confirm-btn-color="primary"
    @on-confirm="handleConfirm"
    @on-cancel="handleCancel"
    @on-btn-cancel="handleBtnCancel"
  >
    <div class="fail-box">
      <div class="fail-tip">
        已成功批量升级任务单 <span class="pfm-smoothing">{{ successList.length }}</span> ，升级失败 <span class="pfm-smoothing">{{ failList.length }}</span>
      </div>
      <div class="fail-list">
        <div class="list-title">
          <div class="title-id">
            任务 ID
          </div>
          <div class="title-name">
            失败原因
          </div>
        </div>
        <el-scrollbar height="245px">
          <div v-for="(item, index) in failList" :key="index" class="list-item">
            <div class="item-id">
              #{{ item.workItemId }}
            </div>
            <div class="item-name">
              {{ item.message }}
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </b-dialog>
</template>

<style lang="scss" scoped>
  .fail-box {
  .fail-tip {
    font-size: 14px;
    line-height: 22px;
    margin-bottom: 24px;
    color: #333;
  }
  .fail-list {
    width: 432px;
    font-size: 13px;
    .list-title {
      display: flex;
      height: 32px;
      margin-bottom: 1px;
      color: #666;
      .title-id {
        display: flex;
        align-items: center;
        width: 128px;
        padding-left: 16px;
        border-right: 1px solid #f2f3f5;
        background: #f7f8fa;
      }
      .title-name {
        display: flex;
        align-items: center;
        flex: 1;
        padding-left: 16px;
        background: #f7f8fa;
      }
    }
    .list-item {
      color: #333;
      display: flex;
      margin-bottom: 1px;
      height: 40px;
      border-bottom: 1px solid #f2f3f5;
      &:last-of-type {
        margin-bottom: 0;
      }
      .item-id {
        display: flex;
        align-items: center;
        width: 128px;
        padding-left: 16px;
        border-right: 1px solid #f2f3f5;
      }
      .item-name {
        display: flex;
        align-items: center;
        flex: 1;
        padding-left: 16px;
      }
    }
  }
}
</style>
