/// <reference types="vite/client" />

declare module 'element-plus/dist/locale/zh-cn.mjs'

declare module 'twitter-text'

declare module 'vue-cropper'

declare module '*.vue' {
  import type { defineComponent } from 'vue'

  const component: ReturnType<typeof defineComponent>
  export default component
}

declare interface Window {
  IM: any
}

declare module 'vue-virtual-scroller'
