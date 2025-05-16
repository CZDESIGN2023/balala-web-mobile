import type { Plugin } from 'vite'

export default function moveAssetsToBottom(): Plugin {
  return {
    name: 'move-assets-to-bottom',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html) {
      // 匹配所有 <link> 标签，排除 <link rel="icon"> 标签
      const linkTags = html.match(/<link(?![^>]*rel="icon")[^>]*>/g) || []
      // 匹配所有 <script> 标签
      const scriptTags = html.match(/<script[^>]*type="module"[^>]*><\/script>/g) || []

      // 移除 <head> 中的匹配 <link> 和 <script> 标签
      html = html.replace(/<link(?![^>]*rel="icon")[^>]*>/g, '')
      html = html.replace(/<script[^>]*type="module"[^>]*><\/script>/g, '')

      // 将匹配 <link> 和 <script> 标签插入到 </body> 之前
      const allTags = [...linkTags, ...scriptTags].join('\n')
      html = html.replace('</body>', `${allTags}\n</body>`)

      return html
    },
  }
}
