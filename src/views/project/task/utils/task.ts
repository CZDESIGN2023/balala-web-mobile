import { cloneDeep } from 'lodash'
import { validatorTaskPlanTimeAt, validatorTaskWorkItemName } from './vaildate'
import type { WorkDetailData } from '@/api/interface'
import type { ItemProps } from '@/components/form/BForm/src/BForm.vue'
import type { Workflow } from '@/views/flowNode/types'
import { getWorkFlow, getWorkItemRoleList } from '@/api/workflow'
import { NodeStatus } from '@/enum/NodeStatus'
import type { TaskPermission } from '@/hooks/useTaskPermission'
import type { WorkFlowTemplateData } from '@/api/project/types'
import { sortNodes } from '@/utils/array'

// 获取对应任务流程下面的负责人角色列表
export async function getWorkflowAndRoleOwners({ spaceId, flowId, workflow: workflowData }: { spaceId: string, flowId: string, workflow?: WorkFlowTemplateData }) {
  const postArr = []
  if (workflowData)
    postArr.push(getWorkItemRoleList({ spaceId }))
  else
    postArr.push(getWorkItemRoleList({ spaceId }), getWorkFlow({ flowId, spaceId }))

  let workflow: Workflow
  const [{ data: roleList }, data] = await Promise.all(postArr)
  // eslint-disable-next-line prefer-const
  workflow = postArr.length > 1 ? data.data : workflowData
  const nodes = sortNodes(workflow.templateConf.nodes, workflow.templateConf.connections)
  const roles: string[] = []
  const roleOwners = nodes.map((item: any) => {
    // 自动填充的用户id
    let fillOwners: string[] = []
    const ownerVal = typeof item.owner.value === 'string' ? JSON.parse(item.owner.value) : item.owner.value
    if (ownerVal && typeof ownerVal === 'object') {
      if (ownerVal.fillOwner && ownerVal.fillOwner.length > 0) {
        fillOwners = ownerVal.fillOwner.map((ele: any) => ele.value)
      }
    }
    return {
      roleId: item.owner.ownerRole[0]?.id,
      roleKey: item.owner.ownerRole[0]?.key,
      roleName: roleList.list.find((ele: any) => ele.key === item.owner.ownerRole[0]?.key)?.name,
      label: item.name,
      directorIds: fillOwners,
      usageMode: item.owner.usageMode,
      appointedOwner: ownerVal?.appointedOwner?.map((item: any) => item.value) || [],
    }
  }).filter((item: any) => {
    if (roles.includes(item.roleKey) || !item.roleKey) {
      return false
    }
    else {
      roles.push(item.roleKey)
      return true
    }
  })
  return { workflow, roleOwners, roleList }
}

/**
 * 获取当前节点模板
 * @param data 任务数据
 * @returns 当前节点的模板
 */
export function getCurrentNode(data: WorkDetailData) {
  // 查找当前节点
  return data.nodes?.find(node => node.flowNodeStatus === NodeStatus.INPROGRESS)
}

// 生成节点选项的方法
export function generateNodeOptions(data: Workflow) {
  // 如果工作流模板或节点不存在，则返回空数组
  if (!data.templateConf || !data.templateConf.nodes)
    return []

  // 使用 filter 方法过滤出不需要自动确认的节点
  const filteredNodes = sortNodes(data.templateConf.nodes, data.templateConf.connections).filter((item) => {
    return item.passMode !== 'auto_confirm'
  })

  // 使用 map 方法将过滤后的节点转换成选项对象
  const nodeOptions = filteredNodes.map((item) => {
    // 如果节点名称存在，则使用它作为标签，否则使用空字符串
    const label = item.name ? `重启至 ${item.name}` : ''
    // 如果节点代码存在，则使用它作为值，否则使用空字符串
    const value = item.key || ''
    return { label, value }
  })

  // 返回生成的节点选项
  return nodeOptions
}

// 获取标题图标
export function getTitleIcon(type: string) {
  switch (type) {
    case 'task':
      return 'warning.svg'

    case 'childTask':
      return 'warning.svg'

    default:
      break
  }
}

// 获取弹窗标题
export function getDlgTitle(type: string) {
  switch (type) {
    case 'task':
      return '确认删除任务吗？'

    case 'childTask':
      return '确认重启该任务吗？'

    default:
      break
  }
}

// 获取确认按钮名称
export function getDlgBtnText(type: string) {
  switch (type) {
    case 'task':
      return '删除'

    case 'childTask':
      return '确认'

    default:
      break
  }
}

const itemsBefore: { [key: string]: ItemProps } = {
  module: {
    label: '所属模块',
    type: 'module',
    field: 'workObjectId',
    width: '100%',
    spaceId: '',
    placeholder: '请选择模块',
    rules: [{ required: true, message: '请选择所属模块', trigger: ['change', 'blur'] }],
  },
  version: {
    label: '所属版本',
    type: 'version',
    field: 'versionId',
    width: 'calc(50% - 1.53846vw)',
    placeholder: '选择版本',
    rules: [
      {
        required: true,
        trigger: ['change', 'blur'],
        message: '请选择版本',
      },
    ],
    spaceId: '',
  },
  priority: {
    label: '优先级',
    type: 'priority',
    field: 'priority',
    width: 'calc(50% - 1.53846vw)',
    rules: [
      {
        required: true,
        trigger: ['change'],
        message: '请选择优先级',
      },
    ],
  },
  planTime: {
    label: '总排期',
    type: 'dateRange',
    field: 'planTime',
    classType: 'detail',
    width: 'calc(50% + 15.8974vw + 1.53846vw)',
    placeholder: '起始日期 ~ 截止日期',
    rules: [{ required: true, validator: validatorTaskPlanTimeAt, trigger: 'change' }],
  },
  processRate: {
    label: '进度',
    type: 'input-number',
    field: 'processRate',
    width: 'calc(50% - 15.8974vw - 3.0769vw - 1.53846vw)',
    placeholder: '待填进度',
    focusPlaceholder: '0～100',
    inputSuffix: '%',
    suffix: '%',
    min: 0,
    max: 100,
  },
  workItemName: {
    label: '任务名称',
    type: 'workItemName',
    field: 'workItemName',
    width: '100%',
    // tips: '请简述概括，详细内容请在描述中撰写。（在任务名添加【功能/系统名】前缀帮助快速定位）',
    placeholder: '待填',
    rules: [{
      required: true,
      trigger: ['change'],
      validator: validatorTaskWorkItemName,
    }],
  },
  describe: {
    label: '任务描述',
    type: 'editor',
    field: 'describe',
    width: '100%',
    placeholder: '为提高沟通有效性，请尽量条理清晰、简洁有逻辑的描述内容…',
    readContent: '为提高沟通有效性，请尽量条理清晰、简洁有逻辑的描述内容…',
    maxHeight: 2000,
    minHeight: 184,
  },
}
const itemsAfter: { [key: string]: ItemProps } = {
  line: { type: 'line', width: '100%' },
  tag: {
    label: '标签',
    type: 'tag',
    field: 'tagIds',
    width: '100%',
    placeholder: '请选择标签',
    spaceId: '',
  },
  remark: {
    label: '交付备注',
    type: 'editor',
    field: 'remark',
    width: '100%',
    placeholder: '如有相关资源交付备注/链接可在此说明',
    readContent: '如有相关资源交付备注/链接可在此说明',
    maxHeight: 2000,
    minHeight: 40,
  },
  files: {
    label: '添加附件',
    type: 'upload',
    field: 'files',
    width: '100%',
    taskMode: true,
  },
  childTaskTable: {
    label: '',
    type: 'slot',
    field: 'childTaskTable',
    width: '100%',
  },
}

export async function getFormItems(workflow: WorkFlowTemplateData, taskDetail?: WorkDetailData, taskPermissions?: TaskPermission) {
  let roleOwners: any[] = []
  if (taskDetail?.pid === '0' || !taskDetail?.id) {
    const { roleOwners: temp } = await getWorkflowAndRoleOwners({ spaceId: workflow.spaceId, flowId: workflow.id, workflow })
    roleOwners = temp
  }
  else {
    roleOwners = [{
      roleName: '负责人',
      roleKey: 'curOwner',
    }]
  }
  const newRoleOwners = roleOwners.map((item) => {
    const displayRange: string[] = []
    if (item.usageMode === 'appointed') {
      item.appointedOwner.forEach((item: any) => {
        let id = item
        if (item === '_creator') {
          id = taskDetail?.creator.userId
        }
        if (!displayRange.includes(id))
          displayRange.push(id)
      })
    }
    return Object.assign(item, {
      label: item.roleName,
      type: 'personSelect',
      field: item.roleKey,
      width: '100%',
      placeholder: `请选择 ${item.roleName} 负责人`,
      rules: [{ required: true, message: `请选择 ${item.roleName} 负责人`, trigger: ['change', 'blur'] }],
      displayRange,
      disabled: taskPermissions ? !taskPermissions.allowEdit : false,
      spaceId: workflow.spaceId,
    })
  })
  // 角色对象列表
  const nodesObj = {} as { [key: string]: ItemProps }
  newRoleOwners.forEach((item, index: number) => {
    nodesObj[item.field as string] = item
    if (index === 0)
      nodesObj.$creator = { label: '创建人', type: 'personSelect', field: '$creator', width: '100%', disabled: true }
  })

  const items = Object.assign(cloneDeep(itemsBefore), nodesObj, cloneDeep(itemsAfter))
  if (taskPermissions && taskDetail) {
  // 权限配置
    items.module.enableCreate = taskPermissions.allowObjectCreate
    items.module.enableEdit = taskPermissions.allowObjectEdit

    items.version.enableCreate = taskPermissions.allowVersionCreate
    items.version.enableEdit = taskPermissions.allowVersionEdit

    items.tag.enableCreate = taskPermissions.allowTagCreate
    items.tag.enableEdit = taskPermissions.allowTagCreate

    items.describe.readonly = !taskPermissions.allowEdit
    items.remark.readonly = !taskPermissions.allowEdit

    items.files.isReadonly = !taskPermissions.allowEdit

    // disabled配置
    items.module.disabled = !taskPermissions.allowEdit
    items.priority.disabled = !taskPermissions.allowEdit
    items.workItemName.disabled = !taskPermissions.allowEdit
    items.planTime.disabled = !taskPermissions.allowEdit
    items.processRate.disabled = !taskPermissions.allowEdit
    items.version.disabled = !taskPermissions.allowEdit
    items.tag.disabled = !taskPermissions.allowEdit
    items.files.disabled = !taskPermissions.allowEdit

    // 设置 spaceId
    items.module.spaceId = workflow.spaceId
    items.workItemName.spaceId = workflow.spaceId
    items.version.spaceId = workflow.spaceId
    items.tag.spaceId = workflow.spaceId
    items.describe.spaceId = workflow.spaceId
    items.remark.spaceId = workflow.spaceId
    items.files.spaceId = workflow.spaceId

    // 特殊参数配置
    items.module.workItemId = taskDetail.id
    items.version.workItemId = taskDetail.id
    items.files.workItemId = taskDetail.id
    items.files.status = taskDetail.workItemStatus.val
    items.planTime.taskStatus = taskDetail.workItemStatus.val
    items.describe.template = workflow.templateConf.formFields.find(item => item.name === 'describe')?.value
    items.describe.mode = `${taskDetail.id}task-desc-edit`
    items.describe.modeKey = `${taskDetail.id}task-desc-edit`

    items.remark.mode = `${taskDetail.id}task-remarks-edit`
    items.remark.modeKey = `${taskDetail.id}task-remarks-edit`
    items.remark.template = '<p>- [相关资源交付备注/链接 | 如有]：</p>'
  }

  return items
}

export async function getWorkFlowOwner(workflow: WorkFlowTemplateData) {
  const { roleOwners } = await getWorkflowAndRoleOwners({ spaceId: workflow.spaceId, flowId: workflow.id, workflow })
  const newRoleOwners = roleOwners.map((item) => {
    return Object.assign(item, {
      label: item.roleName,
      type: 'personSelect',
      field: item.roleKey,
      clearNotRestore: true,
      width: '100%',
      placeholder: `请选择 ${item.roleName} 负责人`,
      rules: [{ required: true, message: `请选择 ${item.roleName} 负责人`, trigger: ['blur', 'change'] }],
      displayRange: item.usageMode === 'appointed' ? item.appointedOwner : undefined,
      creator: item.usageMode !== 'appointed',
    })
  })

  return newRoleOwners
}
