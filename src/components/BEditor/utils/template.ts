const demandTemplate = `
  <p>- [任务描述]： </p>
  <p>- [思维导图 | 如有]：</p>
  <p>- [需求文档 | 如有]：</p>
  <p>- [设计稿件 | 如有]：</p>
`

const bugTemplate = `
  <p>- [当前版本/环境]： </p>
  <p>- [问题描述]：</p>
  <p>- [复现步骤]：</p>
  <p>- [期望效果]：</p>
`

const uiTemplate = `
  <p>- [设计描述]： </p>
  <p>- [思维导图 | 如有]：</p>
`

const remarkTemplate = `
  <p>- [相关资源交付备注/链接 | 如有]：</p>
`

export const templateMap = new Map([
  [1, demandTemplate],
  [2, bugTemplate],
  [3, bugTemplate],
  [4, uiTemplate],
  [5, remarkTemplate],
])
