# free-font

开源免费字体索引库。收录授权明确允许免费商用的字体，元数据入库，字体文件通过 GitHub Releases 分发。

> **使用前请务必阅读** [免责声明](DISCLAIMER.md)。本仓库提供的授权信息仅为整理与索引，不构成法律意见；字体版权均归原作者或厂商所有。

## 字体索引

<!-- FONTS:START -->

共收录 **0** 款字体：0 款提供镜像下载，0 款仅提供官方外链。

## 镜像下载

以下字体的授权已核实允许再分发，二进制文件托管在本仓库的 GitHub Releases，授权原文存档于 `licenses/`。

_暂无_

## 仅官方外链

以下字体允许免费商用，但授权不允许第三方再分发，或条款尚未核实完成。请点击官方链接自行下载。

_暂无_

<!-- FONTS:END -->

## 收录标准

只收录同时满足以下三条的字体：

1. 授权明确允许**免费商用**
2. 授权明确允许**第三方再分发**
3. 授权原文已存档于 `licenses/<slug>/`

任何一项存疑的字体，一律不镜像二进制文件，仅在索引中提供官方外链。这条规则由 `npm run validate` 在 CI 中强制执行，不靠人工自觉。

## 项目结构

```
fonts/<slug>.json         字体元数据（唯一需要手工维护的数据）
licenses/<slug>/          授权原文副本
preview/<slug>.webp       预览图
src/licenses.ts           授权注册表 —— 合规白名单的唯一来源
src/schema.ts             元数据结构定义
src/policy.ts             合规策略校验
scripts/validate.ts       校验入口
scripts/build-readme.ts   由 fonts/*.json 生成上方索引表
```

字体二进制文件**不进 Git**（见 `.gitignore`），只作为 Release 附件分发。

## 贡献

### 收录新字体

1. 在 `src/licenses.ts` 确认该字体的授权已注册。若没有，先补注册，并**务必核对官方授权原文**后才把 `verified` 设为 `true`
2. 新建 `fonts/<slug>.json`，文件名必须与 `slug` 字段一致
3. 若要镜像（`mirror: true`），把授权原文放进 `licenses/<slug>/`，并填写 `sourceUrl` 记录二进制来源
4. 本地跑 `npm run validate`，确认无错误
5. 跑 `npm run build:readme` 更新索引表，一并提交

### 侵权投诉

如果你是版权方，认为本仓库的收录超出了授权范围，请提交标题以 `[侵权投诉]` 开头的 Issue，附上版权归属证明与授权条款依据。我们会在核实后第一时间删除。

## 本地开发

需要 Node.js 20 及以上。

```bash
npm install
npm run validate              # 校验所有字体元数据
npm run validate -- --check-links   # 额外检查官方链接是否可达
npm run build:readme          # 重新生成索引表
npm run check                 # typecheck + validate
```

## 许可

元数据、脚本与文档采用 [CC0-1.0](LICENSE) 释出。字体文件各自遵循其原有授权。
