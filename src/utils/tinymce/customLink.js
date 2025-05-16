tinymce.PluginManager.add('customLink', function (editor, url) {
  // 添加一个按钮到 TinyMCE 的工具栏
  editor.ui.registry.addButton('customLink', {
    icon: 'link',
    onAction: function () {
      setTimeout(function () {
        editor.focus()
      }, 0)
      // 显示自定义弹窗
      showCustomDialog(editor)
    }
  })

  // 显示自定义弹窗的函数
  function showCustomDialog(editor) {
    const nowDialgo = document.getElementById('my-custom-dialog')
    if (nowDialgo) {
      document.body.removeChild(nowDialgo)
    }
    // 创建弹窗的 HTML 结构
    var dialog = document.createElement('div')
    dialog.id = 'my-custom-dialog'
    dialog.innerHTML = `
        <div id="linkDialog" title="插入链接">  
          <p>  
            <label for="linkText">链接文本:</label>  
            <input type="text" id="linkText" name="linkText">  
          </p>  
          <p>  
            <label for="linkUrl">链接地址:</label>  
            <input type="text" id="linkUrl" name="linkUrl">  
          </p>  
        </div>
      `
    dialog.style.position = 'absolute'
    dialog.style.zIndex = '10000' // 确保弹窗在编辑器内容之上
    dialog.style.padding = '10px'
    dialog.style.backgroundColor = 'white'
    dialog.style.border = '1px solid #ccc'
    dialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)'

    // 将弹窗添加到页面中
    var node = editor.selection.getNode() // 获取选中的节点
    if (node) {
      // 获取编辑器的 iframe 元素
      var iframe = editor.getContentAreaContainer().firstChild
      // 获取 iframe 的内容文档
      var contentDocument = iframe.contentDocument || iframe.contentWindow.document
      // 获取元素相对于 iframe 视口的位置
      var rect = node.getBoundingClientRect()
      // 获取 iframe 相对于浏览器视口的位置
      var iframeRect = iframe.getBoundingClientRect()
      // 计算元素相对于浏览器视口的位置
      var absX = rect.left + iframeRect.left
      var absY = rect.top + iframeRect.top

      // 考虑页面滚动
      absX += window.pageXOffset
      absY += window.pageYOffset

      console.log('Absolute X:', absX)
      console.log('Absolute Y:', absY)

      dialog.style.top = absY + 'px'
      dialog.style.left = absX + 'px'
      setTimeout(() => {
        document.body.appendChild(dialog)
      })
    }
    // 监听点击编辑器或其他地方来关闭弹窗
    document.addEventListener('click', function (e) {
      if (e.target !== dialog && !dialog.contains(e.target)) {
        document.body.removeChild(dialog)
      }
    })

    // 阻止编辑器失去焦点时关闭弹窗（可选）
    editor.on('Blur', function (e) {
      e.preventDefault()
      document.body.removeChild(dialog)
    })
  }

  return {
    name: 'customLink'
  }
})
