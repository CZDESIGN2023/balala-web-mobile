<script lang="ts" setup>
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  shallowRef,
} from 'vue'
import {
  type LocationQuery,
  type RouteLocationNormalized,
  type RouteParams,
  onBeforeRouteUpdate,
} from 'vue-router'
import { message } from 'ant-design-vue'
import projectIntro from './intro/index.vue'
import vTable from './vTable.vue'
import ProjectSpace from './space/index.vue'
import { tabNames } from './config'
import type { TaskDialogInfoParams } from './types/task'
import type { TableRowData, WorkGroup } from './types/table'
import { deepCopy, getConfigDomain } from '@/utils'
import { useProjectStore } from '@/stores/modules/project'
import router from '@/router'
import {
  delTagName,
  editTagName,
  getProjectInfo,
  getProjectTable,
  getProjectTagList,
} from '@/api/project'
import type { ProjectInfoData, TagItem } from '@/api/interface'
import type { OrderSelectOptions } from '@/components/BSearchOrder/interface'
import { useSpaceStore } from '@/stores/modules/space'
import { useUserStore } from '@/stores/modules/user'
import type { FilterSort } from '@/api/interface/component'
import { findObjectByKey, getAllKeys, getTableByid, parseFlattenData } from '@/mixins/vtable'
import type { QueryCondition, QueryConditionGroup } from '@/components/BSearchFilter/interface'
import { ConfigKey } from '@/enum'
import { usePermission } from '@/hooks/usePermission'
import { Perm } from '@/enum/permission'
import { useTableStore } from '@/stores/modules/table'
import tableIcon from '@/assets/icon/table.png'

defineOptions({ name: 'ProjectIndex' })

// props
const props = defineProps({
  id: {
    type: String,
  },
})
const { checkPerm } = usePermission()
const { proxy } = getCurrentInstance() as any
const userStore = useUserStore()

const spaceStore = useSpaceStore()
const tableStore = useTableStore()
const projectStore = useProjectStore()

const taskParams = ref<TaskDialogInfoParams>({})
// 编辑项目弹框
const dialogVisible = ref(false)
const spaceVisible = shallowRef(false)
// 任务弹框
const taskDialog = ref(false)
// 当前标签 默认简介
const activeKey = ref<string>('')
// const activeObj = ref({
//   icon: tableIcon,
//   name: '表格',
//   key: 'table',
// })

// 项目信息
const projectInfo = ref<ProjectInfoData>({} as any)

// 新增还是编辑
const isEdit = ref<boolean>(false)

// 标签列表
const tagList = ref<TagItem[]>([])

// 拷贝标签列表
const copyTagList = ref<TagItem[]>([])

// 表格数据
const tableData = ref<TableRowData[]>([])
const tableTotal = ref(0)
const tableAllTotal = ref(0)
const cacheKey = computed(() => `project_list_${router.currentRoute.value.params.id}`)
const rowKeys = ref<string[]>([])

const ref_leave_dialog = ref()
const filterComponent = ref()
const orderComponent = ref()
const groupComponent = ref()
const tagComponent = ref()
const taskSearchComponent = ref()
const tableLoading = ref<boolean>(false)
const projectTableRef = ref()
const projectIntroRef = ref()
const projectSpaceRef = ref()
const drawerTab = ref('base')
const isSkeletonLoading = ref<boolean>(true)

// 关注，查询，标签数据
const followData = ref<QueryCondition[]>([])
const searchData = ref<QueryCondition[]>([])
const tagData = ref<QueryCondition[]>([])

const conditionComputed = computed(() => {
  const conditions = []

  if (followData.value?.length > 0)
    conditions.push(...followData.value)

  if (searchData.value?.length > 0)
    conditions.push(...searchData.value)

  if (tagData.value?.length > 0)
    conditions.push(...tagData.value)

  if (conditions.length === 0)
    return null
  return {
    conditions,
    conjunction: 'AND',
    conditionGroup: [],
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

const activeObj = computed(() => {
  return tabNames.find(item => item.key === activeKey.value)
})

const selectedTagId = computed(() => {
  return tagData.value[0]?.values[0] || ''
})

// 排序条件
const sortData = ref<FilterSort[]>([])
const groupData = ref<{ field: string }[]>([])
groupData.value = projectStore.getGroupData(cacheKey.value)?.data.map((item: any) => {
  return { field: item.oneSelectVal }
}) ?? []

// 打开项目空间
async function toggleSpace() {
  spaceVisible.value = !spaceVisible.value
  if (spaceVisible.value)
    return
  projectIntroRef.value?.updateIntro()
  getInfo()
  await projectStore.getList()
  // 关闭后刷新数据
  getTable()
}

// 切换表格或者简介
async function changeTab(key: string) {
  // activeObj.value = tabNames.find(item => item.key === key)

  activeKey.value = key
  window.localStorage.setItem(`projectTab${props.id}`, key)
  if (key === 'table') {
    followData.value = []
    getTable()
  }
  else if (key === 'follow') {
    followData.value = [getFollowCondition()]
    getTable()
  }
}

// 关注的条件
function getFollowCondition(): QueryCondition {
  return {
    field: 'followers',
    values: [userStore.userInfo.id],
    operator: 'IN',
    spaceId: '0',
  }
}

// 退出项目
function leaveSpace() {
  ref_leave_dialog.value.leaveShow({
    spaceName: projectInfo.value.spaceName,
    id: projectInfo.value.id,
    userId: projectInfo.value.userId,
  })
}

function leaveSuccess() {
  router.replace('/home')
}

// 获取基本信息
async function getInfo(isUpdate: boolean = true) {
  try {
    if (!projectInfo.value.spaceName)
      isSkeletonLoading.value = true
    const { data } = await getProjectInfo({ spaceId: props.id })
    projectInfo.value = data
    const headTitle = getConfigDomain(ConfigKey.TITLE) || import.meta.env.VITE_GLOBAL_APP_TITLE
    document.title = `${data.spaceName} - ${headTitle} 项目管理系统 - 协作效率标准化`
    spaceStore.setUserStatus(Number(data.roleId))
    isSkeletonLoading.value = false
    if (isUpdate) {
      getTagOption()
      projectStore.getProjectModuleList(props.id as string)
      projectStore.getProjectVersionList(props.id as string)
      projectStore.getProjectTagList(props.id as string, [], true)
      projectStore.getProjectMemberList(props.id as string, '')

      switch (activeKey.value) {
        case 'intro':
          initTable()
          break
        case 'table':
          initTable()
          proxy.mittBus.on('tagDelete', onCooperate)
          break
        case 'follow':
          followData.value = [getFollowCondition()]
          initTable()
          break
      }

      checkCopyLink(router.currentRoute.value)
    }
  }
  catch (error: any) {
    if (error.code === 305003) {
      message.warning('你无权访问该页面，请联系项目管理员添加', 3).then(() => {
        router.replace('/home')
      })
    }
  }
}

// 获取项目信息
function updateIntro(type: string = '') {
  if (type === 'describe') {
    getInfo()
    dialogVisible.value = false
  }
  else {
    getInfo()
  }
}

// 获取标签列表
async function getTagOption() {
  const { data } = await getProjectTagList(props.id || '')
  data.list.map((item) => {
    item.readonly = true
    item.focus = false
  })
  tagList.value = data.list
  copyTagList.value = deepCopy(tagList.value)
}

// 打开新建任务添加弹框
function openAddTaskDrawer() {
  proxy.mittBus.emit('openTaskDialog', {
    openType: 'project',
  })
  projectStore.clearTaskItem()
  drawerTab.value = ''
  taskDialog.value = true
  isEdit.value = false
}

const isOpenDetails = ref<boolean>(false)

// 打开任务编辑弹框
function openTaskDetail(record: TableRowData, index: number, type: string) {
  if (record && record.spaceId) {
    const isMainTask = Number(record.pid) === 0
    proxy.mittBus.emit('openTaskDialog', {
      openType: isMainTask ? 'detail' : 'child_detail',
      taskTabKey: type,
      taskParams: {
        spaceId: record.spaceId,
        workItemId: record.id,
      },
    })
  }
  isOpenDetails.value = true
  if (type)
    drawerTab.value = type
  else
    drawerTab.value = 'base'

  isEdit.value = true
  taskDialog.value = true
}

// 编辑标签名称
async function editTag(item: TagItem) {
  try {
    await editTagName(props.id || '', item.tagName, item.id)
    message.success('标签修改成功', 3)
    getTagOption()
    projectStore.getProjectTagList(props.id as string, [], true)
  }
  catch (error) {}
}

function refreshTag() {
  // 刷新
  getTagOption()
}

// 删除标签
async function deleteTag(item: TagItem) {
  try {
    await delTagName(props.id || '', item.id)
    if (selectedTagId.value === item.id) {
      tagComponent.value.clearOption()
      tagData.value = []
      getTable()
    }
    message.success('标签删除成功', 2)
    getTagOption()
  }
  catch (error) {}
}

// 选择标签
function selectTag(item: QueryCondition, isChange: boolean) {
  if (item === undefined)
    tagData.value = []
  else
    tagData.value = [item]

  if (isChange && activeKey.value !== 'follow') {
    followData.value = []
    activeKey.value = 'table'
  }

  getTable()
}

function initTable() {
  orderComponent.value.setCacheData(cacheKey.value)
  tagComponent.value.setCacheData(cacheKey.value)
  groupComponent.value.setCacheData(cacheKey.value)
}

// 关闭添加任务弹框
function closeAddTaskDrawer() {
  taskDialog.value = false
}

// 获取表格数据
async function getTable() {
  tableLoading.value = true
  tableData.value = []
  if (tableData.value.length === 0) {
    try {
      const { data } = await getProjectTable(
        props.id || '',
        finalConditionComputed.value,
        groupData.value,
        sortData.value,
      )
      const result = await parseFlattenData(data.list as WorkGroup[])
      tableData.value = result.data as any
      tableTotal.value = data.totalNum
      tableAllTotal.value = result.total
      rowKeys.value = []
      // rowKeys.value = (tableData.value.length > 0 && getAllKeys(tableData.value)) || []
      projectTableRef.value?.loadData()
      tableLoading.value = false
    }
    catch {
      tableLoading.value = false
    }
  }
}

// 获取表格id数组
async function tableGetKeys(keys: string[]) {
  const list = await getTableByid(keys, { [props.id as string]: projectInfo.value.workingDay as string })
  list.map((item) => {
    findObjectByKey(tableData.value as any, item)
  })
}

// 更新表格单条数据
async function updateTableItem(id: string) {
  if (!id)
    return
  const list = await getTableByid([id], { [props.id as string]: projectInfo.value.workingDay as string })
  if (list.length === 0)
    return
  const rowKeys = tableStore.expandIds

  // 处理展开行图标状态
  list.forEach((item) => {
    if (rowKeys.includes(item.id)) {
      item.isExpanded = true
    }
  })
  findObjectByKey(tableData.value as any, list[0])
}

// 更新表格数据
function updateTable(id: string) {
  updateTableItem(id)
}

// 刷新表格单条数据
function refreshTableItem(tableIds: string[]) {
  if (tableIds.length === 0)
    return
  tableIds.map((item) => {
    updateTableItem(item)
  })
}

function checkCopyLink({ query, params }: { query: LocationQuery, params: RouteParams }) {
  const { workItemId, tabKey, openType, type, pid } = query
  const openTypeBylink = Number(pid) === 0 ? 'detail' : 'child_detail'
  if (type === 'intro') {
    activeKey.value = 'intro'
    setTimeout(() => {
      router.replace({
        name: 'project',
        params: {
          id: props.id,
        },
      })
    }, 100)
    return
  }
  if (workItemId && tabKey && params.id === props.id) {
    taskParams.value = {
      spaceId: props.id,
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
          openType: openType || openTypeBylink,
          taskTabKey: tabKey,
          taskParams: {
            spaceId: props.id,
            workItemId: workItemId as string,
          },
        })
      }
      router.replace({
        name: 'project',
        params: {
          id: props.id,
        },
      })
    }, 100)
  }
}

// 监听表格刷新
function onRefreshTable(tableIds: string[]) {
  activeKey.value = 'table'
  if (activeKey.value === 'follow') {
    getTable()
    return
  }
  isOpenDetails.value = false
  if (tableIds.length > 0)
    refreshTableItem(tableIds)
  else
    getTable()
}

function closeTaskDialog(type: string) {
  if (type === 'refreshTable')
    getTable()

  if (activeKey.value === 'intro')
    projectIntroRef.value?.updateIntro()

  getTagOption()
}

function onCooperate(data: any) {
  if (Number(data.space.id) === Number(props.id)) {
    message.warning(`${data.tag.name} 标签已被删除`)
    if (Number(selectedTagId.value) === Number(data.tag.id)) {
      tagComponent.value.clearOption()
      tagData.value = []
      getTable()
      getTagOption()
    }
  }
}

function openProjectSpace(data: any) {
  const { type, isShow } = data
  spaceVisible.value = isShow

  requestAnimationFrame(() => {
    projectSpaceRef.value && projectSpaceRef.value.changeComponent(type, true)
  })
}

// ONMOUNTED
onMounted(() => {
  proxy.mittBus.on('closeTaskDialog', closeTaskDialog)
  proxy.mittBus.on('onRefreshTable', onRefreshTable)
  // 监听项目管理界面的开启
  proxy.mittBus.on('openProjectSpace', openProjectSpace)

  activeKey.value = window.localStorage.getItem(`projectTab${props.id}`) ?? 'table'
  updateIntro()
})

onUnmounted(() => {
  proxy.mittBus.off('onRefreshTable', onRefreshTable)
  proxy.mittBus.off('closeTaskDialog', closeTaskDialog)
  proxy.mittBus.off('openProjectSpace', openProjectSpace)
  proxy.mittBus.off('tagDelete', onCooperate)
})

onBeforeRouteUpdate((to: RouteLocationNormalized) => {
  if (to?.query?.type) {
    activeKey.value = to.query.type.toString()
    router.push(`/project/${to.params.id}`)

    if (to.query.type === 'table')
      getTable()
  }

  checkCopyLink(to)
})

/**
 * 排序-更新数据
 */
function orderChange(val: {
  source: OrderSelectOptions[]
  target: FilterSort[]
}, isChange: boolean) {
  sortData.value = val.target.filter(item => item.field)
  isChange && getTable()
}

function groupChange(val: any, isChange: boolean) {
  groupData.value = val
  isChange && getTable()
}

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

// 筛选数据变化
function filterChange(isChange: boolean) {
  if (!isChange)
    return
  getTable()
}

// 重置视图
function resetAll() {
  filterComponent.value.clearOption()
  orderComponent.value.clearOption(false)
  groupComponent.value.clearOption(false)
  taskSearchComponent.value.clearOption(false)

  getTable()
}

// 简介点击tab切换
function handleChangeTab(selectGroup: QueryConditionGroup) {
  activeKey.value = 'table'
  followData.value = []
  spaceVisible.value = false
  localStorage.setItem(`projectTab${props.id}`, 'table')
  requestAnimationFrame(() => {
    filterComponent.value?.renderData(selectGroup)
  })
  // 筛选弹窗加载数据
}

// 简介点击关注切换
function handleChangeFollow(selectGroup: QueryConditionGroup) {
  followData.value = selectGroup.conditions
  activeKey.value = 'follow'
  window.localStorage.setItem(`projectTab${props.id}`, 'follow')
  getTable()
}

// PROVIDE 注入
provide('leaveSpace', leaveSpace)
provide('closeAddTaskDrawer', closeAddTaskDrawer)
provide('handleChangeTab', handleChangeTab)
provide('handleChangeFollow', handleChangeFollow)
provide('getInfo', getInfo)
</script>

<template>
  <div class="project-wrap">
    <navbar>
      <template #content>
        <a-dropdown
          overlay-class-name="project-tab-drop-down"
        >
          <div class="flex-row-center intro-change">
            <SvgIcon :name="activeObj && activeObj.iconName" size="16" :color="activeObj && activeObj.iconColor" />
            <div class="text14 pfm-smoothing line14 ml4 mr4">
              {{ activeObj ? activeObj.name : '' }}
            </div>
            <svg-icon name="select-arrow" size="16" color="#bfbfbf" />
          </div>
          <template #overlay>
            <div>
              <div
                v-for="item in tabNames"
                :key="item.key"
                class="tab-pane"
                @mousedown.left="changeTab(item.key)"
              >
                <SvgIcon :name="item.iconName" size="16" :color="item.iconColor" />
                <div class="text14 name">
                  {{ item.name }}
                </div>
                <SvgIcon v-show="item.key === activeKey" class="active" name="gou" size="16" color="#1D74F5" />
              </div>
            </div>
          </template>
        </a-dropdown>
      </template>
      <template #right>
        <div class="top h40 flex-row-between">
          <div id="projectName" class="name maxw220 flex-row-start skeleton-style full-100" @click="toggleSpace">
            <a-skeleton :paragraph="false" :loading="isSkeletonLoading" active>
              <span class="mr8 text16 ss-line-1 animate__animated animate__fadeIn pfm">
                {{ projectInfo.spaceName }}
              </span>
              <svg-icon class="flex-shrink-0" name="project-set" color="#333333" size="24" />
            </a-skeleton>
          </div>
        </div>
      </template>
    </navbar>
    <!-- 项目固定头部 -->
    <div v-if="activeKey === 'table' || activeKey === 'follow'" class="project-header">
      <div v-show="tagList.length" class="tags flex-row-start">
        <b-tag
          ref="tagComponent"
          :list="tagList"
          :copy-list="copyTagList"
          :space-id="Number(props.id)"
          @on-refresh="refreshTag"
          @on-edit="editTag"
          @on-delete="deleteTag"
          @on-select="selectTag"
        />
        <AddTaskBtn
          v-if="checkPerm(Perm.CreateSpaceWorkItem)"
          @click="openAddTaskDrawer"
        />
      </div>
      <div class="tab-header flex-row-between mt2">
        <div class="left">
          <div
            class="filter-tools flex-row-start"
          >
            <BSearchFilter ref="filterComponent" @on-change="filterChange" />
            <BSearchOrder ref="orderComponent" @change="orderChange" />
            <BSearchGroup ref="groupComponent" @change="groupChange" />
            <div
              v-if="
                projectStore.getFilterData(cacheKey)?.text
                  || projectStore.getSortData(cacheKey)?.text
                  || projectStore.getGroupData(cacheKey)?.text
              "
              class="reset-all flex-shrink-0"
              @click="resetAll"
            >
              重置
            </div>
            <BSearchTask ref="taskSearchComponent" @change="taskSearchChange" />
          </div>
        </div>
      </div>
    </div>
    <div class="project-bodyer">
      <div
        v-if="activeKey === 'intro'"
        class="project-intro-wrap"
      >
        <project-intro
          ref="projectIntroRef"
          :info="projectInfo"
          @on-update="updateIntro"
          @on-leave-space="leaveSpace"
          @on-change-tab="handleChangeTab"
        />
      </div>
      <v-table
        v-else-if="activeKey === 'table' || activeKey === 'follow'"
        ref="projectTableRef"
        v-model:rowKeys="rowKeys"
        :table="tableData"
        :table-total="tableTotal"
        :table-all-total="tableAllTotal"
        :loading="tableLoading"
        :is-open-details="isOpenDetails"
        :info="projectInfo.workingDay"
        @open-drawer="openTaskDetail"
        @on-update="updateTable"
        @on-get-keys="tableGetKeys"
        @refresh-table-item="refreshTableItem"
      />
    </div>
    <!-- 项目空间弹框 -->
    <!-- <template v-if="spaceVisible"> -->
    <ProjectSpace v-if="spaceVisible" ref="projectSpaceRef" :dialog-visible="spaceVisible" :space-id="Number(props.id)" @on-close="toggleSpace" @on-swiper="spaceVisible = false" />
    <!-- </template> -->

    <!-- 离开项目弹框 -->
    <b-leave-dialog ref="ref_leave_dialog" @leave-success="leaveSuccess" />
  </div>
</template>

<style lang="scss">
.intro-change {
  position: relative;
  padding-left: 12px;
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 14px;
    background-color: #e3e4e5;
  }
}
.project-tab-drop-down {
  background-color: #fff;
  box-shadow: $tool-drop-box-shadow;
  border: 1px solid $tool-drop-box-border;
  border-radius: 8px;
  padding: 7px 15px;
  .tab-pane {
    width: 120px;
    height: 36px;
    line-height: 1;
    display: flex;
    align-items: center;
    .name {
      flex: 1;
      margin-left: 8px;
    }
    .active {
      padding-right: 2px;
    }
  }
}
.project-wrap {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  .bg {
    width: 100%;
    height: 316px;
    background: #fff;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
  }
  .project-header {
    background: #fff;
    .tags {
      padding: 16px 0;
    }
    .top {
      .name {
        font-size: 20px;
        font-weight: initial;
        color: $color-icon;
        height: 100%;
        border-radius: 8px;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 9px 10px;
        cursor: pointer;
        position: relative;
        left: 0px;
        transition: all 0.3s;

        .arrow {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          &:hover {
            background: $color-bg-hover;
          }
        }
        &:hover {
          background: $color-bg-hover;
          // left: 0;
        }
      }
    }
    .tab-header {
      .left {
        margin-left: -4px;
      }
      .tab-pane {
        &.active {
          background: $color-primary-active;
          &:hover {
            background: $color-primary-active;
          }
        }
        &:hover {
          background: rgba(0, 0, 0, 0.04);
        }
      }
    }
  }
  .project-bodyer {
    flex: 1;
  }
  .project-popover-content {
    width: 160px;
    border-radius: 8px;
    padding: 8px;
    background: #ffffff;
    border: 1px solid #e5e5e5;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.07);

    .btn {
      width: 144px;
      height: 32px;
      border-radius: 4px;
      padding: 0px 8px;
      cursor: pointer;
      &:hover {
        background: $color-bg-hover;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.skeleton-style {
  :deep() {
    .ant-skeleton {
      width: 80px;
      height: 22px;
      border-radius: 8px;
    }
    .ant-skeleton-content {
      padding: 0 !important;
    }
    .ant-skeleton-content .ant-skeleton-title {
      height: 100% !important;
    }
  }
}

.max-h {
  max-height: calc(100vh - 174px);
  overflow-y: auto;
}
</style>
