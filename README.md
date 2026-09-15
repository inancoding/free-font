# free-font

开源免费字体聚合站——收录授权明确允许免费使用的字体，提供在线预览与 GitHub Releases 分发。

> **使用前请务必阅读** [免责声明](DISCLAIMER.md)。本仓库提供的授权信息仅为整理与索引，不构成法律意见；字体版权均归原作者或厂商所有。

## 收录标准

满足以下条件的字体即可收录：

1. 授权明确允许**免费使用**（含个人非商业用途）
2. 授权原文已存档于 `licenses/<slug>/`

所有收录字体均通过 GitHub Release 独立分发。

## 项目结构

```
fonts/<slug>.json         字体元数据（唯一需要手工维护的数据）
licenses/<slug>/          授权原文副本
templates/                EJS 模板（首页、详情页、关于页、管理页）
public/
  images/                 封面图 + 预览图
  styles/                 CSS
  scripts/                前端 JS
docs/                     生成的静态网站（不进 Git）
src/
  schema.ts               元数据结构定义
  licenses.ts             授权注册表
  policy.ts               合规策略校验
  tags.ts                 Release tag 与下载链接生成
scripts/
  validate.ts             校验入口
  build-site.ts           静态站构建（EJS → docs/）
  dev-server.ts           本地开发服务器 + 管理页面
  release-info.ts         生成 Release 标题和描述
  upload-release.ts       上传 zip 到 Release
.github/workflows/        ci.yml（校验 + Pages 部署）/ release.yml（tag 触发创建 Release 骨架）
```

字体二进制文件**不进 Git**。每款字体通过 GitHub Release 独立分发。

## 收录新字体

### 方式一：UI 界面（推荐）

```bash
npm run dev               # 启动本地服务器
# 访问 http://localhost:3000/admin 填写表单
```

### 方式二：CLI 手动创建

1. 新建 `fonts/<slug>.json`，文件名必须与 `slug` 字段一致
2. 在 `src/licenses.ts` 确认该字体的授权已注册
3. 把授权原文放进 `licenses/<slug>/`
4. 封面图和预览图放入 `public/images/`，在 JSON 中填写 `cover` 和 `preview`
5. 本地跑 `npm run validate`，确认无错误

## 发版流程

字体通过 GitHub Release 分发。发版步骤：

### 1. 准备产物

准备字体压缩包（zip），计算 SHA-256：

```bash
sha256sum <file>.zip
```

在 `fonts/<slug>.json` 中填写 `sha256` 字段。

### 2. 打 tag 并推送

```bash
git tag <slug>-v<version>      # 格式固定为 <slug>-v<version>
git push origin <slug>-v<version>
```

> **一次只推一个 tag。** 把多个 tag 合并进同一条 `git push`，GitHub 只会为其中一个创建 workflow run，其余的**静默丢失**。批量发版必须逐条推送。

CI 会先重跑 `typecheck` 与 `validate`（合规校验不通过的字体发不出去），然后创建 Release 骨架（含 Release Notes）。

### 3. 上传附件

```bash
npm run upload -- <slug>-v<version> ./<slug>-<version>.zip
```

> 前置条件：安装 [GitHub CLI](https://cli.github.com/) 并执行 `gh auth login`。

上传完成后，以下链接即可生效：
- GitHub 直接下载：`https://github.com/inancoding/free-font/releases/download/<tag>/<artifact>.zip`
- jsDelivr 加速：`https://cdn.jsdelivr.net/gh/inancoding/free-font@<tag>/<artifact>.zip`

### 补救措施

已经推错了，删掉远端 tag 再单独重推（本地 tag 不用动）：

```bash
git push origin :refs/tags/<tag>   # 只删远端
git push origin <tag>              # 单独重推，触发工作流
```

## 侵权投诉

如果你是版权方，认为本仓库的收录超出了授权范围，请提交标题以 `[侵权投诉]` 开头的 Issue，附上版权归属证明与授权条款依据。我们会在核实后第一时间删除。

## 本地开发

需要 Node.js 22 及以上。

```bash
npm install
npm run dev                 # 启动开发服务器（含管理页面）
npm run validate            # 校验所有字体元数据
npm run validate -- --check-links   # 额外检查官方链接是否可达
npm run build:site          # 构建静态网站（输出到 docs/）
npm run check               # typecheck + validate
```

## 许可

元数据、脚本与文档采用 [CC0-1.0](LICENSE) 释出。字体文件各自遵循其原有授权。
