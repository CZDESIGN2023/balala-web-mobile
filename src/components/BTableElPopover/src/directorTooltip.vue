<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { User } from '@/views/project/types/table'

// PROPS
interface Props {
  data: User[]
  virtualRef?: Element | ComponentPublicInstance | null
}
withDefaults(defineProps<Props>(), {
  data: () => {
    return [] as User[]
  },
  virtualRef: null,
})
</script>

<template>
  <ElTooltip
    v-bind="$attrs"
    :virtual-ref="virtualRef"
    :virtual-triggering="!!virtualRef"
    :show-arrow="false"
    popper-class="table-comment-popover default-tooltip director-tooltip"
    placement="top"
    trigger="hover"
  >
    <template #content>
      <el-scrollbar max-height="132px" class="hide-x">
        <div class="director-list flex-row-start flex-wrap gap8">
          <b-avatar-name-tag
            v-for="item in data" :key="item.userId"
            :user-id="item.userId"
            :user-nickname="item.userNickname"
            :src="item.avatar"
            show-all
          />
        </div>
      </el-scrollbar>
    </template>
    <slot />
  </ElTooltip>
</template>

<style lang="scss">
.director-tooltip {
  padding: 16px 0;
  line-height: 22px;
  box-shadow:
    0 8px 24px #0000000f,
    0 4px 4px #00000005;
  border: none !important;
  .el-scrollbar__bar.is-horizontal {
    display: none;
  }
}
</style>
