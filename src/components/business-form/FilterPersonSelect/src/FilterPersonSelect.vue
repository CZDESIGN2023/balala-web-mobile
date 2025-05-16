<template>
  <BusinessPersonSelect
    v-bind="$attrs"
    class="filter-person-select"
  />
</template>

<style lang="scss" scoped>
.filter-person-select {
  min-width: fit-content;
  &.ant-select-multiple.ant-select-lg {
    :deep(.ant-select-selector) {
      padding-inline-end: 0;
      padding-left: 6px;
      height: 30px;
      min-height: 30px;
    }
    :deep(.ant-select-selector:after) {
      height: 28px;
    }
    :deep(.ant-select-selection-placeholder) {
      line-height: 32px;
      inset-inline-start: 6px;
      inset-inline-end: 6px;
      font-size: $filter-drop-font-size;
      padding-inline-end: 10px;
    }
    :deep(.ant-select-arrow) {
      inset-inline-end: 2px;
      svg {
        width: 12px !important;
        height: 12px !important;
      }
    }
  }
  :deep(.ant-select-selection-overflow) {
    padding: 0 !important;
    display: flex;
    align-items: center;
    position: absolute;
  }
  :deep(.ant-select-selection-overflow-item) {
    margin: 0 !important;
    .director-box {
      height: 20px;
      max-width: 80px;
      border: none;
      margin-right: 3px !important;
      padding-right: 0 !important;
      .avatar {
        width: 18px !important;
        height: 18px !important;
      }
      .nickname {
        max-width: 25px;
        font-size: 12px !important;
        padding-right: 4px !important;
      }
      .close-container {
        display: none;
      }
    }
    .close-container {
      width: 20px !important;
      margin-left: 0;
      margin-right: 0;
      .close {
        right: 4px;
      }
    }
    .ant-select-selection-item {
      min-height: $tool-input-height !important;
      margin-left: 0 !important;
      .ant-select-selection-item-content {
        p {
          font-size: 10px;
          line-height: 38px !important;
        }
      }
    }
  }
  :deep(.choose-list .option-item) {
    height: 40px;
    .avatar {
      width: 20px !important;
      height: 20px !important;
    }
  }
}
</style>
