import dayjs from 'dayjs'
import type { TableListItem, WorkDetailData } from '@/api/interface'
import type { Permissions } from '@/views/project/types/task'
import { getProjectTableById } from '@/api/project'
import { formatDate, getTimeColor, getTimediff, isEmptyObject } from '@/utils'
import type { TableRowData, WorkGroup, WorkGroupInfo, WorkGroupItem } from '@/views/project/types/table'
import { useTaskPermission } from '@/hooks/useTaskPermission'
import type { TaskStatusKey } from '@/enum/TaskStatus'
import { getBadgeColor } from '@/utils/color'

interface ObjType {
  [key: string]: number
}

// 扁平化
export async function parseFlattenData(data: WorkGroup[]) {
  const groupData: TableRowData[] = []
  // 临时存储的组数据，key为组唯一id路径，value为组值
  const objs: ObjType = {}
  // 总任务条数（主任务+子任务）
  let total = 0

  /**
   * 1. 为 组和任务添加 id 和 parentId 且平铺
   * 2. 为 组添加 total 组下的主任务数量
   * 组 id 添加逻辑：重叠的组使用相同的 id。判断重叠依据：从顶层算起拼起来的 fieldKey 作为唯一依据
   * returns 得到的数据将是一维数组，且组会有重复，去除重复项即可得到平铺树
   */
  data.forEach((item) => {
    // 将工作项附加到最后一组信息
    item.groupInfo[item.groupInfo.length - 1].workItems = item.workItems
    item.groupInfo.forEach((group: WorkGroupInfo, index: number) => {
      // 生成唯一键
      const key = item.groupInfo.slice(0, index + 1).map(g => g.fieldId + g.fieldKey).join('')
      objs[key] = objs[key] || Math.random()

      group.id = objs[key]
      group.total = item.workItems.length
      group.parentId = index > 0 ? item.groupInfo[index - 1].id : null

      // 存在分组信息 fieldId, 加入列表
      if (group.fieldId) {
        const obj = {
          key: group.fieldId!,
          displayName: group.displayName,
          id: group.id,
          rowKey: group.id,
          parentId: group.parentId,
          fieldKey: group.fieldKey,
          isGroup: true,
          loading: true,
          total: item.workItems.length,
        } as unknown as TableRowData
        groupData.push(obj)
      }

      if (group.workItems?.length > 0) {
        const workItems = convertToFlat(group.workItems, group.id)
        total += workItems.length
        groupData.push(...workItems)
      }
    })
  })

  // 去除组 id 重复的项
  const tableData: TableRowData[] = []
  const ids: number[] = []
  const temp: TableRowData[] = []
  groupData.forEach((item) => {
    const index = ids.indexOf(Number(item.id!))
    if (index === -1) {
      tableData.push(item)
      ids.push(Number(item.id!))
      temp.push(item)
    }
    else {
      temp[index].total += item.total
    }
  })

  // #region METHODS

  // workItems 平铺
  function convertToFlat(data: WorkGroupItem[], parentId: number) {
    const flatData: TableRowData[] = []
    data.forEach((item) => {
      item.id = Math.random()
      item.parentId = parentId
      const obj = {
        key: item.workItemId!,
        displayName: '',
        id: item.id,
        rowKey: item.id,
        parentId: item.parentId,
        fieldKey: '',
        isGroup: false,
        loading: true,
        total: 0,
      } as unknown as TableRowData
      flatData.push(obj)
      if (item.workItems && item.workItems.length > 0)
        flatData.push(...convertToFlat(item.workItems, item.id as number))
    })
    return flatData
  }

  return { data: tableData, total }
}

// 根据 id 获取表格单条信息
export async function getTableByid(ids: string[] | number[], workingDay: any) {
  const { data } = await getProjectTableById(0, ids)
  const parseList = parseData(data.list, workingDay)
  return parseList
}

// 重构返回数据
export function parseData(list: WorkDetailData[], workingDay: string) {
  const result: TableRowData[] = []
  list.forEach((item) => {
    let operationPermissions: Permissions = {}
    try {
      try {
        operationPermissions = JSON.parse(item.operationPermissions || '')
      }
      catch (error) {
        operationPermissions = {} as Permissions
      }
    }
    catch (error) {}
    const { perms } = useTaskPermission({ workItemStatus: item.workItemStatus, operationPermissions })
    result.push({
      ...item,
      perm: {
        allowEdit: perms.allowEdit,
        allowNode: perms.allowNode,
        allowChangeState: perms.allowChangeState,
      },
      isExpanded: false,
      loading: false,
      formatTime: formatDateText(item.planTime),
      nodeTime: getStatusTime(item as any, workingDay[item.spaceId! as any]),
      flowColor: getBadgeColor(item.flowName),
      statuColor: getBadgeColor(item.workItemStatus.name),
      planTimeColor: getTimeColor(Number(item?.planTime.completeAt), item.workItemStatus.val || 0),
    } as unknown as TableRowData)
  })
  return result
}

// 处理长期
function formatDateText(planTime: any) {
  const start = dayjs(formatDate(planTime.startAt))
  const end = dayjs(formatDate(planTime.completeAt))
  const diffInDays = end.diff(start, 'day')
  const showTime = [formatDate(planTime.startAt ?? '', 'MM/DD'), formatDate(planTime.completeAt ?? '', 'YYYY/MM/DD')]
  return diffInDays > 300 ? `长期` : `${showTime[1]}`
}

// 获取所有 workItemId
export function getAllIds(items: TableListItem[]) {
  let result: string[] = []
  items.forEach((item: any) => {
    if (item.workItemId)
      result.push(item.workItemId) // 首先将每一项的 workItemId 添加到结果中

    // 如果这一项的 workItems 存在，就递归处理
    if (item.workItems && item.workItems.length > 0)
      result = result.concat(getAllIds(item.workItems))
  })
  return result
}

// 获取所有 key值
export function getAllKeys(table: TableRowData[]) {
  let result: string[] = []
  table.forEach((item: any) => {
    if (item.id)
      result.push(item.id) // 首先将每一项的 workItemId 添加到结果中

    // 如果这一项的 workItems 存在，就递归处理
    if (item.children && item.children.length > 0)
      result = result.concat(getAllKeys(item.children))
  })
  return result
}

// 找到表格某一行更新
export function findObjectByKey(list: TableRowData[], obj: TableRowData) {
  if (!list || !obj)
    return
  for (let i = 0; i < list.length; i++) {
    if (list[i].key === obj.id && !list[i].isGroup)
      Object.assign(list[i], obj)
    if (list[i].children)
      findObjectByKey(list[i].children as TableRowData[], obj)
  }
}

// 切换树形表格展开收起
export function toggleTreeExpand(data: any) {
  data.row.isExpanded = data.expanded ? 'expand' : 'fold'
}

// 检查表格任务权限
export function checkTaskItemPerm(operationPermissions: Permissions, key: string) {
  if (!operationPermissions || isEmptyObject(operationPermissions))
    return false

  if (operationPermissions[key as keyof Permissions])
    return operationPermissions[key as keyof Permissions]

  return false
}

function getStatusTime(record: TableRowData, workingDay: string) {
  if (Number(record.pid) === 0 || Number(record.lastStatusAt)) {
    return getTimediff(record.lastStatusAt as string, false, '' as TaskStatusKey, workingDay)
  }
  else {
    return getTimediff(record.createdAt as string, false, '' as TaskStatusKey, workingDay)
  }
}

/**
 * 滚动控制，锁定、解除滚动
 * @param value 值为 overflow 的值，如hidden、auto
 */
export function scrollControl(value: string) {
  const body = document.querySelectorAll<HTMLElement>('.vxe-table--body-wrapper.body--wrapper')
  for (let i = 0; i < body.length; i++) {
    body[i].style.overflowY = value
    body[i].style.overflowX = value
  }

  const fixedLeft = document.querySelectorAll<HTMLElement>('.fixed-left--wrapper')
  for (let i = 0; i < fixedLeft.length; i++)
    fixedLeft[i].style.overflowY = value

  const fixedRight = document.querySelectorAll<HTMLElement>('.fixed-right--wrapper')
  for (let i = 0; i < fixedRight.length; i++)
    fixedRight[i].style.overflowY = value

  document.body.style.overflowY = value
}
