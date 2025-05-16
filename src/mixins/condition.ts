import dayjs from 'dayjs'
import { h } from 'vue'
import pinyin from 'pinyin'
import type {
  Condition,
  ConditionGroup,
  FilterOneOptions,
  FilterProjectOptions,
  QueryCondition,
  QueryConditionGroup,
  TSDate,
} from '@/components/BSearchFilter/interface'
import { deepCopy, isEmptyObject } from '@/utils'
import { getMemberListByFilter, getProjectModuleById, getWorkFlowSelectList, getWorkVersionById } from '@/api/project'
import router from '@/router'
import { oneAllList, oneList, twoList } from '@/components/BSearchFilter/config'
import { getWorkFlowRelationUser, getWorkItemStatusList } from '@/api/workflow'
import { useUserStore } from '@/stores/modules/user'
import { useProjectStore } from '@/stores/modules/project'
import { Msgbox } from '@/utils/msgbox'
import { SvgIcon } from '@/components/SvgIcon'

import { getBadgeColor } from '@/utils/color'

// 获取工作状态列表
async function getWorkStatusList(spaceId: string) {
  const { data } = await getWorkItemStatusList({ spaceId })
  return data.list.map((item: any) => ({
    id: item.id,
    val: item.val,
    pinyin: pinyin(item.name, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    name: item.name,
    color: getBadgeColor(item.name),
  }))
}

// 获取优先级列表
async function getWorkPriorityList() {
  const options = oneList.find((item: any) => item.value === 'priority')?.thirdOptions || []
  return options.map((item: any) => ({
    id: item.value,
    pinyin: pinyin(item.name, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    name: item.label,
    color: item.color,
  }))
}

// 获取任务流程列表
async function getWorkTypeList(spaceId: string) {
  const list = await getWorkFlowSelectList(spaceId)
  return list.map((item: any) => ({
    id: item.id,
    pinyin: pinyin(item.name, { style: pinyin.STYLE_NORMAL, heteronym: false }).flat().join(''),
    name: item.name,
    color: getBadgeColor(item.name),
  }))
}

export function formatConditionData(data: ConditionGroup): QueryConditionGroup {
  const reqConditionGroup = <QueryConditionGroup>{
    conjunction: data.conjunction,
    conditions: [],
    conditionGroup: [],
  }

  const filterData = data.conditions.filter((item) => {
    return item.thirdSelectVal?.toString()
  })

  filterData.forEach((item) => {
    let values: any = []
    const oneSelectVal = Array.isArray(item.oneSelectVal) ? item.oneSelectVal[1] : item.oneSelectVal
    if (oneSelectVal === 'plan_time') {
      if (item.thirdSelectVal && (item.thirdSelectVal as TSDate).start) {
        values = [(item.thirdSelectVal as TSDate).start, (item.thirdSelectVal as TSDate).complete]
      }
      else {
        values = []
      }
    }
    else {
      if (typeof item.thirdSelectVal === 'string' || typeof item.thirdSelectVal === 'number') {
        values = [String(item.thirdSelectVal)]
      }
      else {
        values = (item.thirdSelectVal as string[])?.map(item => String(item))
      }
    }

    const obj: QueryCondition = {
      field: oneSelectVal as string,
      values,
      operator: item.twoSelectVal as string,
      spaceId: item.projectVal ? String(item.projectVal) : '0',
    }

    reqConditionGroup.conditions.push(obj)
  })

  if (data.conditionGroup && data.conditionGroup.length > 0) {
    data?.conditionGroup?.forEach((item) => {
      const reqConditionGroupItem: QueryConditionGroup = formatConditionData(item)
      reqConditionGroup.conditionGroup?.push(reqConditionGroupItem)
    })
  }
  return reqConditionGroup
}

function filterOptionsByValue(list: any, value: string) {
  return list.filter((item: any) => item.value === value)
}

function createCondition(isProject: boolean, oneSelectVal: string, twoOptions: any, twoSelectVal: string, thirdSelectVal: any) {
  return {
    isOpen: false,
    oneSelectVal: isProject ? ['0', oneSelectVal] : oneSelectVal,
    thirdSelectVal,
    twoOptions,
    twoOldVal: twoSelectVal,
    twoSelectVal,
  }
}

function getFilterOptions(name: string) {
  const result = filterOptionsByValue(oneList, name)[0]
  const twoOptions = result.twoOptions.map((item: any) => filterOptionsByValue(twoList, item).shift()) || []
  return {
    twoOptions,
  }
}

// 获取本周时间周期
function getWeekTime() {
  const startTime = dayjs().startOf('week').add(1, 'day').format('YYYY/MM/DD HH:mm:ss')
  const endTime = dayjs().startOf('week').add(7, 'day').endOf('day').format('YYYY/MM/DD HH:mm:ss')

  return {
    startTime,
    endTime,
  }
}
// 未完成任务
export function getAllUncompletedTasks(isProject: boolean) {
  const { twoOptions: workTwoOptions } = getFilterOptions('work_item_status')

  const condition = createCondition(isProject, 'work_item_status', workTwoOptions, 'NOT_IN', ['3', '8', '2'])
  return {
    conjunction: 'AND',
    conditions: [condition],
    conditionGroup: [],
  }
}
// 本周完成任务
export function getWeekCompletedTask(isProject: boolean) {
  const { twoOptions: workTwoOptions } = getFilterOptions('work_item_status')

  const { startTime, endTime } = getWeekTime()
  const { twoOptions: timeTwoOptions } = getFilterOptions('plan_time')

  const workCondition = createCondition(isProject, 'work_item_status', workTwoOptions, 'IN', ['2'])
  const timeCondition = createCondition(isProject, 'plan_time', timeTwoOptions, 'BETWEEN', { start: startTime, complete: endTime })
  return {
    conjunction: 'AND',
    conditions: [workCondition, timeCondition],
    conditionGroup: [],
  }
}
// 我的任务
export function getOwnerTasks(isProject: boolean) {
  const { twoOptions: particiTwoOptions } = getFilterOptions('participators')

  const condition = createCondition(isProject, 'participators', particiTwoOptions, 'IN', [])
  return {
    conjunction: 'AND',
    conditions: [condition],
    conditionGroup: [],
  }
}

// 指定任务流程
export function getWorkProcess(isProject: boolean, flow_id: string) {
  const { twoOptions: workFlowTwoOptions } = getFilterOptions('work_item_flow_id')

  const condition = createCondition(isProject, 'work_item_flow_id', workFlowTwoOptions, 'IN', [flow_id])
  return {
    conjunction: 'AND',
    conditions: [condition],
    conditionGroup: [],
  }
}
// 本周未完成任务
export function getWeekUncompletedTasks(isProject: boolean) {
  const { twoOptions: workTwoOptions } = getFilterOptions('work_item_status')

  const { startTime, endTime } = getWeekTime()
  const { twoOptions: timeTwoOptions } = getFilterOptions('plan_time')

  const workCondition = createCondition(isProject, 'work_item_status', workTwoOptions, 'NOT_IN', ['3', '8', '2'])
  const timeCondition = createCondition(isProject, 'plan_time', timeTwoOptions, 'BETWEEN', { start: startTime, complete: endTime })
  return {
    conjunction: 'AND',
    conditions: [workCondition, timeCondition],
    conditionGroup: [],
  }
}

// 提交数据转可渲染数据
export function parseToUIData(data: QueryConditionGroup) {
  const conditionData: ConditionGroup = {
    conjunction: data.conjunction,
    conditions: [],
    conditionGroup: [],
  }
  if (data.conditions) {
    data.conditions.map(async (item) => {
      const filterTypeItem = oneList.filter(ytem => ytem.value === item?.field)[0]
      const thirdValue
        = item.field === 'plan_time'
          ? { start: item.values[0], complete: item.values[1] }
          : item.values?.map(item => String(item))
      const conditionItem = {
        oneSelectVal: item.field,
        twoOptions: filterTypeItem.twoOptions.map(
          item => twoList.filter(ytem => ytem.value === item)[0],
        ),
        twoSelectVal: item.operator,
        thirdSelectVal: thirdValue,
      }
      conditionData.conditions.push(conditionItem as any)
    })
  }
  data.conditionGroup?.forEach((item) => {
    const conditionItem = parseToUIData(item)
    conditionData.conditionGroup?.push(conditionItem)
  })
  return conditionData
}

// 获取条件总数
export function getConditionsCount(obj: ConditionGroup) {
  let conditionCount = 0
  let groupsCount = 0
  if (obj.conditions) {
    obj.conditions.forEach((condition) => {
      if (isValidCondition(condition))
        conditionCount++
    })
  }

  // 如果存在groups属性，则对其中的每一项递归调用countConditions
  if (obj.conditionGroup) {
    groupsCount += obj.conditionGroup.length
    obj.conditionGroup.forEach((group) => {
      const groupCount = getConditionsCount(group)
      conditionCount += groupCount.conditionCount
      groupsCount += groupCount.groupsCount
    })
  }
  return {
    conditionCount,
    groupsCount,
  }
}

// 获取筛选条件提示文案
async function getFilterName(obj: any) {
  const oneSelectVal = Array.isArray(obj.oneSelectVal) ? obj.oneSelectVal[1] : obj.oneSelectVal
  const one = oneList.find(item => item.value === oneSelectVal)?.label
  const two = twoList.find(item => item.value === obj?.twoSelectVal)?.label
  const spaceId = router.currentRoute.value.params.id as string || obj?.projectVal as string

  let three = ''

  if (['work_item_flow_id', 'work_item_status', 'priority'].includes(oneSelectVal)) {
    three = await getAsyncFilterList(oneSelectVal, spaceId, (item: any) =>
      (obj.thirdSelectVal as string[]).includes(oneSelectVal === 'work_item_status' ? item.val : item.id))
  }
  else if (['directors', 'user_id', 'participators'].includes(oneSelectVal)) {
    const userIds = obj.thirdSelectVal
    // let spaceIdParams: string[] = []
    // if (spaceId) {
    //   spaceIdParams = [spaceId]
    // }
    const res = await getMemberListByFilter({ spaceIds: [], userIds })
    three = res.data.list.map((item: any) => item.userNickname).join(';')
  }
  else if (['work_object_id', 'version_id'].includes(oneSelectVal)) {
    const ids = obj.thirdSelectVal
    const result = await (oneSelectVal === 'work_object_id'
      ? getProjectModuleById({ spaceId, ids })
      : getWorkVersionById({ spaceId, ids }))

    three = result.data.list.map((item: any) => item[oneSelectVal === 'work_object_id' ? 'workObjectName' : 'versionName']).join(';')
  }
  else if (oneSelectVal === 'plan_time' && obj?.thirdSelectVal?.start && obj?.thirdSelectVal?.complete) {
    three = formatFilterTime(obj.thirdSelectVal)
  }

  return three ? `筛选·${one} ${two} ${three}` : ''
}

async function getAsyncFilterList(oneSelectVal: string, spaceId: string, filterCallback: (item: any) => boolean) {
  let res
  if (oneSelectVal === 'work_item_flow_id') {
    res = await getWorkTypeList(spaceId)
  }
  else if (oneSelectVal === 'work_item_status') {
    res = await getWorkStatusList(spaceId)
  }
  else if (oneSelectVal === 'priority') {
    res = await getWorkPriorityList()
  }
  const filterList = res.filter(filterCallback)
  return filterList.map((item: any) => item.name).join('; ')
}

/**
 * 处理日期
 */
function formatFilterTime(obj: TSDate) {
  let timeRange = ''
  const diffInDays = dayjs(obj.complete).diff(dayjs(obj.start), 'day')
  if (diffInDays < 300) {
    timeRange = `${dayjs(obj.start).format('YYYY/MM/DD')} ~ ${dayjs(obj.complete).format(
      'YYYY/MM/DD',
    )}`
  }
  else {
    timeRange = `${dayjs(obj.start).format('YYYY/MM/DD')} ~ 长期`
  }
  return timeRange
}

// 获取第一个有效条件
export async function getFirstValidConditionOfGroup(obj: ConditionGroup): Promise<Condition | null> {
  for (let i = 0; i < obj.conditions.length; i++) {
    if (isValidCondition(obj.conditions[i])) {
      const filterText = await getFilterName(obj.conditions[i])
      if (filterText) {
        obj.conditions[i].filterText = filterText
      }
      return obj.conditions[i]
    }
  }

  if (obj.conditionGroup) {
    for (let i = 0; i < obj.conditionGroup.length; i++) {
      const ConditionsItem = await getFirstValidConditionOfGroup(obj.conditionGroup[i])
      if (ConditionsItem) {
        return ConditionsItem
      }
    }
  }

  return null
}

// 判断条件是否有效
export function isValidCondition(condition: Condition) {
  if (typeof condition.thirdSelectVal === 'object' && condition.thirdSelectVal !== null && !isEmptyObject(condition.thirdSelectVal))
    return true

  else if ((Array.isArray(condition.thirdSelectVal) && condition.thirdSelectVal.length > 0))
    return true

  else if (condition.thirdSelectVal && condition.thirdSelectVal !== null && String(condition.thirdSelectVal).length > 0)
    return true

  return false
}

export function getTodayTime() {
  const startTime = dayjs().startOf('day').format('YYYY/MM/DD HH:mm:ss')
  const endTime = dayjs().endOf('day').format('YYYY/MM/DD HH:mm:ss')

  return [startTime, endTime]
}

// 检查是否有成立的值
export function checkObjectsWithoutThirdSelectVal(obj: any) {
  let hasValidThirdSelectVal = false

  if (Array.isArray(obj.conditions)) {
    hasValidThirdSelectVal = obj.conditions.some((item: any) => {
      const thirdSelectVal = item.thirdSelectVal
      return thirdSelectVal !== null && (!Array.isArray(thirdSelectVal) || thirdSelectVal.length > 0)
    })
  }

  if (Array.isArray(obj.conditionGroup)) {
    hasValidThirdSelectVal = hasValidThirdSelectVal || obj.conditionGroup.some((group: any) => {
      return checkObjectsWithoutThirdSelectVal(group)
    })
  }
  // 返回最终的检查结果
  return hasValidThirdSelectVal
}

// 过滤所有condition里没有值的数据
export function filterObjectsWithoutThirdSelectVal(obj: any, parentGroup?: any) {
  const newObj = deepCopy(obj)

  // 过滤 conditions 数组
  if (Array.isArray(newObj.conditions)) {
    newObj.conditions = newObj.conditions.filter((item: any) => {
      return item.thirdSelectVal !== null && (!Array.isArray(item.thirdSelectVal) || item.thirdSelectVal.length > 0)
    })
  }
  // 递归处理 conditionGroup
  if (Array.isArray(newObj.conditionGroup)) {
    newObj.conditionGroup = newObj.conditionGroup
      .map((group: any) => filterObjectsWithoutThirdSelectVal(group, newObj.conditionGroup))
      .filter((group: any) => {
        // 筛选出条件组不为空的对象
        return group.conditions.length > 0 || group.conditionGroup.length > 0
      })
  }

  if (parentGroup && Array.isArray(newObj.conditions) && newObj.conditions.length === 0 && Array.isArray(newObj.conditionGroup) && newObj.conditionGroup.length === 0) {
    parentGroup.length = 0
  }

  return newObj
}

// 是否存在有效条件
export function hasValidCondition(group: ConditionGroup) {
  for (const item of group.conditions) {
    if (item.oneSelectVal && item.thirdSelectVal && (item.thirdSelectVal as string[]).length > 0)
      return true
  }
  for (const item of group.conditionGroup as ConditionGroup[]) {
    const isValid = hasValidCondition(item)
    if (isValid)
      return true
  }
  return false
}

// 检查用户是否有关联任务
export async function testUserWidthProject(spaceId: string, ownerUid: string, userName?: string) {
  const { userInfo } = useUserStore()
  let isOwnerUser: boolean = false
  if (userInfo.id === ownerUid) {
    isOwnerUser = true
  }
  const res = await getWorkFlowRelationUser({ spaceId, ownerUid })
  const processList = res.data.list

  if (processList.length) {
    const processNames = processList.map((item: any) => {
      return `【${item.name || '未知流程'}】`
    }).join('、')

    const title = isOwnerUser ? `您已关联任务流程，无法离开` : `${userName} 已关联任务流程，无法移除`

    const textContentOne = isOwnerUser ? `1.您已关联任务流程` : ` 1.该成员已关联任务流程`
    const textContentProcess = `${processNames}`
    const textContentTwo = isOwnerUser ? `2.请联系项目管理员取消关联后，可离开项目` : `2.请联系项目管理员取消关联后，可移除成员`

    const modalInstance = Msgbox.warning.m({
      title,
      content: [h('p', null, textContentOne), h('p', null, textContentProcess), h('p', null, textContentTwo)],
      footer: [
        h('div', { class: 'process-create-custom-btn' }, [
          h('div', {
            onClick: () => {
              modalInstance.destroy()
            },
            class: 'ant-btn ant-btn-confirm',
          }, '我知道了'),
        ]),
      ],
    })
    return true
  }
  return false
}

export function projectAddIcon() {
  const projectStore = useProjectStore()

  const newOneList = addIconToLabel(oneAllList)
  const cList: FilterProjectOptions[] = [
    {
      value: '0',
      label: '所有项目',
      children: newOneList,
    },
  ]
  const childList = addIconToLabel(oneList)
  projectStore.projectList.forEach((item: any) => {
    cList.push({
      value: item.id,
      label: item.spaceName,
      children: childList.filter((find: FilterOneOptions) => find.value !== 'followers'),
    })
  })
  return cList
}

function addIconToLabel(list: FilterOneOptions[]) {
  const deepCopyList = deepCopy(list)
  const modifiedList = deepCopyList.map((item: any) => {
    // 创建带有图标的 span 元素
    const iconElement = h(SvgIcon, {
      name: item.icon,
      size: 12,
      color: '#666',
    })
    const labelElement = h('span', { class: 'two-sub-icon' }, [iconElement, h('span', item.label)])
    item.label = labelElement
    return item
  })
  return modifiedList
}
