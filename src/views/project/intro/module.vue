<script lang="ts" setup>
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import Sortable from 'sortablejs'
import { message } from 'ant-design-vue'
import type { VxeGridInstance } from 'balala-vxe-table'
import { gridOptions, recordRow } from './config/module'
import router from '@/router'
import { useProjectStore } from '@/stores/modules/project'
import {
  deepCopy,
  findObjectWithProperty,
  formatTaskPriority,
  getCurrentWeek,
  getTextLength,
  throttle,
} from '@/utils'
import type { CreateProjectModuleItemData, ProjectModuleListItem } from '@/api/interface'
import {
  createProjectModule,
  editProjectModuleName,
  getProjectModuleCount,
  updateProjectModuleOrder,
  workObjectDel,
  workObjectDelTran,
} from '@/api/project'
import { useBaseChart } from '@/echart'
import type { QueryCondition } from '@/components/BSearchFilter/interface'
import { archivedTaskStatus, progressTaskStatusList } from '@/enum/TaskStatus'
import { usePermission } from '@/hooks/usePermission'
import { Perm } from '@/enum/permission'
import { getResortList } from '@/utils/array'

interface Props {
  maxHeight?: string | number
  scrolltop?: number
  scrollMaxHeight?: string
  showChart?: boolean
  type?: string
}

/** PROPS */
const props = withDefaults(defineProps<Props>(), {
  maxHeight: 280,
  scrolltop: 472,
  scrollMaxHeight: '240px',
  showChart: true,
  type: 'main',
})

const emit = defineEmits(['onChangeTab', 'handleLoading'])

/** STORE */
const projectStore = useProjectStore()
const { checkPerm } = usePermission()

/** INJECT */
const handleChangeTab: Function = inject('handleChangeTab') as Function

/** DATA */
const echartRef = ref()
const addBtnDIs = ref<boolean>(false)
const customScrollRef = ref() // 自定义滚动条 DOM
const introModuleGrid = ref<VxeGridInstance>() // 表格 DOM
const refList: any = reactive<HTMLInputElement[]>([]) // dom数组 => 模块名称
const moduleData = ref<ProjectModuleListItem[]>([]) // 模块列表数据
const copyModuleData = ref<ProjectModuleListItem[]>([])
const currentModule = ref<CreateProjectModuleItemData>() // 当前模块
const removeModule = ref<CreateProjectModuleItemData>() // 当前模块
const removeDialog: {
  visible: boolean
  removeItem: {
    title: string
    options: Array<any>
    selected: any
    count: number
  }
} = reactive({
  visible: false,
  removeItem: {
    title: '',
    options: [],
    selected: null,
    count: 0,
  },
})
let sortTable: any
let initTime: any

// 是否为0
const isZero = computed(() => {
  return (value: any) => {
    if (Number(value) === 0 && props.type === 'main')
      return 'minor-color'
  }
})

onMounted(() => {
  getModulelist(true)
})

onUnmounted(() => {
  clearTimeout(initTime)
  if (sortTable)
    sortTable.destroy()
})
// 生成模块名称DOM数组
function setItemRef(el: HTMLElement, index: number) {
  if (el)
    refList[`nameRef${index}`] = el
}

// 数据更新
function __update() {
  const $grid = introModuleGrid.value
  if (sortTable)
    sortTable.destroy()
  if ($grid) {
    nextTick(() => {
      if (props.showChart && echartRef.value)
        useBaseChart(echartRef.value, moduleData.value)

      requestAnimationFrame(async () => {
        $grid.reloadData(moduleData.value)
      })
      if (checkPerm(Perm.DragSpaceWorkObject)) {
        initTime = setTimeout(() => {
          gridRowDrag()
        }, 500)
      }
    })
  }
}

// 监听表格滚动
function gridScroll(e: { scrollTop: number }) {
  customScrollRef.value?.setScrollTop(e.scrollTop)
}

// 绑定拖拽
function gridRowDrag() {
  const $grid = introModuleGrid.value
  if ($grid) {
    sortTable = Sortable.create(
      $grid?.$el.querySelector('.vxe-table--body-wrapper>.vxe-table--body tbody'),
      {
        handle: '.drag-btn',
        forceFallback: true,
        fallbackOnBody: false,
        onEnd: async (evt: any) => {
          const newIndex = evt.newIndex as number
          const oldIndex = evt.oldIndex as number
          if (oldIndex === newIndex)
            return
          const currentRow = moduleData.value && moduleData.value.splice(oldIndex, 1)[0]
          // 请求排序
          moduleData.value.splice(newIndex, 0, currentRow)
          changeSort(currentRow.spaceId)
        },
      },
    )
  }
}

// 更新排序
async function changeSort(spaceId: string) {
  updateProjectModuleOrder(spaceId, getResortList(moduleData.value))
    .finally(() => {
      getModulelist()
    })
}

// 获取模块列表
const optionList = ref([])
async function getModulelist(isShowLoading: boolean = false) {
  try {
    if (isShowLoading)
      emit('handleLoading', true)

    addBtnDIs.value = true
    const id = (router.currentRoute.value.params.id as string) || '264'
    const list = await projectStore.getProjectModuleList(id || '', true)
    setTimeout(() => {
      emit('handleLoading', false)
      copyModuleData.value = deepCopy(list || [])
      moduleData.value = list || []
      const options: any = []
      list?.forEach((item: any, index: number) => {
        options[index] = {
          value: item.id,
          label: item.workObjectName,
        }
      })
      optionList.value = options
      addBtnDIs.value = false
      __update()
    }, 400)
  }
  catch (error) {
    emit('handleLoading', false)
  }
}

// 获取进度
function getDasharray(rate: string) {
  const count = Number(rate)
  const start = `calc(2 * 3.1415 * (15 - 2) / 2 * (${count} / 100))`
  if (count === 0)
    return `stroke-dasharray: ${start}, 1000; opacity: 0;`

  return `stroke-dasharray: ${start}, 1000`
}

// 添加模块
// const addModule = throttle(() => {
//   handleInsert()
// }, 100)

// 新增行
// async function handleInsert() {
//   recordRow.spaceId = router.currentRoute.value.params.id as string
//   moduleData.value.unshift(recordRow)
//   const $grid = introModuleGrid.value
//   if ($grid) {
//     await $grid.insertAt(recordRow, null)
//     $grid.getTableData().tableData[0].contenteditable = true
//     setFocusStatu($grid.getTableData().tableData[0], 0, 'focus')
//     addBtnDIs.value = true
//   }
// }

// 移除行
async function handleRemove(row: any) {
  console.log(row)
  const $grid = introModuleGrid.value
  if ($grid)
    $grid.remove(row)

  if (row.id === '0')
    moduleData.value = moduleData.value.filter(item => item.id !== '0')
  useBaseChart(echartRef.value, moduleData.value)
}

// 模块名称 切换编辑状态
// function changeNameStatus(row: ProjectModuleListItem, _rowIndex: number) {
//   row.contenteditable = true
//   addBtnDIs.value = true
//   setFocusStatu(row, _rowIndex, 'focus')
// }

// 模块名称 获取焦点
function nameInputFocus(row: ProjectModuleListItem, _rowIndex: number) {
  // 拷贝当前点击行的数据
  currentModule.value = deepCopy(row)
  introModuleGrid.value?.scrollToRow(row)
}

// 模块名称 失去焦点
async function nameInputBlur(row: any) {
  const length = getTextLength(row.workObjectName.trim())
  const isVaild = !(length >= 2 && length <= 14)
  const isDuplicate = findObjectWithProperty(
    copyModuleData.value,
    'workObjectName',
    row.workObjectName,
  )
  if (row.id !== '0') {
    // 编辑流程
    row.contenteditable = false
    if (row.workObjectName.trim() === currentModule.value?.workObjectName) {
      // 前后名称相等，不做任何操作
      row.workObjectName = currentModule.value?.workObjectName
      currentModule.value = {} as any
      addBtnDIs.value = false
      return
    }
    if (isVaild) {
      message.error('请输入有效格式(2 ~ 14个字符)', 2)
      addBtnDIs.value = false
      row.workObjectName = currentModule.value?.workObjectName
    }
    else {
      if (isDuplicate) {
        message.error('模块名称重复', 2)
        addBtnDIs.value = false
        row.workObjectName = currentModule.value?.workObjectName
        return
      }
      // 请求编辑模块名称接口
      editModuleName(row)
      addBtnDIs.value = false
    }
  }
  else {
    // 新增流程
    if (isVaild) {
      if (row.workObjectName)
        message.error('请输入有效格式(2 ~ 14个字符)', 2)

      handleRemove(row)
      addBtnDIs.value = false
    }
    else {
      if (isDuplicate) {
        message.error('模块名称重复', 2)
        addBtnDIs.value = false
        handleRemove(row)
        return
      }
      // 请求新增模块接口
      createModule(row)
    }
  }
}

// 创建模块
async function createModule(row: any) {
  console.log(row.workObjectName.trim())
  try {
    await createProjectModule({
      spaceId: row.spaceId || '',
      workObjectName: row.workObjectName.trim(),
      describe: '',
    })
    message.success('模块创建成功', 2)
    getModulelist()
  }
  catch (error) {}
}

// 编辑模块
async function editModuleName(row: any) {
  try {
    const id = router.currentRoute.value.params.id as string
    await editProjectModuleName({
      spaceId: id || '',
      workObjectName: row.workObjectName.trim(),
      workObjectId: row.id,
    })
    message.success('模块编辑成功', 2)
    getModulelist()
  }
  catch (error) {
    row.workObjectName = currentModule.value?.workObjectName
    currentModule.value = {} as any
  }
}

// 设置焦点
function setFocusStatu(row: CreateProjectModuleItemData, index: number, type: string) {
  requestAnimationFrame(() => {
    if (type === 'focus') {
      refList[`nameRef${index}`].focus()
    }
    else {
      row.contenteditable = false
      if (!row?.id)
        currentModule.value = {} as any

      refList[`nameRef${index}`].blur()
    }
  })
}

// 删除模块
async function deleteModule(row: CreateProjectModuleItemData) {
  if (row.id === '0')
    return

  removeModule.value = row
  removeDialog.removeItem.selected = null

  const resCount = await getProjectModuleCount(row.spaceId, [row.id])

  let countTotle = 0
  if (resCount.data && resCount.data.list?.length) {
    const resArr = resCount.data.list.filter(item => item.id === row.id)

    if (resArr[0])
      countTotle = Number(resArr[0].total)
  }

  removeDialog.removeItem.count = countTotle

  if (countTotle) {
    removeDialog.removeItem.options = projectStore.projectModuleList
      .map((item) => {
        item.value = item.id
        item.label = item.workObjectName
        return item
      })
      .filter(item => item.value !== row.id)
    removeDialog.removeItem.title = `<p>当前模块已关联任务 <span class='minor-color'>${countTotle}</span> ，确认移除此模块吗？</p>`
  }
  else {
    removeDialog.removeItem.title = '确认移除此模块吗？'
  }
  removeDialog.visible = true
}

// 删除模块弹框 点击确认
async function dialogConfirm() {
  const { removeItem } = removeDialog
  try {
    if (removeItem.count) {
      if (!removeItem.selected) {
        message.error('请选择转移模块', 2)
        return
      }

      await workObjectDelTran({
        spaceId: removeModule.value?.spaceId || '',
        workObjectId: removeModule.value?.id || '',
        toWorkObjectId: removeItem.selected,
      })

      message.success(
        `模块 ${removeModule.value?.workObjectName} 已移除，成功转移 ${removeItem.count} 条任务`,
        2,
      )
    }
    else {
      await workObjectDel({
        spaceId: removeModule.value?.spaceId || '',
        workObjectId: removeModule.value?.id || '',
      })

      message.success(`模块 ${removeModule.value?.workObjectName} 已移除`, 2)
    }
    removeDialog.visible = false
    removeDialog.removeItem = {
      title: '',
      options: [],
      selected: null,
      count: 0,
    }
    moduleData.value = moduleData.value.filter((item: any) => item.id !== removeModule.value?.id)
    getModulelist()
  }
  catch (error) {
  }
}

// 删除模块弹框 点击取消
function dialogCancel() {
  removeModule.value = {} as any
}

// 获取优先级标题
function getTipsTitle(key: string) {
  let title = ''
  switch (key) {
    case 'PENDING':
      title = '待定'
      break

    case 'SUSPEND':
      title = '暂定'
      break

    default:
      title = key
      break
  }
  return `${title}`
}

// 跳转

function goTable(type: string, moduleId: string | number) {
  const currentWeek = getCurrentWeek() // 当前周

  const planTimeCondition: QueryCondition = {
    field: 'plan_time',
    operator: 'BETWEEN',
    values: [currentWeek.start, currentWeek.end],
    spaceId: '0',
  }

  const processingCondition: QueryCondition = {
    field: 'work_item_status',
    operator: 'NOT_IN',
    values: archivedTaskStatus,
    spaceId: '0',
  }

  const moduleCondition: QueryCondition = {
    field: 'work_object_id',
    operator: 'EQ',
    values: [String(moduleId)],
    spaceId: '0',
  }

  const conditions: QueryCondition[] = [moduleCondition]

  switch (type) {
    case 'weekProcessing':
      conditions.push(planTimeCondition, processingCondition)
      break
    case 'processing':
      conditions.push(processingCondition)
      break
    case 'total':
      break
  }

  handleChangeTab
  && handleChangeTab({
    conditions,
    conjunction: 'AND',
    groups: [],
  })
}

defineExpose({
  getModulelist,
})
</script>

<template>
  <div
    class="h32 intro-module-title flex-row-between"
    :class="maxHeight === 'auto' ? 'mb16 mt24' : 'mb12'"
  >
    <div class="left flex-row-start icon-color pfm text16">
      <svg-icon class="mr6" name="project-module" color="#333333" size="16" />
      模块管理
      <span class="minor-color text14 ml8">共 {{ moduleData.length }}</span>
    </div>
    <!-- <a-button
      v-if="checkPerm(Perm.CreateSpaceWorkObject)"
      class="add-btn"
      :disabled="addBtnDIs"
      @click="addModule"
    >
      添加模块
    </a-button> -->
  </div>
  <!-- <div
    v-if="showChart && moduleData.filter((i) => i.id !== '0').length > 0"
    class="chart-wrap mb24"
  >
    <div class="e-chart" :style="{ height: '332px' }">
      <div ref="echartRef" style="width: inherit; height: inherit" />
    </div>
  </div> -->
  <div class="table-wrap">
    <vxe-grid
      ref="introModuleGrid"
      class="intro-module-grid"
      :class="{ 'no-data': moduleData.length === 0 }"
      :row-class-name="checkPerm(Perm.DeleteSpaceWorkObject) ? 'hasPerm' : ''"
      v-bind="gridOptions(maxHeight, checkPerm(Perm.DeleteSpaceWorkObject))"
      :params="{ isGroup: false }"
      :scroll-y="{
        enabled: false,
      }"
      @scroll="gridScroll"
    >
      <!-- 模块名称头部 -->
      <template #name_header>
        <p class="flex-row-start pl5">
          模块名称
        </p>
      </template>
      <!-- 模块名称 -->
      <template #name_default="{ row, _rowIndex }">
        <div v-if="!row.contenteditable" class="text12 icon-color flex-row-between name-box pl8">
          <b-ellipsis :content="row.workObjectName" />
          <!-- <div
            v-if="checkPerm(Perm.ModifySpaceWorkObject)"
            class="edit-icon w20 h20 br2 flex-row-center"
            @click="changeNameStatus(row, _rowIndex)"
          >
            <svg-icon size="16" name="table-edit" color="#333333" />
          </div> -->
        </div>
        <a-input
          v-else
          :ref="(el: any) => setItemRef(el, _rowIndex)"
          v-model:value="row.workObjectName"
          :bordered="false"
          placeholder="待填"
          class="name-input pl14 text14 title-color"
          @focus="nameInputFocus(row, _rowIndex)"
          @press-enter="setFocusStatu(row, _rowIndex, 'blur')"
          @blur="nameInputBlur(row)"
        />
      </template>

      <!-- 本周待办 -->
      <template #week_default="{ row }">
        <p
          class="text14 icon-color pointer num-box"
          :class="isZero(row.weekProcessing)"
          @click="goTable('weekProcessing', row.id)"
        >
          {{ row.weekProcessing }}
        </p>
      </template>

      <!-- 待办总数 -->
      <template #processing_default="{ row }">
        <p
          class="text14 icon-color pointer num-box"
          :class="isZero(row.processing)"
          @click="goTable('processing', row.id)"
        >
          {{ row.processing }}
        </p>
      </template>

      <!-- 任务总数 -->
      <template #total_default="{ row }">
        <p
          class="text14 icon-color pointer num-box"
          :class="isZero(row.total)"
          @click="goTable('total', row.id)"
        >
          {{ row.total }}
        </p>
      </template>

      <!-- 优先级 -->
      <template #priority_default="{ row }">
        <div class="priority flex-row-between">
          <div
            v-for="item in row.priorityInfos"
            :key="item.priority"
            class="pointer"
            style="flex: 1; text-align: left"
          >
            <!--  -->
            <div class="flex-row-start">
              <a-tooltip :title="getTipsTitle(item.priority)" destroy-tooltip-on-hide :align="{ offset: [0, 0] }">
                <div class="wrap w58 h22 flex-row-start">
                  <span
                    class="flex w12 h12 br4 mr4"
                    :style="{ background: formatTaskPriority(item.priority)?.color }"
                  />
                  {{ Number(item.count) }}
                </div>
              </a-tooltip>
            </div>
            <!-- </a-tooltip> -->
          </div>
        </div>
      </template>

      <!-- 进度 -->
      <template #rate_default="{ row }">
        <div class="rate-box flex-row-start pl2">
          <!-- r (15 - 2)/2 -->
          <svg class="rate-circle mr8 flex-shrink-0">
            <circle stroke="#edeef0" />
            <circle stroke="#08C479" :style="getDasharray(row.completeRate)" />
          </svg>

          <p class="icon-color text14">
            {{ row.completeRate }}%
          </p>
        </div>
      </template>

      <!-- 工具栏 -->
      <template #tool_default="{ row }">
        <div
          v-if="
            (moduleData[0]?.contenteditable
              ? moduleData.length > 2
              : moduleData.length > 1 && checkPerm(Perm.DeleteSpaceWorkObject))
              || (row?.contenteditable && moduleData.length > 1)
          "
          class="tool-box flex-inline"
        >
          <a-tooltip title="移除" effect="dark">
            <div class="full flex-row-center" @mousedown.left="deleteModule(row)">
              <svg-icon
                name="filter-close"
                color="#999999"
                size="16"
              />
            </div>
          </a-tooltip>
        </div>
      </template>
      <!-- 空数据模板 -->
      <template #empty>
        <div v-if="moduleData.length === 0" class="empty-box flex-row-center">
          <p v-if="checkPerm(Perm.CreateSpaceWorkObject)" class="text14 minor-color">
            当前暂无模块，请添加
          </p>
          <p v-else class="text14 minor-color">
            请联系 <span class="icon-color">项目管理员</span> 添加模块
          </p>
        </div>
      </template>
    </vxe-grid>
    <!-- 自定义滚动条 -->
  </div>
  <!-- 移除模块确认弹框 -->
  <b-dialog
    v-if="removeDialog.visible"
    v-model:dialogVisible="removeDialog.visible"
    width="480px"
    :title="removeDialog.removeItem.title"
    title-icon="warning.svg"
    confirm-btn-color="danger"
    @on-confirm="dialogConfirm"
    @on-cancel="dialogCancel"
  >
    <p class="desc text14 icon-color">
      注意，该操作不可逆，请谨慎操作
    </p>
    <p v-if="removeDialog.removeItem.count" class="desc text14 icon-color mb16">
      移除模块需要把关联任务转移至指定模块
    </p>
    <BBaseSelect
      v-if="removeDialog.removeItem.count"
      v-model:value="removeDialog.removeItem.selected"
      size="large"
      placeholder="请选择转移模块"
      :options="
        removeDialog.removeItem.options.filter((find: any) => {
          return !find?.contenteditable
        })
      "
    />
  </b-dialog>
</template>

<style lang="scss" scoped>
.add-btn {
  width: 81px;
  height: 32px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid $color-border-main;
  color: $color-title;
  padding: 0;
  &:hover {
    border-color: $color-border-main;
    color: $color-title;
  }
}
.scrollbar {
  position: absolute;
  right: 24px;
  top: 0px;
  bottom: 0;
  opacity: 0;
  :deep(.el-scrollbar__bar.is-vertical) {
    right: 0px;
  }
}
.intro-module-grid {
  position: relative;

  :deep(.vxe-table) {
    .vxe-table--render-wrapper {
      display: block;
      .vxe-table--main-wrapper {
        .vxe-table--header-wrapper {
          background-color: transparent;
          border-top: 1px solid #f2f3f5;
          border-bottom: 1px solid #f2f3f5;
          .vxe-table--header-border-line {
            border-bottom: 0;
            background-image: none;
          }

          .vxe-header--row {
            .vxe-header--column {
              padding: 0;
              height: 32px;
              background-image: none;
              .vxe-cell {
                padding-left: 4px;
              }
            }
          }
          .vxe-cell--title {
            font-size: 14px;
            color: $color-main;
          }
        }
        .vxe-table--body-wrapper {
          .vxe-table--body {
            .vxe-body--row {
              .vxe-body--column {
                height: 39px;
                .vxe-cell {
                  height: 100%;
                  line-height: 39px;
                }
                position: relative;
                background-image: none;
                border-bottom: 1px solid #f2f3f5;
                &:nth-child(1) {
                  .vxe-cell {
                    padding: 0;
                  }
                }
              }
              &.row--hover {
                background: $color-default-hover;
                &.hasPerm {
                  .drag-btn {
                    opacity: 1;
                    cursor: move;
                  }
                }

                &.sortable-ghost,
                &.sortable-chosen {
                  cursor: move;
                  .vxe-body--column {
                    background-color: transparent;
                    .vxe-cell {
                      .rate-circle {
                        width: 15px;
                        height: 15px;
                        transform: rotate(-90deg);
                        padding-left: 0;
                        circle {
                          cx: 7.5px;
                          cy: 7.5px;
                          r: 6.5px;
                          stroke-linecap: round;
                          fill: none;
                          stroke-width: 2px;
                        }
                        .dasharray {
                          transition: stroke-dasharray 0.4s linear;
                        }
                      }
                    }
                    &::after {
                      content: '';
                      width: 100%;
                      height: 2px;
                      background: $color-primary;
                      position: absolute;
                      left: 0;
                      bottom: 0;
                    }
                  }
                }
              }
            }
          }
          &::-webkit-scrollbar {
            // 整体样式
            background-color: transparent;
            width: 0px;
            height: 0px;
            border: 0px solid transparent !important;
          }
        }
        .name-box {
          height: 100%;
          .edit-icon {
            cursor: pointer;
            opacity: 0;
            &:hover {
              background: $color-bg-hover;
              .svg-icon {
                use {
                  fill: $color-primary;
                }
              }
            }
          }
          &:hover {
            .edit-icon {
              opacity: 1;
            }
          }
        }

        .drag-btn {
          opacity: 0;
        }
        .name-input {
          background: #fff;
          box-shadow: 0 0 0 2px $color-primary;
          width: calc(100% - 4px);
          height: calc(100% - 4px);
          border-radius: 0;
          position: absolute;
          z-index: 99;
          left: 2px;
          top: 50%;
          transform: translateY(-50%);
          caret-color: $color-primary;
          &:hover {
            background: #fff;
          }
        }
        .priority {
          height: 100%;
          .wrap {
            border-radius: 4px;
            padding-left: 4px;
            &:hover {
              background: $color-bg-hover;
            }
          }
        }
        .num-box {
          &:hover {
            color: $color-primary;
          }
        }
        .rate-circle {
          width: 15px;
          height: 15px;
          transform: rotate(-90deg);
          circle {
            cx: 7.5px;
            cy: 7.5px;
            r: 6.5px;
            stroke-linecap: round;
            fill: none;
            stroke-width: 2px;
          }
          .dasharray {
            transition: stroke-dasharray 0.4s linear;
          }
        }
        .tool-box {
          width: 20px;
          height: 20px;
          border-radius: 2px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: translateY(3px);
          &:hover {
            background: $color-bg-hover;
          }
        }
      }
    }
    .vxe-table--border-line {
      border: 0;
    }
  }
  :deep(.vxe-grid--bottom-wrapper) {
    position: absolute;
    right: 0;
    top: 40px;
  }
  &.no-data {
    :deep(.vxe-table) {
      .vxe-table--render-wrapper {
        display: none;
      }
      .vxe-table--empty-placeholder {
        height: 215px !important;
        position: relative;
        .vxe-table--empty-content {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          .empty-box {
            height: 100%;
          }
        }
      }
    }
  }
}

.table-wrap {
  width: 100%;
  height: 100%;
  // position: relative;
  &:hover {
    .scrollbar {
      opacity: 1;
    }
  }
}
</style>

<style lang="scss">
.sortable-drag {
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow:
    0px 8px 16px 0px rgba(0, 0, 0, 0.08),
    0px 4px 4px 0px rgba(0, 0, 0, 0.04);
  border: 1px solid $color-border-main !important;
  opacity: 1 !important;
  border-radius: 0px;
  display: flex;
  align-items: center;
  .drag-icon {
    display: none !important;
  }
  .vxe-body--column {
    .vxe-cell {
      height: 100%;
      line-height: 48px;
      .num-box {
        text-align: center;
      }
      .priority {
        padding-left: 16px;
      }
      .tool-box {
        position: absolute;
        right: 24px;
        top: 15px;
      }
      .rate-circle {
        width: 15px;
        height: 15px;
        transform: rotate(-90deg);
        padding-left: 15px;
        circle {
          cx: 7.5px;
          cy: 7.5px;
          r: 6.5px;
          stroke-linecap: round;
          fill: none;
          stroke-width: 2px;
        }
      }
    }
  }
}
</style>
