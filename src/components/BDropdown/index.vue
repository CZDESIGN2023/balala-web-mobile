<script lang="ts" setup>
interface Option {
  label: string
  value?: string | number
  description?: string
  show?: boolean
}

const {
  placeholder = '请选择...',
  placement = 'bottom-end',
  moreType = false,
  disabled = false,
} = defineProps<{
  options: Option[]
  placeholder?: string
  placement?: string
  moreType?: boolean
  disabled?: boolean
  minWidth?: number
  dropdownWidth?: number
}>()

defineEmits(['select'])

const modelValue = defineModel()
</script>

<template>
  <el-dropdown
    v-if="$props.options.filter(item => item.show || item.show === undefined).length > 0"
    v-bind="$attrs"
    :placement
    :disabled
    :popper-options="{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }"
    :class="{ disabled }"
    popper-class="b-dropdown-popper"
    class="b-dropdown outline-0 cursor-pointer"
  >
    <div v-if="moreType" style="transform: translateY(3px);">
      <svg-icon name="more" size="16" color="#999" />
    </div>
    <span
      v-else
      :style="{ 'min-width': `${$props.minWidth}px` }"
      :class="{ pr4: !$props.disabled, pr6: $props.disabled }"
      class="text text12 text-gray-800 bg-gray-input hover:bg-gray-input-hover rounded pl6 h24 flex items-center justify-center outline-0"
    >
      {{ $props.options.find(item => item.value === modelValue)?.label || placeholder }}
      <svg-icon v-if="!disabled" name="arrow-b" size="12" color="#999" />
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <template v-for="d in $props.options" :key="d.label">
          <el-dropdown-item
            v-if="d.show || d.show === undefined" @click="() => {
              $emit('select', d.value)
              modelValue = d.value
            }"
          >
            <div :style="{ width: $props.dropdownWidth ? `${$props.dropdownWidth - 32}px` : 'auto' }" class="flex-col leading-none">
              <div class="text14 text-gray-800 pfm">
                {{ d.label }}
              </div>
              <div v-if="d.description" class="mt6 text13 text-gray-500">
                {{ d.description }}
              </div>
            </div>
          </el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss">
.b-dropdown-popper {
  &.el-dropdown__popper.el-popper {
    --el-dropdown-menuItem-hover-fill: theme('backgroundColor.hover');
    --el-dropdown-menuItem-hover-color: theme('colors.gray-800');
    --el-text-color-regular: theme('colors.gray-800');
    --uno: shadow-medium border border-solid border-gray-98 rounded-md;
    .el-dropdown-menu {
      --uno: p8;
    }
    .el-dropdown-menu__item {
      --uno: p8 rounded;
    }
    .el-popper__arrow {
      display: none;
    }
  }
}
</style>

<style lang="scss" scoped>
.b-dropdown {
  :deep(.el-tooltip__trigger) {
    --uno: outline-0;
  }
  :deep(.more-icon) {
    use {
      color: theme('colors.gray-500');
    }
    &:hover {
      use {
        color: theme('colors.primary');
      }
    }
  }
}
</style>
