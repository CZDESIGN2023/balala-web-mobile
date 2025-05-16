import { ref } from 'vue'
import type { NodeProp, OwnerConfig, OwnerRole } from '@/views/flowNode/types'

interface OwnerObjConfig {
  [key: string]: OwnerConfig
}

const ownersConfig = ref<OwnerObjConfig>({})

export function useOwners(arr: NodeProp[] = []) {
  arr.forEach((item) => {
    const ownerRole = item.owner.ownerRole
    if (ownerRole.length > 0 && ownerRole[0].id)
      ownersConfig.value[ownerRole[0].id] = item.owner
  })
  return { ownersConfig, reset, create }
}

export function reset(arr: NodeProp[]) {
  ownersConfig.value = {}
  return useOwners(arr)
}

export function create(owner: [OwnerRole]): OwnerConfig {
  return {
    forceOwner: true,
    usageMode: 'none',
    value: {
      fillOwner: [],
      appointedOwner: [],
    },
    ownerRole: owner,
  }
}
