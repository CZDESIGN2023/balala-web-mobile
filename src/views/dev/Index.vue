<template>
  <div>
    <h1>组件开发说明</h1>
    <h2>目录组织</h2>
    <p>暂定以下目录，可参考 ElementPlus 组织方式。</p>
    <p>以下目录组件自动全局引入，引入逻辑参考：<code>src/components/autoImport.ts</code></p>
    <br>
    <h3>基础组件</h3>
    <ul>
      <li>/components/basic/ => Basic 基础组件</li>
      <li>/components/form/ => Form 表单组件</li>
      <li>/components/data/ => Data 数据展示</li>
      <li>/components/navigation/ => Navigation 导航</li>
      <li>/components/feedback/ => Feedback 反馈组件</li>
    </ul>
    <h3>业务组件</h3>
    <ul>
      <li>/components/business/ => Business 业务基础组件</li>
      <li>/components/business-form/ => Business Form 业务表单组件</li>
      <li>/components/business-data/ => Business Data 业务数据展示组件</li>
    </ul>
    <h2>组件命名、路径</h2>
    <p>
      文件名和目录使用组件名称，驼峰大写：<br>
      <ul>
        <li><code>src/components/[分类名称]/[组件名称]/src/[组件名称].vue</code></li>
        <li><code>例如: src/components/business/PersonSelect/src/PersonSelect.vue</code></li>
      </ul>
    </p>
    <h2>Demo 创建</h2>
    <p>demo 文件与组件路径大致一致：</p>
    <ul>
      <li>例如组件：src/<code>components</code>/business<code>/PersonSelect/src/PersonSelect.vue</code></li>
      <li>Demo组件：src/<code>views/dev</code>/business/PersonSelect<code>Demo</code>.vue</li>
    </ul>
  </div>
</template>
