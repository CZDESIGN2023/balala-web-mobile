<script setup lang="ts">
import { h } from 'vue'
import example from '../components/example.vue'
import { Msgbox } from '@/utils/msgbox'

async function onOpenMsgbox() {
  const modal = Msgbox.warning.m({ title: '确定要删除吗？', content: [h('div', { onClick: () => {
    modal.destroy()
  } }, '点击此处关闭')] })
  await modal
  console.log('确认后执行')
}
</script>

<template>
  <h1>Msgbox 消息弹出框</h1>
  <p>异步弹窗使用 Promise，.then 或 await 等待用户点击按钮。点击取消则抛出错误。</p>
  <h2>Msgbox.method()</h2>
  <p>参数为 AntDesign Modal.method() 的参数，类型为：ModalFuncProps。</p>
  <p>包括：</p>
  <ul>
    <li>Msgbox.error.m(options: ModalFuncProps)</li>
    <li>暂未增加其它类型，可自行增加</li>
  </ul>
  <br>

  <h2>无 content 内容弹窗</h2>
  <example>
    <a-button type="primary" class="mr8" @click="Msgbox.warning.m({ title: '确定要保存吗？' })">
      warning(s尺寸)
    </a-button>
    <a-button type="primary" danger @click="Msgbox.error.m({ title: '确定要删除吗？' })">
      error(s尺寸)
    </a-button>
  </example>

  <h2>带 content 内容弹窗</h2>
  <example>
    <a-button type="primary" class="mr8" @click="Msgbox.warning.m({ title: '确定要保存吗？', content: '内容。。。' })">
      warning(s尺寸)
    </a-button>
    <a-button type="primary" danger @click="Msgbox.error.m({ title: '确定要删除吗？', content: '内容。。。' })">
      error(s尺寸)
    </a-button>
  </example>

  <h2>content 使用 h 函数</h2>
  <example>
    <a-button
      type="primary"
      danger
      @click="Msgbox.error.m({ title: '确定要删除吗？', content: [h('div', null, 'test'), h('input', { placeholder: '请输入内容...' })] })"
    >
      error(s尺寸)
    </a-button>
  </example>

  <h2>调用关闭方法</h2>
  <example>
    <a-button
      type="primary"
      @click="onOpenMsgbox"
    >
      弹出窗口
    </a-button>
  </example>
</template>
