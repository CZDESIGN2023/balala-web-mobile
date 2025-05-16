import { ref } from 'vue'
import type { ConditionGroup } from './interface'

interface filteItem {
  id: string
  name: string
  conditionData: ConditionGroup
  isEdit: boolean
}
const configFilterTag = ref([] as filteItem[])

export { configFilterTag }
