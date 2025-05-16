import { defineStore } from 'pinia'
import { useUserStore } from './user'
import piniaPersistConfig from '@/config/piniaPersist'
import {
  getMemberListById,
  getProjectList,
  getProjectMemberCount,
  getProjectModuleCount,
  getProjectModulelist,
  getProjectTagList,
  workVersionList,
} from '@/api/project'
import { getUserListBySearch } from '@/api/user'
import type {
  ColumnConfig,
  ProjectMemberCountItem,
  ProjectMemberListItem,
  ProjectModuleListItem,
  TagItem,
  UserListItem,
  VersionModuleListItem,
} from '@/api/interface'
import type {
  ConditionGroup,
  QueryConditionGroup,
} from '@/components/BSearchFilter/interface'
import type { UserWorkbenchCountItem } from '@/api/interface/system'
import type { OrderSelectOptions } from '@/components/BSearchOrder/interface'
import type { SelectOptions } from '@/api/interface/common'
import type { GroupSelectOptions } from '@/components/BSearchGroup/interface'
import type { TableRowData } from '@/views/project/types/table'

function getInitialState() {
  return {
    // 项目列表
    projectList: [] as any,
    // 用户列表
    memberList: [] as any,
    // 当前点击任务行数据
    taskItem: {} as TableRowData,
    // 项目成员列表
    projectMemberList: [] as ProjectMemberListItem[],
    // 项目模块列表
    projectModuleList: [] as ProjectModuleListItem[],
    // 项目版本列表
    projectVersionList: [] as VersionModuleListItem[],
    // 项目标签列表
    projectTagList: [] as TagItem[],
    // 项目模板列表
    projectTypeOptionsList: [] as SelectOptions[],
    // 当前tab是简介还是表格
    projectTab: 'intro',
    // 当前用户选择的标签id
    projectTagFilterId: {} as any,
    // 保存筛选数据
    filterData: {} as any,
    // 保存排序数据
    sortData: {} as any,
    // 保存分组数据
    groupData: {} as any,
    // 表格宽度配置
    columnConfig: {} as any,
    // 保存标签
    tagData: {} as any,
    // 保存待办
    homeDataTab: 'processing',
    // 新建任务流程
    taskType: '4', // 1:需求，2：BUG,3:走查,4:设计
    // 是否收缩面板
    isCollapse: false as boolean, // false：展开，true：收缩,
    homeTabList: [] as UserWorkbenchCountItem[],
  }
}
export const useProjectStore = defineStore({
  id: 'project',
  state: () => getInitialState(),
  getters: {},
  actions: {
    customReset() {
      const initialState = getInitialState()

      const keysToPreserve = ['filterData', 'groupData', 'sortData', 'projectTagFilterId']

      Object.keys(initialState).forEach((key) => {
        if (!keysToPreserve.includes(key)) {
          (this as any)[key] = (initialState as any)[key]
        }
      })
    },
    // 获取项目列表
    async getList() {
      const { data }: any = await getProjectList()
      this.setProjectList(data.list)
    },
    // 设置项目列表
    setProjectList(list: any) {
      const newList = list
      list?.forEach((item: any, index: number) => {
        newList[index] = {
          ...item,
          checkedNotify: item.notify !== 0,
        }
      })
      this.projectList = newList
    },
    // 修改项目列表信息
    editProjectItem(id: string) {
      const list = this.projectList.map((item: any) => {
        if (item.id === id)
          item.isJoin = false
        return item
      })
      this.projectList = list
    },
    // 获取用户列表
    async getMemberList() {
      const { data } = await getUserListBySearch({ py: '' })
      data.list.map(item => (item.dropdown = false))
      this.setMemberList(data.list)
    },
    // 设置用户列表
    setMemberList(list: UserListItem[]) {
      this.memberList = list
    },
    // 设置点击任务行数据
    setTaskItem(data: TableRowData) {
      this.taskItem = data
    },
    // 获取点击任务行数据
    getTaskItem() {
      return this.taskItem
    },
    // 清空点击任务行数据
    clearTaskItem() {
      this.taskItem = {} as any
    },
    // 获取项目成员列表
    async getProjectMemberList(spaceId: string, userName: string = '', userId: string[] = [], isGetCount: boolean = false) {
      if (userId.length) {
        const inCacheUser = this.projectMemberList.filter(item => userId.includes(item.userId))
        if (inCacheUser.length === userId.length)
          return this.projectMemberList
      }
      try {
        const query: any = {
          spaceId,
        }
        if (userName)
          query.userName = userName
        const { data } = await getMemberListById(query)
        data.list.map((item) => {
          item.active = true
          item.disabled = true
          item.popVisible = false
        })
        this.setProjectMemberList(data.list)
        if (!isGetCount) {
          this.projectMemberList = data.list
          return data.list
        }
        return this.getMemberListCount(spaceId, data.list)
      }
      catch (error) {}
    },
    // 获取项目成员列表下面的数量
    async getMemberListCount(spaceId: string, list: ProjectMemberListItem[]) {
      try {
        const { data } = await getProjectMemberCount(spaceId)
        list.map((item: ProjectMemberListItem) => {
          data.list.map((ytem: ProjectMemberCountItem) => {
            if (item.userId === ytem.id) {
              item.total = ytem.total
              item.processing = ytem.processing
              item.weekProcessing = ytem.weekProcessing
            }
          })
        })
        this.projectMemberList = list || []
        return this.projectMemberList
      }
      catch (error) {}
    },
    // 设置项目成员列表
    setProjectMemberList(list: ProjectMemberListItem[]) {
      this.projectMemberList = list
    },
    // 获取项目模块列表
    async getProjectModuleList(
      spaceId: string,
      isGetCount: boolean = false,
      moduleId: string[] = [],
    ) {
      if (moduleId.length) {
        const inCacheModule = this.projectModuleList.filter(item => moduleId.includes(item.id))
        if (inCacheModule.length === moduleId.length)
          return this.projectModuleList
      }
      try {
        const { data } = await getProjectModulelist({ spaceId })
        data.list.map((item) => {
          item.contenteditable = false
        })
        const ids = data.list.map(item => item.id) || []
        if (!isGetCount) {
          this.projectModuleList = data.list
          return data.list
        }
        return this.getModuleListCount(spaceId, ids, data.list)
      }
      catch (error) {}
    },
    // 获取模块列表下面的数量
    async getModuleListCount(spaceId: string, ids: string[], list: ProjectModuleListItem[]) {
      try {
        const { data } = await getProjectModuleCount(spaceId, ids)
        list.map((item) => {
          data.list.map((ytem) => {
            if (item.id === ytem.id) {
              item.completeRate = ytem.completeRate
              item.completed = ytem.completed
              item.total = ytem.total
              item.processing = ytem.processing
              item.weekProcessing = ytem.weekProcessing
              item.priorityInfos = ytem.priorityInfos
            }
          })
        })
        this.projectModuleList = list || []
        return this.projectModuleList
      }
      catch (error) {}
    },
    // 获取版本列表
    async getProjectVersionList(spaceId: string, versionId: string[] = []) {
      if (versionId.length) {
        const inCacheVersion = this.projectVersionList.filter(item => versionId.includes(item.id))
        if (inCacheVersion.length === versionId.length)
          return this.projectVersionList
      }
      try {
        const { data } = await workVersionList(spaceId)
        this.projectVersionList = data.list
        return this.projectVersionList
      }
      catch (error) {}
    },
    // 设置版本列表
    setProjectVersionList(list: VersionModuleListItem[]) {
      this.projectVersionList = list
    },
    // 获取项目类型下拉列表
    // async getProjectTypeList(spaceId: number = 0, workItemType: number = 0) {
    //   try {
    //     const { data } = await getSpaceTemplateSearch()
    //     const list = data.list.map((item) => {
    //       return {
    //         value: item.workItemType,
    //         label: item.workItemTypeName,
    //       }
    //     })
    //     this.projectTypeOptionsList = list
    //     return this.projectTypeOptionsList
    //   }
    //   catch (error) {}
    // },

    // 设置项目 tab
    setProjectTab(key: string) {
      this.projectTab = key
    },
    setProjectFilterTagId(key: string, value: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      this.projectTagFilterId[userKey] = value
    },
    getProjectFilterTagId(key: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      return this.projectTagFilterId[userKey]
    },
    // 获取标签列表
    async getProjectTagList(spaceId: string, tagId: string[] = [], ignoreCache: boolean = false) {
      if (ignoreCache) {
        try {
          const { data } = await getProjectTagList(spaceId)
          this.projectTagList = data.list
          return this.projectTagList
        }
        catch (error) {}
      }
      if (tagId.length) {
        const inCacheTag = this.projectTagList.filter(item => tagId.includes(item.id as string))
        if (inCacheTag.length === tagId.length) {
          return this.projectTagList
        }
        else {
          try {
            const { data } = await getProjectTagList(spaceId)
            this.projectTagList = data.list
            return this.projectTagList
          }
          catch (error) {}
        }
      }
      else {
        return this.projectTagList
      }
    },
    // 设置筛选数据
    setFilterData(key: string, data: ConditionGroup, rawData: QueryConditionGroup, text: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      this.filterData[userKey] = {
        data,
        rawData,
        text,
      }
    },
    // 获取筛选数据
    getFilterData(key: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      return this.filterData[userKey]
    },
    resetFilterAndSortData() {
      this.filterData = {}
      this.sortData = {}
      this.groupData = {}
    },
    // 设置筛选数据
    setSortData(key: string, data: OrderSelectOptions[], text: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      this.sortData[userKey] = {
        data,
        text,
      }
    },
    // 获取筛选数据
    getSortData(key: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      return this.sortData[userKey]
    },
    // 设置分组数据
    setGroupData(key: string, data: GroupSelectOptions[], text: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      this.groupData[userKey] = {
        data,
        text,
      }
    },
    getGroupData(key: string) {
      const { userInfo } = useUserStore()
      const userKey = `${key}_${userInfo.id}`
      return this.groupData[userKey]
    },
    // 设置表格列配置数据
    setColumnConfig(key: string, data: ColumnConfig) {
      const columns = this.getColumnConfig(key)
      const item = columns.find((item: ColumnConfig) => item.field === data.field)
      if (item)
        Object.assign(item, data)
      else
        columns.push(data)

      this.columnConfig[key] = columns
    },
    getColumnConfig(key: string) {
      return this.columnConfig[key] ?? []
    },
    clearColumnConfig(key: string) {
      if (this.columnConfig[key])
        delete this.columnConfig[key]
    },
    // 设置标签数据
    setTagData(key: string, data?: string) {
      if (data)
        this.tagData[key] = data
      else
        delete this.tagData[key]
    },
    getTagData(key: string) {
      return this.tagData[key]
    },
    // 设置首页 tab
    setHomeTabData(key: string) {
      this.homeDataTab = key
    },
    getHomeTabData() {
      return this.homeDataTab
    },
    // 设置新建任务流程
    setTaskType(index: string) {
      this.taskType = index
    },
    // 设置是否收缩左侧面板
    setisCollapse(isShow: boolean) {
      this.isCollapse = isShow
    },
    // 存储首页tab列表数据
    setHomeTabList(list: UserWorkbenchCountItem[]) {
      this.homeTabList = list
    },
  },
  persist: piniaPersistConfig('project', [
    'projectList',
    'memberList',
    'taskItem',
    'projectMemberList',
    'projectModuleList',
    'projectVersionList',
    'projectTagList',
    'projectTab',
    'projectTagFilterId',
    'filterData',
    'conditionData',
    'tagData',
    'homeDataTab',
    'sortData',
    'groupData',
    'columnConfig',
    'taskType',
    'isCollapse',
    'homeTabList',
  ]),
})
