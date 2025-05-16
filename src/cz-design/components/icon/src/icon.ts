import type { ExtractPropTypes } from 'vue'
import type Icon from './icon.vue'

import { definePropType } from '@/cz-design/utils'

export const iconProps = {
  tag: {
    type: String,
    default: 'i',
  },
  name: {
    type: String,
  },
  color: {
    type: String,
  },
  size: {
    type: definePropType<number | string>([Number, String]),
  },
  spin: Boolean,
} as const

export type IconProps = ExtractPropTypes<typeof iconProps>
export type IconInstance = InstanceType<typeof Icon>
