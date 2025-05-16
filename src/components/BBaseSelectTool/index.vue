<script lang="ts" setup>
import { computed, shallowReactive, toRaw, watch } from 'vue'

defineOptions({ name: 'BBaseSelectTool' })

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
  size: 'normal',
})

const emits = defineEmits(['update:value', 'change', 'update:isOpen', 'update:label', 'onDropdownVisibleChange'])

interface TSProps {
  options: any[]
  value: null | string | string[] | number | number[]
  placeholder: string
  isOpen?: boolean
  isIcon?: boolean
  className?: string
  showHead?: boolean
  showVersion?: boolean
  size?: string
}

function handleChange(val: string | string[] | number | number[]) {
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
    class="cover-input-select"
    :class="[className, size]"
    :show-arrow="true"
    autofocus
    :default-open="dataSRt.isOpen"
    :filter-option="filterOption"
    @change="handleChange"
    @dropdown-visible-change="emits('onDropdownVisibleChange')"
  >
    <template #suffixIcon>
      <svg-icon name="select-arrow" size="12" color="#333333" />
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
      <div class="selected-icon">
        <svg-icon name="gou" size="12" color="#1D74F5" />
      </div>
    </template>
    <template #tagRender="{ closable, onClose, label }">
      <a-tag :closable="closable" class="filter-select-tag flex-row-start" @close="onClose">
        <p class="text13 title-color ss-line-1 maxwi95">
          {{ label }}
        </p>
        <template #closeIcon>
          <svg-icon
            name="filter-close"
            class="close-icon transition pointer mt5 mr4"
            size="12"
            color="#666"
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

<style lang="scss" scoped>
.cover-input-select {
  &.normal {
    :deep(.ant-select-selector) {
      height: 30px;
    }
    :deep(.ant-select-selection-placeholder) {
      font-size: 14px;
    }
    :deep(.ant-select-arrow) {
      inset-inline-end: 2px;
    }
  }
  &.large {
    :deep(.ant-select-selector) {
      height: 40px;
    }
    :deep(.ant-select-selection-placeholder) {
      font-size: 14px;
    }
    :deep(.ant-select-arrow) {
      inset-inline-end: 12px;
    }
  }
  :deep(.ant-select-dropdown) {
    max-height: $tool-select-normal-height;
    min-width: $filter-drop-down-min-width !important;
    box-shadow: $tool-drop-box-shadow;
    border: 1px solid $tool-drop-box-border;
    padding: 6px;
    .selected-icon {
      opacity: 0;
    }
    .ant-select-item-option-selected {
      background: transparent;
      font-weight: initial;
      .selected-icon {
        opacity: 1;
      }
    }
    .rc-virtual-list {
      .ant-select-item-option-selected {
        .ant-select-item-option-state {
          opacity: 0;
        }
      }
      .ant-select-item {
        padding: 0;
        height: 32px;
        .ant-select-item-option-content {
          display: flex;
          align-items: center;
          font-size: $filter-drop-font-size;
          padding-left: 6px;
          span {
            max-width: 80%;
            text-overflow: ellipsis;
            overflow: hidden;
          }
          .selected-icon {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
          }
        }
      }
      .rc-virtual-list-scrollbar {
        right: -8px !important;
      }
      .rc-virtual-list-scrollbar-thumb {
        width: $tool-drop-scorll-width !important;
        border-radius: $tool-drop-scorll-radius !important;
        background: $tool-drop-scorll-bg !important;
      }
    }
  }
  &.ant-select-disabled {
    :deep(.ant-select-selector) {
      background: $tool-input-normal-bg;
    }
  }
  :deep(.ant-select-selector) {
    background: $tool-input-normal-bg;
    border: none;
    padding: 0 0 0 6px;
    border-radius: $tool-input-radius;
    height: 30px;
    align-items: center;
    .ant-select-selection-placeholder {
      font-size: $filter-drop-font-size;
    }
    .ant-select-selection-search {
      input {
        font-size: $filter-drop-font-size;
      }
    }
    .ant-select-selection-item {
      font-size: $filter-drop-font-size;
      padding-inline-end: 0;
      padding: 0;
      max-width: 80%;
      position: absolute;
    }
    &:hover {
      background-color: $color-input-hover;
    }
    .ant-select-selection-placeholder {
      line-height: $tool-input-height;
      position: absolute;
      inset-inline-start: 6px;
      inset-inline-end: 6px;
      padding-inline-end: 10px;
    }
  }
  :deep(.ant-select-item-option) {
    &:hover {
      background: $tool-hover-bg;
    }
  }
  :deep(.ant-select-item-option-active) {
    background-color: transparent;
  }
  &.ant-select-multiple {
    :deep(.ant-select-selector) {
      height: $tool-input-height;
    }
    .ant-select-item-option-state {
      opacity: 0 !important;
    }
    // .selected-icon {
    //   display: none !important;
    // }
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
      line-height: $tool-input-height;
    }
  }
  &.ant-select-focused {
    :deep(.ant-select-selector) {
      box-shadow: none !important;
    }
  }
  &.ant-select-open {
    :deep(.ant-select-selector) {
      background: #fff;
      box-shadow: 0 0 0 2px #1d74f5 !important;
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
    .ant-tag-close-icon {
      svg {
        margin-right: 2px !important;
      }
    }
  }
}

.project-select {
  &.ant-select-open {
    :deep(.ant-select-selector) {
      box-shadow: $tool-box-shadow;
      border: 0;
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
