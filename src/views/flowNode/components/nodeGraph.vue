<script lang="ts" setup>
import { computed, onUnmounted, ref } from 'vue'
import G6 from '@antv/g6'
import { onClickOutside, useResizeObserver } from '@vueuse/core'
import { cloneDeep } from 'lodash'
import { message } from 'ant-design-vue'
import { generateDefaultNodeData } from '../utils'
import { debounce, deepCopy, generateRandomString, getAssetsFile, getNodeTextWidth, getTextLength, isEmptyObject } from '@/utils'
import edgeAddIcon from '@/assets/svg/flow-add.svg'
import { Msgbox } from '@/utils/msgbox'

const emits = defineEmits(['onSelectNode', 'onChangeNode', 'onChangeName', 'onRemoveNode'])

const nodeGraphRef = ref()
const nodeDropMenu = ref()
const loading = ref(false)
const nodeAddMenuStyle: any = ref({})
const contextmenuStyle: any = ref({})
const edgeAddStyle: any = ref({})
const selectNodeAndEdge: any = ref({})
const selectedNodeIds: any = ref([])
let flowConf: { [key: string]: any[] } = {}

// 定义画布
let graph: any

let currentNode: any = {}
let selectedNode: any = {}
let removeMouseEventListener: Function = () => {}

const styleObj = {
  nodeHeight: 32,
  offsetWidth: 164,
  padding: 32,
  circleWidth: 1,
  strokeWidth: 2,
  circleStyle: {
    normal: { fill: '#edeef0', stroke: '#ffffff', y: 0, r: 2.5, lineWidth: 1, cursor: 'pointer' },
    success: { fill: '#1d74f5', stroke: '#FFFFFF' },
    current: { fill: '#FFFFFF', stroke: '#edeef0' },
  },
  lineStyle: {
    normal: { stroke: '#e3e4e5' },
    success: { stroke: '#1d74f5' },
  },
}
const maxNodes = 40

const nodes = ref([])
const edges = ref([])
// 节点是否处于编辑状态
const isNodeNameEditing = ref(false)

const graphData = computed(() => {
  return {
    nodes: createNodes(nodes.value),
    edges: createEdges(edges.value),
  }
})

// 计算节点大小
function computedNodeSize(label: string) {
  const textWidth = getNodeTextWidth(label)
  return textWidth + styleObj.padding
}

// 创建节点
function createNodes(nodes: any[]) {
  return nodes.map(node => ({
    id: node.key,
    text: node.name,
    size: [computedNodeSize(node.name), styleObj.nodeHeight],
    data: node || {},
  }))
}

// 创建边
function createEdges(edges: string[][]) {
  return edges.map((item: any) => ({
    source: item.startNode,
    target: item.endNode,
  }))
}

// 自定义节点
G6.registerNode(
  'extra-shape-node',
  {
    draw(cfg: any, group: any) {
      const nodeSize = computedNodeSize(cfg.text as string)
      const shape = group.addShape('rect', {
        attrs: {
          x: -nodeSize / 2,
          y: -styleObj.nodeHeight / 2,
          width: nodeSize,
          height: styleObj.nodeHeight,
          stroke: '#EDEEF0',
          fill: '#FFFFFF',
          radius: styleObj.nodeHeight / 2,
          cursor: cfg.id === 'started' || cfg.id === 'ended' ? 'not-allowed' : 'pointer',
        },
        name: 'rect-box',
        draggable: false,
      })
      const addCircle = (name: string, x: number) => {
        group.addShape('circle', {
          attrs: {
            x,
            ...styleObj.circleStyle.normal,
          },
          name,
        })
      }

      group.addShape('text', {
        attrs: {
          textAlign: 'center',
          text: cfg.text,
          fontSize: 14,
          cursor: cfg.id === 'started' || cfg.id === 'ended' ? 'not-allowed' : 'pointer',
          textBaseline: 'middle',
          lineHeight: styleObj.nodeHeight,
          letterSpacing: '0.04em',
          fill: '#333',
        },
        name: 'title',
      })

      // 左边连接点
      if (cfg.id !== 'started')
        addCircle('left-link-point', -shape.attr('width') / 2 + 0.5)

      // 右边连接点
      if (cfg.id !== 'ended')
        addCircle('right-link-point', shape.attr('width') / 2 - 0.5)

      return shape
    },
    // ... 其他自定义节点配置
    update: undefined,
  },
  'single-node',
)

// 自定义边
G6.registerEdge(
  'extra-shape-edge',
  {
    afterDraw(cfg: any, group: any) {
      const shape = group.get('children')[0]
      const quatile = shape.getPoint(0.5)
      group.addShape('image', {
        name: 'edge-add-circle',
        attrs: {
          width: 16,
          height: 16,
          img: edgeAddIcon,
          x: quatile.x - 8,
          y: quatile.y - 8,
          cursor: 'pointer',
          opacity: 0,
        },
      })
    },
    update: undefined,
  },
  'cubic-horizontal',
)

// 获取数据
function setData(data: any, flowConfData: { [key: string]: any[] }) {
  nodes.value = data.nodes
  edges.value = data.connections
  flowConf = flowConfData
  initGraph()
  useResizeObserver(nodeGraphRef.value, (entries) => {
    const entry = entries[0]
    const { width, height } = entry.contentRect
    let debouncedChangeSizeAndFitCenter: Function = null as unknown as Function
    if (graph) {
      debouncedChangeSizeAndFitCenter = debounce(() => {
        graph.changeSize(width, height)
        graph.fitCenter()
        graph.translate(-styleObj.offsetWidth, 0)
      }, 600)
    }
    if (graph)
      debouncedChangeSizeAndFitCenter()
  })
  // 默认选中第一个节点
  if (graphData.value.edges.length) {
    const startNode = graphData.value.edges.find(item => item.source === 'started')
    if (!startNode)
      return
    emitSelectNode(startNode?.target)
  }
}

// 触发节点点击事件
function emitSelectNode(nodeId: string) {
  const node = graph.findById(nodeId)
  graph.emit('node:click', {
    item: node,
    target: node.getKeyShape(),
  })
}

// 在两个节点之间插入节点
function handleInsertNodeBetween() {
  const vaildnodesNum = vaildMaxnodes()
  if (vaildnodesNum)
    return
  const currentEdge = currentNode.getOutEdges()[0]
  if (!currentEdge) {
    handleAddNodeAfter()
    return
  }
  const { source, target } = currentEdge.getModel()
  graph.removeItem(currentEdge)
  insertNodeBetween(source, target)
  nodeAddMenuStyle.value.display = 'none'
}

// 复制节点
function handleInsertCopyNodeBetween() {
  const vaildnodesNum = vaildMaxnodes()
  if (vaildnodesNum)
    return
  const currentEdge = currentNode.getOutEdges()[0]
  if (!currentEdge) {
    handleAddNodeAfter()
    return
  }
  const { source, target } = currentEdge.getModel()
  graph.removeItem(currentEdge)
  insertCopyNodeBetween(source, target)
  nodeAddMenuStyle.value.display = 'none'
}

// 删除节点操作
function handleDeleteNode() {
  if (!currentNode)
    return
  nodeAddMenuStyle.value.display = 'none'
  onDeleteNode(currentNode.get('id'))
}

// 删除节点并且通知改变
function onDeleteNode(id: string) {
  nodeAddMenuStyle.value.display = 'none'
  Msgbox.error.m({ title: `是否确认删除选中节点`, content: '删除后，选中节点配置的内容将不会保留', okText: '删除' }).then(async () => {
    deleteNode(id)
    emits('onChangeNode')
    emits('onRemoveNode', [id])
  })
}

// 外部表单调用添加节点
function onAddNode() {
  const edge = graph!.getEdges()[0]
  const model = edge.getModel()
  const { source, target } = model
  graph.removeItem(edge)
  insertNodeBetween(source, target)
}

// 批量删除节点
function handleBatchDeleteNode() {
  contextmenuStyle.value.display = 'none'
  Msgbox.error.m({ title: `是否确认删除选中节点`, content: '删除后，选中节点配置的内容将不会保留', okText: '删除' }).then(async () => {
    selectedNodeIds.value.forEach((nodeId: any) => {
      deleteNode(nodeId)
    })
    emits('onChangeNode')
    emits('onRemoveNode', selectedNodeIds.value)
    selectedNodeIds.value = []
  })
}

// 在节点后添加节点
function handleAddNodeAfter() {
  const source = currentNode.get('id')
  addNodeAfter(source)
  nodeAddMenuStyle.value.display = 'none'
}

// 添加节点
function addNodeAfter(source: string) {
  const newNode = {
    id: `node_${generateRandomString(5)}`,
    text: `未命名节点`,
    size: [computedNodeSize('未命名节点'), styleObj.nodeHeight],
  }
  graph.addItem('node', newNode)
  graph.addItem('edge', {
    source,
    target: newNode.id,
  })

  showNodeBothEdgeAddBtn(newNode.id)
  emitSelectNode(newNode.id)
  graph.layout()
}

// 插入节点
function insertNodeBetween(source: string, target: string) {
  const newNode = {
    id: `node_${generateRandomString(5)}`,
    text: '未命名节点',
    size: [computedNodeSize('未命名节点'), styleObj.nodeHeight],
    data: {},
    restartReasonOptions: flowConf.reasonOptions.find(item => item.name === 'node.restart').options,
    rollbackReasonOptions: flowConf.reasonOptions.find(item => item.name === 'node.rollback').options,
    closeReasonOptions: flowConf.reasonOptions.find(item => item.name === 'node.close').options,
  }
  newNode.data = { ...generateDefaultNodeData(newNode) }
  graph.addItem('node', newNode)
  graph.addItem('edge', {
    source,
    target: newNode.id,
  })
  graph.addItem('edge', {
    source: newNode.id,
    target,
  })
  showNodeBothEdgeAddBtn(newNode.id)
  emitSelectNode(newNode.id)
  emits('onChangeNode')
  requestAnimationFrame(() => {
    showNodeInput(graph.findById(newNode.id))
  })
  graph.layout()
}

// 显示编辑节点名称输入框
function showNodeInput(node: any) {
  const { text, size, x, y, id, data } = node.getModel()
  const zoom = graph.getZoom()
  const rawText = text
  const [width, height] = size
  const point = graph.getCanvasByPoint(x, y)
  // 如果是开始节点或结束节点，则不执行任何操作
  if (id === 'started' || id === 'ended')
    return

  // 创建输入框
  const input = document.createElement('input')
  input.type = 'text'
  input.value = text
  input.className = 'custom-input-type-drop-down-class'
  input.style.width = `${(width - 24) * zoom}px`
  input.style.height = `${(height - 4) * zoom}px`
  input.style.top = `${point.y - (height * zoom) / 2 + (2 * zoom)}px`
  input.style.left = `${point.x - (width * zoom) / 2 + (12 * zoom)}px`
  input.style.fontSize = `${14 * zoom}px`
  input.style.letterSpacing = '0.04em'

  // 绑定输入框失去焦点事件
  input.onblur = () => {
    let value = input.value
    const length = getTextLength(value)
    const isError = !(length >= 2 && length <= 30)
    if (!value) {
      message.warning('节点名称不能为空')
      value = rawText
    }
    else if (isError) {
      message.warning('请输入2 ~ 30个字符')
      value = rawText
    }

    isNodeNameEditing.value = false

    // 更新节点数据
    graph.updateItem(node, {
      text: value,
      size: [computedNodeSize(value), styleObj.nodeHeight],
    })
    emits('onChangeName', data)
    emits('onChangeNode')
    graph.layout()
    // 移除输入框
    document.getElementById('container')!.removeChild(input)
  }

  // 绑定回车键按下事件
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) {
      input.blur()
    }
  })

  document.getElementById('container')!.appendChild(input)
  input.focus()
  isNodeNameEditing.value = true
}

// 插入复制的节点
function insertCopyNodeBetween(source: string, target: string) {
  const copyData = cloneDeep(currentNode.getModel().data)
  const nodeText = `${copyData.name}-副本`
  copyData.name = nodeText
  const newNode = {
    id: `node_${generateRandomString(5)}`,
    text: nodeText,
    size: [computedNodeSize(nodeText), styleObj.nodeHeight],
    data: copyData,
  }
  newNode.data.key = newNode.id
  graph.addItem('node', newNode)
  graph.addItem('edge', {
    source,
    target: newNode.id,
  })
  graph.addItem('edge', {
    source: newNode.id,
    target,
  })
  showNodeBothEdgeAddBtn(newNode.id)
  emits('onChangeNode', source, newNode.id)
  emitSelectNode(newNode.id)
  requestAnimationFrame(() => {
    showNodeInput(graph.findById(newNode.id))
  })
  graph.layout()
}

// 删除节点
function deleteNode(nodeId: string) {
  const node = graph.findById(nodeId)
  const sourceNode = node.getNeighbors('source')[0]?.get('id')
  const targetNode = node.getNeighbors('target')[0]?.get('id')
  graph.removeItem(nodeId)
  if (sourceNode && targetNode)
    graph.addItem('edge', { source: sourceNode, target: targetNode })

  if (targetNode === 'ended' && sourceNode === 'started') {
    graph.layout()
    return
  }

  if (hasNodeWithState('selected')) {
    showNodeBothEdgeAddBtn(hasNodeWithState('selected'))
    graph.layout()
    return
  }

  if (targetNode !== 'ended') {
    showNodeBothEdgeAddBtn(targetNode)
    emitSelectNode(targetNode)
  }
  else if (sourceNode !== 'started') {
    showNodeBothEdgeAddBtn(sourceNode)
    emitSelectNode(sourceNode)
  }
  graph.layout()
}

// 节点是否存在已选中的
function hasNodeWithState(state: string) {
  const allNodes = graph.getNodes()
  for (const node of allNodes) {
    if (node.hasState(state))
      return node.get('id')
  }
  return false
}

// 给当前选中节点的两边的边上显示按钮
function showNodeBothEdgeAddBtn(currentId: string) {
  if (!graph || !currentId)
    return
  graph.getEdges().forEach((edge: Node) => {
    graph.clearItemStates(edge)
  })

  graph.getNodes().forEach((node: any) => {
    const model = node.getModel()
    if (model.id !== currentId)
      graph.setItemState(node, 'selected', false)
  })

  graph.setItemState(currentId, 'selected', true)

  // 找到与点击节点相连的边
  // graph.getEdges().forEach((edge: any) => {
  //   const edgeModel = edge.getModel()
  //   if (edgeModel.source === currentId || edgeModel.target === currentId)
  //     graph.setItemState(edge, 'hover', true)
  //   else
  //     graph.setItemState(edge, 'hover', false)
  // })
}

// 鼠标移入节点时触发
function handleNodeMouseenter(evt: any) {
  const { item } = evt
  const { id } = item.getModel()

  // 如果是开始节点或结束节点，则不执行任何操作
  if (id === 'started' || id === 'ended')
    return
  const hasSelected = item.hasState('selected')
  const hasError = item.hasState('error')
  if (hasError)
    return
  graph.setItemState(item, 'hover', !hasSelected)
}

// 鼠标移出节点时触发
function handleNodeMouseleave(evt: any) {
  const { item } = evt
  graph.setItemState(item, 'hover', false)
}

// 用户在节点上右击鼠标时触发并打开右键菜单
function handleNodeContextmenu(evt: any) {
  evt.preventDefault() // 阻止默认的右键事件
  const { item } = evt
  const { id, x, y, size } = item.getModel()
  const zoom = graph.getZoom()
  const point = graph.getClientByPoint(x, y)

  // 判断当前右键点击的节点是否在已框选的节点范围内
  if (selectedNodeIds.value && selectedNodeIds.value.includes(id)) {
    console.log(`右键点击的节点 ID：${id}，在已框选节点范围内`)
    contextmenuStyle.value.display = 'flex'
    contextmenuStyle.value.left = `${evt.clientX}px`
    contextmenuStyle.value.top = `${evt.clientY}px`
  }
  else {
    console.log(`右键点击的节点 ID：${id}，不在已框选节点范围内`)
    if (id === 'started' || id === 'ended')
      return
    // 记录当前点击的节点，并显示菜单
    currentNode = item
    const [width, height] = size
    // 更新菜单的样式以显示在点击的节点旁边
    nodeAddMenuStyle.value.display = 'flex'
    nodeAddMenuStyle.value.left = `${point.x - width * zoom / 2 + 16 * zoom}px`
    nodeAddMenuStyle.value.top = `${point.y + height * zoom / 2 + 8}px`
  }
}

// 使用了 'brush-select' , 'click-select' 或 'lasso-select' Behavior 且选中元素发生变化时，该事件被触发
function handleNodeselectchange(e: any) {
  if (e.select && e.selectedItems.nodes.length > 0) {
    selectNodeAndEdge.value = e.selectedItems
    selectedNodeIds.value = e.selectedItems.nodes.map((node: any) => node.getID()) // 存储已框选节点的 ID
  }
}

// 鼠标左键单击节点时触发
function handleNodeClick(evt: any) {
  const { item } = evt
  const model = item.getModel()
  // 如果是开始节点或结束节点，则不执行任何操作
  if (model.id === 'started' || model.id === 'ended')
    return
  showNodeBothEdgeAddBtn(model.id)
  // 移除错误状态
  graph.setItemState(model.id, 'error', false)
  if (selectedNode !== item) {
    selectedNode = item // 更新上一次选中的节点
    emits('onSelectNode', model.data) // 触发事件
  }
}

// 鼠标双击左键节点时触发，同时会触发两次 node:click
function handleNodeDbClick(evt: any) {
  const { item } = evt
  showNodeInput(item)
}

// 鼠标左键单击边时触发
function handleEdgeClick(evt: any) {
  const { item } = evt
  const { name } = evt.target.cfg
  if (name !== 'edge-add-circle')
    return

  const vaildnodesNum = vaildMaxnodes()
  if (vaildnodesNum)
    return

  const model = item.getModel()
  const { source, target } = model
  graph.removeItem(item)
  contextmenuStyle.value.display = 'none'
  edgeAddStyle.value.display = 'none'
  selectedNodeIds.value = []
  insertNodeBetween(source, target)
}

// 鼠标移入边上方时触发
function handleEdgeMouseover(evt: any) {
  const { item } = evt
  const { name } = evt.target.cfg
  const zoom = graph.getZoom()
  graph.setItemState(item, 'hover', true)

  edgeAddStyle.value.display = 'none'
  if (name !== 'edge-add-circle')
    return
  const target = evt.target
  const { x, y } = target.attrs
  const point = graph.getClientByPoint(x, y)
  edgeAddStyle.value.display = 'flex'
  // 32 tip宽度 76/2 - 图形的宽度 16/2
  const offsetWidth = 76 / 2 - 16 * zoom / 2
  // 42 tip高度 32 + 间距 10
  edgeAddStyle.value.left = `${(point.x - offsetWidth)}px`
  edgeAddStyle.value.top = `${(point.y - 42)}px`
}

// 鼠标移出边上方时触发
function handleEdgeMouseleave(evt: any) {
  const { item } = evt
  // const edgeModel = item.getModel()
  graph.setItemState(item, 'hover', false)
  // const sourceNode = graph.findById(edgeModel.source)
  // const targetNode = graph.findById(edgeModel.target)
  // 检查源节点或目标节点是否处于 'selected' 状态
  // const sourceSelected = sourceNode.hasState('selected')
  // const targetSelected = targetNode.hasState('selected')
  edgeAddStyle.value.display = 'none'
  // if (selectedNodeIds.value.length > 0) {
  //   if (selectedNode.getModel().id === edgeModel.source || selectedNode.getModel().id === edgeModel.target)
  //     return
  //   graph.setItemState(item, 'hover', false)
  // }

  // 如果相邻的节点包含 'selected' 状态，则不更新边的状态
  // if (sourceSelected || targetSelected)
  //   return
}

// 使用内置交互 create-edge，创建边之后触发
function handleAfterCreateEdge() {
  graph.layout()
}

// 调用 graph.update / graph.updateItem 方法之后触发
function handleAfterUpdateItem(data: any) {
  const model = data.item.getModel()
  model.data.name = model.text
}

// 鼠标左键单击画布时触发
function handleCanvasClick() {
  nodeAddMenuStyle.value.display = 'none'
  contextmenuStyle.value.display = 'none'
  edgeAddStyle.value.display = 'none'
  if (graph.getNodes().length <= 2)
    return
  showNodeBothEdgeAddBtn(selectedNode.getModel().id)
  currentNode = {}
  selectedNodeIds.value = []
}

// 画布右键菜单时触发
function handleCanvasContextmenu(evt: any) {
  evt.preventDefault()
}

// 绑定图表事件
function bindGraphEvents() {
  graph.on('node:mouseenter', handleNodeMouseenter)
  graph.on('node:mouseleave', handleNodeMouseleave)
  graph.on('node:click', handleNodeClick)
  graph.on('node:dblclick', handleNodeDbClick)
  graph.on('node:contextmenu', handleNodeContextmenu)
  graph.on('nodeselectchange', handleNodeselectchange)
  graph.on('edge:click', handleEdgeClick)
  graph.on('edge:mouseover', handleEdgeMouseover)
  graph.on('edge:mouseleave', handleEdgeMouseleave)
  graph.on('canvas:click', handleCanvasClick)
  graph.on('aftercreateedge', handleAfterCreateEdge)
  graph.on('afterupdateitem', handleAfterUpdateItem)
  graph.on('canvas:contextmenu', handleCanvasContextmenu)
}

function vaildMaxnodes() {
  let isVaild = false
  const allNodes = graph.getNodes()
  if (allNodes.length >= maxNodes) {
    message.warning('流程节点已达最大数量')
    isVaild = true
  }
  return isVaild
}

// 初始化图表
function initGraph() {
  const graphWidth = nodeGraphRef.value.clientWidth
  const graphHeight = nodeGraphRef.value.clientHeight
  const graphContainer = document.getElementById('container')!
  graph = new G6.Graph({
    container: graphContainer,
    width: graphWidth,
    height: graphHeight,
    fitCenter: true,
    layout: {
      type: 'dagre',
      rankdir: 'LR',
      nodesep: 14,
      ranksep: 16,
    },
    modes: {
      default: [
        {
          // 拖动框选节点
          type: 'brush-select',
          trigger: 'drag',
          brushStyle: {
            fill: 'rgba(29, 116, 245, 0.12)',
            stroke: 0,
          },
          includeEdges: false,
          // 是否允许对该 behavior 发生。若返回 false，被操作的 item 不会被选中，不触发 'nodeselectchange' 时机事件
          shouldUpdate: (e: any) => {
            // 当点击的节点/边/ combo 的 id 为 'started' 或者 'ended' 时，该 item 不会被选中
            if (['started', 'ended'].includes(e.getModel().id))
              return false
            return true
          },
          onDeselect: () => {
            if (graph.getNodes.length <= 2)
              return
            const prevSelectId = selectedNode.getModel().id
            graph.setItemState(prevSelectId, 'selected', true)
          },
        },
      ],
    },
    defaultNode: {
      type: 'extra-shape-node',
      anchorPoints: [
        [0, 0.5],
        [1, 0.5],
      ],
    },
    defaultEdge: {
      type: 'extra-shape-edge',
      style: {
        ...styleObj.lineStyle.normal,
        lineWidth: 2,
      },
    },
    nodeStateStyles: {
      hover: {
        'lineWidth': 1,
        'stroke': '#0F87FF',
        'fill': '#fff',
        'left-link-point': {
          stroke: '#ffffff',
          fill: '#0F87FF',
        },
        'right-link-point': {
          stroke: '#ffffff',
          fill: '#0F87FF',
        },
      },
      selected: {
        'lineWidth': 2,
        'stroke': '#1d74f5',
        'fill': '#fff',
        'left-link-point': {
          stroke: '#ffffff',
          fill: '#1d74f5',
        },
        'right-link-point': {
          stroke: '#ffffff',
          fill: '#1d74f5',
        },
        'node-add-menu': {
          opacity: 1,
        },
      },
      error: {
        'lineWidth': 2,
        'stroke': '#FD4C4C',
        'fill': '#fff',
        'left-link-point': {
          stroke: '#ffffff',
          fill: '#FD4C4C',
        },
        'right-link-point': {
          stroke: '#ffffff',
          fill: '#FD4C4C',
        },
        'node-add-menu': {
          opacity: 1,
        },
      },
    },
    edgeStateStyles: {
      normal: {
        'stroke': '#e2e3e5',
        'lineWidth': 2,
        'edge-add-circle': {
          opacity: 0,
        },
      },
      hover: {
        'stroke': '#1d74f5',
        'lineWidth': 2,
        'edge-add-circle': {
          opacity: 1,
        },
      },
    },
  })

  // 自定义缩放
  graph.on('wheel', (evt: any) => {
    const { offsetX, offsetY } = evt
    edgeAddStyle.value.display = 'none'
    if (isNodeNameEditing.value)
      return
    if (evt.ctrlKey) {
      evt.preventDefault() // 阻止默认滚动行为
      const zoom = graph.getZoom() // 获取当前缩放比例
      const deltaY = evt.deltaY
      let newZoom = zoom
      if (deltaY < 0) {
        // 向前滚动，放大
        newZoom = zoom * 1.05
      }
      else {
        // 向后滚动，缩小
        newZoom = zoom * 0.95
      }
      // 以画布中心点为中心进行缩放
      graph.zoomTo(newZoom, { x: offsetX, y: offsetY })
    }
    // shift + 滚动
    if (evt.shiftKey) {
      evt.preventDefault()
      const sensitivity = 20 // 调整灵敏度
      if (evt.deltaX < 0) {
        // 向上滚，向左平移
        graph.translate(sensitivity, 0)
      }
      else {
        // 向下滚，向右平移
        graph.translate(-sensitivity, 0)
      }
    }
  })

  // 添加节点和边到图中...

  let isDragging = false
  let startX = 0
  let startY = 0

  const handleMouseDown = (evt: any) => {
    if (isNodeNameEditing.value)
      return
    if (evt.button === 1 || evt.button === 2) {
      // 只处理中键和右键
      isDragging = true
      startX = evt.clientX
      startY = evt.clientY
    }
  }

  const handleMouseMove = (evt: any) => {
    if (isNodeNameEditing.value)
      return
    if (isDragging) {
      const dx = evt.clientX - startX
      const dy = evt.clientY - startY
      graph.translate(dx, dy)
      startX = evt.clientX
      startY = evt.clientY
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false
    }
  }

  graphContainer.addEventListener('mousedown', handleMouseDown)
  document.body!.addEventListener('mousemove', handleMouseMove)
  document.body!.addEventListener('mouseup', handleMouseUp)

  removeMouseEventListener = () => {
    graphContainer.removeEventListener('mousedown', handleMouseDown)
    document.body!.removeEventListener('mousemove', handleMouseMove)
    document.body!.removeEventListener('mouseup', handleMouseUp)
  }

  bindGraphEvents()
  // bindInteractions()
  graph.data(graphData.value)
  graph.changeSize(graphWidth - (styleObj.offsetWidth * 2), graphHeight)
  graph.render()
}

// 修改布局
function changeGraphPosition() {
  // 获取画布容器总宽度和图宽度
  const graphContainerTotalWidth = getGraphContainerTotalWidth()
  const graphWidth = nodeGraphRef.value.clientWidth
  const graphHeight = nodeGraphRef.value.clientHeight // 增加获取画布高度

  // 修改画布缩放为默认
  graph.zoomTo(1)

  // 如果画布容器宽度小于画布宽度，则居中显示
  if (graphContainerTotalWidth < graphWidth) {
    if (!graph)
      return
    graph.fitCenter()
    graph.translate(-styleObj.offsetWidth, 0)
    return
  }

  // 如果没有选中节点，则不进行任何操作
  if (isEmptyObject(selectedNode))
    return

  // 获取选中节点的模型和位置
  const selectNode = selectedNode.getModel()
  const selectNodePos = graph.getCanvasByPoint(selectNode.x, selectNode.y) // 修正为获取画布坐标

  // 计算画布中心点
  const centerPoint = {
    x: graphWidth / 2,
    y: graphHeight / 2,
  }

  // 计算需要移动的距离
  const deltaX = centerPoint.x - selectNodePos.x
  const deltaY = centerPoint.y - selectNodePos.y

  // 移动画布视图，使选中节点居中
  graph.translate(deltaX - styleObj.offsetWidth, deltaY)
}

// 获取画布内容总宽度
function getGraphContainerTotalWidth() {
  const nodes = graph.getNodes()
  let min = Number.POSITIVE_INFINITY
  let max = 0
  nodes.forEach((node: any) => {
    const model = node.getModel()
    min = Math.min(min, model.x - model.size[0] / 2)
    max = Math.max(max, model.x + model.size[0] / 2)
  })
  return max - min + 2
}

// 获取节点数据和节点连接信息
function getNodesAndEdges() {
  // 获取所有连接线
  const getConnections = () => {
    const edges: any = graph.getEdges() // 获取所有边
    const connections = edges.map((edge: any) => {
      const model = edge.getModel()
      return {
        startNode: model.source, // 起始节点的ID
        endNode: model.target, // 目标节点的ID
      }
    })
    return connections
  }

  // 获取所有节点
  const getNodesData = () => {
    const nodes = graph.getNodes() // 获取所有节点
    const nodesData = nodes.map((node: any) => {
      const model = node.getModel()
      return model.data // 假设节点模型中的data是我们需要的数据
    })
    return nodesData
  }

  const nodes = getNodesData() || []
  const edges = getConnections() || []
  return {
    nodes,
    edges,
  }
}

/**
 * 获取面板表单数据
 * @param path 更改的表单类型
 * @param val 更改的值
 * @param key 当前节点 id
 */
function getFormChange(path: string, val: any, key: string) {
  switch (path) {
    case 'name':
      const node = graph.findById(key)
      graph.updateItem(node, {
        text: val,
        size: [computedNodeSize(val), styleObj.nodeHeight],
      })
      graph.layout()
      break
  }
}

// 修改节点状态
function changeNodeItemStatus(nodeIds: string[]) {
  nodeIds.forEach((nodeId: string) => {
    if (selectedNode.getModel().id === nodeId)
      return
    graph.setItemState(nodeId, 'error', true)
  })
}

function changeLoading(statu: boolean) {
  loading.value = statu
}

onClickOutside(nodeDropMenu, () => {
  nodeAddMenuStyle.value.display = 'none'
})

onUnmounted(() => {
  removeMouseEventListener()
})

defineExpose({
  setData,
  getNodesAndEdges,
  getFormChange,
  onAddNode,
  onDeleteNode,
  changeNodeItemStatus,
  changeLoading,
})
</script>

<template>
  <div ref="nodeGraphRef" class="node-graph">
    <div class="node-graph-tool">
      <el-tooltip effect="dark" content="定位到中心节点" placement="right" :offset="9" :hide-after="0">
        <div class="position flex-row-center" @click="changeGraphPosition">
          <svg-icon class="position-icon" size="16" name="node-position" color="#666666" />
        </div>
      </el-tooltip>
    </div>
    <div id="container" class="w-full h-full select-none" />
  </div>
  <!-- 节点右键菜单 -->
  <Teleport to="body">
    <div ref="nodeDropMenu" class="custom-node-add-menu-drop-down" :style="nodeAddMenuStyle">
      <!-- <div class="item" @click="handleAddNodeAfter">
        添加节点
      </div> -->
      <div class="item mb4" @click="handleInsertNodeBetween">
        <img :src="getAssetsFile('node-insert.svg')">插入
      </div>
      <div class="item" @click="handleInsertCopyNodeBetween">
        <svg-icon name="node-edit-copy" size="16" color="#666666" />复制
      </div>
      <div class="line" />
      <div class="item delete-item" @click="handleDeleteNode">
        <svg-icon name="delete-line" size="16" color="#FD4C4C" />删除
      </div>
    </div>
  </Teleport>
  <!-- 批量删除节点 菜单 -->
  <Teleport to="body">
    <div class="custom-node-add-menu-drop-down" :style="contextmenuStyle">
      <div class="item delete-item" @click="handleBatchDeleteNode">
        删除节点（{{ selectedNodeIds.length }}）
      </div>
    </div>
  </Teleport>
  <!-- 边插入节点 tip -->
  <Teleport to="body">
    <div class="custom-edge-add-tooltip" :style="edgeAddStyle">
      插入节点
    </div>
  </Teleport>
</template>

<style lang="scss">
.node-graph {
  width: 100%;
  height: 100%;
  overflow: hidden;
  .node-graph-tool {
    position: absolute;
    left: 24px;
    top: 24px;
    .position {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #ffffff;
      cursor: pointer;
      &:hover {
        .svg-icon {
          use {
            fill: $color-primary;
          }
        }
      }
      &:active {
        .svg-icon {
          use {
            fill: #2361e2;
          }
        }
      }
    }
  }
}

.custom-input-type-drop-down-class {
  border: 0;
  outline: 0;
  position: absolute;
  text-align: center;
  transform: translate(0, 0);
  font-size: 14px;
  z-index: 8000;
  color: #333333;
}

.custom-node-add-menu-drop-down {
  position: absolute;
  display: none;
  min-width: 112px;
  border-radius: 8px;
  flex-direction: column;
  transform: translate(0, 0);
  justify-content: center;
  padding: 8px;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #f7f8fa;
  box-shadow:
    0px 8px 24px 0px rgba(0, 0, 0, 0.06),
    0px 4px 4px 0px rgba(0, 0, 0, 0.02);
  z-index: 9999;
  .item {
    width: 100%;
    height: 32px;
    border-radius: 4px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: start;
    border-radius: 4px;
    padding: 0px 8px;
    gap: 8px;
    color: $color-icon;
    background: #ffffff;
    cursor: pointer;
    &:hover {
      background: rgba(24, 62, 118, 0.03);
    }
    &:active {
      background: rgba(24, 62, 118, 0.06);
    }
    &.delete-item {
      color: #fd4c4c;
      margin-bottom: 0;
    }
  }
  .line {
    width: 100%;
    height: 0px;
    margin-bottom: 3px;
    margin-top: 3px;
    border-top: 1px solid #edeef0;
  }
}

.custom-edge-add-tooltip {
  position: absolute;
  width: 76px;
  display: none;
  height: 32px;
  border-radius: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px 12px;
  background: #393a3a;
  z-index: 9999;
  color: #fff;
  font-size: 12px;
  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 5px solid #393a3a;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
