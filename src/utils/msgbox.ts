import { h } from 'vue'
import { Modal } from 'ant-design-vue'
import type { ModalFuncProps } from 'ant-design-vue/es/modal/Modal'
import SvgIcon from '@/components/SvgIcon/src/index.vue'

interface MsgboxPromise<T> extends Promise<T> {
  destroy: () => void
  update: (newConfig: ModalFuncProps) => void
}

function execModal(options: ModalFuncProps) {
  let modalId: {
    destroy: () => void
    update: (newConfig: ModalFuncProps) => void
  }
  const promiser = new Promise((resolve, reject) => {
    modalId = Modal.confirm(Object.assign({
      icon: h('div', { class: 'anticon' }, [
        h(SvgIcon, {
          name: 'modal-exclamation',
          size: 20,
        }),
      ]),
      centered: true,
      closeIcon: h(SvgIcon, {
        name: 'add_member_close',
        color: '#333',
        size: 16,
      }),
      okText: '确认',
      okButtonProps: {
        icon: ' ',
      },
      okType: 'danger',
      cancelButtonProps: {
        icon: ' ',
      },
      cancelText: '取消',
      closable: true,
      onOk() {
        resolve(true)
      },
      onCancel() {
        reject(new Error('cancel'))
      },
    }, options, {
      content: typeof options.content === 'string' ? h('div', { class: 'content-wrap' }, options.content) : options.content,
    }))
    requestAnimationFrame(() => {
      promiser.destroy = modalId.destroy
      promiser.update = modalId.update
    })
  }) as MsgboxPromise<boolean>
  return promiser
}

export const Msgbox = {
  warning: {
    m: (options: ModalFuncProps) => {
      return execModal(Object.assign(options, { class: 'modal-warning-s' }))
    },
    l: (options: ModalFuncProps) => {
      return execModal(Object.assign(options, { class: 'modal-warning-l' }))
    },
  },
  error: {
    m: (options: ModalFuncProps) => {
      return execModal(Object.assign(options, { class: 'modal-error-s' }))
    },
  },
}
