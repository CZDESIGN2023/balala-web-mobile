<script lang="ts" setup>
import { computed, shallowReactive, toRaw, watch } from 'vue'

interface TSProps {
  options: any[]
  value: null | string | string[] | number | number[]
  placeholder: string
  isOpen?: boolean
  isIcon?: boolean
  className?: string
  showHead?: boolean
  showVersion?: boolean
}

const props = withDefaults(defineProps<TSProps>(), {
  options: () => [],
  value: '',
  placeholder: '',
  isOpen: false,
  isIcon: false,
  className: '',
  // 是否显示：头像+昵称+用户名
  showHead: false,
  showVersion: false,
})

const emits = defineEmits(['update:value', 'change', 'update:isOpen', 'update:label'])

function handleChange(val: string | string[] | number | number[]) {
  // selectData.value = val
  emits('update:value', val)
  emits('change', val)
}

const selectData = computed({
  get() {
    return props.value
  },
  set(val) {
    emits('update:value', val)
    emits(
      'update:label',
      typeof val === 'object'
        ? toRaw(props.options)
          .filter(item => (val as any).includes(item.value))
          .map(item => item.label)
        : toRaw(props.options).find(item => item.value === val).label,
    )
  },
})

// 浅层响应集合
interface DataSRt {
  isOpen: boolean
}
const dataSRt = shallowReactive<DataSRt>({
  isOpen: false,
})

function filterOption(val: string, option: {
  value: string
  label: string
}) {
  return option.label.includes(val)
}

watch(
  () => props.isOpen,
  (val: boolean) => {
    if (val) {
      dataSRt.isOpen = true
      emits('update:isOpen', false)
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <a-select
    v-model:value="selectData"
    style="width: 100%"
    :placeholder="props.placeholder"
    :dropdown-align="{ offset: [0, 8] }"
    :options="props.options"
    :get-popup-container="(triggerNode: any) => triggerNode.parentNode"
    :class="className"
    :show-arrow="true"
    :list-height="258"
    :default-open="dataSRt.isOpen"
    :filter-option="filterOption"
    popup-class-name="b-base-select-popup"
    class="head-select"
    autofocus
    @change="handleChange"
  >
    <template #suffixIcon>
      <svg-icon name="select-arrow" size="16" color="#999" />
    </template>
    <template #option="{ value: val, label, icon, userId, userName, avatar, versionName }">
      <slot v-if="isIcon" name="option" :label="label" :value="val" :icon="icon" />
      <!-- 头像+昵称+用户名 -->
      <div v-else-if="showHead" class="flex-row-start">
        <b-head :id="userId" class="mr8" width="28px" :name="label" :src="avatar" />
        <span class="mr8">{{ label }}</span>
        <span class="user-name">{{ userName }}</span>
      </div>
      <div v-else-if="showVersion">
        {{ versionName }}
      </div>
      <span v-else>{{ label }}</span>
    </template>
    <template #tagRender="{ closable, onClose, label }">
      <a-tag :closable="closable" class="filter-select-tag flex-row-start" @close="onClose">
        <p class="text13 title-color ss-line-1 maxwi95">
          {{ label }}
        </p>
        <template #closeIcon>
          <svg-icon
            name="filter-close"
            class="close-icon transition pointer mt5 mr8"
            size="12"
            color="#666666"
          />
        </template>
      </a-tag>
    </template>
    <template #maxTagPlaceholder>
      <p class="ml8 mt1">
        +{{ Array.isArray(selectData) && selectData.length - 1 }}
      </p>
    </template>
    <template #notFoundContent>
      <slot name="notFoundContent" />
    </template>
  </a-select>
</template>

<style lang="scss">
.head-select {
  &.ant-select-single {
    &:not(.ant-select-customize-input)
      .ant-select-selector
      .ant-select-selection-search-input {
      height: 36px;
    }
    .ant-select-selector {
      font-size: 14px;
      .ant-select-selection-item,
      .ant-select-selection-placeholder {
        line-height: 36px;
      }
    }
  }
}
.b-base-select-popup {
  &.ant-select-dropdown .ant-select-item {
    font-size: 14px;
    line-height: 32px;
  }
}
</style>

<style lang="scss" scoped>
.head-select {
  :deep(.ant-select-selector) {
    background: $color-input;
    border: none;
    padding: 0 8px;
    border-radius: 4px;
    .ant-select-selection-placeholder {
      line-height: 36px;
      inset-inline-start: 8px;
      inset-inline-end: 8px;
    }
  }
  :deep(.ant-select-arrow) {
    inset-inline-end: 8px;
  }
  :deep(.ant-select-item-option) {
    &:hover {
      background: $color-bg-hover;
    }
  }
  :deep(.ant-select-item-option-active) {
    background-color: transparent;
  }
  &.ant-select-multiple {
    :deep(.ant-select-selector) {
      height: 32px;
    }
  }
  &.ant-select-lg {
    :deep(.ant-select-selector) {
      height: 40px;
      font-size: 14px !important;
    }
    :deep(.ant-select-selection-placeholder),
    :deep(.ant-select-selection-item) {
      line-height: 40px;
    }
    :deep(.ant-select-dropdown) .ant-select-item-option {
      line-height: 32px;
    }
  }
  &.ant-select-focused {
    :deep(.ant-select-selector) {
      box-shadow: none !important;
    }
  }
  &.ant-select-open {
    :deep(.ant-select-selector) {
      background: none;
      box-shadow: 0 0 0 2px #1d74f5 !important;
    }
  }
  :deep(.ant-select-dropdown) {
    padding: 8px;
    padding-right: 0;

    .ant-select-item-option-selected {
      background: $color-primary-active;
      font-weight: initial;
    }
    .rc-virtual-list {
      padding-right: 8px;
    }
    .rc-virtual-list-scrollbar-thumb {
      width: $tool-drop-scorll-width !important;
      border-radius: $tool-drop-scorll-radius !important;
      background: $tool-drop-scorll-bg !important;
    }
  }
  &.ant-select-multiple {
    :deep(.ant-select-dropdown) {
      .ant-select-item-option-selected {
        background: none;
        font-weight: initial;
      }
    }
    :deep(.ant-select-selection-overflow) {
      flex-wrap: nowrap;
    }
  }
  .filter-select-tag {
    height: 24px;
    border: 1px solid $color-border-main;
    padding: 1px 1px 1px 8px;
    border-radius: 16px;
    background: #fff;
    .avatar {
      background: #ff9800;
    }
  }
}

.project-select {
  :deep(.ant-select-selector) {
    border-radius: 6px;
  }
  &.ant-select-open {
    :deep(.ant-select-selector) {
      box-shadow: 0 0 0 1.6px #1d74f5 !important;
      border: 0;
      border-radius: 6px;
    }
  }
  :deep(.ant-select-dropdown) {
    .ant-select-item {
      padding: 0px 12px;
    }
  }
  :deep(.ant-select-selection-placeholder) {
    color: #999;
    line-height: 32px;
  }
}

.user-name {
  color: #999999;
  font-size: 13px;
}
</style>
