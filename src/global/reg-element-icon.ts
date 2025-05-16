import type { App } from 'vue'
import * as Icons from '@element-plus/icons-vue'

export default (app: App) => {
  Object.keys(Icons).forEach((key) => {
    app.component(key, Icons[key as keyof typeof Icons])
  })
}
