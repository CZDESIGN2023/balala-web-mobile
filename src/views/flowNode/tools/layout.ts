// /* eslint-disable ts/no-this-alias */
// import dagre from '@dagrejs/dagre'

// export const dagreLayout = {
//   // 默认参数
//   getDefaultCfg() {
//     return {
//       rankdir: 'LR',
//       ranksep: 100,
//     }
//   },
//   // 执行布局
//   execute() {
//     const self: any = this

//     const nodes = self.nodes
//     const edges = self.edges

//     const layoutNodes = nodes.map((node: any) => {
//       return {
//         id: node.id,
//         x: node.x,
//         y: node.y,
//         width: node.size[0],
//         height: node.size[1],
//       }
//     })

//     // Create a new directed graph
//     const g = new dagre.graphlib.Graph()

//     // Set an object for the graph label
//     g.setGraph({
//       rankdir: self.rankdir,
//       ranksep: self.ranksep,

//       nodesep: self.nodesep,
//       edgesep: self.edgesep,

//       marginx: self.marginx,
//       marginy: self.marginy,
//     })

//     g.setDefaultEdgeLabel(() => { return {} })

//     layoutNodes.forEach((node: any) => {
//       g.setNode(node.id, node)
//     })

//     edges.forEach((edge: any) => {
//       g.setEdge(edge.source, edge.target)
//     })

//     dagre.layout(g)

//     nodes.forEach((node: any, index: number) => {
//       const n = layoutNodes[index]
//       node.x = n.x - n.width / 2
//       node.y = n.y - n.height / 2
//     })
//   },
// }
