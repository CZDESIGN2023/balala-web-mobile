// 处理li无法删除
export function deleteListItem(editor: any, listItem: any) {
  const list = listItem.parentNode
  const previousListItem = listItem.previousSibling
  const nextListItem = listItem.nextSibling
  if (previousListItem) {
    editor.selection.select(previousListItem)
    editor.selection.collapse(false)
  }
  else if (nextListItem) {
    editor.selection.select(nextListItem)
    editor.selection.collapse(true)
  }
  else {
    editor.selection.select(list)
  }

  // editor.execCommand('RemoveList')
  editor.execCommand('Delete')
}

export function removeContentById(htmlString: string, id: string): string {
  // 创建一个临时的DOM解析器
  const parser = new DOMParser()
  // 将HTML字符串解析为DOM
  const doc = parser.parseFromString(htmlString, 'text/html')

  // 查找具有指定id的元素
  const element = doc.getElementById(id)
  if (element) {
    // 移除整个元素
    element.remove()
  }

  // 将修改后的DOM转换回字符串
  return doc.body.innerHTML
}

// 清空html标签
export function processHtmlContent(html: string): string {
  let result = html.replace(/<img[^>]*>/gi, '[图片]')
  result = result.replace(/&nbsp;/g, ' ')
  result = result.replace(/<[^>]*>/g, '')
  return result
}
