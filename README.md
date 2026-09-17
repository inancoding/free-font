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
zips/<slug>-<version>.zip 字体 ZIP 产物（入库后通过 CDN 分发）
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
.github/workflows/        ci.yml（校验 + Pages 部署）/ auto-release.yml（push 后自动创建 Release）
```

字体 ZIP 提交至 `zips/` 目录，通过 GitHub Release 和 jsDelivr CDN 分发。

## 收录新字体

### 方式一：UI 界面（推荐）

```bash
pnpm run dev               # 启动本地服务器
# 访问 http://localhost:3000/admin 填写表单
```

### 方式二：CLI 手动创建

1. 新建 `fonts/<slug>.json`，文件名必须与 `slug` 字段一致
2. 在 `src/licenses.ts` 确认该字体的授权已注册
3. 把授权原文放进 `licenses/<slug>/`
4. 封面图和预览图放入 `public/images/`，在 JSON 中填写 `cover` 和 `preview`
5. 本地跑 `pnpm run validate`，确认无错误

## 发版流程

### 1. 新增字体（Admin UI）

```bash
pnpm run dev               # 启动本地服务器
# 访问 http://localhost:3000/admin
```

在表单中上传字体 ZIP 文件，系统自动计算 SHA-256 并标记为已发版。封面图和预览图也通过文件上传自动入库。填写完成后点击保存。

### 2. 提交并推送

```bash
git add fonts/ zips/ public/images/
git commit -m "新增 Xxx 字体"
git push
```

推送后 CI 自动完成以下工作：
1. 校验字体元数据
2. 部署 GitHub Pages，网站即时更新
3. 检测变更的字体，自动创建 tag 和 GitHub Release

下载链接格式：
- GitHub 直接下载：`https://raw.githubusercontent.com/inancoding/free-font/<tag>/zips/<slug>-<version>.zip`
- jsDelivr 加速：`https://cdn.jsdelivr.net/gh/inancoding/free-font@<tag>/zips/<slug>-<version>.zip`

## 侵权投诉

如果你是版权方，认为本仓库的收录超出了授权范围，请提交标题以 `[侵权投诉]` 开头的 Issue，附上版权归属证明与授权条款依据。我们会在核实后第一时间删除。

## 本地开发

需要 Node.js 22 及以上。

```bash
pnpm install
pnpm run dev                 # 启动开发服务器（含管理页面）
pnpm run validate            # 校验所有字体元数据
pnpm run validate -- --check-links   # 额外检查官方链接是否可达
pnpm run build:site          # 构建静态网站（输出到 docs/）
pnpm run check               # typecheck + validate
```

## 许可

元数据、脚本与文档采用 [CC0-1.0](LICENSE) 释出。字体文件各自遵循其原有授权。
