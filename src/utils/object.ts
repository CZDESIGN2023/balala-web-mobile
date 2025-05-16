// 通过变量路径获取值
export function getValueByPath(obj: object | any[], path: string) {
  const keys = path.split('.')
  function recursive(obj: any, keys: string[]) {
    // 取出第一个键
    const key = keys.shift()
    if (key === undefined)
      return undefined
    // 如果是最后一个键，返回对应的值
    if (keys.length === 0)
      return obj[key]
    return recursive(obj[key], keys)
  }
  return recursive(obj, keys)
}

export function filterObjectByKeys(obj: any, keysToFilter: string[]) {
  // 使用filter方法来过滤对象
  const filtered = Object.keys(obj).filter(key => !keysToFilter.includes(key)).reduce((acc: any, key) => {
    acc[key] = obj[key]
    return acc
  }, {})

  return filtered
}
