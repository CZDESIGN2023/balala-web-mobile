import { createApp } from 'vue'
import VXETable from 'balala-vxe-table'
import mitt from 'mitt'
import VConsole from 'vconsole'
import dayjs from 'dayjs'
import App from './App.vue'
import router from './router'
import { globalRegister } from './global'
import { setupCommonDirectives } from '@/directives'
import pinia from '@/stores'
import install from '@/cz-design'
import 'dayjs/locale/zh-cn'

import 'tdesign-vue-next/es/style/index.css'
import '@/assets/font/font.css'
import 'balala-vxe-table/lib/style.css'
import 'virtual:uno.css'

function useTable(app: any) {
  app.use(VXETable)
}

if (import.meta.env.MODE === 'development') { // 如果为开发模式, 则注入 vConsole, 预防正式会不小心忘记删除
  // eslint-disable-next-line no-new
  new VConsole()
}

dayjs.locale('zh-cn')

const app = createApp(App)
app.config.performance = true
setupCommonDirectives(app)
app.use(useTable)
app.use(globalRegister)
app.use(pinia)
app.use(router)
app.use(install)
app.mount('#app')

const globalProperties = {
  mittBus: mitt(),
}

app.config.globalProperties = Object.assign(app.config.globalProperties, globalProperties)
