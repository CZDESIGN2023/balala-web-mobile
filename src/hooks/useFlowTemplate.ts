import { reactive, toRefs } from 'vue'
import { getWorkFlowTemplateByShared } from '@/api/project'
import type { TemplateConfConnection, TemplateConfNode, WorkFlowTemplateData } from '@/api/project/types'
import type { SelectOptions } from '@/typings/common'
import { sortNodes } from '@/utils/array'

// 流程模板
export default function useFlowTemplate() {
  const state = reactive({
    flowTemplateInfo: { templateConf: {} } as WorkFlowTemplateData,
    nodeOptions: [] as SelectOptions[],
    currentNode: {} as TemplateConfNode,
    loading: true,
  })

  // 初始化
  async function initFlowTemplate(spaceId: string, templateId: string, nodeKey?: string) {
    state.loading = true
    try {
      const { data } = await getWorkFlowTemplateByShared({ spaceId, templateId })
      processTemplateResponse(data, nodeKey as string)
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.log('Failed to load workflow template:', error)
    }
    finally {
      state.loading = false
    }
    return true
  }

  // 响应处理
  function processTemplateResponse(data: WorkFlowTemplateData, nodeKey: string) {
    const { templateConf } = data

    // 处理重启原因
    templateConf.rebootReasonList = mapOptions(templateConf.rebootReasonOptions, templateConf.enableRebootReasonOtherOption)
    // 处理终止原因
    templateConf.terminatedReasonList = mapOptions(templateConf.terminatedReasonOptions, templateConf.enableTerminatedReasonOtherOption)
    templateConf.resumeReasonList = mapOptions(templateConf.resumeReasonOptions, templateConf.enableResumeReasonOtherOption)

    // 处理节点原因配置
    templateConf.nodes.forEach((node) => {
      node.restartReasonList = mapOptions(node.restartReasonOptions, node.enableRestartReasonOtherOption)
      node.rollbackReasonList = mapOptions(node.rollbackReasonOptions, node.enableRollbackReasonOtherOption)
      node.closeReasonList = mapOptions(node.closeReasonOptions, node.enableCloseReasonOtherOption)
    })

    state.flowTemplateInfo = data
    state.nodeOptions = getNodeOptions(templateConf.nodes, templateConf.connections)

    if (nodeKey)
      setCurrentTemplate(nodeKey)
  }

  // 获取节点列表
  function getNodeOptions(nodes: TemplateConfNode[], connections: TemplateConfConnection[]): SelectOptions[] {
    return sortNodes(nodes, connections).map(node => ({ label: node.name, value: node.key }))
  }

  // 获取当前节点对象
  function getCurrentTemplate(nodes: TemplateConfNode[], nodeKey: string): TemplateConfNode {
    return nodes.find(node => node.key === nodeKey) as TemplateConfNode
  }

  // 设置当前模板
  function setCurrentTemplate(nodeKey: string) {
    state.currentNode = getCurrentTemplate(state.flowTemplateInfo.templateConf.nodes, nodeKey)
  }

  return {
    ...toRefs(state),
    initFlowTemplate,
    setCurrentTemplate,
  }
}

// 处理原因 options
export function mapOptions(options: string[], enableOtherOption: boolean): SelectOptions[] {
  const mappedOptions: SelectOptions[] = options.map((item, index) => ({
    label: item,
    value: index,
  }))

  if (enableOtherOption)
    mappedOptions.push({ label: '其他', value: 'other' })

  return mappedOptions
}
