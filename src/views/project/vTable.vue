<script lang="ts" setup>
import {
  computed,
  getCurrentInstance,
  // h,
  nextTick,
  onDeactivated,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  shallowReactive,
  toRaw,
  watch,
} from 'vue'
import type { VxeColumnProps, VxeGridInstance } from 'balala-vxe-table'
// import { message } from 'ant-design-vue'
// import { ElTooltip } from 'element-plus'
import { cloneDeep } from 'lodash'
import { gridOptions } from './config/table'
import type { TableRowData } from './types/table'
import { useProjectStore } from '@/stores/modules/project'
// import type { ColumnConfig, TaskDirectorOrTag } from '@/api/interface'
// import { useCopy } from '@/utils'
// import {
//   editWorkDirector,
//   editWorkPriority,
//   taskFollow,
//   workItemDirectorSet,
// } from '@/api/project'
import { PRIORITY_LIST, TASK_STATUS, TASK_TYPES } from '@/utils/constant'
import router from '@/router'
// import confirmPopover from '@/components/BTableElPopover/src/confirmPopover.vue'
// import quickCompletePopover from '@/components/BTableElPopover/src/quickCompletePopover.vue'
// import commentTooltip from '@/components/BTableElPopover/src/commentTooltip.vue'
// import directorTooltip from '@/components/BTableElPopover/src/directorTooltip.vue'
// import restorePopover from '@/components/BTableElPopover/src/restorePopover.vue'
// import restartPopover from '@/components/BTableElPopover/src/restartPopover.vue'
import BSkeleton from '@/components/BTableElPopover/src/BSkeleton.vue'
import { findNode } from '@/utils/array'
import { scrollControl } from '@/mixins/vtable'
import { getBadgeColor } from '@/utils/color'
import { useTableStore } from '@/stores/modules/table'

const props = withDefaults(defineProps<Props>(), {
  table: () => [],
  tableTotal: 0,
  tableAllTotal: 0,
  rowKeys: () => [],
  mode: 'task',
  loading: false,
  scroll: 'calc(100% - 9.48718vw)',
  isOpenDetails: false,
  info: '',
})
// EMITS
const emits = defineEmits([
  'openDrawer',
  'onCheckAll',
  'onCheck',
  'onUpdate',
  'update:rowKeys',
  'onScroll',
  'onGetKeys',
  'refreshTableItem',
  'onGetOutKeys',
])
// PROPS
interface Props {
  table?: TableRowData[]
  tableTotal?: number
  tableAllTotal?: number
  rowKeys?: string[]
  mode?: string
  loading?: boolean
  scroll?: string
  isOpenDetails?: boolean
  info?: string
}

const projectStore = useProjectStore()
const tableStore = useTableStore()
const { proxy } = getCurrentInstance() as any

// 缓存的key名称
const cacheKey = computed(() => `project_list_${router.currentRoute.value.params.id}`)

// 是否选择所有
const tableCheckData = shallowReactive<{
  checkAll: boolean
  selectedRowKeys: string[]
  selectedRows: TableRowData[]
}>({
  checkAll: false,
  selectedRowKeys: [],
  selectedRows: [],
})

// 表格实例
const xGrid = ref<VxeGridInstance<TableRowData>>()

// 关闭编辑窗口时，清楚当前选中行
proxy.mittBus.on('closeTaskDialog', () => {
  xGrid.value?.clearCurrentRow()
})

const tableOptions = gridOptions(props.mode)
const rawTableOptions = cloneDeep(toRaw(tableOptions))

// 骨架数据
const skeletonRenderData = shallowReactive<any>({
  timer: null,
  idKeys: [],
  idsParam: [],
  idsLoading: new Map(),
})

const configData = shallowReactive({
  containerWidth: 0,
  contentWidth: 0,
})

// 滚动条
// const scrollbarRef = ref()

const lockScroll = ref(0)
provide('lockScroll', lockScroll)
watch(lockScroll, (n) => {
  if (n > 0)
    scrollControl('hidden')
  else
    scrollControl('auto')
})

// tooltip 单例
// const tooltipRef = ref()
// const tooltipMsg = ref('')

// 评论 popover 单例
// const commentRef = ref()
// const commentRow = ref()

// 快速完成 popover 单例
// const popoverVisible = ref(false)
// const popoverRef = ref()
// const popoverRow = ref()

// 待确认 popover 单例
// const confirmPopoverVisible = ref(false)
// const confirmRef = ref()
// const confirmRow = ref()

// 负责人 popover 单例
// const directorRef = ref()
// const directorRow = ref()

// 已终止 重启 popover 单例
// const restoreRow = ref()
// const restoreRef = ref()
// const restoreVisible = ref(false)

// 已完成 重启 popover 单例
// const restartRef = ref()
// const restartVisible = ref(false)
// const restartRow = ref()

// 测试按钮
// const bTablePopupRef = ref()

const dataTableRef = ref<HTMLDivElement>()

interface FixedColumn {
  column1Width: number
  column2Width: number
  column3Width: number
  lastColumn0Width: number
  lastColumn1Width: number
  lastColumn2Width: number
  lastColumn3Width: number
}

type FixedColumnKey = keyof FixedColumn

interface StateType {
  fixedTopShadow: boolean
  fixedLeftShadow: boolean
  fixedRightShadow: boolean
  groupColors: string[]
  showType: Record<ShowTypeKey, string>
  autoWidth: boolean
  fixedColumn: FixedColumn
  widthIsChange: boolean
}

const showTypeConfig = {
  versionName: [65],
  type: [60],
  priority: [66],
  director: [100],
  creator: [68],
  status: [120, 98, 65],
}

type ShowType = typeof showTypeConfig
type ShowTypeKey = keyof ShowType

const state = reactive<StateType>({
  fixedTopShadow: false,
  fixedLeftShadow: false,
  fixedRightShadow: false,
  groupColors: [],
  showType: {
    versionName: '',
    type: '',
    priority: '',
    director: '',
    creator: '',
    status: '',
  },
  autoWidth: true, // 列是否有自动宽度
  fixedColumn: {
    column1Width: 84,
    column2Width: 71,
    column3Width: 73,

    lastColumn0Width: 131, // 所属项目列
    lastColumn1Width: 57, // 参与人
    lastColumn2Width: 64, // 进度
    lastColumn3Width: 120, // 总排期
  },
  widthIsChange: false,
})

// 是否显示链接图片附件图标
// const isShowFileIcon = computed(() => (arr: number[]) => {
//   return arr.includes(1) || arr.includes(2) || arr.includes(4)
// })

// 切换树形表格展开收起
function toggleTreeExpand(data: any) {
  // bTablePopupRef.value.clear()
  data.row.isExpanded = data.expanded ? 'expand' : 'fold'
}

function customToggleExpand(row: any) {
  nextTick(() => {
    const $grid = xGrid.value
    $grid?.toggleTreeExpand(row)
    row.isExpanded = !row.isExpanded
    if (row.isExpanded) {
      tableStore.setExpandIds(row.key)
    }
    else {
      tableStore.removeExpandIds(row.key)
    }
  })
}

function onVisibleChange({ visibleStart, visibleSize, $table }: any) {
  const offset = 10
  for (let i = visibleStart; i < visibleStart + visibleSize - 1 + offset; i++) {
    // afterFullData: 渲染表格的数组
    const item = $table.internalData.afterFullData[i]
    if (item && !item.isGroup && item.loading && !skeletonRenderData.idsLoading.has(String(item.key)))
      skeletonRenderData.idKeys.push(String(item.key))
  }
}

// 更改优先级
// async function changePriority(value: string, record: TableRowData) {
//   try {
//     await editWorkPriority(record.spaceId || '', record.id || '', value)
//     record.priority = value
//     message.success('优先级修改成功', 2)
//     emits('refreshTableItem', [record.id])
//   }
//   catch (error) {}
// }

// 获取文件tips内容
// function getFileTitle(iconFlags: number[]) {
//   // 没有附件
//   if (!isShowFileIcon.value)
//     return

//   // 筛选出评论
//   const typeArr = iconFlags.filter((find: number) => find !== 8)
//   let text = ''
//   typeArr.forEach((item: number, index: number) => {
//     text = text + getFileType(item)
//     if (typeArr.length > 1 && index !== typeArr.length - 1)
//       text = `${text}/`
//   })

//   return `任务包含${text}`
// }

// 附件类型（type：1有图片 2有链接 4有附件 8有评论）
// function getFileType(type: number) {
//   switch (type) {
//     case 1:
//       return '图片'

//     case 2:
//       return '链接'

//     case 4:
//       return '附件'

//     default:
//       break
//   }
// }

// async function closeDirector(
//   record: TableRowData,
//   val: any,
// ) {
//   await editDirector(record, val)

//   emits('onUpdate', record.id)
// }

// 修改负责人
// async function editDirector(record: TableRowData, director: TaskDirectorOrTag) {
//   try {
//     if (record.pid === '0') {
//       await editWorkDirector(
//         record.spaceId || '',
//         record.id || '',
//         record.flowNode.owner.ownerRole[0].key,
//         director,
//       )
//       message.success('负责人修改成功', 2)
//     }
//     else {
//       await workItemDirectorSet(record.spaceId || '', record.id || '', director)
//       message.success('负责人修改成功', 2)
//     }
//   }
//   catch (error) {}
// }

// 监听选择负责人
// async function toggleDirector(record: TableRowData, e: MouseEvent) {
//   if (record.perm.allowEdit) {
//     bTablePopupRef.value.pop(
//       e,
//       { type: 'director', clickOutside: false, width: '362px', border: false },
//       {
//         value: record.directors,
//         rawValue: cloneDeep(record.directors),
//         row: record,
//         classType: 'table-style detail',
//       },
//     )
//   }
// }

async function openDrawer(record: TableRowData, index: number, type?: string) {
  projectStore.setTaskItem(record)
  emits('openDrawer', record, index, type)
}

watch(
  () => router.currentRoute.value.params.id,
  () => {
    tableCheckData.checkAll = false
  },
)

watch(
  () => projectStore.isCollapse,
  () => {
    const $grid = xGrid.value
    nextTick(() => {
      $grid?.recalculate()
    })
  },
)

let xGridObserver: ResizeObserver

onMounted(() => {
  loadData()
  // const columnConfig = projectStore.getColumnConfig(cacheKey.value)
  // columnConfig.forEach((item: ColumnConfig) => {
  //   const column = findNode(tableOptions.columns, ele => ele.field === item.field)
  //   if (column)
  //     column.width = item.resizeWidth
  //   onColumnWidthChange({ $rowIndex: item.rowIndex, $columnIndex: item.columnIndex, resizeWidth: item.resizeWidth, column: { field: item.field } as VxeColumnProps })
  // })

  // 计算是否需要显示冻结列阴影
  window.addEventListener('resize', onResize)

  // 监听主内容面板宽度
  xGridObserver = new ResizeObserver(() => {
    fixedRightShadowVisible()
  })
  xGridObserver.observe(document.querySelector('.app-main')!)
})

function loadData() {
  clearData()
  nextTick(() => {
    tableOptions.loading = true
    const $grid = xGrid.value
    requestAnimationFrame(async () => {
      if ($grid) {
        skeletonRenderData.timer = setInterval(() => {
          skeletonRenderData.idsParam = skeletonRenderData.idKeys.splice(0, 40)
          const ids = []
          for (let index = 0; index < skeletonRenderData.idsParam.length; index++) {
            const element = skeletonRenderData.idsParam[index]
            if (skeletonRenderData.idsLoading.has(element))
              continue

            ids.push(element)
            skeletonRenderData.idsLoading.set(element, true)
          }
          if (ids.length === 0)
            return
          emits('onGetKeys', ids)
        }, 100)
        $grid.reloadData(props.table)
        tableOptions.loading = false

        state.fixedTopShadow = false
        state.fixedLeftShadow = false
        fixedRightShadowVisible()
      }
    })
  })
}

// function handleScrollX(e: { scrollLeft: number, scrollTop: number }) {
//   const top = xGrid.value?.getScroll().scrollTop || 0
//   xGrid.value?.scrollTo(e.scrollLeft, top)
// }

function rowClassName(data: { row: TableRowData }) {
  if (!data.row.workItemStatus)
    return ''
  if (data.row.workItemStatus.val)
    return 'table-module'
}

function clearData() {
  clearInterval(skeletonRenderData.timer)
  skeletonRenderData.idKeys = []
  skeletonRenderData.idsParam = []
  skeletonRenderData.idsLoading.clear()
}

// function onTableChange(value: any, key: string, scope: any) {
//   switch (key) {
//     case 'priority':
//       changePriority(value, scope.row)
//       break
//   }
// }

// function onTableClose(value: any, key: string, scope: any) {
//   switch (key) {
//     case 'director':
//       closeDirector(scope.row, value)
//       break
//   }
// }

function fixedRightShadowVisible() {
  if (dataTableRef.value) {
    configData.contentWidth
          = (dataTableRef.value?.querySelectorAll('.vxe-table--body')[0] as HTMLDivElement).offsetWidth
    configData.containerWidth = dataTableRef.value.clientWidth
    state.fixedRightShadow = configData.contentWidth > dataTableRef.value.clientWidth
  }
}

// function onClickStatus(e: MouseEvent, type: string, row: TableRowData) {
//   if ((row.perm.allowChangeState || row.perm.allowNode) && !(Number(row.workItemStatus.val) === 3 && row.pid !== '0')) {
//     switch (type) {
//       case 'quickComplete':
//         popoverRef.value = e.currentTarget
//         popoverVisible.value = true
//         popoverRow.value = row
//         break
//       case 'confirm':
//         confirmRef.value = e.currentTarget
//         confirmPopoverVisible.value = true
//         confirmRow.value = row
//         break
//       case 'restore':
//         restoreRef.value = e.currentTarget
//         restoreVisible.value = true
//         restoreRow.value = row
//         break
//       case 'restart':
//         restartRef.value = e.currentTarget
//         restartVisible.value = true
//         restartRow.value = row
//         break
//     }
//   }
// }

// function onFollow(row: TableRowData) {
//   taskFollow(row.id!, row.followed!)
//     .then(() => {
//       emits('refreshTableItem', [row.id])
//       message.success(row.followed ? '取消关注成功！' : '关注任务成功！', 2)
//     })
// }

// tooltip 在目标上移动
// function tooltipMouseover(e: MouseEvent, msg: string) {
//   if (!e.currentTarget)
//     return
//   tooltipRef.value = e.currentTarget
//   tooltipMsg.value = msg
// }

function onScroll(e: { scrollTop: number, scrollLeft: number, bodyWidth: number, scrollWidth: number }) {
  state.fixedTopShadow = e.scrollTop > 0
  state.fixedLeftShadow = e.scrollLeft > 0
  state.fixedRightShadow = e.scrollLeft + e.bodyWidth !== e.scrollWidth
  // scrollbarRef.value.setScrollLeft(e.scrollLeft)
}

function onResize() {
  fixedRightShadowVisible()
}

function getGroupColor(row: TableRowData) {
  switch (row.fieldKey) {
    case 'priority':
    case 'work_item_flow_id':
    case 'work_item_status':
      return getBadgeColor(row.displayName)
    case 'work_object_id':
      return '#F9F0D5' // 模块：P5颜色
    case 'version_id':
      return '#F0E8FF' // 版本：P6颜色
    case 'directors':
      return '#FAE4F3' // 当前负责人：P7颜色
    case 'user_id':
      return '#E9F7DF' // 创建人：P9颜色
  }
}

function onColumnWidthChange({ $rowIndex, $columnIndex, resizeWidth, column }: { $rowIndex: number, $columnIndex: number, resizeWidth: number, column: VxeColumnProps }) {
  state.widthIsChange = true
  // 左侧冻结列变量修改
  if ($rowIndex === 0 && $columnIndex > 0 && $columnIndex < 4)
    state.fixedColumn[`column${$columnIndex}Width` as FixedColumnKey] = resizeWidth

  // 首页 右侧冻结列变量修改
  if (props.mode === 'home' && $rowIndex === 0 && $columnIndex === 10)
    state.fixedColumn['lastColumn0Width' as FixedColumnKey] = resizeWidth

  if (props.mode === 'task' && $rowIndex === 1 && ($columnIndex >= 0 || $columnIndex <= 2))
    state.fixedColumn[`lastColumn${$columnIndex + 1}Width` as FixedColumnKey] = resizeWidth

  // 计算当前宽度下，列显示的样式
  const item = showTypeConfig[column.field! as ShowTypeKey]
  if (item) {
    let newType = ''
    for (let i = item.length - 1; i >= 0; i--) {
      if (resizeWidth <= item[i]) {
        newType = String(item.indexOf(item[i]) + 1)
        break
      }
    }
    state.showType[column.field! as ShowTypeKey] = newType
  }

  // 重新计算右侧冻结列宽度
  fixedRightShadowVisible()

  // 保存配置
  projectStore.setColumnConfig(cacheKey.value, { rowIndex: $rowIndex, columnIndex: $columnIndex, resizeWidth, field: column.field! })

  // 保存到变量
  const tableColumn = findNode(tableOptions.columns, ele => ele.field === column.field)
  if (tableColumn)
    tableColumn.width = resizeWidth

  // 该列是否自动宽度
  if (column.field === 'displayName')
    state.autoWidth = false
}

async function onResetView() {
  // 重置列宽
  await xGrid.value?.reloadColumn(cloneDeep(rawTableOptions.columns))
  for (let i = 0; i < rawTableOptions.columns.length; i++) {
    const item = rawTableOptions.columns[i]

    if (item.children?.length > 0) {
      item.children.forEach((ele: any, ei: number) => {
        const column: any = xGrid.value?.getColumnByField(ele.field)
        onColumnWidthChange({ $rowIndex: 1, $columnIndex: ei, resizeWidth: column.width, column })
      })
    }
    else {
      const column: any = xGrid.value?.getColumnByField(item.field)
      onColumnWidthChange({ $rowIndex: 0, $columnIndex: i, resizeWidth: column.width, column })
    }
  }
  xGrid.value?.setAllTreeExpand(true)
  // 移除缓存
  projectStore.clearColumnConfig(cacheKey.value)
  state.widthIsChange = false
}

// function onCopyWorkItemId(row: TableRowData) {
//   useCopy(
//     `#${row.id}`,
//     h('div', {
//       innerHTML: `<div  style="color: #333333;">已复制 ID <span class="pfm">「${row.id}」</span></div>`,
//     }),
//   )
// }

onUnmounted(() => {
  window.removeEventListener('resize', fixedRightShadowVisible)
  xGridObserver.disconnect()
})

onDeactivated(() => {
  clearData()
})

defineExpose({
  loadData,
})
</script>

<template>
  <div v-if="loading && table.length === 0" :style="{ height: scroll }">
    <b-table-loading />
  </div>
  <div
    v-if="!loading"
    ref="dataTableRef"
    class="b-data-table"
    :class="{ [mode]: true }"
    :style="{
      'height': scroll,
      'width': 'calc(100vw - 4.10256vw)',
      '--column1-width': `${state.fixedColumn.column1Width}px`,
      '--column2-width': `${state.fixedColumn.column2Width}px`,
      '--column3-width': `${state.fixedColumn.column3Width}px`,
      '--last-column0-width': `${state.fixedColumn.lastColumn0Width}px`,
      '--last-column1-width': `${state.fixedColumn.lastColumn1Width}px`,
      '--last-column2-width': `${state.fixedColumn.lastColumn2Width}px`,
      '--last-column3-width': `${state.fixedColumn.lastColumn3Width}px`,
      '--container-width': `${configData.containerWidth}px`,
      '--table-width': `${configData.contentWidth}px`,
    }"
  >
    <vxe-grid
      ref="xGrid"
      v-bind="tableOptions"
      :empty-render="{ name: 'NotData' }"
      :tree-config="{
        transform: true,
        rowField: 'id',
        parentField: 'parentId',
        expandAll: true,
      }"
      :row-config="{
        keyField: 'rowKey',
        isHover: true,
        isCurrent: isOpenDetails,
      }"
      :row-class-name="rowClassName"
      :params="{
        isGroup: true,
        scrollFollow: true,
      }"
      :class="{
        'fixed-top-shadow': state.fixedTopShadow,
        'fixed-left-shadow': state.fixedLeftShadow,
        'home_fixed-right-shadow': state.fixedRightShadow && mode === 'home',
        'task_fixed-right-shadow': state.fixedRightShadow && mode === 'task',
        'scroll-y': configData.contentWidth > configData.containerWidth,
      }"
      class="project-grid"
      round
      @toggle-tree-expand="toggleTreeExpand"
      @scroll="onScroll"
      @visible-change="onVisibleChange"
      @resizable-change="onColumnWidthChange"
    >
      <template #bottom>
        <div
          v-if="!loading && table.length !== 0 "
          class="table-footer flex-row-between pr16 text12"
        >
          <div>共 {{ tableTotal }}，当前列表 {{ tableAllTotal }}</div>
          <div v-if="state.widthIsChange" class="reset-view pointer" @click="onResetView">
            <svg-icon name="reset-view" size="14" /> 恢复视图
          </div>
        </div>
      </template>
      <template #empty>
        <b-empty
          v-if="!loading && table.length === 0"
          img-name="no-data-search.svg"
          :is-svg="false"
          icon-mb="5px"
          desc="暂无内容"
        />
      </template>
      <!-- 序号和多选框 头部 -->
      <template #checkbox_header />

      <!-- <template #table_header="{ column }">
        <b-ellipsis
          :content="column.title"
          fs="13"
          chinese
          @mouse-over-back="(e: MouseEvent) => tooltipMouseover(e, column?.title)"
        />
      </template> -->
      <!-- 版本 -->
      <!-- <template #versionName_default="{ row }">
        <BSkeleton :loading="row.loading">
          <div
            class="flex-inline version-tag pfm text-color3"
          >
            <b-ellipsis
              :content="row.versionName"
              :ellipsis="state.showType.versionName === '1'"
              content-class="pfm"
              @mouse-over-back="(e: MouseEvent) => tooltipMouseover(e, row?.versionName)"
            />
          </div>
        </BSkeleton>
      </template> -->

      <!-- 任务流程 -->
      <!-- <template #type_default="{ row }">
        <BSkeleton :loading="row.loading">
          <div class="type-box flex-row-start">
            <div
              class="work-item-type box pl8 pr8 h24 br4 text14 text-color3 ss-line-1"
              :style="{ background: row.flowColor }"
            >
              <b-ellipsis
                :content="row.flowName"
                :ellipsis="state.showType.type === '1'"
                content-class="pfm"
                @mouse-over-back="(e: MouseEvent) => tooltipMouseover(e, row.flowName)"
              />
            </div>
          </div>
        </BSkeleton>
      </template> -->

      <!-- 优先级 -->
      <!-- <template #priority_default="{ row }">
        <BSkeleton :loading="row.loading">
          <div
            class="priority-box flex-row-start"
            @click="
              (e) => {
                if (!row.perm.allowEdit) return
                bTablePopupRef.pop(
                  e,
                  { type: 'prioritySelect', hideContent: true },
                  { row, className: 'detail table', width: '100%' },
                )
              }
            "
          >
            <b-table-priority
              v-if="row.priority"
              :value="row.priority"
              :disabled="!row.perm.allowEdit"
              :hover-ellipsis="state.showType.priority === '1'"
              class-name="detail table"
              @mouse-over-back="(e: MouseEvent, val: string) => tooltipMouseover(e, val)"
            />
          </div>
        </BSkeleton>
      </template> -->

      <!-- 任务名称 -->
      <template #displayName_default="{ row, _rowIndex, islast, level }">
        <!-- 分组行 -->
        <div
          v-if="row.isGroup"
          class="flex-row-start module-name flex-inline flex-row-start full-100 pointer"
        >
          <div v-if="level !== 0" class="group-child flex-row-center mr8 ml8">
            <svg-icon name="group-child" size="16" color="#999999" />
          </div>
          <div
            class="x-expand-icon flex-row-center "
            :class="{ rotate: row.isExpanded === 'fold', ml8: level === 0 }"
          >
            <svg-icon name="table-group-bottom" size="16" color="#999999" />
          </div>
          <p class="mr8 flex-row-center pfm">
            {{ row.fieldKey === 'priority' ? PRIORITY_LIST.find(item => item.label === row.displayName)!.label : row.displayName }}
          </p>
          <!-- <span class="text13 minor-color">共 {{ row.total }}</span> -->
        </div>

        <BSkeleton v-else :loading="row.loading">
          <div class="displayname-box flex-row-start">
            <div
              class="content flex-row-start flex-one"
              style="min-width: 0; flex: 1;"
            >
              <!-- <div
                v-if="!(row.pid === '0' && row.children.length === 0)"
                class="x-expand-icon w16 h16 pointer"
                :class="{
                  rotate: row.isExpanded,
                  op: row.pid === '0' && row.children.length === 0,
                  hide: row.pid !== '0' && row.children.length === 0,
                }"
                @click="customToggleExpand(row)"
              >
                <svg-icon name="table-group-bottom" size="16" color="#999999" />
              </div> -->

              <svg-icon
                v-if="row.pid !== '0'"
                :name="islast ? 'children-end' : 'children-start'"
                class="mr4"
                size="16"
                color="#999999"
              />
              <span
                class="ss-line-1 icon-color pointer w-full"
                @click="openDrawer(row, _rowIndex, 'base')"
              >
                <b-ellipsis :content="row.workItemName" fs="3.58974vw" />
              </span>

              <!-- <p
                v-if="row.children.length > 0"
                id="subtask-icon"
                class=" flex-row-start mt1 pl3 text13 minor-color flex-inline"
                @mouseover="(e) => tooltipMouseover(e, `共 ${row.children.length} 条子任务`)"
              >
                <svg-icon class="ml2" name="children" size="14" color="#999999" />
                {{ row.children.length }}
              </p> -->

              <!-- <svg-icon
                v-if="isShowFileIcon(row.iconFlags)"
                id="file-icon"
                class=" ml4 ty1 flex-shrink-0"
                name="has-files"
                size="14"
                color="#999999"
                @mouseover="
                  (e: MouseEvent) => {
                    if (isShowFileIcon(row.iconFlags)) {
                      tooltipMouseover(e, getFileTitle(row.iconFlags) as string)
                    }
                  }
                "
              /> -->
            </div>

            <!-- <div class="tool ml8 flex-row-start">
              <div
                v-if="row.perm.allowEdit"
                class="tool-item tool-edit w22 h22 br4 flex-row-center"
                @click="(e) => bTablePopupRef.pop(e, { type: 'workItemName' }, { row })"
              >
                <svg-icon size="16" name="table-edit" color="#666666" />
              </div>
              <div
                v-show="row.iconFlags?.includes(8)"
                :class="{ border: row.unreadCommentNum > 0 }"
                class="tool-comment h24 br4 ml8 flex-row-center pointer"
                @mouseover="
                  (e: MouseEvent) => {
                    commentRef = e.currentTarget
                    commentRow = row
                  }
                "
                @mouseleave="commentRow = {}"
                @mousedown.left.stop="openDrawer(row, _rowIndex, 'comment')"
              >
                <svg-icon size="16" name="table-comment" color="#666666" />
                <span v-if="row.unreadCommentNum > 0" class="comment-num text12">{{
                  row.unreadCommentNum > 99 ? '99+' : row.unreadCommentNum
                }}</span>
              </div>
            </div> -->
          </div>
        </BSkeleton>
      </template>

      <!-- 负责人 -->
      <template #director_default="{ row, _rowIndex }">
        <BSkeleton
          :paragraph="false"
          :loading="row.loading"
          active
          @click="openDrawer(row, _rowIndex, 'base')"
        >
          <div
            class="director-module pointer flex items-center justify-items-center"
          >
            <b-head v-if="row.directors" :id=" row.directors[0]?.userId" :name=" row.directors[0]?.userNickname" :src=" row.directors[0]?.avatar" width="6.15384vw" />

            <!-- @click="(e: MouseEvent) => toggleDirector(row, e)" -->
            <!-- <b-avatar-name-tag
              :user-id="row.directors && row.directors[0]?.userId"
              :user-nickname="row.directors && row.directors[0]?.userNickname"
              :src="row.directors && row.directors[0]?.avatar"
              :only-avatar="['1'].includes(state.showType.director)"
              @mouseover="
                (e: MouseEvent) => {
                  if (['1'].includes(state.showType.director)) {
                    directorRef = e.currentTarget
                    directorRow = row.directors
                  }
                }
              "
            /> -->
            <!-- <p
              v-if="row.directors?.length > 1 && !['1'].includes(state.showType.director)"
              class="hover-gray text14 minor-color ml4"
              @mouseover="
                (e: MouseEvent) => {
                  if (row.directors?.length > 0) {
                    directorRef = e.currentTarget
                    directorRow = row.directors
                  }
                }
              "
            >
              +{{ row.directors?.length - 1 }}
            </p> -->
            <!-- <svg-icon v-if="row.perm.allowEdit" class="op" name="arrow-b-out" size="16" color="#666666" /> -->
          </div>
        </BSkeleton>
      </template>

      <!-- 创建人 -->
      <!-- <template #creator_default="{ row }">
        <BSkeleton :loading="row.loading">
          <div class="creator-module flex-row-start ">
            <b-avatar-name-tag
              :user-id="row.creator?.userId"
              :user-nickname="row.creator?.userNickname"
              :src="row.creator?.avatar"
              :only-avatar="['1'].includes(state.showType.creator)"
            />
          </div>
        </BSkeleton>
      </template> -->

      <!-- 任务状态 -->
      <!-- <template #status_default="{ row }">
        <BSkeleton :loading="row.loading">
          <BStatusOperations
            :row="row"
            :active="[popoverRow?.key, confirmRow?.key, restoreRow?.key, restartRow?.key].includes(row.key)"
            :text-wrap="['2', '3'].includes(state.showType.status) ? 'wrap' : 'nowrap'"
            :mini-hover="['2', '3'].includes(state.showType.status)"
            :ellipsis="state.showType.status === '3'"
            :show-restart="Number(row.restartAt) > 0 && ['', '1'].includes(state.showType.status)"
            @on-click="(e: MouseEvent, type: string) => onClickStatus(e, type, row)"
            @mouse-over-back="(e: MouseEvent, msg: string) => tooltipMouseover(e, msg)"
          >
            <p v-if="!state.showType.status" class="time text14 minor-color ml4 ss-line-1">
              {{ row.nodeTime }}
            </p>
            <div
              v-if="Number(row.restartAt) > 0 && ['', '1'].includes(state.showType.status)"
              class="reseted-btn flex-row-center"
              style="pointer-events: auto"
              @click.stop=""
              @mouseover="
                (e) =>
                  tooltipMouseover(
                    e,
                    row.restartUser.userNickname
                      ? `${row.restartUser.userNickname}<span class='minor-color-55'>（${row.restartUser.userName}）</span>重启了该任务`
                      : '已重启',
                  )
              "
            >
              <svg-icon name="reseted" size="16" color="#bfbfbf" />
            </div>
          </BStatusOperations>
        </BSkeleton>
      </template> -->

      <!-- 模块 -->
      <!-- <template #workObject_default="{ row }">
        <BSkeleton :loading="row.loading">
          <p class="text14 icon-color ss-block-1 box-sizing-box">
            <b-ellipsis
              :content="row.workObjectName"
              @mouse-over-back="(e: MouseEvent) => tooltipMouseover(e, row.workObjectName)"
            />
          </p>
        </BSkeleton>
      </template> -->

      <!-- 参与人 -->
      <!-- <template #attendee_default="{ row }">
        <BSkeleton :loading="row.loading">
          <p
            class="hover-gray pl8 text14 minor-color"
            @mouseover="
              (e: MouseEvent) => {
                if (row.directors?.length > 0) {
                  directorRef = e.currentTarget
                  directorRow = row.participators
                }
              }
            "
          >
            {{ row.participators?.length > 0 ? `+${row.participators?.length}` : 0 }}
          </p>
        </BSkeleton>
      </template> -->

      <!-- 进度 -->
      <!-- <template #processRate_default="{ row }">
        <BSkeleton :loading="row.loading">
          <div class="process-box pr4">
            <div
              :class="{ 'not-rate-allow': !row.perm.allowEdit }"
              class="processrate-text text14 color-minor flex-row-between"
              @click="
                (e) => {
                  if (row.perm.allowEdit)
                    bTablePopupRef.pop(e, { type: 'processRate' }, { row, maxlength: 3 })
                }
              "
            >
              {{ row.workItemStatus.val === 2 ? '100%' : `${row.processRate}%` }}
              <div
                class="tool-edit w22 h22 br4 flex-row-center pointer"
              >
                <svg-icon size="16" name="table-edit" color="#666666" />
              </div>
            </div>
          </div>
        </BSkeleton>
      </template> -->

      <!-- 总排期 -->
      <template #time_default="{ row, _rowIndex }">
        <BSkeleton :loading="row.loading" @click="openDrawer(row, _rowIndex, 'base')">
          <p
            :class="[row.planTimeColor]"
            class="text12 icon-color"
          >
            {{ row.formatTime }}
          </p>
        </BSkeleton>
      </template>

      <!-- 所属项目 -->
      <!-- <template #project_default="{ row }">
        <BSkeleton :loading="row.loading" active>
          <p class="text14 minor-color ss-block-1 box-sizing-box">
            <b-ellipsis
              :content="row.spaceName"
              @mouse-over-back="(e: MouseEvent) => tooltipMouseover(e, row.spaceName)"
            />
          </p>
        </BSkeleton>
      </template> -->
    </vxe-grid>

    <!-- 横向滚动条 -->
    <!-- <el-scrollbar ref="scrollbarRef" class="h8" always @scroll="handleScrollX">
      <div :style="{ width: `${configData.contentWidth}px` }" class="h8" />
    </el-scrollbar>

    <ElTooltip
      :virtual-ref="tooltipRef"
      :content="tooltipMsg"
      trigger="hover"
      placement="top"
      raw-content
      virtual-triggering
    />

    <quickCompletePopover
      v-model:visible="popoverVisible"
      v-model:data="popoverRow"
      :virtual-ref="popoverRef"
      @success="(ids) => $emit('refreshTableItem', ids)"
    />
    <confirmPopover
      v-model:visible="confirmPopoverVisible"
      v-model:data="confirmRow"
      :virtual-ref="confirmRef"
      @success="(ids) => $emit('refreshTableItem', ids)"
    />
    <commentTooltip :row="commentRow" :virtual-ref="commentRef" />
    <directorTooltip :data="directorRow" :virtual-ref="directorRef" />
    <restorePopover
      v-model:visible="restoreVisible"
      v-model:row="restoreRow"
      :virtual-ref="restoreRef"
      @success="(ids) => $emit('refreshTableItem', ids)"
    />
    <restartPopover
      v-model:visible="restartVisible"
      v-model:row="restartRow"
      :virtual-ref="restartRef"
      @success="(ids) => $emit('refreshTableItem', ids)"
    />
    <BTablePopup
      ref="bTablePopupRef"
      @on-change="onTableChange"
      @on-close="onTableClose"
      @success="(ids: string[]) => $emit('refreshTableItem', ids)"
    /> -->
  </div>
</template>

<style lang="scss" scoped>
@import './scss/table.scss';
.version-tag {
  padding: 0 12px;
  max-width: 100%;
  height: 24px;
  line-height: 24px;
  border-radius: 12px;
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  background: #f2f3f5;
  justify-content: center;
}
.work-item-type {
  line-height: 24px;
  max-width: 100%;
  padding: 0 8px;
}
</style>

<style lang="scss">
.vxe-table--tooltip-wrapper.theme--dark {
  opacity: 0;
}
.el-popper[style~='translate3d(0px,'],
.el-popper[style~='translate(0px,'],
.el-popper[style~='translate3d(-1px,'],
.el-popper[style~='translate(-1px,'],
.el-popper[style*='inset: 12px auto auto 0px'] {
  display: none;
}
.not-allowed {
  cursor: not-allowed;
}
</style>
