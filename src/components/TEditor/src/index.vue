<script setup lang="ts">
const props = defineProps({
  spaceId: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    default: () => {
      return ''
    },
  },
  // 插件
  plugins: {
    type: [String, Array],
    default: () => ['autoresize', 'table', 'image', 'formatpainter', 'link', 'lists', 'customLink', 'balaba_autolink'],
  },
  // 工具栏
  toolbar: {
    type: [String, Array],
    default: 'undo redo formatpainter | customHeadingButton forecolor backcolor bold italic underline strikethrough | customAlignButtom bullist numlist | hr indent outdent',
  },
  placeholder: {
    type: String,
    default: '',
  },
  // 只读内容
  readContent: {
    type: String,
    default: '',
  },
  // 最小高度
  minHeight: {
    type: Number,
    default: 0,
  },
  // 最大高度
  maxHeight: {
    type: Number,
    default: 0,
  },
})

const emits = defineEmits(['getContent', 'editorFocus', 'editorBlur', 'changeMode'])
</script>

<template>
  <div class="container">
    <div class="read-content" />
    <div class="editor" />
  </div>
</template>

<style lang="scss" scoped>

</style>
