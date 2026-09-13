# free-font

开源免费字体索引库。收录授权明确允许免费商用的字体，元数据入库，字体文件通过 GitHub Releases 分发。

> **使用前请务必阅读** [免责声明](DISCLAIMER.md)。本仓库提供的授权信息仅为整理与索引，不构成法律意见；字体版权均归原作者或厂商所有。

## 字体索引

<!-- FONTS:START -->

共收录 **9** 款字体：5 款提供镜像下载，4 款仅提供官方外链。

## 镜像下载

以下字体的授权已核实允许再分发，二进制文件托管在本仓库的 GitHub Releases，授权原文存档于 `licenses/`。

| 字体 | 厂商 | 授权 | 字重 | 语言 | 获取 |
| --- | --- | --- | --- | --- | --- |
| Inter  | Rasmus Andersson | `OFL-1.1` | 9 种 | latin, greek, cyrillic | [Release](https://github.com/inancoding/free-font/releases/tag/inter-v4.1) · [官方](https://github.com/rsms/inter) |
| JetBrains Mono  | JetBrains | `OFL-1.1` | 8 种 | latin, greek, cyrillic | [Release](https://github.com/inancoding/free-font/releases/tag/jetbrains-mono-v2.304) · [官方](https://github.com/JetBrains/JetBrainsMono) |
| 霞鹜文楷 / LXGW WenKai  | LXGW | `OFL-1.1` | 3 种 | zh-Hans, zh-Hant, ja, ko, latin | [Release](https://github.com/inancoding/free-font/releases/tag/lxgw-wenkai-v1.522) · [官方](https://github.com/lxgw/LxgwWenKai) |
| 得意黑 / Smiley Sans  | 锚定工坊 Atelier Anchor | `OFL-1.1` | 1 种 | zh-Hans, ja, latin, cyrillic, greek | [Release](https://github.com/inancoding/free-font/releases/tag/smiley-sans-v2.0.1) · [官方](https://github.com/atelier-anchor/smiley-sans) |
| 朱雀仿宋 / Zhuque Fangsong  | 璇玑造字 Triones Type | `OFL-1.1` | 1 种 | zh-Hans, latin | [Release](https://github.com/inancoding/free-font/releases/tag/zhuque-fangsong-v0.212) · [官方](https://github.com/TrionesType/zhuque) |

## 仅官方外链

以下字体均可免费商用，但本仓库不托管其二进制文件，原因分两类：授权不允许第三方再分发（或条款尚未核实完成），或字族全量体积过大不适合整体镜像。请点击官方链接自行下载，具体原因见各条目的 `notes` 字段。

| 字体 | 厂商 | 授权 | 字重 | 语言 | 获取 |
| --- | --- | --- | --- | --- | --- |
| 思源黑体（Noto 版） / Noto Sans CJK  | Google | `OFL-1.1` | 7 种 | zh-Hans, zh-Hant, ja, ko, latin | [官方](https://github.com/notofonts/noto-cjk) |
| 思源宋体（Noto 版） / Noto Serif CJK  | Google | `OFL-1.1` | 7 种 | zh-Hans, zh-Hant, ja, ko, latin | [官方](https://github.com/notofonts/noto-cjk) |
| 思源黑体 / Source Han Sans  | Adobe / Google | `OFL-1.1` | 7 种 | zh-Hans, zh-Hant, ja, ko, latin | [官方](https://github.com/adobe-fonts/source-han-sans) |
| 思源宋体 / Source Han Serif  | Adobe / Google | `OFL-1.1` | 7 种 | zh-Hans, zh-Hant, ja, ko, latin | [官方](https://github.com/adobe-fonts/source-han-serif) |

## 分发与使用限制

以下字体在所用授权的通用条款之外还有额外限制。**再分发、嵌入软件或自制子集前请务必确认。**

<details>
<summary><strong>Inter</strong></summary>

- 不含 CJK 字符，需与中文字体搭配使用

</details>
<details>
<summary><strong>JetBrains Mono</strong></summary>

- 不含 CJK 字符，需与中文字体搭配使用

</details>
<details>
<summary><strong>霞鹜文楷 / LXGW WenKai</strong></summary>

- 带 OFL 保留字体名（RFN）与附加许可：保留名「霞鹜」「霞鶩」「落霞孤鹜」「落霞孤鶩」「LXGW」仅可用于未修改源码的重编译版，或仅用于网页投递的子集化／转格式版
- 上述子集化／转格式版本不得作为可安装桌面字体发布；主流平台（如 Google Fonts）明确被点名禁止，其他网页字体平台须联系作者 @lxgw 确认
- 本仓库仅逐字节镜像官方 Release 的 TTF 原件，不做二次子集化
- 基于 Klee（Fontworks）开发，授权文本含其版权声明，须一并保留

</details>
<details>
<summary><strong>思源黑体（Noto 版） / Noto Sans CJK</strong></summary>

- 与 Adobe 的 Source Han Sans 同源，字形一致但打包方式与版本号体系不同
- Google Fonts 上的 Noto Sans SC 是另一套可变 TTF 产物，与本仓库的分语言 zip 不是同一批文件

</details>
<details>
<summary><strong>思源宋体（Noto 版） / Noto Serif CJK</strong></summary>

- 与 Adobe 的 Source Han Serif 同源，字形一致但打包方式与版本号体系不同
- Google Fonts 上的 Noto Serif SC 是另一套可变 TTF 产物，与本仓库的分语言 zip 不是同一批文件

</details>
<details>
<summary><strong>得意黑 / Smiley Sans</strong></summary>

- 保留字体名为「Smiley」与「得意黑」，衍生版本不得沿用
- 仅单一字重（Oblique），无正体、无多字重可选

</details>
<details>
<summary><strong>思源黑体 / Source Han Sans</strong></summary>

- Adobe 版与 Google 版 Noto Sans CJK 同源但发布渠道与打包方式不同
- 官方另提供 HW 竖排变体与 Subset OTF，按需取用

</details>
<details>
<summary><strong>思源宋体 / Source Han Serif</strong></summary>

- CFF2 格式的可变字体在 Windows 上存在已知渲染问题，官方建议改用 TTF 可变字体版本

</details>
<details>
<summary><strong>朱雀仿宋 / Zhuque Fangsong</strong></summary>

- 西文与符号部分采用 Alegreya（Juan Pablo del Peral / Huerta Tipográfica，同为 OFL-1.1），分发时须双重署名
- 不得单独销售原始版本或修改版本
- 作者请求（非授权条款）：正式版发布前不要大量传播非官方修改版
- 版本仍为 0.x，官方仓库持续迭代中，预期存在破坏性变更

</details>
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
scripts/fetch-artifact.ts 下载官方产物并校验 SHA-256
src/tags.ts               Release tag 与产物命名规则
.github/workflows/        ci.yml（校验）/ release.yml（tag 触发发版）
```

字体二进制文件**不进 Git**（见 `.gitignore`）。它们只在 CI 的 `build/` 目录里短暂存在：下载 → 校验摘要 → 上传到 Release → 丢弃，本地仓库中始终不会有字体文件。

## 贡献

### 收录新字体

1. 在 `src/licenses.ts` 确认该字体的授权已注册。若没有，先补注册，并**务必核对官方授权原文**后才把 `verified` 设为 `true`
2. 新建 `fonts/<slug>.json`，文件名必须与 `slug` 字段一致
3. 若要镜像（`mirror: true`），还需要三样东西：
   - 把授权原文放进 `licenses/<slug>/`
   - 填 `sourceUrl`，指向官方发布的具体产物文件（不是发布页）
   - 填 `sha256`，即该产物的摘要：`curl -sL <sourceUrl> | sha256sum`
4. 本地跑 `npm run validate`，确认无错误
5. 跑 `npm run build:readme` 更新索引表，一并提交

### 发版

`mirror: true` 的字体通过打 tag 触发 GitHub Actions 自动发版，不需要在本地上传二进制：

```bash
git tag zhuque-fangsong-v0.212      # 格式固定为 <slug>-v<version>
git push origin zhuque-fangsong-v0.212
```

工作流会先重跑 `typecheck` 与 `validate`（合规校验不通过的字体发不出去），再从 `sourceUrl` 下载官方产物、校验 `sha256`，最后创建 Release。

产物是官方压缩包的**逐字节镜像**——不解包、不重打包、不做子集化。这既满足部分授权的附加条款（如霞鹜文楷禁止把改制版本作为可安装桌面字体发布），也让镜像不构成衍生作品。

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
