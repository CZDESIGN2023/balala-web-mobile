/**
 * 查找树节点（向该函数提供一个方法，函数会遍历节点给方法，如果方法返回 true, 则找到节点）
 * @param tree string 树数据
 * @param predicate function 判断是否已找到的回调
 * @returns 节点 | null
 */
export function findNode(tree: any[], predicate: (node: any) => boolean): any | null {
  for (const node of tree) {
    if (predicate(node))
      return node

    if (node.children && node.children.length > 0) {
      const childNode = findNode(node.children, predicate)
      if (childNode)
        return childNode
    }
  }
  return null
}

/**
 * 以数组下标获取新排序列表
 * @param resource 数组
 * @returns array
 */
export function getResortList(resource: any[]) {
  const list: { id: string, ranking: number }[] = []
  let ranking = 0
  for (let i = resource.length - 1; i >= 0; i--) {
    list.push({ id: resource[i].id, ranking: ranking += 100 })
  }
  return list
}

export function arrayToObject(arr: any[], key: string, func?: Function) {
  const obj: { [key: string]: any } = {}
  arr.forEach((item: any) => {
    let r = item
    if (func) {
      r = func(item)
    }
    obj[item[key] as string] = r
  })
  return obj
}

/**
 * 根据 连接信息对 nodes 重新排序
 * @param nodes 节点数组
 * @param connections 链接信息数组
 * @returns 除开始、结束节点以为的数组
 */
export function sortNodes(nodes: any[], connections: any[]) {
  // 创建一个映射，用于快速查找节点
  const nodeMap = new Map(nodes.map(node => [node.key, node]))
  // 创建一个映射，存储每个节点的下一个节点
  const nextNodeMap = new Map(connections.map(conn => [conn.startNode, conn.endNode]))
  // 初始化结果数组
  const sortedNodes = []
  // 从 "started" 开始
  let currentKey = 'started'
  // 循环直到到达 "ended"
  while (currentKey !== 'ended') {
    // 找到当前 key 对应的节点
    const currentNode = nodeMap.get(currentKey)
    if (currentNode) {
      // 将当前节点添加到结果数组
      sortedNodes.push(currentNode)
    }

    // 获取下一个节点的 key
    currentKey = nextNodeMap.get(currentKey)

    // 如果没有找到下一个节点，退出循环
    if (!currentKey)
      break
  }

  // 移除第一个节点
  sortedNodes.splice(0, 1)

  return sortedNodes
}

// 它合并两个数组，但将第二个数组的对象放入一个单独的属性中
export function mergeArraysByKeyWithSeparateObject<T1, T2, K extends keyof T1 & keyof T2, R>(
  arr1: T1[],
  arr2: T2[],
  key: K,
  secondArrayKey: string,
): R[] {
  const mergedByKey: { [key: string]: R } = {}
  const order: string[] = [] // 新增一个数组来保持顺序

  // 遍历第一个数组，填充 mergedByKey 对象，并记录顺序
  arr1.forEach((item) => {
    const keyValue = (item[key] as string).toString()
    mergedByKey[keyValue] = { ...item } as unknown as R
    order.push(keyValue) // 将键值添加到顺序数组中
  })

  // 遍历第二个数组，合并对象，并将第二个数组的项放入单独的对象中
  arr2.forEach((item) => {
    const keyValue = (item[key] as string).toString()
    if (!order.includes(keyValue)) {
      order.push(keyValue) // 如果顺序数组中不存在该键值，则添加它
    }
    if (mergedByKey[keyValue]) {
      // 如果存在相同的 key 值，则合并对象，并将第二个数组的项放入单独的对象中
      mergedByKey[keyValue] = {
        ...mergedByKey[keyValue],
        [secondArrayKey]: { ...item },
      } as R
    }
    else {
      // 如果不存在相同的 key 值，则直接添加到 mergedByKey 对象中，并使用新属性名
      mergedByKey[keyValue] = {
        [secondArrayKey]: { ...item },
      } as unknown as R
    }
  })

  // 使用顺序数组来保持原始数组的顺序
  return order.map(keyValue => mergedByKey[keyValue])
}

export function compareUserNickName(a: string, b: string): number {
  function charCodeOrder(char: string): number {
    if (/\d/.test(char))
      return 1 // 数字
    if (/[a-z]/i.test(char)) {
      return 3
    } // 英文
    if (/[\u4E00-\u9FA5]/.test(char))
      return 4 // 中文
    return 2 // 其他字符
  }

  const maxLength = Math.max(a.length, b.length)

  for (let i = 0; i < maxLength; i++) {
    const charA = a[i] || ''
    const charB = b[i] || ''

    const orderA = charCodeOrder(charA)
    const orderB = charCodeOrder(charB)

    if (orderA !== orderB)
      return orderA - orderB

    if (charA !== charB) {
      // 特殊处理英文和中文的比较
      if (orderA === 3 && orderB === 4)
        return 1 // 英文排在中文前面
      if (orderA === 4 && orderB === 3)
        return -1 // 中文排在英文后面

      return charA.localeCompare(charB)
    }
  }

  return 0 // 如果完全相同，则返回0
}
