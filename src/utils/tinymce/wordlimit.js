import { message } from 'ant-design-vue'
tinymce.PluginManager.add('wordlimit', function (editor) {
  var pluginName = '字数限制'
  var app = tinymce.util.Tools.resolve('tinymce.util.Delay')
  var Tools = tinymce.util.Tools.resolve('tinymce.util.Tools')
  var wordlimit_event = editor.getParam(
    'ax_wordlimit_event',
    'SetContent Undo Redo Keyup input paste'
  )
  var options = editor.getParam('wordlimit', {}, 'object')
  // var close = null
  var toast = function (msg) {
    message.error(msg, 2)
    return
  }
  // 默认配置
  var defaults = {
    // max: 0, // 最多可以输入多少字
    spaces: false, // 是否含空格
    isInput: false, // 是否在超出后还可以输入
    maxMessage: '超出最大输入字符数量！',
    changeCallback: () => {}, // 自定义的回调方法
    changeMaxCallback: () => {},
    toast // 提示弹窗
  }

  class WordLimit {
    constructor(editor, options) {
      options = Tools.extend(defaults, options)
      let preCount = 0
      let _wordCount = 0
      let oldContent = editor.getContent()
      let WordCount = editor.plugins.wordcount
      let sumLetter = function (html) {
        var re1 = new RegExp('<.+?>', 'g')
        var txt = html.replace(re1, '')
        txt = txt.replace(/\n/g, '')
        txt = txt.replace(/&nbsp;/g, ' ')
        return {
          txt: txt,
          html
        }
      }
      editor.on(wordlimit_event, function (e) {
        var content = editor.getContent() || e.content || ''
        if (!options.spaces) {
          // 字数
          _wordCount = WordCount.body.getCharacterCount()
        } else {
          // 不含空格字数
          _wordCount = WordCount.body.getCharacterCountWithoutSpaces()
        }
        options.changeCallback({
          ...options,
          editor,
          num: _wordCount,
          content,
          ...sumLetter(content)
        })
        if (_wordCount > options.max) {
          preCount = _wordCount
          // 禁止再输入
          if (options.isInput == !1) {
            // 内容超出还原
            editor.setContent(oldContent)
            // 还原后重新统计
            if (!options.spaces) {
              _wordCount = WordCount.body.getCharacterCount()
            } else {
              _wordCount = WordCount.body.getCharacterCountWithoutSpaces()
            }
          }
          editor.getBody().blur()
          editor.fire('wordlimit', {
            maxCount: options.max,
            wordCount: _wordCount,
            preCount: preCount,
            isPaste: e.type === 'paste' || e.paste || false
          })
          toast(options.maxMessage)
        }
        oldContent = editor.getContent()
      })
    }
  }
  var setup = function () {
    // 如果没设置最大输入限制，则不进行下一步操作
    if (!options && !options.max) return false
    // 如果没有配置字数统计，则不进行下一步，并且提示配置字数统计
    if (!editor.plugins.wordcount)
      return toast('请先在tinymce的plugins配置wordlimit之前加入wordcount插件')
    app.setEditorTimeout(
      editor,
      function () {
        let editDom = editor.getContainer()
        let wordNum = editDom.querySelector('button.tox-statusbar__wordcount')
        if (wordNum.innerText.indexOf('字符') == -1) wordNum.click()
        new WordLimit(editor, options)
      },
      300
    )
  }
  setup()
  return {
    getMetadata: function () {
      return {
        name: pluginName
      }
    }
  }
})
