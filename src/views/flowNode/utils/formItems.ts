import { type Ref, ref } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { NodeProp, Workflow } from '../types'
import { checkLength, required } from '@/utils/validate'
import type { ItemProps } from '@/components/form/BForm/src/BForm.vue'

function validateAppointedOwner(node: Ref<NodeProp>) {
  return {
    required: true,
    validator: (_rule: Rule, value: string[]) => {
      if (node.value.owner.usageMode === 'appointed' && (!value || !value.length)) {
        return Promise.reject(new Error('可选成员范围不能为空'))
      }
      return Promise.resolve()
    },
    trigger: ['change', 'blur'],
  }
}

export function getFormItems(_workflow: Ref<Workflow>, node: Ref<NodeProp>) {
  const items = ref({
    group1: { label: '节点信息', type: 'group' },
    name: { label: '节点名称', type: 'input', field: 'name', placeholder: '请输入节点名称', rules: [required('节点名称不能为空'), checkLength(2, 30)] },
    targetSubState: {
      label: '任务状态',
      type: 'select-status',
      field: 'onReach.0.targetSubState.id',
      create: true,
      edit: true,
      placeholder: '请选择任务状态',
      tips: '任务到达当前节点时所体现的任务状态',
      rules: [
        required('节点状态不能为空'),
        // {
        //   validator: async (_rule: Rule, value: string) => {
        //     // 查找是否有相同任务状态的节点
        //     const sameArr = workflow.value.templateConf.nodes.filter((item) => {
        //       if (['started', 'ended'].includes(item.key)) {
        //         return false
        //       }
        //       if (item.onReach[0].targetSubState.id === value) {
        //         return true
        //       }
        //       return false
        //     })
        //     if (sameArr.length > 1) {
        //       return Promise.reject(new Error('单任务流程不可重复'))
        //     }
        //     return Promise.resolve()
        //   },
        //   message: '单任务流程不可重复',
        //   trigger: ['change', 'blur'],
        // },
      ],
    },
    doneOperationDisplayName: { label: '流转按钮', type: 'input', field: 'doneOperationDisplayName', placeholder: '请输入按钮名称', tips: '任务流转时的操作按钮名称', rules: [required('操作名称不能为空'), checkLength(2, 8)] },
    group2: { label: '节点关联角色配置', type: 'group' },
    ownerRole: { label: '关联角色', type: 'select-role', field: 'owner.ownerRole.0.id', readonly: true, placeholder: '请选择节点关联角色', tips: '配置负责该节点的角色，任务单中以负责人形式体现，单流程重复使用时配置通用', rules: [required('关联角色不能为空')], create: true, edit: true },
    usageMode: {
      label: '分配方式',
      type: 'slot',
      field: 'owner.usageMode',
      placeholder: '请选择分配方式',
      tips: '配置该节点成员选择方式',
      options: [{ label: '无限制选择范围', value: 'none', des: '自行添加，支持默认填充成员' }, { label: '限制选择范围', value: 'appointed', des: '限制成员选择范围，支持默认填充成员' }],
    },
    appointedOwner: { label: '可选成员范围', type: 'slot', field: 'owner.value.appointedOwner', tips: '配置当前节点负责人可选范围', placeholder: '请选择成员范围', rules: [validateAppointedOwner(node)], show: false },
    fillOwner: { label: '默认填充成员', type: 'slot', field: 'owner.value.fillOwner', tips: '配置该节点默认填充成员，为空则不默认填充', placeholder: '若未选择，则不自动填充默认成员' },
    group3: { label: '节点事件', type: 'group' },
    enableRollback: { label: '节点支持回滚', type: 'slot', field: 'enableRollback', tips: '开启后当前节点支持回滚，可配置回滚原因供成员选择' },
    enableClose: { label: '节点支持关闭、重启', type: 'slot', field: 'enableClose', tips: '开启后当前节点支持关闭/重启，可配置关闭/重启原因供成员选择' },
  } as unknown as { [key: string]: ItemProps })
  return items
}
