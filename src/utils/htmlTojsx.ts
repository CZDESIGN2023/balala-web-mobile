import { type VNode, h } from 'vue'

export function parseToJsx(html: string): VNode | null {
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = html

  if (tempContainer.children.length === 1) {
    return createVNode(tempContainer.firstElementChild!)
  }

  return null
}

function createVNode(element: Element): VNode {
  const tag = element.tagName.toLowerCase()
  const props: { [key: string]: any } = {}
  const children: VNode[] = []

  Array.from(element.attributes).forEach((attr) => {
    props[attr.name] = attr.value
  })

  Array.from(element.childNodes).forEach((childNode: any) => {
    if (childNode.nodeType === Node.TEXT_NODE) {
      children.push(childNode.textContent!)
    }
    else if (childNode.nodeType === Node.ELEMENT_NODE) {
      children.push(createVNode(childNode as Element))
    }
  })

  return h(tag, props, children)
}

// const htmlText = '<p>Hello, <strong>world</strong>!</p>'
// const jsxElement = parseToJsx(htmlText)
