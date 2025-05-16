<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import G6 from '@antv/g6'
import type { G6GraphEvent } from '@antv/g6'
import taskNodeLegend from '@/views/project/task/components/nodeLegend.vue'
import { getNodeTextWidth } from '@/utils'
import edgeAddIcon from '@/assets/svg/flow-add.svg'
import type { Connection, Node } from '@/api/project/types'
import { getStyleByStatus } from '@/enum/NodeStatus'

interface Props {
  nodes: Node[]
  connections: Connection[]
  id: string
  config?: {
    fitCenter: boolean
    nodeHeight: number
    nodePadding: number
    lineWidth: number
    nodeTextSize: number
  }
  select?: boolean
  defaultKey?: string
  statusCircle?: boolean
  restart?: boolean
  restartBy?: any
  scrollBar?: boolean
  legend?: boolean // 显示节点图例
}
const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  connections: () => [],
  id: '',
  config: () => ({
    fitCenter: false,
    nodeHeight: 22,
    nodePadding: 10,
    lineWidth: 1,
    nodeTextSize: 10,
  } || {}),
  select: false, // 节点是否可被选中
  defaultKey: '',
  statusCircle: false,
  restart: false,
  restartBy: () => ({}),
  scrollBar: true,
  legend: false,
})

const emits = defineEmits(['onSelectNode'])

const nodeGraphRef = ref()

// 定义画布
let graph: any
const styleObj = {
  circleStyle: {
    normal: { fill: '#edeef0', stroke: '#ffffff' },
    success: { fill: '#1d74f5', stroke: '#FFFFFF' },
    current: { fill: '#FFFFFF', stroke: '#edeef0' },
  },
  lineStyle: {
    normal: { stroke: '#e3e4e5' },
    success: { stroke: '#1d74f5' },
  },
}

const restartSize = 14
const nodes = ref<Node[]>([])
const edges = ref<Connection[]>([])
const containerRef = ref()
const triggerRef = ref()
// const scrollbarRef = ref()
const tooltipVisible = ref(false)

const graphData = computed(() => {
  return {
    nodes: createNodes(nodes.value),
    edges: createEdges(edges.value),
  }
})
let selectedNode: any = {}
const state = reactive({
  canvasBBox: {} as { minX: number, maxX: number },
  fitCenter: false,
})

function getNodePosition(cfg: any) {
  // 状态点位置
  let statusCricle = 0
  if (props.statusCircle)
    statusCricle = props.config.nodePadding + 5
  // 文字位置：如果有圆点：位置 = 圆点位置+圆点宽度+圆点右编剧；没有 = 节点左边距
  const text = statusCricle ? statusCricle + 11 : props.config.nodePadding // 16 = 状态点宽度 + 右边距
  // 重启位置 = 文字位置 + 文字宽度 + 文字右边距
  const textWidth = getNodeTextWidth(cfg.text, props.config.nodeTextSize)
  let restart = 0
  if (cfg.id === 'started' && props.restart)
    restart = text + textWidth + 6
  // 延期宽度
  // 已完成：是否延期 = 完成时间 > 排期时间
  // 当前节点：是否延期 = 当前时间 > 排期时间
  let delay = 0
  if (cfg.data.$isDelay === true) {
    // 重启
    if (restart)
      delay = restart + restartSize + 6
    else
      delay = text + textWidth + 6
  }
  const r = {
    width: 0,
    statusCricle,
    text,
    restart,
    delay,
  }
  // 节点宽度
  if (r.delay)
    r.width = r.delay + 36 // 36: 延期自身宽度
  else if (r.restart)
    r.width = r.restart + restartSize // 14: 重启自身宽度
  else
    r.width = r.text + textWidth
  r.width += props.config.nodePadding
  return r
}

// 创建节点
function createNodes(nodes: any[]) {
  return nodes.map(node => ({
    id: node.key,
    text: node.name,
    size: [getNodePosition({ text: node.name, id: node.key, data: node }).width, props.config.nodeHeight],
    data: node || {},
  }))
}

// 创建边
function createEdges(edges: any[]) {
  return edges.map((item: any) => ({
    source: item.startNode,
    target: item.endNode,
  }))
}

function registerG6() {
// 自定义边
  G6.registerEdge(
    'panel-edge',
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

  // 自定义节点
  G6.registerNode(
    'panel-node',
    {
      draw(cfg: any, group: any) {
        const nodePosition = getNodePosition(cfg)
        const shape = group.addShape('rect', {
          attrs: {
            x: -nodePosition.width / 2,
            y: -props.config.nodeHeight / 2,
            width: nodePosition.width,
            height: props.config.nodeHeight,
            stroke: '#EDEEF0',
            fill: '#FFFFFF',
            radius: props.config.nodeHeight / 2,
            cursor: cfg.id === 'started' || cfg.id === 'ended' ? 'not-allowed' : 'pointer',
          },
          name: 'rect-box',
          draggable: false,
        })

        // 状态点
        if (props.statusCircle) {
          group.addShape('circle', {
            attrs: {
              x: nodePosition.statusCricle - nodePosition.width / 2,
              y: 0,
              r: 5.5,
              fill: getStyleByStatus(cfg.data.$flowNodeStatus).color,
              stroke: '#FFFFFF',
              lineWidth: 1,
              cursor: 'pointer',
            },
          })
        }

        group.addShape('text', {
          attrs: {
            x: nodePosition.text - nodePosition.width / 2,
            textAlign: 'left',
            text: cfg.text,
            fontSize: props.config.nodeTextSize,
            cursor: cfg.id === 'started' || cfg.id === 'ended' ? 'not-allowed' : 'pointer',
            textBaseline: 'middle',
            lineHeight: props.config.nodeHeight,
            fill: '#333',
          },
          name: 'title',
        })

        // 重启图标
        if (nodePosition.restart) {
          group.addShape('image', {
            attrs: {
              x: nodePosition.restart - nodePosition.width / 2,
              y: -7,
              img: '/svg/node-restart.svg',
            },
            name: 'restart',
          })
        }

        // 延期
        if (nodePosition.delay) {
          group.addShape('rect', {
            attrs: {
              x: nodePosition.delay - nodePosition.width / 2,
              y: -10,
              width: 36,
              height: 20,
              radius: [4],
              fill: '#ffd4d1',
            },
            // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
            name: 'restart-bg',
          })

          group.addShape('text', {
            attrs: {
              x: nodePosition.delay + 5.4 - nodePosition.width / 2,
              textAlign: 'start',
              text: '延期',
              fontSize: 12,
              cursor: cfg.id === 'started' || cfg.id === 'ended' ? 'not-allowed' : 'pointer',
              textBaseline: 'middle',
              lineHeight: props.config.nodeHeight,
              fill: '#333',
            },
            name: 'delay',
          })
        }

        // 左边链接点
        if (cfg.id !== 'started') {
          group.addShape('circle', {
            attrs: {
              x: -shape.attr('width') / 2 + 0.5,
              y: 0,
              r: 2.5,
              ...styleObj.circleStyle.normal,
              lineWidth: 1,
              cursor: 'pointer',
            },
            name: 'left-link-point',
          })
        }

        if (cfg.id !== 'ended') {
        // 右边链接点
          group.addShape('circle', {
            attrs: {
              x: shape.attr('width') / 2 - 0.5,
              y: 0,
              r: 2.5,
              ...styleObj.circleStyle.normal,
              lineWidth: 1,
              cursor: 'pointer',
            },
            name: 'right-link-point',
          })
        }

        return shape
      },
      // ... 其他自定义节点配置
      update: undefined,
    },
    'single-node',
  )
}

// 获取数据
function setData() {
  nodes.value = props.nodes
  edges.value = props.connections
  requestAnimationFrame(() => {
    initGraph()
    if (props.defaultKey)
      emitSelectNode(props.defaultKey)
  })
}

// 初始化图表
function initGraph() {
  if (!nodeGraphRef.value)
    return
  const graphWidth = nodeGraphRef.value.clientWidth
  const graphHeight = nodeGraphRef.value.clientHeight
  graph = new G6.Graph({
    container: document.getElementById(`container${props.id}`)!,
    width: graphWidth,
    height: graphHeight,
    fitCenter: props.config.fitCenter,
    modes: {
      default: [
        {
          type: 'drag-canvas',
          direction: 'x',
          allowDragOnItem: true,
        },
      ],
    },
    layout: {
      type: 'dagre',
      rankdir: 'LR',
      nodesep: graphHeight / 2 - 11,
      ranksep: props.config.nodeHeight / 2 - 0.5,
    },
    defaultNode: {
      type: 'panel-node',
      anchorPoints: [
        [0, 0.5],
        [1, 0.5],
      ],
    },
    defaultEdge: {
      type: 'panel-edge',
      style: {
        ...styleObj.lineStyle.normal,
        lineWidth: props.config.lineWidth,
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
    },
  })
  bindGraphEvents()
  graph.data(graphData.value)
  graph.render()
}

// 触发节点点击事件
function emitSelectNode(nodeId: string) {
  const node = graph.findById(nodeId)
  graph.emit('node:click', {
    item: node,
    target: node.getKeyShape(),
  })
}

// 绑定图表事件
function bindGraphEvents() {
  if (props.select) {
    graph.on('node:mouseenter', handleNodeMouseenter)
    graph.on('node:mouseleave', handleNodeMouseleave)
    graph.on('touchend', handleNodeClick)
  }
  if (props.restart)
    graph.on('mousemove', handleRestartMousemove)
  if (props.scrollBar)
    graph.on('afterlayout', handleAfterlayout)
  // 自定义缩放
  // graph.on('wheel', (evt: any) => {
  //   if (evt.shiftKey) {
  //     evt.preventDefault()
  //     const sensitivity = 20 // 调整灵敏度
  //     console.log(scrollbarRef.value)
  //     window.aa = scrollbarRef.value
  //     if (evt.deltaX < 0) {
  //       let newSensitivity = sensitivity
  //       const scrollWidth = -sensitivity + scrollbarRef.value.wrapRef.scrollLeft
  //       if (scrollWidth < 0) {
  //         newSensitivity = sensitivity + scrollWidth
  //       }
  //       // 向上滚，向左平移
  //       graph.translate(-newSensitivity, 0)
  //       scrollbarRef.value.setScrollLeft(-newSensitivity + scrollbarRef.value.wrapRef.scrollLeft)
  //     }
  //     else {
  //       console.log(sensitivity + scrollbarRef.value.wrapRef.scrollLeft)
  //       console.log(scrollbarRef.value.wrapRef.scrollWidth)
  //       // 向下滚，向右平移
  //       graph.translate(sensitivity, 0)
  //       scrollbarRef.value.setScrollLeft(sensitivity + scrollbarRef.value.wrapRef.scrollLeft)
  //     }
  //   }
  // })
}

// 鼠标左键单击节点时触发
function handleNodeClick(evt: any) {
  const { item } = evt
  const model = item.getModel()

  // 如果是开始节点或结束节点，则不执行任何操作
  if (model.id === 'started' || model.id === 'ended')
    return
  showNodeBothEdgeAddBtn(model.id)

  if (selectedNode !== item) {
    selectedNode = item // 更新上一次选中的节点
    emits('onSelectNode', model.data) // 触发事件
  }
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
  graph.setItemState(item, 'hover', !hasSelected)
}

// 鼠标移出节点时触发
function handleNodeMouseleave(evt: any) {
  const { item } = evt
  graph.setItemState(item, 'hover', false)
}

// 判断居中或左对齐
function handleAfterlayout() {
  // canvas 宽度
  const { cfg } = graph.get('canvas')

  // 渲染宽度
  const group = graph.get('group')
  const box = group.getCanvasBBox()
  state.canvasBBox = box

  if (cfg.width > box.width) {
    graph.fitCenter()
    state.fitCenter = true
  }
}

// function onScroll({ scrollLeft }: { scrollLeft: number }) {
//   const group = graph.get('group')
//   const box = group.getCanvasBBox()
//   graph.moveTo(-scrollLeft + state.canvasBBox.minX, box.y)
// }

function handleRestartMousemove(e: G6GraphEvent) {
  if (e.target.cfg?.name === 'restart') {
    const position = containerRef.value.getBoundingClientRect()
    const x = e.target.cfg.canvasBBox.x + position.x + restartSize / 2
    const y = e.target.cfg.canvasBBox.y + position.y + restartSize / 2 - 7 // 向上偏移量7像素
    triggerRef.value = { getBoundingClientRect: () => ({ width: 0, height: 0, top: y, right: x, bottom: y, left: x }) }
    tooltipVisible.value = true
  }
  else {
    tooltipVisible.value = false
  }
}

function selectNodes(keys: string[]) {
  graph.getNodes().forEach((node: any) => {
    graph.setItemState(node, 'selected', false)
  })

  keys.forEach((item) => {
    graph.setItemState(item, 'selected', true)
  })
}

// 根据角色key高亮选中节点
function selectNodesByRole(roleKey: string) {
  const nodeKeys: string[] = []
  graph.getNodes().forEach((node: any) => {
    try {
      const nodeRoleKey = node._cfg.model.data.owner.ownerRole[0].key
      if (nodeRoleKey === roleKey) {
        nodeKeys.push(node._cfg.id)
      }
    }
    catch (e) {
      console.log('可能未找到')
    }
  })
  selectNodes(nodeKeys)
}

function refresh() {
  registerG6()
  if (!graph)
    return
  nodes.value = props.nodes
  edges.value = props.connections
  graph.clear()
  graph.changeData(graphData.value)
  graph.render()
  if (props.defaultKey)
    emitSelectNode(props.defaultKey)
}

onMounted(() => {
  registerG6()
  setData()
})

defineExpose({ selectNodes, selectNodesByRole, setData, refresh })
</script>

<template>
  <div ref="nodeGraphRef" class="node-graph w-full h-full relative overflow-hidden">
    <task-node-legend v-if="props.legend" />
    <!-- <el-tooltip
      v-model:visible="tooltipVisible"
      :virtual-ref="triggerRef"
      :content="`${restartBy?.userNickname}<span style='color: rgba(255, 255, 255, 0.55)'>(${restartBy?.userName})</span>重启了该任务`"
      virtual-triggering
      placement="top"
      raw-content
    /> -->
    <!-- <el-scrollbar ref="scrollbarRef" @scroll="onScroll"> -->
    <div :id="`container${props.id}`" ref="containerRef" class=" absolute top-0 left-0 w-full h-full" />
    <!-- <div :style="{ width: state.fitCenter ? '0' : `${state.canvasBBox.maxX + state.canvasBBox.minX}px`, height: '1px' }" /> -->
    <!-- </el-scrollbar> -->
  </div>
</template>

<style lang="scss" scoped>
.node-graph {
  :deep(.el-scrollbar) {
    .el-scrollbar__wrap {
      scroll-behavior: initial;
    }
    .el-scrollbar__bar.is-horizontal {
      opacity: 1;
    }
  }
}
</style>
