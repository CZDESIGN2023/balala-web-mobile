<script lang="ts" setup>
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  provide,
  ref,
} from 'vue'
import {
  type LocationQuery,
  type RouteLocationNormalized,
  type RouteParams,
  onBeforeRouteUpdate,
} from 'vue-router'
import type { TaskDialogInfoParams } from '../project/types/task'
import type { TableRowData, WorkGroup } from '../project/types/table'
import { getWorkbenchCount } from '@/api/system'
import { getProjectTable } from '@/api/project'
import { useProjectStore } from '@/stores/modules/project'
import type { UserWorkbenchCountItem } from '@/api/interface/system'
import vTable from '@/views/project/vTable.vue'
import { findObjectByKey, getAllKeys, getTableByid, parseFlattenData } from '@/mixins/vtable'
import type { TableTaskItem } from '@/api/interface'

import type { OrderSelectOptions } from '@/components/BSearchOrder/interface'
import type { QueryCondition, QueryConditionGroup } from '@/components/BSearchFilter/interface'
import type { FilterSort } from '@/api/interface/component'

import router from '@/router'
import { arrayToObject } from '@/utils/array'

const { proxy } = getCurrentInstance() as any

const projectStore = useProjectStore()
const projectList = computed(() => projectStore.projectList)
const workingDayObj = computed(() => {
  return arrayToObject(projectList.value, 'id', (item: any) => {
    return item.workingDay
  })
})
// const userStore = useUserStore()
const taskDialog = ref(false)
const tabKey = ref<string>('processing')
const countData = ref<UserWorkbenchCountItem[]>([
  {
    type: 'processing',
    count: '0',
    condition: {} as QueryConditionGroup,
    label: '',
    tip: '',
  },
  {
    type: 'weekProcessing',
    count: '0',
    condition: {} as QueryConditionGroup,
    label: '',
    tip: '',
  },
  {
    type: 'completed',
    count: '0',
    condition: {} as QueryConditionGroup,
    label: '',
    tip: '',
  },
  {
    type: 'weekCompleted',
    count: '0',
    condition: {} as QueryConditionGroup,
    label: '',
    tip: '',
  },
  {
    type: 'followed',
    count: '0',
    condition: {} as QueryConditionGroup,
    label: '',
    tip: '',
  },
])
const currentIndex = ref<number>(0)
const rowKeys = ref<string[]>([])
const isEdit = ref<boolean>(false)
const drawerTab = ref('base')
const cacheKey = computed(() => {
  return `project_list_${tabKey.value}`
})

const taskParams = ref<TaskDialogInfoParams>({})
// 表格数据
const tableData = ref<TableTaskItem[]>([])
const tableTotal = ref<number>(0)
const tableAllTotal = ref(0)
const tableLoading = ref<boolean>(false)
const filterComponent = ref()
const orderComponent = ref()
const taskSearchComponent = ref()
const projectTableRef = ref()

const tabData = ref<QueryConditionGroup>({
  conjunction: 'AND',
  conditions: [],
  conditionGroup: [],
})
const searchData = ref<QueryCondition[]>([])

const conditionComputed = computed(() => {
  const conditionGroups: QueryConditionGroup[] = [tabData.value]

  if (searchData.value?.length > 0) {
    conditionGroups.push({
      conjunction: 'AND',
      conditionGroup: [],
      conditions: searchData.value,
    })
  }
  return {
    conditions: [],
    conjunction: 'AND',
    conditionGroup: conditionGroups,
  }
})

const finalConditionComputed = computed(() => {
  const storeData = projectStore.getFilterData(cacheKey.value)
  const conditionGroup: QueryConditionGroup[] = []
  if (storeData && storeData.text)
    conditionGroup.push(storeData.rawData)

  if (conditionComputed.value)
    conditionGroup.push(conditionComputed.value)

  return {
    conditions: [],
    conjunction: 'AND',
    conditionGroup,
  }
})

// 排序条件
const sortData = ref<FilterSort[]>([])

// 分组条件
const groupData = ref([])
groupData.value = projectStore.getGroupData(cacheKey.value)?.data.map((item: any) => {
  return { field: item.oneSelectVal }
}) ?? [{ field: 'work_object_id' }]

async function updatWorkCount() {
  const { data } = await getWorkbenchCount()
  const countList: UserWorkbenchCountItem[] = [
    {
      type: 'processing',
      count: data.processing,
      condition: data.processingConditionGroup,
      label: '我的待办',
      tip: '当前您负责，且流程未结束的任务单',
    },
    {
      type: 'participatedProcessing',
      count: data.participatedProcessing,
      condition: data.participatedProcessingConditionGroup,
      label: '我参与的',
      tip: '您参与，且流程未结束的任务单',
    },
    {
      type: 'created',
      count: data.created,
      condition: data.createdConditionGroup,
      label: '我创建的',
      tip: '由您创建的任务单',
    },
    {
      type: 'followed',
      count: data.followed,
      condition: data.followedConditionGroup,
      label: '我关注的',
      tip: '您关注的所有任务单',
    },
    {
      type: 'weekProcessing',
      count: data.weekProcessing,
      condition: data.weekProcessingConditionGroup,
      label: '本周待办',
      tip: '当前您负责，排期截止时间包含本周 且 流程未结束的任务单',
    },
    {
      type: 'weekCompleted',
      count: data.weekCompleted,
      condition: data.weekDoneConditionGroup,
      label: '本周完成',
      tip: '您参与，且流程在本周内结束的任务单',
    },
    {
      type: 'completed',
      count: data.completed,
      condition: data.doneConditionGroup,
      label: '完成任务',
      tip: '您参与，且流程结束的任务单',
    },
  ]
  projectStore.setHomeTabList(countList)
  countData.value = countList
}

// 获取任务数量
async function getCount(isFreshTable: boolean = true) {
  const homeTabData = projectStore.getHomeTabData()
  await updatWorkCount()
  const filterList = countData.value.filter(item => item.type === homeTabData)
  if (!isFreshTable)
    return
  await changeTab(filterList[0])
}

// 获取表格数据
async function getTable() {
  tableLoading.value = true
  tableData.value = []
  const { data } = await getProjectTable(0, finalConditionComputed.value, groupData.value, sortData.value)
  const result = await parseFlattenData(data.list as WorkGroup[])
  tableData.value = result.data as unknown as TableTaskItem[]
  tableTotal.value = data.totalNum
  tableAllTotal.value = result.total
  rowKeys.value = (tableData.value.length > 0 && getAllKeys(tableData.value as unknown as TableRowData[])) || []
  projectTableRef.value?.loadData()
  tableLoading.value = false
}

// 切换待办和已完成
async function changeTab(item: UserWorkbenchCountItem) {
  // if (tabKey.value === item.type) return
  tabKey.value = item.type
  projectStore.setHomeTabData(item.type)
  tabData.value = item.condition as QueryConditionGroup
  orderComponent.value?.setCacheData(cacheKey.value)
  await updatWorkCount()
  getTable()
}

async function tableGetKeys(keys: string[]) {
  const list = await getTableByid(keys, workingDayObj.value)
  list.forEach((item) => {
    findObjectByKey(tableData.value as unknown as TableRowData[], item)
  })
}

const isOpenDetails = ref<boolean>(false)
// 打开任务编辑弹框
async function editTask(record: TableTaskItem, index: number, type: string) {
  if (record && record.spaceId) {
    const isMainTask = Number(record.pid) === 0
    proxy.mittBus.emit('openTaskDialog', {
      openType: isMainTask ? 'detail' : 'child_detail',
      taskTabKey: type,
      taskParams: {
        spaceId: record.spaceId,
        workItemId: record.key,
      },
    })
  }
  isOpenDetails.value = true
  if (type)
    drawerTab.value = type
  else
    drawerTab.value = 'base'

  currentIndex.value = index
  isEdit.value = true
  if (record) {
    // await projectStore.getProjectModuleList(record?.spaceId || '', false, [
    //   record?.childKey as string
    // ])
    // await projectStore.getProjectVersionList(record?.spaceId || '', [record.versionId as string])
    // await projectStore.getProjectTagList(record?.spaceId || '')
    // await projectStore.getProjectMemberList(
    //   record?.spaceId || '',
    //   '',
    //   record.participator.map((item) => item.userId as string) || []
    // )
    taskDialog.value = true
  }
}

function openAddTask() {
  proxy.mittBus.emit('openTaskDialog', {
    openType: 'dashboard',
  })
  projectStore.clearTaskItem()
  taskDialog.value = true
  isEdit.value = false
}

// 更新表格
async function updateTable(id: string) {
  updateTableItem(id)
}

// 更新表格单条数据
async function updateTableItem(id: string) {
  if (id) {
    const list = await getTableByid([id], workingDayObj.value)
    findObjectByKey(tableData.value as unknown as TableRowData[], list[0])
    getCount(false)
  }
}

function checkCopyLink({ query }: { query: LocationQuery, params: RouteParams }) {
  const { workItemId, tabKey, spaceId, openType } = query
  if (workItemId && tabKey && spaceId) {
    taskParams.value = {
      spaceId: spaceId as string,
      workItemId: workItemId as string,
    }
    taskDialog.value = false
    nextTick(() => {
      drawerTab.value = tabKey as string
      isEdit.value = true
      taskDialog.value = true
    })
    setTimeout(() => {
      if (workItemId) {
        proxy.mittBus.emit('openTaskDialog', {
          openType,
          taskTabKey: tabKey,
          taskParams: {
            spaceId,
            workItemId: workItemId as string,
          },
        })
      }
      router.replace({
        name: 'home',
        params: {
          id: Number(spaceId),
        },
      })
    }, 100)
  }
}

const isLoading = ref<boolean>(true)

// 监听表格刷新
function onRefreshTable(tableIds: string[]) {
  isOpenDetails.value = false
  if (tableIds.length > 0)
    refreshTableItem(tableIds)
  else
    getTable()
}

onMounted(async () => {
  proxy.mittBus.on('onRefreshTable', onRefreshTable)
  if (projectList.value.length > 0) {
    isLoading.value = true
    await getCount()
    // await initTable()
    // orderComponent.value?.setCacheData(cacheKey.value)
    isLoading.value = false
  }
  checkCopyLink(router.currentRoute.value)
})

onUnmounted(() => {
  proxy.mittBus.off('onRefreshTable', onRefreshTable)
})

onBeforeRouteUpdate((to: RouteLocationNormalized) => {
  checkCopyLink(to)
})

/** ************************************* 排序 */

/**
 * 排序-更新数据
 * @param val 选择项集合
 // eslint-disable-next-line jsdoc/check-param-names
 * @param val.source 选择项集合中的源数据
 * @param val.target 选择项集合中的源数据
 * @param isChange 是否更新表格
 */
function orderChange(val: {
  source: OrderSelectOptions[]
  target: FilterSort[]
}, isChange: boolean) {
  sortData.value = val.target.filter(item => item.field)
  isChange && getTable()
}

/** ************************************* 搜索任务名称 */
/**
 * 搜索任务名称-更新数据
 * @param val
 */
function taskSearchChange(val: QueryCondition, isChange: boolean) {
  if (!val)
    searchData.value = []
  else
    searchData.value = [val]

  isChange && getTable()
}
/**
 * 筛选-更新数据
 * @param data
 * @param isChange
 */
function filterChange(data: any, isChange: boolean) {
  if (!isChange)
    return
  getTable()
}

// 重置视图
function resetAll() {
  filterComponent.value.clearOption(false)
  orderComponent.value.clearOption(false)
  // groupComponent.value.clearOption(false)
  taskSearchComponent.value.clearOption(false)

  getTable()
}

function refreshTableItem(tableIds: string[]) {
  tableIds.forEach((item) => {
    updateTableItem(item)
  })
}

// 关闭添加任务弹框
function closeAddTaskDrawer() {
  taskDialog.value = false
}

provide('workbenchTabkey', tabKey)
provide('closeAddTaskDrawer', closeAddTaskDrawer)
</script>

<template>
  <div class="home-wrap">
    <navbar title="工作台" />
    <AddTaskBtn @click="openAddTask" />
    <div v-if="projectList.length > 0" class="main">
      <div class="panel-scroll mb8">
        <div class="panel flex-row-start mt8 mb8 skeleton-style">
          <template v-for="(item, index) in countData" :key="item.type">
            <a-skeleton :paragraph="false" :loading="isLoading" active>
              <div
                class="item flex-column-center flex-shrink-0 animate__animated animate__fadeIn"
                :class="{ active: tabKey === item.type }"
                @click="changeTab(item)"
              >
                <h2 v-if="item?.count !== '0'" class="value ddin pfm-smoothing">
                  {{ item.count }}
                </h2>
                <h2 v-else class="value value-none pfr font-smoothing">
                  暂无
                </h2>
                <p class="label font-smoothing">
                  {{ item.label }}
                </p>
              </div>
            </a-skeleton>
            <div v-if="index < countData.length - 1" class="line">
              <div class="real-line" />
            </div>
          </template>
        </div>
      </div>
      <div>
        <div class="filter-tools flex-row-start">
          <BSearchFilter ref="filterComponent" is-project @on-change="filterChange" />
          <BSearchOrder ref="orderComponent" is-project @change="orderChange" />
          <div
            v-if="
              projectStore.getFilterData(cacheKey)?.text || projectStore.getSortData(cacheKey)?.text
            "
            class="reset-all"
            @click="resetAll"
          >
            重置
          </div>
          <BSearchTask ref="taskSearchComponent" @change="taskSearchChange" />
        </div>
      </div>
      <div class="b-data-table">
        <v-table
          ref="projectTableRef"
          v-model:rowKeys="rowKeys"
          :table="tableData as unknown as TableRowData[]"
          :table-total="tableTotal"
          :table-all-total="tableAllTotal"
          mode="home"
          :loading="tableLoading"
          :is-open-details="isOpenDetails"
          @open-drawer="editTask"
          @on-update="updateTable"
          @on-get-keys="tableGetKeys"
          @refresh-table-item="refreshTableItem"
        />
      </div>
    </div>
    <b-empty
      v-else
      title="欢迎使用项目管理系统"
      desc="您可以尝试创建一个项目，为您的团队提供高效的项目管理方案！"
      name="smiling"
      :is-svg="false"
      img-name="smiling.svg"
      btn-icon-name="add-white"
      :is-btn="true"
      btn-text="新建项目"
      btn-url="/project/add"
    />
  </div>
</template>

<style lang="scss" scoped>
.home-wrap {
  height: 100%;
  display: flex;
  flex-flow: column;
  .main {
    flex: 1;
    display: flex;
    flex-flow: column;
    .b-data-table {
      flex: 1;
    }
  }
  .single-title-header {
    padding-top: 24px;
    height: 40px;
    font-size: 20px;
  }
}
.panel-scroll {
  overflow-x: scroll;
  // &::-webkit-scrollbar {
  //   //整体样式
  //   background-color: transparent;
  //   height: 6px;
  // }
  // &::-webkit-scrollbar-thumb {
  //   //滑动滑块条样式
  //   border-radius: $tool-drop-scorll-radius;
  //   background-color: $tool-drop-scorll-bg;
  // }
}
.panel {
  .item {
    border-radius: 8px;
    padding: 16px;
    z-index: 0;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.2s;
    .value {
      font-size: 20px;
      line-height: 1;
      color: #333;
      margin-bottom: 8px;
    }
    .value-none {
      font-size: 14px;
      color: #999999;
      font-weight: initial;
      flex-shrink: 0;
      line-height: 20px;
    }
    .label {
      font-size: 14px;
      line-height: 1;
      font-weight: initial;
      color: #999;
    }
    &:active {
      background: $color-default-active;
    }
    &.active {
      background: $color-primary-active;
      .value {
        color: $color-primary;
      }
      .label {
        color: $color-primary;
      }
      &:hover {
        background: $color-primary-active;
      }
    }
  }

  .line {
    margin: 0;
    width: 1px;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    .real-line {
      background: #f2f3f5;
      width: 1px;
      height: 24px;
    }
  }
}
</style>

<style lang="scss" scoped>
:global(.task-tool-width) {
  max-width: 345px !important;
}
:global(.task-tool-width .ant-tooltip-inner) {
  padding: 8px 12px !important;
}

.skeleton-style {
  :deep() {
    .ant-skeleton {
      width: 70px;
      height: 65px;
      flex-shrink: 0;
      border-radius: 8px;
    }
    .ant-skeleton-content .ant-skeleton-title {
      height: 100% !important;
    }
  }
}
</style>
