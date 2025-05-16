<script lang="ts" setup>
import { computed, inject, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import Sortable from 'sortablejs'
import { message } from 'ant-design-vue'
import type { VxeGridInstance } from 'balala-vxe-table'
import type { CountList, DataList, Options, Params } from './config/versionInterface'
import { gridVersionOptions, recordVersionRow } from './config/module'
import router from '@/router'
import { useProjectStore } from '@/stores/modules/project'
import { deepCopy, findObjectWithProperty, getCurrentWeek, getTextLength } from '@/utils'
import {
  spaceVersionCount,
  workVersionCreate,
  workVersionDel,
  workVersionList,
  workVersionModifyName,
  workVersionRelationCount,
  workVersionSetOrder,
} from '@/api/project'
import type { QueryCondition } from '@/components/BSearchFilter/interface'
import { archivedTaskStatus, progressTaskStatusList } from '@/enum/TaskStatus'
import { usePermission } from '@/hooks/usePermission'
import { Perm } from '@/enum/permission'
import { getResortList } from '@/utils/array'

/** PROPS */
interface Props {
  maxHeight?: string | number
  scrolltop?: number
  scrollMaxHeight?: string
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: 280,
  scrolltop: 119,
  scrollMaxHeight: '240px',
  type: 'main',
})

const emit = defineEmits(['onChangeTab', 'handleLoading'])

/** STORE */
const projectStore = useProjectStore()
const { checkPerm } = usePermission()

/** INJECT */
const handleChangeTab: Function = inject('handleChangeTab') as Function

/** DATA */
const addBtnDIs = ref<boolean>(false)
const introVersionGrid = ref<VxeGridInstance>() // 表格 DOM
const refList: any = reactive<HTMLInputElement[]>([]) // dom数组 => 版本名称
const versionData = ref<DataList[]>([]) // 版本列表数据
const copyVersionData = ref<DataList[]>([])
const currentVersion = ref<DataList>() // 当前版本
const removeVersion = ref<DataList>() // 当前版本
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
  getVersionList(true)
})

onUnmounted(() => {
  clearTimeout(initTime)
  if (sortTable)
    sortTable.destroy()
})
function setItemRef(el: HTMLElement, index: number) {
  if (el)
    refList[`nameRef${index}`] = el
}

// 绑定拖拽
function gridRowDrag() {
  const $grid = introVersionGrid.value
  if ($grid) {
    sortTable = Sortable.create(
      $grid?.$el.querySelector('.vxe-table--body-wrapper>.vxe-table--body tbody'),
      {
        handle: '.drag-btn',
        forceFallback: true,
        fallbackOnBody: false,
        onEnd: (evt: any) => {
          const newIndex = evt.newIndex as number
          const oldIndex = evt.oldIndex as number
          if (oldIndex === newIndex)
            return
          const currentRow = versionData.value.splice(oldIndex, 1)[0]
          versionData.value.splice(newIndex, 0, currentRow)
          // 请求排序
          changeSort(currentRow.spaceId)
        },
      },
    )
  }
}

// 获取版本列表
const optionList = ref<Options[]>([])
async function getVersionList(isShowLoading: boolean = false) {
  try {
    if (isShowLoading)
      emit('handleLoading', true)

    const id = router.currentRoute.value.params.id as string
    const nameRes = await workVersionList(id)
    const countRes = await spaceVersionCount(id)
    setTimeout(() => {
      emit('handleLoading', false)
      const nameList: DataList[] = nameRes.data?.list || []
      const countList: CountList[] = countRes.data?.list || []
      const newList: DataList[] = []
      const options: Options[] = []
      nameList?.forEach((item: DataList, index: number) => {
        newList[index] = { ...item, value: item.versionName }
        options[index] = {
          value: item.id,
          label: item.versionName,
        }
        const findInfo = countList.find((find: CountList) => Number(find.id) === Number(item.id))

        if (!findInfo)
          return
        newList[index] = {
          ...findInfo,
          ...item,
          disabledName: false,
          value: item.versionName,
        }
      })

      copyVersionData.value = deepCopy(newList || [])
      versionData.value = newList || []

      optionList.value = options
      projectStore.setProjectVersionList(versionData.value)
      __update()
    }, 400)
  }
  catch (error) {
    emit('handleLoading', false)
  }
}

// 更新排序
function changeSort(spaceId: string) {
  workVersionSetOrder(spaceId, getResortList(versionData.value))
    .finally(() => {
      getVersionList()
    })
}

// 数据更新
function __update() {
  const $grid = introVersionGrid.value
  if (sortTable)
    sortTable.destroy()
  if ($grid) {
    nextTick(() => {
      requestAnimationFrame(async () => {
        $grid.reloadData(versionData.value)
        addBtnDIs.value = false
      })
      if (checkPerm(Perm.DragSpaceWorkVersion)) {
        initTime = setTimeout(() => {
          gridRowDrag()
        }, 500)
      }
    })
  }
}

// 获取进度
function getDasharray(rate: string) {
  const count = Number(rate) || 0
  const start = `calc(2 * 3.1415 * (15 - 2) / 2 * (${count} / 100))`
  if (count === 0)
    return `stroke-dasharray: ${start}, 1000; opacity: 0;`

  return `stroke-dasharray: ${start}, 1000`
}

// 新增行
// async function addVersion() {
//   recordVersionRow.spaceId = router.currentRoute.value.params.id as string
//   versionData.value.unshift(recordVersionRow)
//   const $grid = introVersionGrid.value
//   if ($grid) {
//     await $grid.insertAt(recordVersionRow, null)
//     $grid.getTableData().tableData[0].contenteditable = true
//     setFocusStatu($grid.getTableData().tableData[0], 0, 'focus')
//     addBtnDIs.value = true
//   }
// }

// 移除行
async function handleRemove(row: DataList) {
  const $grid = introVersionGrid.value
  if ($grid)
    $grid.remove(row)

  if (row.id === '0')
    versionData.value = versionData.value.filter(item => item.id !== '0')
}

// 版本名称 切换编辑状态
// function changeNameStatu(row: DataList, _rowIndex: number) {
//   row.contenteditable = true
//   addBtnDIs.value = true
//   setFocusStatu(row, _rowIndex, 'focus')
// }

// 版本名称 获取焦点
function nameInputFocus(row: DataList, _rowIndex: number) {
  // 拷贝当前点击行的数据
  currentVersion.value = deepCopy(row)
}

// 版本号 失去焦点
async function nameInputBlur(row: DataList) {
  const length = getTextLength(row.versionName.trim())
  const isVaild = !(length >= 2 && length <= 20)
  const isDuplicate = findObjectWithProperty(copyVersionData.value, 'versionName', row.versionName)
  if (row.id !== '0') {
    // 编辑流程
    row.contenteditable = false
    if (row.versionName.trim() === currentVersion.value?.versionName) {
      // 前后名称相等，不做任何操作
      addBtnDIs.value = false
      row.versionName = currentVersion.value?.versionName || ''
      currentVersion.value = {} as DataList
      return
    }
    if (isVaild) {
      message.error('请输入有效格式(2 ~ 20个字符)', 2)
      addBtnDIs.value = false
      row.versionName = currentVersion.value?.versionName || ''
    }
    else {
      if (isDuplicate) {
        message.error('版本名称重复', 2)
        addBtnDIs.value = false
        row.versionName = currentVersion.value?.versionName || ''
        return
      }
      // 请求编辑版本名称接口
      editVersionName(row)
    }
  }
  else {
    // 新增流程
    if (isVaild) {
      if (row.versionName)
        message.error('请输入有效格式(2 ~ 20个字符)', 2)

      handleRemove(row)
      addBtnDIs.value = false
    }
    else {
      if (isDuplicate) {
        message.error('版本名称重复', 2)
        addBtnDIs.value = false
        handleRemove(row)
        return
      }
      // 请求新增版本接口
      createVersion(row)
    }
  }
}

// 创建版本
async function createVersion(row: DataList) {
  try {
    const params: Params = {
      spaceId: row.spaceId || '',
      versionName: row.versionName.trim(),
    }
    await workVersionCreate(params)
    message.success('版本创建成功', 2)
    getVersionList()
  }
  catch (error) {}
}

// 更改版本号
async function editVersionName(row: DataList) {
  try {
    const params: Params = {
      versionId: row.id,
      versionName: row.versionName.trim(),
    }
    await workVersionModifyName(params)
    message.success('版本编辑成功', 2)
    getVersionList()
  }
  catch (error) {
    row.versionName = currentVersion.value?.versionName || ''
    currentVersion.value = {} as DataList
  }
}

// 设置焦点
function setFocusStatu(row: DataList, index: number, type: string) {
  requestAnimationFrame(() => {
    if (type === 'focus') {
      refList[`nameRef${index}`].focus()
    }
    else {
      row.contenteditable = false
      if (!row?.id)
        currentVersion.value = {} as DataList

      refList[`nameRef${index}`].blur()
    }
  })
}

// 删除版本
async function deleteVersion(row: DataList) {
  if (row.id === '0')
    return

  removeVersion.value = row

  removeDialog.removeItem.selected = null

  const { data } = await workVersionRelationCount(row.spaceId, row.id)
  removeDialog.removeItem.count = Number(data)

  if (Number(data) === 0) {
    removeDialog.removeItem.title = '确认移除此版本吗？'
  }
  else {
    removeDialog.removeItem.options = optionList.value.filter(
      (item: Options) => item.value !== row.id,
    )
    removeDialog.removeItem.title = `<p>当前版本已关联任务 ${data} ，确认移除此版本吗？</p>`
  }

  removeDialog.visible = true
}

// 删除版本弹框 点击确认
async function dialogConfirm() {
  const { removeItem } = removeDialog

  try {
    if (removeItem.count) {
      if (!removeItem.selected) {
        message.error('请选择转移版本', 2)
        return
      }

      const msg = `版本 ${removeVersion.value?.versionName} 已移除，成功转移 ${removeItem.count} 条任务`

      onDelVison(msg, removeItem.selected)
    }
    else {
      const msg = `版本 ${removeVersion.value?.versionName} 已移除`
      onDelVison(msg)
    }
  }
  catch (error) {}
}

// 删除接口
async function onDelVison(msg: string, toVersionId?: string) {
  await workVersionDel(removeVersion.value?.id || '', toVersionId)
  removeDialog.visible = false
  removeDialog.removeItem = {
    title: '',
    options: [],
    selected: null,
    count: 0,
  }
  message.success(msg, 2)
  await getVersionList()
}

// 删除版本弹框 点击取消
function dialogCancel() {
  removeVersion.value = {} as DataList
}

// 监听表格滚动
const customScrollRef = ref()
function gridScroll(e: { scrollTop: number }) {
  customScrollRef.value?.setScrollTop(e.scrollTop)
}

defineExpose({
  getVersionList,
})

// 跳转
function goTable(type: string, versionId: string | number) {
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

  const versionCondition: QueryCondition = {
    field: 'version_id',
    operator: 'EQ',
    values: [String(versionId)],
    spaceId: '0',
  }

  const conditions: QueryCondition[] = [versionCondition]

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
</script>

<template>
  <div
    class="h32 intro-version-title flex-row-between"
    :class="maxHeight === 'auto' ? 'mb16 mt24' : 'mb12'"
  >
    <div class="left flex-row-start icon-color pfm text16">
      <svg-icon class="mr6" name="versioning" color="#333333" size="16" />
      版本管理
      <span class="minor-color text14 ml8">共 {{ versionData.length }}</span>
    </div>
    <!-- <a-button
      v-if="checkPerm(Perm.CreateSpaceWorkVersion)"
      class="add-btn"
      :disabled="addBtnDIs"
      @click="addVersion"
    >
      添加版本
    </a-button> -->
  </div>

  <div class="table-wrap">
    <vxe-grid
      ref="introVersionGrid"
      class="intro-version-grid"
      :class="{ 'no-data': versionData.length === 0 }"
      v-bind="gridVersionOptions(maxHeight, checkPerm(Perm.DeleteSpaceWorkVersion))"
      :params="{ isGroup: false }"
      :scroll-y="{
        enabled: false,
      }"
      :row-class-name="checkPerm(Perm.DeleteSpaceWorkVersion) ? 'hasPerm' : ''"
      @scroll="gridScroll"
    >
      <!-- 模块名称头部 -->
      <template #versionName_header>
        <p class="flex-row-start pl5">
          版本
        </p>
      </template>
      <!-- 版本名称 -->
      <template #versionName_default="{ row, _rowIndex }">
        <div v-if="!row.contenteditable" class="text14 icon-color flex-row-between name-box pl8">
          <!-- <div class="drag-btn flex-row-center select-none">
            <svg-icon name="drag_icon" color="#999" size="16" />
          </div> -->
          <b-ellipsis :content="row.versionName" />
          <!-- <div
            v-if="checkPerm(Perm.ModifySpaceWorkVersion)"
            class="edit-icon w20 h20 br2 flex-row-center mr13"
            @click="changeNameStatu(row, _rowIndex)"
          >
            <svg-icon size="16" name="table-edit" color="#333333" />
          </div> -->
        </div>
        <a-input
          v-else
          :ref="(el: HTMLElement) => setItemRef(el, _rowIndex)"
          v-model:value="row.versionName"
          :bordered="false"
          placeholder="待填"
          class="name-input pl12 text14 title-color"
          @focus="nameInputFocus(row, _rowIndex)"
          @press-enter="setFocusStatu(row, _rowIndex, 'blur')"
          @blur="nameInputBlur(row)"
        />
      </template>

      <!-- 本周待办 -->
      <template #week_default="{ row }">
        <p
          class="text14 icon-color pointer num-box"
          :class="isZero(row?.weekProcessing || 0)"
          @click="goTable('weekProcessing', row.id)"
        >
          {{ row?.weekProcessing || 0 }}
        </p>
      </template>

      <!-- 待办总数 -->
      <template #processing_default="{ row }">
        <p
          class="text14 icon-color pointer num-box"
          :class="isZero(row?.processing || 0)"
          @click="goTable('processing', row.id)"
        >
          {{ row?.processing || 0 }}
        </p>
      </template>

      <!-- 任务总数 -->
      <template #total_default="{ row }">
        <p
          class="text14 icon-color pointer num-box"
          :class="isZero(row?.total || 0)"
          @click="goTable('total', row.id)"
        >
          {{ row?.total || 0 }}
        </p>
      </template>

      <!-- 进度 -->
      <template #rate_default="{ row }">
        <div class="rate-box flex-row-start pl2">
          <svg class="rate-circle mr8 flex-shrink-0">
            <circle stroke="#edeef0" />
            <circle stroke="#08C479" :style="getDasharray(row.completeRate)" />
          </svg>
          <p class="icon-color text14">
            {{ row?.completeRate || 0 }}%
          </p>
        </div>
      </template>

      <!-- 工具栏 -->
      <template #tool_default="{ row }">
        <div
          v-if="
            ((versionData[0]?.contenteditable
              ? versionData.length > 2
              : versionData.length > 1 && checkPerm(Perm.ModifySpaceWorkVersion))
              && row.versionKey !== 'Default')
              || (row?.contenteditable && versionData.length > 1 && row.versionKey !== 'Default')
          "
          class="tool-box flex-inline"
        >
          <a-tooltip title="移除" effect="dark">
            <div class="full flex-row-center" @mousedown.left="deleteVersion(row)">
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
        <div v-if="versionData.length === 0" class="empty-box flex-row-center">
          <p v-if="checkPerm(Perm.CreateSpaceWorkVersion)" class="text14 minor-color">
            当前暂无版本，请添加
          </p>
          <p v-else class="text14 minor-color">
            请联系 <span class="icon-color">项目管理员</span> 添加版本
          </p>
        </div>
      </template>
    </vxe-grid>
  </div>

  <!-- 移除版本确认弹框 -->
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
      移除版本需要把关联任务转移至指定版本
    </p>
    <BBaseSelect
      v-if="removeDialog.removeItem.count"
      v-model:value="removeDialog.removeItem.selected"
      size="large"
      placeholder="请选择转移版本"
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
.intro-version-grid {
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
          left: 2px;
          top: 2px;
          caret-color: $color-primary;
          &:hover {
            background: #fff;
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
        .num-box {
          &:hover {
            color: $color-primary;
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

.table-wrap {
  height: 100%;
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
}
</style>
