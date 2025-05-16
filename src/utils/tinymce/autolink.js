/**
 * TinyMCE version 6.7.2 (2023-10-25)
 */
;(function () {
  'use strict'

  const global$1 = tinymce.util.Tools.resolve('tinymce.PluginManager')
  const global = tinymce.util.Tools.resolve('tinymce.dom.TextSeeker')
  const link = () =>
    /(?:[A-Za-z][A-Za-z\d.+-]{0,14}:\/\/(?:[-.~*+=!&;:'%@?^${}(),\w]+@)?|www\.|[-;:&=+$,.\w]+@)[A-Za-z\d-]+(?:\.[A-Za-z\d-]+)*(?::\d+)?(?:\/(?:[-.~*+=!;:'%@$(),/\w]*[-~*+=%@$()/\w])?)?(?:\?[-.~*+=!&;:'%@?^${}(),/\w]+)?(?:#[-.~*+=!&;:'%@?^${}(),/\w]+)?/g
  const option = name => editor => editor.options.get(name)
  const register = (editor) => {
    const registerOption = editor.options.register
    registerOption('autolink_pattern', {
      processor: 'regexp',
      default: new RegExp(`^${link().source}$`, 'i'),
    })
    registerOption('link_default_target', { processor: 'string' })
    registerOption('link_default_protocol', {
      processor: 'string',
      default: 'https',
    })
  }
  const getAutoLinkPattern = option('autolink_pattern')
  const getDefaultLinkProtocol = option('link_default_protocol')
  const eq = t => a => t === a
  const isUndefined = eq(undefined)
  const isNullable = a => a === null || a === undefined
  const isNonNullable = a => !isNullable(a)
  // const not = (f) => (t) => !f(t);
  const hasOwnProperty = Object.hasOwnProperty
  const has = (obj, key) => hasOwnProperty.call(obj, key)
  const checkRange = (str, substr, start) =>
    substr === ''
    || (str.length >= substr.length && str.substr(start, start + substr.length) === substr)
  const contains = (str, substr, start = 0, end) => {
    const idx = str.indexOf(substr, start)
    if (idx !== -1)
      return isUndefined(end) ? true : idx + substr.length <= end
    else
      return false
  }
  const startsWith = (str, prefix) => checkRange(str, prefix, 0)
  const zeroWidth = '\uFEFF'
  const isZwsp = char => char === zeroWidth
  const removeZwsp = s => s.replace(/\uFEFF/g, '')
  const isTextNode = node => node.nodeType === 3
  const isElement = node => node.nodeType === 1
  const isBracketOrSpace = char => /^[([{ \u00A0]$/.test(char)
  const hasProtocol = url => /^([A-Za-z][A-Za-z\d.+-]*:\/\/)|mailto:/.test(url)
  // const isPunctuation = (char) => /[?!,.;:]/.test(char)
  const findChar = (text, index, predicate) => {
    for (let i = index - 1; i >= 0; i--) {
      const char = text.charAt(i)
      if (!isZwsp(char) && predicate(char))
        return i
    }
    return -1
  }
  const freefallRtl = (container, offset) => {
    let tempNode = container
    let tempOffset = offset
    while (isElement(tempNode) && tempNode.childNodes[tempOffset]) {
      tempNode = tempNode.childNodes[tempOffset]
      tempOffset = isTextNode(tempNode) ? tempNode.data.length : tempNode.childNodes.length
    }
    return {
      container: tempNode,
      offset: tempOffset,
    }
  }

  const parseCurrentLine = (editor) => {
    // let _a;
    const voidElements = editor.schema.getVoidElements()
    const autoLinkPattern = getAutoLinkPattern(editor)
    const { dom, selection } = editor
    if (dom.getParent(selection.getNode(), 'a[href]') !== null)
      return null

    const rng = selection.getRng()
    const textSeeker = global(dom, (node) => {
      return (
        dom.isBlock(node)
        || has(voidElements, node.nodeName.toLowerCase())
        || dom.getContentEditable(node) === 'false'
      )
    })
    const { container: endContainer, offset: endOffset } = freefallRtl(
      rng.endContainer,
      rng.endOffset,
    )
    // const root = (_a = dom.getParent(endContainer, dom.isBlock)) !== null && _a !== void 0 ? _a : dom.getRoot();

    const endSpot = textSeeker.backwards(endContainer, endOffset, (node, offset) => {
      // const text = node.data
      // const idx = findChar(text, offset, not(isBracketOrSpace))
      // return idx === -1 || isPunctuation(text[idx]) ? idx : idx + 1
      return offset
    })
    if (!endSpot)
      return null

    let lastTextNode = endSpot.container

    const startSpot = textSeeker.backwards(endSpot.container, endSpot.offset, (node, offset) => {
      lastTextNode = node
      const idx = findChar(node.data, offset, isBracketOrSpace)
      return idx === -1 ? idx : idx + 1
    })
    const newRng = dom.createRng()

    if (!startSpot)
      newRng.setStart(lastTextNode, 0)
    else
      newRng.setStart(startSpot.container, startSpot.offset)

    newRng.setEnd(endSpot.container, endSpot.offset)

    const matches = removeZwsp(newRng.toString()).match(autoLinkPattern)

    if (matches) {
      let url = matches[0]

      if (startsWith(url, 'www.') || startsWith(url, 'WWW.')) {
        url = `${getDefaultLinkProtocol(editor)}://${url}`
      }
      else if (contains(url, '@') && !hasProtocol(url)) {
        // url = 'mailto:' + url
        return
      }

      return {
        rng: newRng,
        url,
      }
    }
    else {
      return null
    }
  }

  const convertToLink = (editor, result) => {
    const { selection } = editor
    const bookmark = selection.getBookmark()
    selection.setRng(result.rng)
    const command = 'createlink'
    if (
      !editor
        .dispatch('BeforeExecCommand', {
          command,
          ui: false,
          value: result.url,
        })
        .isDefaultPrevented()
    )
      editor.getDoc().execCommand(command, false, result.url)

    selection.moveToBookmark(bookmark)
  }

  const handlerAny = (editor) => {
    const result = parseCurrentLine(editor)
    isNonNullable(result) && convertToLink(editor, result)
  }

  const setup = (editor) => {
    // 键盘事件 键被完全释放
    editor.on('keyup', (e) => {
      if (e.isComposing)
        return
      if (!e.isDefaultPrevented())
        handlerAny(editor)
    })

    // 获取粘贴内容，生成链接插入到编辑器内
    editor.on('paste', (e) => {
      const pastedText = (e.originalEvent || e).clipboardData.getData('text/plain')
      const cReg = /((https?:\/\/|www\.)[^\s\u4E00-\u9FA5]+)/g
      if (pastedText.match(cReg)) {
        e.preventDefault()
        const cRes = pastedText.replace(cReg, (match, url) => {
          const link = url.startsWith('www') ? `https://${url}` : url

          return `<a href="${link}" target="_blank" style="color: #1d74f5;">${url}</a>`
        })
        editor.execCommand('mceInsertContent', false, cRes)
      }
    })
  }

  global$1.add('balaba_autolink', (editor) => {
    register(editor)
    setup(editor)
  })
})()
