/**
 * 获取浏览器名称和版本，目前只返回 chrome 和 safari 浏览器
 * @returns object
 */
export function useBrowser() {
  const userAgent = navigator.userAgent.toLowerCase()

  let name = ''
  let version = ''
  if (/version\/[0-9.]/.test(userAgent)) {
    name = 'Safari'
    version = userAgent.match(/version\/([0-9.]+)/)![1]
  }
  else if (/(chrome|chromium|crios)\//.test(userAgent)) {
    name = 'Chrome'
    version = userAgent.match(/chrome\/([0-9.]+)/)![1]
  }

  return { name, version, verNum: Number.parseFloat(version) }
}
