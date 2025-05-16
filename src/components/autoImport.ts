// 自动导入组件

import type { ComponentOptions } from 'vue'
import { defineComponent } from 'vue'

// 基础组件
const basic = import.meta.glob('./basic/*/src/*.vue', { eager: true })
const form = import.meta.glob('./form/*/src/*.vue', { eager: true })
const data = import.meta.glob('./data/*/src/*.vue', { eager: true })
const navigation = import.meta.glob('./navigation/*/src/*.vue', { eager: true })
const feedback = import.meta.glob('./feedback/*/src/*.vue', { eager: true })

// 业务组件
const business = import.meta.glob('./business/*/src/*.vue', { eager: true })
const businessBasic = import.meta.glob('./business-basic/*/src/*.vue', { eager: true })
const businessForm = import.meta.glob('./business-form/*/src/*.vue', { eager: true })
const businessData = import.meta.glob('./business-data/*/src/*.vue', { eager: true })

interface Components {
  [key: string]: any
}

const componentFiles = Object.assign(basic, form, data, navigation, feedback, business, businessBasic, businessForm, businessData)

const components: Components = {}

for (const path in componentFiles) {
  const componentName = path.split('/').pop()?.replace(/\.\w+$/, '') as string
  components[componentName] = defineComponent((componentFiles[path] as ComponentOptions).default)
}

export default components
