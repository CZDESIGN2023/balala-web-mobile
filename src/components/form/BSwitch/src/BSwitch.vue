<template>
  <a-switch v-bind="$attrs" />
</template>

<style lang="scss" scoped>
.ant-switch {
  background: #e2e3e5;
  &:hover:not(.ant-switch-disabled) {
    background-color: #e2e3e5;
  }
  &.ant-switch-checked,
  &.ant-switch-checked:hover:not(.ant-switch-disabled) {
    background-color: #1d74f5;
  }
  &.ant-switch-small {
    height: 14px;
    min-width: 26px;
    &.ant-switch-checked :deep(.ant-switch-handle) {
      inset-inline-start: calc(100% - 12px);
    }
    :deep(.ant-switch-handle) {
      height: 10px;
      width: 10px;
      &::before {
        box-shadow: none;
      }
    }
  }
}
</style>
