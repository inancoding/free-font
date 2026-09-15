# free-font

开源免费字体聚合站——收录授权明确允许免费使用的字体，提供在线预览、元数据索引与 GitHub Releases 镜像分发。

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

满足以下条件的字体即可收录：

1. 授权明确允许**免费使用**（含个人非商业用途）
2. 授权原文已存档于 `licenses/<slug>/`

所有收录字体均通过 GitHub Release 分发。授权信息存疑的字体同样可以收录，但会在条目中标注「待核实」。

## 项目结构

```
fonts/<slug>.json         字体元数据（唯一需要手工维护的数据）
licenses/<slug>/          授权原文副本
templates/                EJS 模板（首页、详情页、关于页）
public/
  images/                 封面图 + 预览图（由 font2image 外部项目生成后放入）
  styles/                 CSS
  scripts/                前端 JS（搜索、筛选）
docs/                     生成的静态网站（不进 Git）
src/licenses.ts           授权注册表
src/schema.ts             元数据结构定义
src/policy.ts             合规策略校验
scripts/validate.ts       校验入口
scripts/build-site.ts     静态站构建（EJS → docs/）
scripts/build-readme.ts   由 fonts/*.json 生成上方索引表
src/tags.ts               Release tag 与下载链接生成
.github/workflows/        ci.yml（校验 + Pages 部署）/ release.yml（tag 触发创建 Release 骨架）
```

字体二进制文件**不进 Git**。每款字体通过 GitHub Release 独立分发，用户按需下载。

## 封面图与预览图

封面图（400px）和预览图（192px）由外部项目 **font2image** 独立生成。生成后将图片放入 `public/images/`，并在字体 JSON 中填写 `cover` 和 `preview` 字段（文件名）。

## 贡献

### 收录新字体

1. 新建 `fonts/<slug>.json`，文件名必须与 `slug` 字段一致
2. 在 `src/licenses.ts` 确认该字体的授权已注册。若没有，先补注册，并**务必核对官方授权原文**后才把 `verified` 设为 `true`
3. 把授权原文放进 `licenses/<slug>/`
4. 用 font2image 生成封面图和预览图，放入 `public/images/`，在 JSON 中填写 `cover` 和 `preview`
5. 本地跑 `npm run validate`，确认无错误
6. 跑 `npm run build:readme` 更新索引表，跑 `npm run build:site` 确认静态站正常，一并提交

### 发版

字体通过 GitHub Release 分发。发版流程：

1. 准备字体压缩包（zip）
2. 计算 SHA-256：`sha256sum <file>.zip`
3. 在 `fonts/<slug>.json` 中填写 `sha256` 字段
4. 打 tag 并推送：

```bash
git tag zhuque-fangsong-v0.212      # 格式固定为 <slug>-v<version>
git push origin zhuque-fangsong-v0.212
```

> **一次只推一个 tag。** 把多个 tag 合并进同一条 `git push`，GitHub 只会为其中一个创建 workflow run，其余的**静默丢失**——不报错、不重试、Actions 页面什么都看不到。批量发版必须逐条推送。

工作流会先重跑 `typecheck` 与 `validate`（合规校验不通过的字体发不出去），然后创建 Release 骨架（含 Release Notes）。**你需要手动上传字体 zip 到 Release assets。**

> 已经推错了补救办法是删掉远端 tag 再单独重推，本地 tag 不用动：
>
> ```bash
> git push origin :refs/tags/<tag>   # 只删远端
> git push origin <tag>              # 单独重推，触发工作流
> ```

### 侵权投诉

如果你是版权方，认为本仓库的收录超出了授权范围，请提交标题以 `[侵权投诉]` 开头的 Issue，附上版权归属证明与授权条款依据。我们会在核实后第一时间删除。

## 本地开发

需要 Node.js 22 及以上。

```bash
npm install
npm run validate              # 校验所有字体元数据
npm run validate -- --check-links   # 额外检查官方链接是否可达
npm run build:readme          # 重新生成索引表
npm run build:site            # 构建静态网站（输出到 docs/）
npm run check                 # typecheck + validate
```

## 许可

元数据、脚本与文档采用 [CC0-1.0](LICENSE) 释出。字体文件各自遵循其原有授权。
