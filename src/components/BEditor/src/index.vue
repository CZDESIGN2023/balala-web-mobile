<script setup lang="ts">
// 接下来定义编辑器所需要的插件数据
import { computed, h, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ElTooltip, ClickOutside as vClickOutside } from 'element-plus'
import { offset, position } from 'caret-pos'
import Editor from '@tinymce/tinymce-vue'
import tinymce from 'tinymce/tinymce'
import { deleteListItem, processHtmlContent, removeContentById } from '../utils'
import { getMemberListById, projectFileUpload } from '@/api/project'
import { deepCopy, getConfigDomain, getFileNameFromUrl } from '@/utils'
import { useUserStore } from '@/stores/modules/user'
import { EditorToolTipEnum } from '@/enum/editEnum'
import type { CommentItem } from '@/api/interface'

// 引入所需的主题和组件
import 'tinymce/skins/content/default/content.css'
import 'tinymce/themes/silver'
import 'tinymce/themes/silver/theme'
import 'tinymce/models/dom' // 这里是个坑 一定要引入
import 'tinymce/plugins/link' // 自动链接
import 'tinymce/icons/default' // 引入编辑器图标icon，不引入则不显示对应图标
import 'tinymce/icons/default/icons'
import 'tinymce/plugins/image' // 插入上传图片插件
import 'tinymce/plugins/media' // 插入视频插件
import 'tinymce/plugins/table' // 插入表格插件
import 'tinymce/plugins/lists' // 列表插件
import 'tinymce/plugins/code' // 源码
import 'tinymce/plugins/fullscreen' // 全屏
import 'tinymce/plugins/autoresize' // 自动高度
import '@/utils/tinymce/formatPainter'
import '@/utils/tinymce/customIcons.js'
import '@/utils/tinymce/customLink.js'
import '@/utils/tinymce/autolink'

defineOptions({ name: 'BEditor' })

// 传递的参数
const props = defineProps({
  // 内容
  value: {
    type: String,
    default: () => {
      return ''
    },
  },
  // 请求地址
  baseUrl: {
    type: String,
    default: '',
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false,
  },
  // 页面来源
  type: {
    type: String,
    default: '',
  },
  // 最小高度
  minHeight: {
    type: Number,
    default: 0,
  },
  // 最大高度
  maxHeight: {
    type: Number,
    default: 0,
  },
  // 插件
  plugins: {
    type: [String, Array],
    default: () => ['autoresize', 'table', 'image', 'formatpainter', 'link', 'lists', 'customLink', 'balaba_autolink'],
  },
  placeholder: {
    type: String,
    default: '',
  },
  readContent: {
    type: String,
    default: '',
  },
  // 工具栏
  toolbar: {
    type: [String, Array],
    default: 'undo redo formatpainter | customHeadingButton forecolor backcolor bold italic underline strikethrough | customAlignButtom bullist numlist | hr indent outdent',
  },
  spaceId: {
    type: String,
    default: '',
  },
  mode: {
    type: String,
    default: '',
  },
  modeKey: {
    type: String,
    default: '',
  },
  commentStyle: {
    type: String,
    default: '',
  },
  isFootBtn: {
    type: Boolean,
    default: false,
  },
  // 按钮标题
  btnTitle: {
    type: String,
    default: '发布评论',
  },
  // 模板
  template: {
    type: String,
    default: '',
  },
  resize: {
    type: Boolean,
    default: true,
  },
})

// 事件
const emits = defineEmits(['getContent', 'editorFocus', 'editorBlur', 'changeMode'])

interface UserParam {
  value: string
  avatar: string
  label: string
  username: string
  pinyin: string
}

const view = inject('view', false)
const { userInfo } = useUserStore()
const tooltipRef = ref()
const tooltipMsg = ref('')
// 用于接收外部传递进来的富文本
const editorRef = ref()
const editorboxRef = ref()
const mentionRef = ref()
const focusInputRef = ref<boolean>(false)
const editorValue = ref(props.value)
// 图片预览地址
const previewImage = ref('')
// 是否显示图片预览
const visible = ref<boolean>(false)
// 图片预览标题
const previewTitle = ref('')
// 是否只读模式
const readonlyMode = ref<boolean>(true)
// 是否显示@人员选择框
const isShowAt = ref<boolean>(false)
// 用户列表
const userList = ref<UserParam[]>([])
// 当前@的人
const atUser = ref<UserParam>()
const sendLoading = ref<boolean>(false)
const currentPos = ref<Range>()
let richEditor: any = null
let judegMenuClick = false
let preAtText = ''
let prevLastAtIndex = -1
const alignStateMap = {
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
}
const fontStateMap = {
  H: false,
  H1: false,
  H2: false,
  H3: false,
  H4: false,
  H5: false,
}
// 展示富文本变
const editorShow = computed(() => {
  return (!readonlyMode.value || props.mode === 'focusMode')
})

const calcReadClass = computed(() => {
  const { mode, commentStyle } = props
  const classNames = ['read-only-normal']
  // 评论
  if (mode === 'comment') {
    if (commentStyle === 'short')
      classNames.push('read-only-comment-short')
    if (commentStyle === 'long')
      classNames.push('read-only-comment-long')
  }

  // 概览, 问题描述-编辑 交付备注-编辑
  const includeModes = ['introMode', 'task-desc-edit', 'task-remarks-edit']
  if (includeModes.some(includeMode => mode.includes(includeMode)))
    classNames.push('read-only-none')

  if (mode.includes('task-remarks-edit'))
    classNames.push('task-remarks-edit')

  if (mode === 'introMode')
    classNames.push('read-only-border')

  return classNames
})
const calcEditorValue = computed(() => {
  return editorValue.value ? 'editor-has-value' : ''
})
const calcReadStyle = computed(() => {
  return {
    minHeight: `${props.mode === 'comment' ? 32 : props.minHeight}px`,
    cursor: props.readonly ? 'not-allowed' : '',
  }
})
// 更新自定义菜单样式
function updateItemActive(obj: any, key: string) {
  for (const i in obj) {
    if (key === i)
      obj[i] = true
    else
      obj[i] = false
  }
}

function dealOutdent(editor: any) {
  const range = editor.selection.getRng()
  const startContainer = range.startContainer
  const parentNode = startContainer.parentNode
  if (parentNode && (parentNode.nodeName === 'UL' || parentNode.nodeName === 'OL')) {
    if (range.startOffset === 0 && range.endOffset === 0) {
      const ulCount = countUlElements(parentNode)
      const listItems = parentNode.querySelectorAll('li')
      if (!(listItems.length === 1 && ulCount === 1)) {
        for (let i = 0; i < ulCount; i++)
          editor.execCommand('Outdent')

        editor.execCommand('InsertParagraph')
      }
    }
  }
}

function handleMouseover(event: any) {
  if (!event.target)
    return

  const targetElement = event.target as HTMLElement
  if (!(targetElement instanceof Element))
    return

  let currentElement: HTMLElement | null = targetElement
  while (currentElement) {
    const name = currentElement.getAttribute('data-mce-name') || ''
    const toolTip = getToolTipByKey(name) || ''
    if (toolTip) {
      // 假设 tooltipRef 和 tooltipMsg 是你需要设置的变量
      tooltipRef.value = currentElement
      tooltipMsg.value = toolTip
      break
    }
    // 继续向上查找父元素
    currentElement = currentElement.parentElement
  }
}
function getToolTipByKey(key: string): string | undefined {
  return EditorToolTipEnum[key as keyof typeof EditorToolTipEnum]
}
function initEditorToolTip() {
  const editorDom = document.querySelectorAll('.editor-box')
  if (!editorDom)
    return
  editorDom.forEach((ele) => {
    ele.addEventListener('mouseover', handleMouseover)
  })
}
// 遍历计算ul列表层级
function countUlElements(node: any) {
  let ulCount = 1
  let parentNode = node.parentNode
  // 逐级向上检查父节点，直到找到最外层的 UL 元素为止
  while (parentNode && parentNode.nodeName !== 'BODY') {
    if (parentNode.nodeName === 'UL' || parentNode.nodeName === 'OL')
      ulCount++

    parentNode = parentNode.parentNode
  }
  return ulCount
}

function getCursorPrevText(rng: any) {
  let cur = rng.startContainer

  if (cur.nodeType !== 3)
    return ''

  if (cur.textContent === cur.wholeText)
    return cur.textContent.substring(0, rng.startOffset)

  let text = ''
  while (cur && cur.nodeType === 3) {
    text = cur.textContent + text
    cur = cur.previousSibling
  }

  return text
}

function getAtTextRng(rng: any) {
  const newRng = document.createRange()

  let cur = rng.endContainer

  if (cur.nodeType !== 3)
    return

  if (!cur.wholeText.includes('@'))
    return

  if (cur.textContent === cur.wholeText) {
    const text = cur.textContent
    const idx = text.lastIndexOf('@')

    newRng.setStart(cur, idx)
    newRng.setEnd(cur, rng.endOffset)

    return newRng
  }

  newRng.setEnd(cur, rng.endOffset)

  while (cur && cur.nodeType === 3) {
    const text = cur.textContent
    const idx = text.lastIndexOf('@')

    if (idx !== -1) {
      newRng.setStart(cur, idx)
      break
    }

    cur = cur.previousSibling
  }

  return newRng
}

// 定义一个对象 init初始化
const init = reactive({
  selector: `#${`${props.modeKey}textarea`}`,
  statusbar: true,
  mobile: {
    menubar: false,
  },
  resize: props.resize,
  placeholder: props.placeholder,
  language_url: '/tinymce/langs/zh_CN.js', // 语言包的路径，具体路径看自己的项目，文档后面附上中文js文件
  language: 'zh_CN', // 语言
  skin_url: '/tinymce/skins/ui/oxide', // skin路径，具体路径看自己的项目
  branding: false, // 是否禁用“Powered by TinyMCE”
  menubar: false, // 顶部菜单栏显示
  plugins: props.plugins, // 这里的数据是在props里面就定义好了的
  content_style: 'p { font-size: 14px;}', // 自定义段落样式
  link_default_target: '_blank',
  link_context_toolbar: false,
  inline_boundaries: false,
  min_height: props.minHeight,
  max_height: props.maxHeight,
  license_key: 'gpl',
  paste_webkit_styles: 'all',
  nonbreaking_force_tab: false,
  paste_auto_cleanup_on_paste: false,
  file_picker_types: 'file image media',
  image_dimensions: false,
  paste_data_images: true,
  text_patterns_lookup: (ctx: any) => {
    if (/\[.+\]\(.+\)$/.test(ctx.text)) {
      const result = /\[(.+)\]\((.+)\)$/.exec(ctx.text)
      if (!result)
        return
      const start = result[0].substr(0, result[0].length - 2)
      const end = ')'
      let url = result[2]
      if (!/^https?:\/\//.test(url)) {
        // 如果不是，则默认使用http作为前缀
        url = `http://${url}`
      }
      const html = `<a href="${url}">${result[1]}</a>`
      return [{ start, end, cmd: 'mceInsertClipboardContent', value: { html } }]
    }
    return [
      { start: '#', format: 'h1', trigger: 'space' },
      { start: '##', format: 'h2', trigger: 'space' },
      { start: '###', format: 'h3', trigger: 'space' },
      { start: '###', format: 'h3', trigger: 'space' },
      { start: '####', format: 'h4', trigger: 'space' },
      { start: '#####', format: 'h5', trigger: 'space' },
      { start: '######', format: 'h6', trigger: 'space' },
      { start: '1.', cmd: 'InsertOrderedList', trigger: 'space' },
      { start: '*', cmd: 'InsertUnorderedList', trigger: 'space' },
      { start: '-', cmd: 'InsertHTML', value: '- ' },
      { start: '>', cmd: 'mceBlockQuote', trigger: 'space' },
      { start: '`', end: '`', format: 'code' },
      { start: '**', end: '**', format: 'bold' },
      { start: '*', end: '*', format: 'italic' },
      { start: '~', end: '~', format: 'underline' },
      { start: '~~', end: '~~', format: 'strikethrough' },
      { start: '```', cmd: 'codesample', trigger: 'space' },
      {
        start: '---',
        cmd: 'InsertHorizontalRule',
        trigger: 'space',
      },
      {
        start: '***',
        cmd: 'InsertHorizontalRule',
        trigger: 'space',
      },
    ]
  },
  icons: 'custom',
  content_css: '/tinymce/skins/content/default/content.css', // 以css文件方式自定义可编辑区域的css样式，css文件需自己创建并引入
  toolbar: props.toolbar, // 这里的数据是在props里面就定义好了的
  font_size_formats: '14px 26px 22px 20px 18px 16px',
  toolbar_mode: 'sliding',
  color_cols: 6,
  color_map: [
    '#ffffff',
    'White',
    '#1D74F5',
    '延展色/blue/700',
    '#FD4C4C',
    '延展色/red/400',
    '#08C479',
    '延展色/green/400',
    '#FFA723',
    '延展色/orange/400',
    '#7B1DF5',
    '延展色/purple/500',

    '#EDEEF0',
    '描边颜色/94',
    '#E3F2FF',
    '延展色/blue/50',
    '#FFEBEE',
    '延展色/red/50',
    '#E3F7EC',
    '延展色/green/50',
    '#FFF3E0',
    '延展色/green/50',
    '#F1E7FE',
    '延展色/purple/50',

    '#EDEEF0',
    '描边颜色/90',
    '#BBDFFF',
    '延展色/blue/100',
    '#FFCDD2',
    '延展色/red/100',
    '#BBEACF',
    '延展色/green/100',
    '#FFE0B2',
    '延展色/orange/100',
    '#DAC4FC',
    '延展色/purple/100',

    '#999999',
    '文本色/次要文字',
    '#2CA6FF',
    '延展色/blue/400',
    '#F27071',
    '延展色/red/300',
    '#56CF91',
    '延展色/green/300',
    '#FFB74B',
    '延展色/orange/300',
    '#924BF8',
    '延展色/purple/400',

    '#333333',
    '文本色/重要文字',
    '#2361E2',
    '延展色/blue/800',
    '#FF372E',
    '延展色/red/500',
    '#00B961',
    '延展色/green/500',
    '#FF9800',
    '延展色/orange/500',
    '#6F17EE',
    '延展色/purple/600',

    '#1A1A1A',
    '文本色/标题文字',
    '#293FC3',
    '延展色/blue/900',
    '#C60014',
    '延展色/red/900',
    '#006628',
    '延展色/green/900',
    '#E65000',
    '延展色/orange/900',
    '#2000DB',
    '延展色/purple/900',
  ],
  // eslint-disable-next-line object-shorthand
  urlconverter_callback: function (url: string) {
    return url
  },
  images_upload_handler: async (blobInfo: any) => {
    try {
      const formData = new FormData()
      formData.append('files', blobInfo.blob(), blobInfo.filename())
      const scene = props.spaceId ? 'space_file' : 'default'
      const res: any = await projectFileUpload(props.spaceId, formData, scene)
      return getConfigDomain('space.file.domain') + res[blobInfo.filename()].uri
    }
    catch (err) {
      message.error('图片上传失败', 2)
      console.log(err)
      return `${getConfigDomain('space.file.domain')}`
    }
  },

  setup(editor: any) {
    editor.on('init', () => {
      richEditor = editor
      initEditorToolTip()
    })
    editor.on('ExecCommand', () => {
      if (judegMenuClick)
        judegMenuClick = false
    })
    editor.on('click', (e: any) => {
      if (e.target.nodeName.toLowerCase() === 'img') {
        visible.value = true
        previewImage.value = e.target.currentSrc
        previewTitle.value = getFileNameFromUrl(e.target.currentSrc)
      }
      if (e.target.classList.contains('close-icon')) {
        const formatContent = removeContentById(editorValue.value, 'editor-reply-content')
        editorValue.value = formatContent
        getFocus()
      }
    })
    // 监听 beforeExecCommand 事件
    editor.on('beforeExecCommand', (e: any) => {
      if (e.command === 'SelectAll') {
        const formatter = editor.formatter.get()
        editor && editor.formatter.register('stagformat', formatter)
        setTimeout(() => {
          editor.formatter.apply('stagformat')
        }, 10)
      }
    })
    // 切换状态
    // function updateToggleButtonState(e, api, key) {
    //   const isApplied = editor.formatter.match(key)
    //   console.log('h1', isApplied)
    //   console.log('editor.formatter', editor.formatter.get())
    // }
    editor.ui.registry.addMenuButton('customheadingbutton', {
      icon: 'custom-title',
      fetch(callback: any, _: any, api: any) {
        const items = [
          {
            type: 'togglemenuitem',
            icon: 'custom-title',
            onAction() {
              updateItemActive(fontStateMap, 'H')
              api.setIcon('custom-title')
              editor.execCommand('fontSize', false, '14px')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(fontStateMap.H)
              // const nodeChangeHandler = (e) => {
              //   console.log('nodechange')
              //   // updateToggleButtonState(e, itemApi, 'H1')
              // }
              // editor.on('nodeChange', nodeChangeHandler)
              return () => {
                // editor.off('nodeChange', nodeChangeHandler)
              }
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'H1',
            onAction() {
              updateItemActive(fontStateMap, 'H1')
              api.setIcon('H1')
              editor.execCommand('fontSize', false, '26px')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(fontStateMap.H1)
              return () => {}
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'H2',
            onAction() {
              updateItemActive(fontStateMap, 'H2')
              api.setIcon('H2')
              editor.execCommand('fontSize', false, '22px')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(fontStateMap.H2)
              return () => {}
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'H3',
            onAction() {
              updateItemActive(fontStateMap, 'H3')
              api.setIcon('H3')
              editor.execCommand('fontSize', false, '20px')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(fontStateMap.H3)
              return () => {}
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'H4',
            onAction() {
              updateItemActive(fontStateMap, 'H4')
              api.setIcon('H4')
              editor.execCommand('fontSize', false, '18px')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(fontStateMap.H4)
              return () => {}
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'H5',
            onAction() {
              updateItemActive(fontStateMap, 'H5')
              api.setIcon('H5')
              editor.execCommand('fontSize', false, '18px')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(fontStateMap.H5)
              return () => {}
            },
          },
        ]
        callback(items)
      },
    })
    // 自定义方向排版按钮
    editor.ui.registry.addMenuButton('customAlignButtom', {
      icon: 'align-left',
      fetch(callback: any, _: any, api: any) {
        const items = [
          {
            type: 'togglemenuitem',
            icon: 'align-left',
            onAction() {
              updateItemActive(alignStateMap, 'alignLeft')
              api.setIcon('align-left')
              editor.execCommand('JustifyLeft')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(alignStateMap.alignLeft)
              return () => {}
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'align-center',
            onAction() {
              updateItemActive(alignStateMap, 'alignCenter')
              api.setIcon('align-center')
              editor.execCommand('JustifyCenter')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(alignStateMap.alignCenter)
              return () => {}
            },
          },
          {
            type: 'togglemenuitem',
            icon: 'align-right',
            onAction() {
              updateItemActive(alignStateMap, 'alignRight')
              api.setIcon('align-right')
              editor.execCommand('JustifyRight')
            },
            onSetup: (itemApi: any) => {
              itemApi.setActive(alignStateMap.alignRight)
              return () => {}
            },
          },
        ]
        callback(items)
      },
    })
    editor.addShortcut('meta+13', 'Add yellow highlight to selected text.', () => {
      // MAC ⌘ + Enter / WIN Ctrl+Enter 发送
      confirmEdit()
    })
    editor.addShortcut('ctrl+13', 'Add yellow highlight to selected text.', () => {
      // Ctrl+Enter 发送
      confirmEdit()
    })
    // 触发删除线
    editor.addShortcut('meta+Shift+X', '', () => {
      editor.execCommand('strikethrough')
    })
    // 有序列表
    editor.addShortcut('meta+Shift+7', '', () => {
      editor.execCommand('InsertOrderedList')
    })
    // 无序列表
    editor.addShortcut('meta+Shift+8', '', () => {
      editor.execCommand('InsertUnorderedList')
    })
    editor.addShortcut('meta+Alt+S', '', () => {
      editor.execCommand('InsertHorizontalRule')
    })
    editor.on('keydown', (e: any) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // 处理回退缩进问题
        dealOutdent(editor)
      }
      if (e.key === 'Tab') {
        // 按下 Tab 键
        e.preventDefault()
        if (
          editor.dom.getParent(editor.selection.getNode(), 'ul')
          || editor.dom.getParent(editor.selection.getNode(), 'ol')
        )
          return

        if (e.shiftKey)
          editor.execCommand('Outdent')
        else
          editor.execCommand('Indent')
      }
      if ((e.metaKey && e.key === ']') || (e.ctrlKey && e.key === ']')) {
        e.preventDefault()
        editor.execCommand('Indent')
      }
      if ((e.metaKey && e.key === '[') || (e.ctrlKey && e.key === '[')) {
        e.preventDefault()
        editor.execCommand('Outdent')
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        if (isShowAt.value) {
          e.preventDefault()
          mentionRef.value?.handleKeyDown(e)
        }
      }
    })
    editor.on('keyup', (e: any) => {
      if (e.keyCode === 65 || e.keyCode === 93 || e.keyCode === 16 || e.keyCode === 91)
        return

      const frame: any = editor.iframeElement
      const body = frame.contentWindow.document.body
      const pos = position(body, { iframe: frame })
      if (frame && (props.mode === 'comment' || props.mode === 'focusMode')) {
        const range: any = editor?.selection.getRng()
        const text = getCursorPrevText(range)
        const lastAtIndex = text?.lastIndexOf('@')
        // 出现新的@位置时
        if (lastAtIndex !== -1 && lastAtIndex !== prevLastAtIndex) {
          preAtText = ''
          prevLastAtIndex = lastAtIndex !== undefined && lastAtIndex !== null ? lastAtIndex : -1
        }
        if (!text || !text?.length)
          preAtText = ''

        if (lastAtIndex !== -1) {
          const textBeforeAt = text?.substring(Number(lastAtIndex), pos.pos) || ''
          if (e.keyCode === 8) {
            if (preAtText.includes('\u00A0') && !textBeforeAt.includes('\u00A0')) {
              isShowAt.value = false
              return
            }
          }
          if (textBeforeAt.length < 1 || /\s+/.test(textBeforeAt) || preAtText.includes('\u00A0')) {
            isShowAt.value = false
            return
          }

          filterUserList(textBeforeAt.substring(1, textBeforeAt.length))
          currentPos.value = range.cloneRange()
        }
        else {
          isShowAt.value = false
        }
      }
    })
  },
})

// 获取焦点
async function focus() {
  emits('editorFocus')
}
// 失焦
function blur() {
  if (!visible.value) {
    // 如果内容与模板一致 则判定未填写，清空内容
    if (
      editorValue.value.replace(/\s/g, '') === props.template.replace(/\s/g, '')
    ) {
      editorValue.value = ''
    }
    else {
      editorValue.value = editorValue.value.replaceAll(
        '<a href="',
        '<a target="_blank" rel="noopener" href="',
      )
    }

    if (!['comment', 'focusMode'].includes(props.mode)) {
      if (judegMenuClick) {
        judegMenuClick = false
        return
      }
      if (editorValue.value.includes(';base64')) {
        message.warning('请等待图片上传完成', 2)
        getFocus()
        return
      }
      emits('editorBlur', editorValue.value)
      readonlyMode.value = true
    }
  }
}

// 获取项目内用户列表
async function getUserList(keyword: string) {
  const param = {
    spaceId: props.spaceId,
    userName: keyword,
  }
  const { data } = await getMemberListById(param)
  userList.value = data.list.map((item) => {
    return {
      value: item.userId,
      avatar: item.avatar as string,
      label: item.userNickname,
      username: item.userName,
      pinyin: item.userPinyin as string,
    }
  })
  nextTick(() => {
    getPosition()
  })
}

// 筛选用户
function filterUserList(keyword: string) {
  getUserList(keyword)
}

// 获取@位置设置下拉框出现位置
function getPosition() {
  isShowAt.value = true

  nextTick(() => {
    const childEle = mentionRef.value.$el
    childEle.style.top = `calc((100% - 63.58974vw) / 2)`
    childEle.style.left = `calc((100vw - 61.53846vw) / 2)`
    richEditor?.getDoc().body?.blur()
  })

  // const frame = richEditor.iframeElement
  // if (richEditor) {
  //   const selection = richEditor.selection
  //   const range = selection?.getRng()

  //   if (range) {
  //     nextTick(() => {
  //       const childEle = mentionRef.value.$el
  //       const childH = childEle.offsetHeight

  //       const cursorPosition: any = range.getClientRects()[0]
  //       const frameRect = frame.getBoundingClientRect()

  //       const rightEdge = frameRect.left + frameRect.width

  //       let leftPos = frameRect.left + cursorPosition.left + 15
  //       let topPos = frameRect.top - childH + cursorPosition.top + 20

  //       if (leftPos + childEle.offsetWidth > rightEdge) {
  //         leftPos = rightEdge - childEle.offsetWidth - 15
  //         topPos = frameRect.top - childH + cursorPosition.top - 5
  //       }

  //       // if (frameRect.top < childH)
  //       //   topPos = frameRect.top + 10

  //       childEle.style.top = `${topPos}px`
  //       childEle.style.left = `${leftPos}px`
  //     })
  //   }
  // }
}

// 取消发送
function cancelEdit() {
  isShowAt.value = false
  if (!visible.value) {
    readonlyMode.value = true
    if (props.mode === 'comment')
      editorValue.value = ''
    else
      editorValue.value = props.value

    focusInputRef.value = false
    emits('changeMode', false)
  }
}

// 确认发送
function confirmEdit() {
  if (visible.value || (props.mode !== 'comment' && props.mode !== 'focusMode'))
    return
  isShowAt.value = false
  // 编辑内容无改动
  if (props.value === editorValue.value) {
    emits('changeMode', false)
    focusInputRef.value = false
    readonlyMode.value = true
    return
  }
  if (editorValue.value) {
    sendLoading.value = true
    const body: any = richEditor?.getBody()
    const bodyList = body?.getElementsByClassName('mention-user')
    const replyElement = body?.getElementsByClassName('editor-reply-content')
    const userIds = []
    const replyCommentId: number = replyElement[0]?.getAttribute('data-id') as number || 0
    for (let i = 0; i < bodyList.length; i++)
      userIds.push(bodyList[i]?.getAttribute('data-userId'))
    if (editorValue.value.includes(';base64')) {
      message.warning('请等待图片上传完成', 2)
      getFocus()
      return
    }
    editorValue.value = editorValue.value.replaceAll(
      '<a href="',
      '<a target="_blank" rel="noopener" href="',
    )
    const formatContent = removeContentById(editorValue.value, 'editor-reply-content')
    emits('editorBlur', formatContent, [...new Set(userIds)], replyCommentId)
    emits('changeMode', false)
    focusInputRef.value = false
    readonlyMode.value = true
    editorValue.value = ''
  }
}

function setLoading() {
  readonlyMode.value = true
  editorValue.value = ''
  atUser.value = {} as any
  sendLoading.value = false
}

// 生成@ 提及用户
function handleMention(item: UserParam) {
  atUser.value = item
  isShowAt.value = false
  insertUser(item.value, item.label)
}

function createMentionElement(id: string, label: string) {
  // 创建一个新的span元素
  const span = document.createElement('span')

  // 设置属性
  span.setAttribute('data-userId', id)
  span.setAttribute('style', 'cursor: pointer; color: #1D74F5; font-family: CustomFont-Medium;')
  span.setAttribute('class', 'mceNonEditable mention-user')
  span.setAttribute('contenteditable', 'false')

  // 设置内容
  span.textContent = `@${label}`

  // 返回创建的元素
  return span
}

/**
 * 将提及的人插入到富文本
 * @param id 提及用户的id
 * @param label 提及用户的名称
 * @param isReplace 内容是替换还是插入
 */
function insertUser(id: string, label: string, isReplace?: boolean) {
  const replacer = `<span data-id="${id}" style="cursor: pointer; color: #1D74F5; font-family: CustomFont-Medium;" class="mceNonEditable mention-user">@${label}</span>`
  if (isReplace) {
    editorValue.value = `${replacer}&nbsp;`
  }
  else {
    const newNode = createMentionElement(id, label)
    const spaceNode = document.createElement('span')
    spaceNode.innerHTML = '&nbsp;'
    const atTextRng = getAtTextRng(currentPos.value)

    atTextRng?.deleteContents()

    atTextRng?.insertNode(spaceNode)
    atTextRng?.insertNode(newNode)

    richEditor?.selection.getSel()?.removeAllRanges()
    richEditor?.selection.getSel()?.addRange(atTextRng as Range)
    richEditor?.selection.getSel()?.collapseToEnd()
  }
  requestAnimationFrame(() => {
    getFocus(false)
  })
}

/**
 * 将回复的内容插入到富文本
 * @param item 当前 item
 */
function insertReplyContent(item: any) {
  const content = processHtmlContent(item.content)
  const replacer = `
    <div data-id="${item.id}" class="mceNonEditable editor-reply-content" id="editor-reply-content">
      <div class="close-icon"></div>
      <p class="line"></p>
      <span class="shrink">回复</span>
      <span class="shrink">${item.user.userNickname}:</span>
      <div class="ellipsis">${content}</div>
    </div>
    <span data-userId="${item.user.userId}" style="cursor: pointer; color: #1D74F5; font-family: CustomFont-Medium;" class="mceNonEditable mention-user">@${item.user.userNickname}</span>
  `
  editorValue.value = `${replacer}&nbsp;`
  // 等待 DOM 更新
  requestAnimationFrame(() => {
    getFocus()
  })
}

function changeEditMode(event: MouseEvent) {
  const { target } = event
  const { readonly } = props

  const tagName = (event.target as HTMLElement).tagName.toLowerCase()
  // 点击对象是图片
  const handleImageClick = () => {
    event.preventDefault()
    const src = (target as HTMLElement).getAttribute('src') || ''
    previewImage.value = src
    previewTitle.value = getFileNameFromUrl(src)
    setVisible(true)
  }

  // 点击对象是其他
  const handleOtherClick = () => {
    if (readonly)
      return
    readonlyMode.value = false
    getFocus()
    if (props.mode === 'comment')
      emits('changeMode', true)
  }

  // if (window?.getSelection()?.toString()) {
  //   if (tagName === 'img')
  //     handleImageClick()
  //   return
  // }

  if (tagName === 'img')
    handleImageClick()
  else if (tagName !== 'a')
    handleOtherClick()
}

// 外部点击展开评论富文本
function openCommentEditor(item: any) {
  readonlyMode.value = false
  if (item.type === 'reply') {
    insertReplyContent(item.comment)
  }
  if (item.type === 'edit') {
    editorValue.value = item.comment.content
  }
  // insertUser(item.user.userId, item.user.userNickname, true)
  requestAnimationFrame(() => {
    getFocus()
    emits('changeMode', true)
  })
}

// 设置图片预览开启和关闭
function setVisible(value: boolean): void {
  visible.value = value
  if (!value) {
    // 为解决：预览图片关闭时，如果马上滚动会出现无法滚动的情况
    const dom: HTMLElement | null = document.querySelector('.ant-image-preview-root')
    if (dom) {
      dom.style.pointerEvents = 'none'
      setTimeout(() => {
        dom.style.pointerEvents = ''
      }, 300)
    }
  }
}

// 无内容时点击外面关闭编辑模式
function onClickOutside(e: any) {
  if (e.target.parentElement.className instanceof SVGAnimatedString)
    return

  const target = e.target.parentElement.className.includes('tox')
  if (target) {
    judegMenuClick = true
    return
  }
  else {
    judegMenuClick = false
  }
  if (editorValue.value && (props.mode === 'comment' || props.mode === 'focusMode'))
    return
  readonlyMode.value = true
  emits('changeMode', false)
}

// 监听外部传递进来的的数据变化
watch(
  () => props.value,
  () => {
    editorValue.value = props.value
    emits('getContent', editorValue.value)
  },
  {
    immediate: true,
  },
)

// 监听富文本中的数据变化
watch(
  () => editorValue.value,
  () => {
    if (editorValue.value === '')
      isShowAt.value = false

    emits('getContent', editorValue.value)
  },
)

// 获取焦点
function getFocus(rangeIsEnd: boolean = true) {
  const ifra: any = richEditor.iframeElement
  if (editorValue.value === '') {
    // 无内容
    if (!props.template) {
      // 无模板
      setTimeout(() => {
        richEditor?.focus()
      }, 30)
    }
    else {
      // 获取焦点后没有内容需要模板 => 填充默认模板 1:需求 2,3: bug,走查...
      editorValue.value = props.template

      setTimeout(() => {
        if (ifra)
          keepLastIndex(rangeIsEnd)
      }, 30)
    }
  }
  else {
    setTimeout(() => {
      if (ifra) {
        richEditor?.focus()
        keepLastIndex(rangeIsEnd)
      }
    }, 30)
  }
}

function keepLastIndex(rangeIsEnd: boolean) {
  const editor = richEditor
  if (rangeIsEnd) {
    const body = editor.getBody()
    const range = editor.selection.getRng()
    // 移动光标到内容的末尾
    range.selectNodeContents(body)
    range.collapse(false) // 将光标移动到范围的末尾

    editor.selection.setRng(range)
  }
  editor.focus()
}

function getPreviewFocus() {
  requestAnimationFrame(() => {
    focusInputRef.value = true
  })
}

// 确认按钮是否禁用
function isDisabled() {
  // 去除标签和空格
  // const str = editorValue.value.replace(/<[^<>]+>/g, '').replace(/&nbsp;/gi, '')
  // 空数据则禁用
  if (!editorValue.value.trim())
    return true

  return false
}

// 在onMounted中初始化编辑器
onMounted(() => {
  tinymce.init({})
})
onBeforeUnmount(() => {
  const editorDom = document.querySelectorAll('.editor-box')
  if (!editorDom)
    return

  editorDom.forEach((ele) => {
    ele.removeEventListener('mouseover', handleMouseover)
  })
})

defineExpose({
  getFocus,
  setLoading,
  getPreviewFocus,
  openCommentEditor,
})
</script>

<template>
  <div ref="editorboxRef" :class="{ 'b-editor-view': view }" class="b-editor">
    <ElTooltip
      trigger="hover"
      virtual-triggering
      placement="top"
      raw-content
      :virtual-ref="tooltipRef"
      :content="tooltipMsg"
    />
    <!-- <b-head
      v-if="mode === 'comment' && editorShow"
      :id="userInfo.id"
      class="mr12 mt4 align-start"
      width="32px"
      :name="userInfo.userNickname"
      :src="userInfo.avatar"
    /> -->
    <div v-show="editorShow" class="editor-box" :style="{ minHeight: `${minHeight}px` }">
      <div class="comment-editor flex">
        <div class="right">
          <Editor
            v-bind="$attrs"
            :id="`${modeKey}textarea`"
            ref="editorRef"
            :key="modeKey"
            v-model="editorValue"
            v-click-outside="onClickOutside"
            :init="init"
            @focus="focus"
            @blur="blur"
          />
          <div v-if="isFootBtn" class="bot flex-row-end gap16 pr12 pb12">
            <a-button class="btn cancel-btn" size="default" :disabled="false" @click="cancelEdit">
              取消
            </a-button>
            <a-button
              class="btn confirm-btn"
              size="default"
              type="primary"
              :disabled="isDisabled()"
              @click="confirmEdit"
            >
              {{ btnTitle }}
            </a-button>
          </div>
        </div>
      </div>
    </div>
    <b-head
      v-if="readonlyMode && mode === 'comment' && commentStyle === 'long'"
      :id="userInfo.id"
      class="mr12"
      width="32px"
      :name="userInfo.userNickname"
      :src="userInfo.avatar"
    />
    <el-scrollbar
      v-show="!editorShow"
      :disabled="true"
      :style="calcReadStyle"
      :view-style="{ overflow: mode === 'comment' && ['long', 'short'].includes(commentStyle) ? 'hidden' : 'auto' }"
      :max-height="`${props.maxHeight}px`"
      :class="[calcEditorValue, calcReadClass, props.type]"
      @click="changeEditMode"
    >
      <svg-icon v-if="mode === 'comment' && commentStyle === 'short'" name="comment-icon" color="#666" size="16" />
      <div class="read-content editor-order-list" v-html="editorValue ? editorValue : readContent" />
    </el-scrollbar>
    <a-image
      :style="{ display: 'none', width: '0px', height: '0px' }"
      :preview="{
        visible,
        onVisibleChange: setVisible,
      }"
      :src="previewImage"
    />
  </div>
  <b-mention v-if="isShowAt" ref="mentionRef" :list="userList" @on-mention="handleMention" />
</template>

<style lang="scss">
// 调色盘
.tox .tox-swatches {
  box-shadow:
    0px 8px 24px 0px rgba(0, 0, 0, 0.06),
    0px 4px 4px 0px rgba(0, 0, 0, 0.02) !important;
}
.tox-tooltip {
  display: none !important;
}
.tox {
  font-size: 14px !important;
}
.tox .tox-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
}
.tox .tox-statusbar {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 16px !important;
}
.tox .tox-swatches-menu {
  z-index: 0 !important;
}
.tox div.tox-swatch:not(.tox-swatch--remove) svg {
  display: none;
  fill: #222f3e;
  height: 20px !important;
  margin: 2px !important;
  width: 12px !important;
  height: 12px !important;
  path {
    stroke-width: 0 !important;
  }
}
.tox .tox-swatch:focus,
.tox .tox-swatch:hover {
  box-shadow: none !important;
  transform: scale(1.1) !important;
}
.tox .tox-swatches__picker-btn:hover {
  background: rgba(0, 0, 0, 0.04) !important;
  border: none !important;
}
.tox-swatch[data-mce-name='White'] {
  border: 1px solid $color-border-main !important;
}
// 自定义菜单栏hover样式
.tox .tox-collection--list .tox-collection__item--active {
  background-color: transparent !important;
}
.tox .tox-collection__item {
  &:hover {
    background: rgba(0, 0, 0, 0.04) !important;
  }
}
.tox .tox-collection--list .tox-collection__item--enabled {
  background-color: rgba(29, 116, 245, 0.08) !important;
  border: 1px solid transparent !important;
}
.tox .tox-swatches__picker-btn {
  width: 24px !important;
  height: 24px !important;
}
.tox-swatch {
  height: 18px !important;
  width: 18px !important;
  border-radius: 4px;
  margin: 8px 5px !important;
  box-sizing: border-box !important;
}
.tox .tox-swatches__row {
  padding-left: 10px;
  padding-right: 10px;
  &:first-of-type {
    padding-top: 8px;
  }
  &:last-of-type {
    position: relative;
    padding-bottom: 35px;
    padding-top: 8px;
  }
}
.tox .tox-swatch--remove {
  left: 10px;
  position: absolute;
  bottom: 0;
}
.tox .tox-swatches__picker-btn {
  position: absolute;
  bottom: 0;
  right: 10px;
}
.tox .tox-swatch--remove {
  flex: 1 1 auto; /* 子元素平分父容器宽度 */
  min-width: 0; /* 允许子元素收缩到 0 宽度以适应容器 */
  margin-right: 10px; /* 可选，添加间距 */
  visibility: hidden;
  width: 120px !important;
  height: 24px !important;
  cursor: pointer;
  &:hover {
    transform: scale(1) !important;
  }
  &:before {
    content: '清除';
    position: absolute;
    left: 0;
    top: 0;
    visibility: visible; /* 伪类元素可见 */
    white-space: nowrap;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #ffffff;
    box-sizing: border-box;
    border: 1px solid $color-border-main;
    font-size: 12px;
    color: #1a1a1a;
  }
}

.tox-collection__group {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tox .tox-collection--list .tox-collection__item {
  padding: 0 !important;
  margin: 4px 8px 8px 8px;
}
.tox .tox-menu.tox-collection.tox-collection--list {
  padding: 0 !important;
}
.tox .tox-menu {
  box-shadow:
    0px 8px 24px 0px rgba(0, 0, 0, 0.06),
    0px 4px 4px 0px rgba(0, 0, 0, 0.02) !important;
}

// 自定义菜单栏选中箭头
.tox-collection__item-checkmark {
  display: none !important;
}
// 自定义菜单栏选中样式
.tox-collection__item--enabled .tox-collection__item-icon svg path {
  // background-color: rgba(0, 0, 0, 0.04) !important;
  fill: #1d74f5 !important;
}

.tox:not(.tox-tinymce-inline) .tox-editor-header {
  box-shadow: none !important;
  border-bottom: 1px solid $color-border-main !important;
}
.tox .tox-toolbar__group {
  padding: 0 0 0 6px !important;
}
.tox .tox-sidebar-wrap {
  padding-right: 2px;
}
.tox .tox-edit-area::before {
  visibility: hidden;
}

.tox .tox-tbtn {
  margin: 0;
  width: 24px !important;
  height: 24px !important;
  margin-right: 8px !important;
}
// 自定义下拉菜单
.tox .tox-tbtn.tox-tbtn--select {
  position: relative;
  min-width: 40px !important;
  .tox-icon {
    position: absolute;
    left: 0;
    top: 0;
  }
  .tox-tbtn__select-chevron {
    position: absolute;
    right: 6px;
    width: auto;
  }
}
// 颜色选择器
.tox-split-button {
  margin: 6px 8px 5px 0 !important;
}
.tox .tox-split-button {
  &:hover {
    box-shadow: none !important;
    background: rgba(0, 0, 0, 0.04);
  }
  .tox-icon {
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
  .tox-split-button__chevron {
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
}
.tox .tox-split-button .tox-tbtn {
  width: 36px !important;
  margin-right: 6px !important;
}
.tox .tox-split-button .tox-tbtn {
  width: 24px !important;
  margin-right: 0px !important;
}
.tox .tox-split-button .tox-tbtn.tox-split-button__chevron {
  width: 13px !important;
}

.tox-tbtn__icon-wrap {
  width: 24px !important;
}

.tox .tox-tbtn--disabled svg path,
.tox .tox-tbtn--disabled:hover svg path,
.tox .tox-tbtn:disabled svg path,
.tox .tox-tbtn:disabled:hover svg path {
  fill: rgba(34, 47, 62, 0.5);
}
.tox-tbtn--bespoke {
  width: 80px !important;
}
.tox .tox-tbtn:hover {
  background: rgba(0, 0, 0, 0.04) !important;
}
.tox .tox-tbtn:focus {
  background: rgba(0, 0, 0, 0.04) !important;
}
.tox-split-button:focus {
  background: rgba(0, 0, 0, 0.04) !important;
}
.tox .tox-tbtn--enabled {
  background: rgba(29, 116, 245, 0.08) !important;
}

.tox .tox-tbtn--enabled svg,
.tox .tox-tbtn--enabled svg path {
  fill: #1d74f5 !important;
}

.tox:not([dir='rtl']) .tox-toolbar__group:not(:last-of-type) {
  position: relative;
}
.tox:not([dir='rtl']) .tox-toolbar__group:not(:last-of-type)::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  height: 18px;
  width: 1px;
  background-color: $color-border-main;
  z-index: 1;
}
.b-editor {
  width: 100%;
  display: flex;
  align-items: center;
  .ant-image {
    display: inline;
  }
  .editor-box {
    width: 100%;
    border-radius: 6px;
    background: #fff;
    overflow: hidden;
    box-shadow: 0 0 0 2px $color-primary;
  }

  .read-content {
    font-size: 14px;
    color: #bfbfbf;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    strong {
      font-weight: bold;
      font-family: auto !important;
      * {
        font-weight: bold;
        font-family: auto !important;
      }
    }
    * {
      line-height: 1.5;
      white-space: normal !important;
    }
    &.preview {
      color: #333;
    }
    img {
      &:hover {
        cursor: pointer;
        box-shadow: 0 0 0 2px #bacefd;
      }
    }
  }
  .mce-content-readonly {
    padding: 12px;
  }
  .mce-content-body {
    img {
      max-width: 100%;
    }
  }
  .tox-tinymce {
    border: 0;
    border-radius: 6px;
    z-index: 9 !important;
  }
  .tox-editor-header {
    background-color: transparent !important;
  }
  .tox-toolbar {
    background-color: transparent !important;
  }
  .tox:not(.tox-tinymce-inline) .tox-editor-header {
    padding: 0 6px;
  }

  .tox:not(.tox-tinymce-inline) {
    .tox-statusbar {
      border-top: 0;
    }
    .tox-statusbar__text-container {
      display: none;
    }
  }
  .comment-editor {
    width: 100%;
    .right {
      width: 100%;
      height: 100%;
      border-radius: 6px;
      .bot {
        width: 100%;
        // height: 56px;
      }
    }
  }
}
.read-mode {
  border-radius: 6px;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #a6a6a6;
  cursor: pointer;
  position: relative;
  display: flex;
  overflow: hidden;
  // &:hover {
  //   background: $color-input-hover;
  // }
  .comment-icon {
    pointer-events: none;
    margin-right: 4px;
  }
}
</style>

<style lang="scss" scoped>
.b-editor-view {
  .el-scrollbar {
    &.read-only-none {
      background-color: #fff;
      // &:hover {
      //   box-shadow: 0 0 0 2px $color-primary;
      //   background-color: #fff !important;
      // }
    }
  }
}
strong {
  font-weight: bold;
}
.align-start {
  align-self: flex-start;
}
.el-scrollbar {
  border-radius: 6px;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #a6a6a6;
  cursor: pointer;
  position: relative;
  display: flex;
  overflow: hidden;
  display: flex;
  background-color: $color-input;
  padding: 7px 12px;
  :deep(.el-scrollbar__wrap) {
    width: 100%;
  }
  &:hover {
    background: $color-input-hover;
  }
  &.read-only-none {
    background-color: #f7f8fa;
    &:active {
      background-color: #f1f4f7 !important;
    }
  }
  &.read-only-border {
    border: 1px solid #f7f8fa;
  }
  &.task-remarks-edit {
    :deep(.el-scrollbar__view) {
      display: flex;
      align-items: center;
      overflow: hidden !important;
      .read-content {
        font-size: 14px;
      }
    }
  }
  &.read-only-comment-long {
    max-width: 397px;
    align-items: center;
    line-height: 1;
  }
  &.read-only-comment-short {
    max-width: 87px;
    align-items: center;
    padding: 8px 12px;
    line-height: 1;
    :deep(.el-scrollbar__view) {
      display: flex;
      align-items: center;
      .read-content {
        margin-left: 4px;
      }
    }
  }
  &.editor-has-value {
    &:active {
      background-color: $color-input;
      box-shadow: 0 0 0 2px $color-primary;
      box-sizing: border-box;
      border-radius: 6px;
      width: 100%;
      height: 100%;
    }
    .read-content {
      color: #333;
      word-break: break-all;
    }
  }
}
.read-mode {
  display: flex;
}

.bot {
  :deep() {
    .ant-btn-primary:disabled {
      color: #ffffff;
      background: #8dcbff;
      border: 1px solid #8dcbff;
      line-height: 10px;
    }
  }
}
</style>
