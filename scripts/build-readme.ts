import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkPolicies } from '../src/policy.ts';
import { loadFonts } from '../src/load-fonts.ts';
import { REPO_ROOT } from '../src/paths.ts';
import { releaseUrlFor } from '../src/tags.ts';
import type { Font } from '../src/schema.ts';

const README_PATH = path.join(REPO_ROOT, 'README.md');
const START = '<!-- FONTS:START -->';
const END = '<!-- FONTS:END -->';

/** 表格单元格里出现竖线会破坏 Markdown 结构 */
function cell(value: string): string {
  return value.replaceAll('|', '\\|');
}

function row(font: Font): string {
  const name = font.name.en ? `${font.name.zh} / ${font.name.en}` : font.name.zh;
  const download = font.mirror
    ? `[Release](${releaseUrlFor(font)}) · [官方](${font.officialUrl})`
    : `[官方](${font.officialUrl})`;

  return [
    `| ${cell(name)} `,
    cell(font.vendor),
    `\`${font.license}\``,
    `${font.weights.length} 种`,
    cell(font.languages.join(', ')),
    `${download} |`,
  ].join(' | ');
}

function table(fonts: Font[]): string {
  if (fonts.length === 0) return '_暂无_\n';
  const header = ['| 字体', '厂商', '授权', '字重', '语言', '获取 |'];
  const divider = '| --- | --- | --- | --- | --- | --- |';
  return [header.join(' | '), divider, ...fonts.map(row)].join('\n') + '\n';
}

function build(fonts: Font[]): string {
  const mirrored = fonts.filter((font) => font.mirror);
  const linked = fonts.filter((font) => !font.mirror);

  return [
    `共收录 **${fonts.length}** 款字体：${mirrored.length} 款提供镜像下载，${linked.length} 款仅提供官方外链。`,
    '',
    '## 镜像下载',
    '',
    '以下字体的授权已核实允许再分发，二进制文件托管在本仓库的 GitHub Releases，授权原文存档于 `licenses/`。',
    '',
    table(mirrored),
    '## 仅官方外链',
    '',
    '以下字体允许免费商用，但授权不允许第三方再分发，或条款尚未核实完成。请点击官方链接自行下载。',
    '',
    table(linked),
  ].join('\n');
}

async function main(): Promise<number> {
  const { fonts, errors } = await loadFonts();
  const policyErrors = await checkPolicies(fonts);
  const blocking = [...errors, ...policyErrors].filter((item) => item.severity === 'error');

  if (blocking.length > 0) {
    console.error(`存在 ${blocking.length} 个校验错误，请先运行 npm run validate 修复后再生成 README。`);
    return 1;
  }

  const readme = await readFile(README_PATH, 'utf8');
  const startIndex = readme.indexOf(START);
  const endIndex = readme.indexOf(END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error(`README.md 中缺少成对的 ${START} / ${END} 标记，无法定位生成区域。`);
    return 1;
  }

  const before = readme.slice(0, startIndex + START.length);
  const after = readme.slice(endIndex);
  const updated = `${before}\n\n${build(fonts.map((item) => item.font))}\n${after}`;

  if (updated === readme) {
    console.log('README.md 已是最新，无需改动。');
    return 0;
  }

  await writeFile(README_PATH, updated, 'utf8');
  console.log(`已更新 README.md：${fonts.length} 款字体。`);
  return 0;
}

process.exitCode = await main();
