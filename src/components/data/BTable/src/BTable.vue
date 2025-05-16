<script setup lang="ts">
import Sortable from 'sortablejs'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { type ScrollState, addCSSRules, disableScrollFromElement, getElementOrParentWithClass, removeCSSRules, restoreScrollState } from '@/utils/dom'
import { debounce } from '@/utils'
import useProxyExpose from '@/hooks/useProxyExpose'

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  data: () => [],
  drag: false,
  offset: () => ({ x: 8, y: 8 }),
})

const emit = defineEmits(['dragEnd', 'dragUpdate'])

export interface Column {
  prop: string
  label: string
  align?: string
  sortMethod?: (a: any, b: any) => number
  width?: number
  visible?: boolean
  sortable?: boolean
}

interface Props {
  columns: Column[] | null
  data: any[]
  drag?: boolean
  offset?: { x: number, y: number }
}

const tableRef = ref()
const hoverDataRef = ref()
let lockScrollState: ScrollState[] | null
let lockScrollStyle: HTMLStyleElement | null
const state = reactive({
  hoverData: {
    row: null as any,
    column: null as Column | null,
    clientX: null as number | null,
    clientY: null as number | null,
  },
  editData: [] as any,
})
const tableProxy = useProxyExpose(tableRef, ['doLayout', 'setScrollTop'])

const debouncedHandleMouseEnter = debounce(onCellMouseEnter, 300)

const hoverDataPosition = computed(() => {
  if (!hoverDataRef.value) {
    return {}
  }
  // 弹窗元素宽高
  const clientHeight = hoverDataRef.value.clientHeight
  const clientWidth = hoverDataRef.value.clientWidth
  let top = state.hoverData.clientY! + props.offset!.y
  let left = state.hoverData.clientX! + props.offset!.x
  // 弹窗元素底部、右侧位置
  const clientY = top + clientHeight
  const clientX = left + clientWidth

  // 如果元素右侧、底部超出可视区域，显示在左侧或上方
  if (clientY > window.innerHeight) {
    top = top - clientHeight - props.offset!.y * 2
  }
  if (clientX > window.innerWidth) {
    left = left - clientWidth - props.offset!.x * 2
  }
  return {
    top: `${top}px`,
    left: `${left}px`,
  }
})

const editDataLength = computed(() => state.editData.length)

watch(editDataLength, (n) => {
  if (n > 0) {
    lockScrollState = disableScrollFromElement(tableRef.value.$el.querySelector('.el-table__body'))
    lockScrollStyle = addCSSRules([['.el-scrollbar__bar', 'opacity: 0 !important; transition: 0.3s;']] as any)
  }
  else {
    if (lockScrollState && lockScrollStyle) {
      restoreScrollState(lockScrollState)
      lockScrollState = null
      removeCSSRules(lockScrollStyle)
      lockScrollStyle = null
    }
  }
})

onMounted(() => {
  nextTick(() => {
    if (props.drag) {
      initSortable()
    }
    tableRef.value?.$el.addEventListener('mousemove', cellMoveEvent, { passive: true })
    window.addEventListener('resize', updateResize)
  })
})

onBeforeUnmount(() => {
  tableRef.value.$el.removeEventListener('mousemove', cellMoveEvent)
  window.removeEventListener('resize', updateResize)
})

function initSortable() {
  const tbody = tableRef.value.$el.querySelector('.el-table__body-wrapper tbody')
  if (tbody) {
    Sortable.create(tbody, {
      forceFallback: true,
      animation: 400,
      dragClass: 'b-table-drag',
      chosenClass: 'b-table-chosen-row',
      handle: '.b-table-drag-btn',

      onEnd(event: Sortable.SortableEvent) {
        emit('dragEnd', event)
      //   if ((oldIndex || oldIndex === 0) && (newIndex || newIndex === 0)) {
      //     const arr = cloneDeep(props.data)
      //     const currentRow = arr && arr.splice(oldIndex, 1)[0]
      //     arr.splice(newIndex, 0, currentRow)
      //     emit('update:data', arr)
      //   }
      },
      onUpdate(event: Sortable.SortableEvent) {
        emit('dragUpdate', event)
      },
    })
  }
}

function onCellStyle({ column }: { column: any }) {
  return { width: `${column.width || column.realWidth}px` }
}

function cellMoveEvent(ev: MouseEvent) {
  state.hoverData.clientX = ev.clientX
  state.hoverData.clientY = ev.clientY
}

function updateResize() {
  state.editData = []
}

function onCellMouseEnter(row: any, column: any) {
  if (state.hoverData.clientX && state.hoverData.clientY) {
    state.hoverData.row = row
    state.hoverData.column = props.columns!.find(item => item.prop === column.rawColumnKey)!
  }
}

function clearHoverData() {
  state.hoverData.column = null
  state.hoverData.row = null
  // 组件销毁前取消所有未执行的防抖调用
  debouncedHandleMouseEnter.cancel && debouncedHandleMouseEnter.cancel()
}

function edit(prop: string, rowIndex: number) {
  setTimeout(() => {
  // 1. 获取目标单元格 dom
    let columnIndex = 0
    const column = props.columns!.find((item, index) => {
      columnIndex = index
      return item.prop === prop
    })!
    // console.log(columnIndex, rowIndex)
    const body = tableRef.value.$el.querySelector('.el-table__body tbody') as HTMLElement
    const rowDom = body.children[rowIndex]
    const cell = rowDom.children[columnIndex]
    // 2. 获取单元格位置
    const rect = cell.getBoundingClientRect()
    // 3. 获取行数据, 列在👆🏻有了
    const row = props.data.find((item: any) => item.id === state.hoverData.row?.id) || props.data[rowIndex]
    // 4. 向数组中插入编辑区
    state.editData.push({
      id: Date.now(),
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      column,
      row,
      index: rowIndex,
    })
  }, 10)
}

function mousedownEditOutside(editData: any) {
  const index = state.editData.findIndex((item: any) => item.id === editData.id)
  if (index > -1) {
    requestAnimationFrame(() => {
      state.editData.splice(index, 1)
    })
  }
}

function exitEditById(id: number) {
  const index = state.editData.findIndex((item: any) => item.id === id)
  if (index > -1) {
    requestAnimationFrame(() => {
      state.editData.splice(index, 1)
    })
  }
}

defineExpose({ ...tableProxy, edit, exitEditById })
</script>

<template>
  <el-table
    ref="tableRef"
    v-bind="$attrs"
    class="b-table"
    border="true"
    :data="$props.data"
    :cell-style="onCellStyle"
    @cell-mouse-enter="debouncedHandleMouseEnter"
    @cell-mouse-leave="clearHoverData"
  >
    <template v-for="(d, index) in $props.columns" :key="d.prop">
      <el-table-column v-show="d.visible || d.visible === undefined" v-bind="d">
        <template v-if="$slots[`${d.prop.replace(/\./g, '-')}-header`]" #header="scope">
          <slot :name="`${d.prop.replace(/\./g, '-')}-header`" v-bind="scope" />
        </template>
        <template v-else #header="scope">
          <slot name="header" v-bind="scope">
            {{ scope.column.label }}<BTableSort v-if="d.sortable" />
          </slot>
        </template>
        <template v-if="$slots[d.prop.replace(/\./g, '-')]" #default="scope">
          <DragBtn v-if="index === 0 && $props.drag" name="b-table-drag-btn" />
          <slot :name="d.prop.replace(/\./g, '-')" v-bind="scope" />
        </template>
      </el-table-column>
    </template>

    <template v-if="$slots.header" #header="scope">
      <slot name="header" v-bind="scope" />
    </template>

    <template #empty>
      <slot name="empty">
        无数据
      </slot>
    </template>
  </el-table>
  <template
    v-if="state.hoverData.column"
  >
    <Teleport to="body">
      <div
        ref="hoverDataRef"
        :style="{ top: hoverDataPosition.top, left: hoverDataPosition.left }"
        class="b-table-hover-data fixed z-50"
      >
        <slot name="hover-data" :column="state.hoverData.column" :row="state.hoverData.row" />
      </div>
    </Teleport>
  </template>

  <Teleport to="body">
    <div
      v-for="d in state.editData" :key="d.id"
      v-mousedown-outside="() => mousedownEditOutside(d)"
      :style="{ left: `${d.x}px`, top: `${d.y}px`, width: `${d.width}px`, height: `${d.height}px` }"
      class="b-table__edit-container fixed bg-white"
    >
      <slot :id="d.id" :column="d.column" :row="d.row" :index="d.index" name="edit" />
    </div>
  </teleport>
</template>

<style lang="scss">
.b-table {
  --el-table-border-color: theme('borderColor.gray-96');
  --el-table-border: 1px solid var(--el-table-border-color);
  --el-table-row-hover-bg-color: theme('backgroundColor.hover');
  --el-table-header-text-color: theme('colors.gray-500');
  --el-table-text-color: theme('colors.gray-800');
  .el-table__body-wrapper {
    .el-table__cell {
      border-bottom: 1px solid #f2f3f5;
    }
  }
  .el-table__header-wrapper {
    font-size: 13px;
    // border-top: var(--el-table-border);
    border-top: 1px solid#f2f3f5;
    border-bottom: 1px solid #f2f3f5;
    .el-table__cell {
      &.is-sortable {
        .caret-wrapper {
          width: 13px;
          height: 14px;
          opacity: 0;
          .sort-caret {
            left: 0;
          }
        }
        &.ascending .asc-icon,
        &.descending .desc-icon {
          color: theme('colors.gray-700');
        }
      }
    }
  }
  .el-table__inner-wrapper {
    &::before {
      opacity: 0;
    }
  }
  .el-table__empty-text {
    line-height: normal;
  }
  .cell {
    line-height: 24px;
    overflow: initial;
    padding: 0 8px;
  }
}
.b-table-chosen-row {
  box-shadow: 0px -2px 0 theme('borderColor.primary');
  position: relative;
  z-index: 999;
}
.b-table-drag.el-table__row {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.06);
}
.b-table__edit-container {
  box-shadow: 0 0 0 2px theme('borderColor.primary') inset;
  z-index: 3000;
}
</style>
