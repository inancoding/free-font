# free-font 重构需求文档

> 开源免费字体收录站——基于 GitHub Pages + Release，实现字体检索、分类、标签与分发。

## 一、项目定位

| 项目 | 说明 |
|------|------|
| 站名 | free-font |
| 定位 | 开源免费字体收录站 |
| 托管 | GitHub Pages（静态站） + GitHub Release（字体分发） |
| 目标规模 | 上千款字体 |
| 技术栈 | EJS 静态站 + TypeScript（tsx 运行） + Zod 校验 + 原生 JS 前端 |

## 二、字体元数据

每款字体包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| slug | string | 是 | 唯一标识，kebab-case，用作文件名和 tag 的一部分 |
| name.zh | string | 否* | 中文名 |
| name.en | string | 否* | 英文名（*zh/en 至少填一个） |
| vendor | string | 是 | 厂商/作者 |
| version | string | 是 | 版本号 |
| license | string | 是 | 授权标识（如 OFL-1.1） |
| languages | string[] | 是 | 支持语言列表 |
| formats | enum[] | 是 | 字体格式（otf/ttf/woff/woff2/ttc/variable-ttf/variable-otf） |
| weights | string[] | 是 | 字重列表 |
| glyphCount | number | 否 | 字形数（收录字数） |
| category | enum | 否 | 分类（sans-serif/serif/monospace/display/handwriting） |
| tags | string[] | 否 | 自定义标签 |
| description | string | 否 | 一句话简介 |
| officialUrl | url | 是 | 来源页（字体官网，非下载链接） |
| downloadUrl | url | 否 | 直接下载链接（Release 附件直链） |
| sha256 | string | 否 | 产物 SHA-256（手动发版时本地计算填入） |
| cover | string | 否 | 封面图文件名（400px，首页卡片用） |
| preview | string | 否 | 预览图文件名（192px，详情页用） |
| constraints | string[] | 否 | 分发与使用限制 |
| addedAt | date | 是 | 收录日期（YYYY-MM-DD） |
| notes | string | 否 | 备注 |

> *`sourceUrl` 字段移除——不再由 CI 从官方源自动下载。*

## 三、字体图片

### 3.1 图片生成（外部项目）

封面图和预览图由独立项目 **font2image** 生成，本项目**不集成** font2image。

| 图片类型 | 尺寸 | 用途 |
|---------|------|------|
| 封面图（cover） | 400px | 首页字体卡片 |
| 预览图（preview） | 192px | 字体详情页 |

### 3.2 图片存储

- 生成的图片放入 `public/images/` 目录，提交进 Git
- 图片体积小（每张几十 KB），上千款字体总计几十 MB，可控
- 不再需要 `fonts/binary/` 目录（该目录仅用于本地预览图生成，重构后移除）

### 3.3 新增字体时的图片流程

1. 用 font2image 项目独立生成封面图和预览图
2. 将图片放入 `public/images/`
3. 在字体 JSON 中填写 `cover` 和 `preview` 字段（文件名）

## 四、字体分发模型

### 4.1 核心原则

- **Git 仓库不保存字体二进制文件**
- 所有字体通过 GitHub Release 分发
- 每款字体独立 Release，互不影响

### 4.2 手动发版流程

```
本地：
  1. 准备字体压缩包（zip）
  2. 计算 SHA-256
  3. 填写 fonts/<slug>.json（含 sha256）
  4. git tag <slug>-v<version> && git push origin <tag>
       ↓
CI（release.yml）：
  5. 校验 JSON 元数据（typecheck + validate）
  6. 创建 Release，附上 Release Notes
  7. 人工上传字体 zip 到 Release assets
     （或：CI 提供 Release 骨架，人工补上传）
       ↓
用户：
  8. 在 Pages 站点选择字体 → 点击下载
```

### 4.3 下载链接体系

每款字体在详情页提供多种下载方式：

| 下载方式 | URL 格式 | 说明 |
|---------|---------|------|
| GitHub Release 直链 | `releases/download/<tag>/<artifact>.zip` | 点击即下载，不跳转 Release 页 |
| jsDelivr CDN | `cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>/<artifact>.zip` | 全球加速 |
| 其他 CDN 代理 | ghproxy / githack 等 | 国内加速备选 |

> CDN 链接从 tag 和 artifact 名自动派生，无需手动维护。

`officialUrl` 不作为下载链接，而是「来源页」入口——用户点击后跳转到字体的官方网站/仓库，了解字体的完整信息。

### 4.4 全量下载

完整字体库打包下载放在网盘（百度网盘 / OneDrive 等），定期更新。

## 五、新增字体方式

### 5.1 CLI 方式（现有）

```bash
# 1. 手动创建 fonts/<slug>.json
# 2. 校验
npm run validate
# 3. 构建确认
npm run build:site
# 4. 提交 & 打 tag
git tag <slug>-v<version>
git push origin <tag>
```

### 5.2 UI 方式（新增）

本地启动表单服务（`npm run add-font`），浏览器打开后：

1. 填写字体元数据表单（实时校验）
2. 选择授权类型（下拉，从 licenses 注册表读取）
3. 指定封面图 / 预览图文件路径（自动复制到 `public/images/`）
4. 计算并填入 SHA-256
5. 一键写入 `fonts/<slug>.json`
6. 提示后续 git 操作

> UI 不处理字体二进制上传和 Release 创建——这些通过 git tag + 人工上传完成。

## 六、网站功能

### 6.1 首页

- 字体卡片网格（封面图 + 名称 + 厂商 + 授权/分类/语言标签）
- 搜索框（按名称、厂商、语言、标签检索）
- 筛选器（授权类型、分类、语言）
- 统计信息（总收录数、镜像数等）

### 6.2 详情页

- 预览图展示
- 完整元数据（授权、版本、字重、格式、语言、字形数、分类、标签、收录时间）
- 下载区（GitHub 直链 / jsDelivr / CDN 代理）
- 来源页（`officialUrl`，跳转字体官网）
- 分发与使用限制说明
- 授权通用条款

### 6.3 关于页

- 项目说明、收录标准、免责声明

## 七、重构变更清单

### 移除

| 项目 | 原因 |
|------|------|
| `font2image/` 子目录 | 图片生成由外部项目负责 |
| `scripts/gen-previews.ts` | 同上 |
| `scripts/fetch-artifact.ts` | 不再由 CI 自动下载官方产物 |
| `fonts/binary/` 目录 | 不再需要本地字体二进制 |
| `package.json` 中 `preview` / `preview:all` 脚本 | 同上 |
| `playwright-core` / `opentype.js` 依赖 | font2image 相关依赖 |
| `sourceUrl` 字段 | 不再从官方源自动下载 |

### 新增

| 项目 | 说明 |
|------|------|
| `glyphCount` 字段 | schema 新增字形数 |
| 直接下载链接 | `tags.ts` 新增 `directDownloadUrlFor()` |
| CDN 链接生成 | 从 tag 自动派生 jsDelivr 等链接 |
| UI 新增字体服务 | 本地 dev server + 表单页面 |
| `npm run add-font` 脚本 | 启动 UI 服务 |

### 修改

| 项目 | 说明 |
|------|------|
| `release.yml` | 改为：校验 → 创建 Release 骨架 → 不再自动下载上传 |
| `font-detail.ejs` | 下载区改为多通道（直链 + CDN + 官方） |
| `schema.ts` | 移除 `sourceUrl`，新增 `glyphCount` |
| `isMirrored()` 逻辑 | 改为：有 `sha256` 即视为已镜像 |
| `build-site.ts` | 移除 manifest 匹配逻辑，直接读 JSON 中的 cover/preview |
| `_font-card.ejs` / `search.js` | 使用 `cover` 字段（已改好） |

## 八、目标项目结构

```
fonts/<slug>.json              字体元数据（唯一需要手工维护的数据）
licenses/<slug>/               授权原文副本
templates/                     EJS 模板（首页、详情页、关于页）
public/
  images/                      封面图 + 预览图（font2image 生成后放入）
  styles/                      CSS
  scripts/                     前端 JS（搜索、筛选）
docs/                          生成的静态网站（不进 Git）
scripts/
  validate.ts                  校验入口
  build-site.ts                静态站构建
  build-readme.ts              README 索引表生成
  add-font.ts                  UI 新增字体服务（新增）
src/
  schema.ts                    元数据结构定义
  licenses.ts                  授权注册表
  policy.ts                    合规策略校验
  tags.ts                      Release tag / 下载链接 / CDN 链接
  load-fonts.ts                字体加载
  config.ts                    仓库配置
  paths.ts                     路径常量
add-font/                      UI 表单页面（新增）
  index.html                   表单页面
  server.ts                    本地 dev server
.github/workflows/
  ci.yml                       校验 + Pages 部署
  release.yml                  tag 触发创建 Release 骨架
```

## 九、里程碑

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| M1 | 移除 font2image 集成 + fetch-artifact + 相关依赖 | 高 |
| M2 | Schema 调整（移除 sourceUrl、新增 glyphCount、调整 isMirrored） | 高 |
| M3 | 下载链接体系（直链 + CDN 自动派生） | 高 |
| M4 | release.yml 改造（创建骨架，不再自动下载） | 高 |
| M5 | UI 新增字体功能 | 中 |
| M6 | 全量下载（网盘）入口 | 低 |
