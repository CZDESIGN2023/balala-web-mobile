import type { Rule } from 'ant-design-vue/es/form'
import { reactive } from 'vue'
import { getTextLength, isEmptyObject } from '@/utils'
import type { TaskOwner, TaskPlanTimeAt } from '@/api/interface'

// 任务总排期校验
export function validatorTaskPlanTimeAt(rule: any, value: TaskPlanTimeAt) {
  if (isEmptyObject(value) || !value)
    return Promise.reject(new Error('请选择 起止 日期'))

  return Promise.resolve()
}

// 任务名称验证
export function validatorTaskWorkItemName(rule: any, value: any) {
  const length = value && getTextLength(value)
  if (!value || !(length >= 2 && length <= 200))
    return Promise.reject(new Error('请输入任务名称(2 ~ 200个字符)'))
  else
    return Promise.resolve()
}

// 子任务负责人验证
export function vChildDirector(rule: any, value: any) {
  if (!value)
    return Promise.reject(new Error(`请选择负责人`))
  else
    return Promise.resolve()
}

// 任务规则
export const taskRule = reactive<Record<string, Rule[]>>({
  spaceId: [
    {
      required: true,
      message: '请选择所属项目',
    },
  ],
  flowId: [
    {
      required: true,
      trigger: ['change'],
      message: '请选择任务流程',
    },
  ],
  workObjectId: [
    {
      required: true,
      trigger: ['change', 'blur'],
      message: '请选择所属模块',
    },
  ],
  priority: [
    {
      required: true,
      trigger: ['change'],
      message: '请选择优先级',
    },
  ],
  itemName: [
    {
      required: true,
      trigger: ['change'],
      validator: validatorTaskWorkItemName,
    },
  ],
  planTimeAt: [
    {
      required: true,
      trigger: ['change'],
      validator: validatorTaskPlanTimeAt,
    },
  ],
  workVersionId: [
    {
      required: true,
      trigger: ['change', 'blur'],
      message: '请选择版本',
    },
  ],
})
