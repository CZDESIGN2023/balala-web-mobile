<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { CommentItem } from '@/api/interface'
import { getTimediff } from '@/utils'
import { taskCommentList } from '@/api/project'
import type { TableRowData } from '@/views/project/types/table'

// PROPS
interface Props {
  row: TableRowData
}
const props = withDefaults(defineProps<Props>(), {
  row: () => {
    return {} as TableRowData
  },
})

// STATE
const state = reactive({
  loading: false,
})
const tooltipRef = ref()
const data = ref<CommentItem>()

watch(
  () => props.row,
  (n, o) => {
    if (n.id === o?.id || !n.id)
      return

    getTaskCommentList()
  },
)

function getTaskCommentList() {
  state.loading = true

  const _id = Math.random().toString()
  // 调用 taskCommentList 方法获取评论信息。
  taskCommentList(props.row.id as string, 1, 0, 'DESC', _id)
    .then((res: any) => {
      if (res._id !== _id)
        return
      // 如果返回的评论列表不为空，更新 commentHoverData。
      if (res.data.items.length > 0) {
        data.value = res.data.items[0]
        setTimeout(() => {
          tooltipRef.value?.updatePopper()
        }, 1)
      }
    })
    .finally(() => {
      state.loading = false
    })
}
</script>

<template>
  <ElTooltip
    ref="tooltipRef"
    v-bind="$attrs"
    :show-arrow="false"
    popper-class="table-comment-popover default-tooltip comment-tooltip"
    trigger="hover"
    effect="light"
    placement="top"
    virtual-triggering
  >
    <template #content>
      <div class="pl16 pr16" style="min-width: 282px">
        <a-skeleton :loading="state.loading" :paragraph="false" active>
          <div class="flex-row-between">
            <p
              v-if="data?.user"
              class="text14 title-color flex-row-start animate__animated animate__fadeIn"
            >
              {{ data?.user.userNickname }}
              <span class="minor-color">（{{ data?.user.userName }}）</span>
              <span class="minor-color">{{ getTimediff(data?.createdAt || '', false) }}前</span>
            </p>
            <p class="text14 minor-color ml40 flex-shrink-0">
              最近评论
            </p>
          </div>
        </a-skeleton>
        <a-skeleton :loading="state.loading" :paragraph="false" active>
          <div class="animate__animated animate__fadeIn">
            <el-scrollbar max-height="414px" class="mt12" always>
              <p class="table-comment-content" v-html="data?.content" />
            </el-scrollbar>
          </div>
        </a-skeleton>
      </div>
    </template>
  </ElTooltip>
</template>

<style lang="scss" scoped>
.table-comment-content {
  max-width: 608px;
  min-width: 227px;
  border-radius: 6px;
  padding: 9px 12px;
  gap: 10px;
  background: #f7f8fa;
  word-break: break-all;
  font-size: 14px;
}
</style>

<style lang="scss">
.comment-tooltip {
  padding: 16px 0;
  line-height: 22px;
  box-shadow:
    0px 8px 24px 0px rgba(0, 0, 0, 0.06),
    0px 4px 4px 0px rgba(0, 0, 0, 0.02);
  border: none !important;
}
</style>
