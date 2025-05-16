import { type Ref, h, onMounted, onUnmounted } from 'vue'
import type { ButtonProps } from 'ant-design-vue'
import { Msgbox } from '@/utils/msgbox'
import type { WorkDetailData } from '@/api/interface'

interface Params {
  proxy: any
  callback: () => void
  taskDetail: Ref<WorkDetailData>
}

export default function useTaskCoolaborate({ proxy, callback, taskDetail }: Params) {
  function onCooperate(data: any) {
    if (data.workItem.id === Number.parseInt(taskDetail.value.id)) {
      Msgbox.warning.l({
        title: `当前任务流程已升级`,
        content: h('div', [
          h('p', [
            '1.',
            h('span', { class: 'primary-color' }, `#${data.workFlow.name}`),
            ` 已被 ${data.operator.nickname}`,
            h('span', { class: 'minor-color' }, `（${data.operator.username}）`),
            `升级`,
          ]),
          h('p', '2.您可点击"我知道了"刷新页面'),
        ]),
        cancelButtonProps: { style: { display: 'none' } } as ButtonProps,
        okText: '我知道了',
        onOk: () => {
          callback()
        },
      })
    }
  }

  function onCooperateArchived(data: any) {
    if (data.workItem.id === Number.parseInt(taskDetail.value.id)) {
      Msgbox.warning.l({
        title: `任务状态已更新，无法操作`,
        content: h('div', [
          h('p', [
            '1.',
            h('span', { class: 'primary-color' }, `#${data.workItem.name}`),
            ` 已被 ${data.operator.nickname}`,
            h('span', { class: 'minor-color' }, `（${data.operator.username}）`),
            `结束流程`,
          ]),
          h('p', '2.您可点击"我知道了"刷新页面'),
        ]),
        cancelButtonProps: { style: { display: 'none' } } as ButtonProps,
        okText: '我知道了',
        onOk: () => {
          callback()
        },
      })
    }
  }

  onMounted(() => {
    proxy.mittBus.on('upgradeWorkFlow', onCooperate)
    proxy.mittBus.on('archivedWorkItem', onCooperateArchived)
  })

  onUnmounted(() => {
    proxy.mittBus.off('upgradeWorkFlow', onCooperate)
    proxy.mittBus.off('archivedWorkItem', onCooperateArchived)
  })
}
