import type { App } from 'vue'
import 'animate.css'
import 'virtual:svg-icons-register' // 注册svg图标插件
import '@/styles/index.scss' // 全局样式引入
import { plugin as VueInputAutowidth } from 'vue-input-autowidth'
import registerElementIcon from './reg-element-icon' // 全局引入 element icon
import registerGlobComp from '@/components' // 自定义组件自动引入

export function globalRegister(app: App) {
  app.use(registerGlobComp)
  app.use(registerElementIcon)
  app.use(VueInputAutowidth)
}
