import type { Component, ExtractPropTypes } from 'vue'
import { definePropType, iconPropType } from '@/cz-design/utils'

export const ButtonType = ['default', 'primary', 'success', 'warning', 'danger', 'text', 'link'] as const
export const ButtonSize = ['large', 'normal', 'small'] as const

export const buttonProps = {
  type: {
    type: String,
    values: ButtonType,
    default: 'default',
  },
  size: {
    type: String,
    values: ButtonSize,
    default: 'normal',
  },
  plain: Boolean,
  round: Boolean,
  circle: Boolean,
  loading: Boolean,
  disabled: Boolean,
  icon: {
    type: iconPropType,
  },
  loadingIcon: {
    type: iconPropType,
  },
  color: {
    type: String,
    default: '',
  },
  tag: {
    type: definePropType<string | Component>([String, Object]),
    default: 'button',
  },
} as const

export const buttonEmits = {
  click: (evt: MouseEvent) => evt instanceof MouseEvent,
}

export type ButtonProps = ExtractPropTypes<typeof buttonProps>
export type ButtonEmits = typeof buttonEmits
