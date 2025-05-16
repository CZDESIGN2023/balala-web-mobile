export enum NodeStatus {
  UNSTARTED = 1,
  INPROGRESS = 2,
  COMPLETED = 3,
  TERMINATED = -1, // 仅前端使用
}

export const StatusStyle = {
  completed: {
    label: '已完成',
    type: 'circle',
    color: '#08c479',
  },
  progressing: {
    label: '进行中',
    type: 'circle',
    color: '#ffa723',
  },
  unstarted: {
    label: '未开始',
    type: 'circle',
    color: '#d3deef',
  },
  terminated: {
    label: '已终止',
    type: 'circle',
    color: '#bfbfbf',
  },
  retarted: {
    label: '任务重启',
    type: 'icon',
    color: '#999999',
  },
  delay: {
    label: '延期节点',
    type: 'div',
    color: '#FFD4D1',
  },
}

export function getStyleByStatus(status: NodeStatus) {
  switch (status) {
    case NodeStatus.UNSTARTED:
      return StatusStyle.unstarted
    case NodeStatus.INPROGRESS:
      return StatusStyle.progressing
    case NodeStatus.COMPLETED:
      return StatusStyle.completed
    case NodeStatus.TERMINATED:
      return StatusStyle.terminated
  }
}
