## balala项目系统

balala项目系统是一个轻量级项目管理系统...

## 文档

- **需求文档**：<https://rzlbm61ljs.feishu.cn/mindnotes/NfEtbTSs9mnHsKn6nBYcR3jXnjg#mindmap>
- **API文档**：<http://apidoc.eatdesk.net:4999/web/#/56?page_id=1397>
- **测试环境访问** : <https://qa.balala.eatdesk.net/>
- **生产环境访问** : <https://balala.eatdesk.net/>

## 安装使用

- 获取项目代码

```bash
git clone git@git.eatdesk.net:balala/balala_client_vue.git
```

- 安装依赖

```bash
cd balala_client_vue

npm install

```

- 运行

```bash
npm run dev
```

- 打包发布

```bash
npm run build
sh rsync.sh
```

## 分支命名

【分支名规范】 `[TYPE]_[YOUR NAME(EN)]_SBBJECT`
【TYPE】
`f`: 新功能（feature）
`b`: 修复 bug
`d`: 文档
`s`: 格式(不影响代码运行的变动）
`r`: 重构
`t`: 增加测试
`c`: 构建过程活腐竹工具的变动

## git提交

`feat`: 新功能（feature）
`fix`: 修补bug
`docs`: 文档（documentation）
`style`: 格式(不影响代码运行的变动）
`refactor`: 重构（即不是新增功能，也不是修改bug的代码变动）
`chore`: 构建过程或辅助工具的变动
`revert`: 撤销，版本回退
`perf`: 性能优化
`test`： 测试
`improvement`: 改进
`build`: 打包
`ci`: 持续集成
