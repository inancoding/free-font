import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadFonts } from '../src/load-fonts.ts';
import { REPO_ROOT } from '../src/paths.ts';
import { directDownloadUrlFor, jsdelivrUrlFor } from '../src/tags.ts';
import { ALL_LICENSES } from '../src/licenses.ts';

const BUILD_DIR = path.join(REPO_ROOT, 'build');

async function main(): Promise<number> {
  const tag = process.argv[2];
  if (!tag) {
    console.error('用法: tsx scripts/release-info.ts <tag>');
    console.error('示例: tsx scripts/release-info.ts lxgw-wenkai-v1.522');
    return 1;
  }

  const match = tag.match(/^(.+)-v(.+)$/);
  if (!match) {
    console.error(`tag "${tag}" 格式不正确，应为 <slug>-v<version>`);
    return 1;
  }
  const [, slug, version] = match;

  const { fonts, errors } = await loadFonts();
  if (errors.some((e) => e.severity === 'error')) {
    console.error('字体数据存在校验错误，请先修复。');
    return 1;
  }

  const found = fonts.find((f) => f.font.slug === slug);
  if (!found) {
    console.error(`未找到 slug 为 "${slug}" 的字体`);
    return 1;
  }

  const font = found.font;
  if (font.version !== version) {
    console.error(`版本不匹配：tag 中为 ${version}，JSON 中为 ${font.version}`);
    return 1;
  }

  const { zh, en } = font.name;
  const displayName = zh && en ? `${zh} / ${en}` : (zh ?? en ?? slug);
  const licenseInfo = ALL_LICENSES[font.license];

  const title = `${displayName} v${font.version}`;

  const lines: string[] = [];
  lines.push(`## ${displayName}`);
  lines.push('');
  if (font.description) {
    lines.push(font.description);
    lines.push('');
  }
  lines.push(`- **厂商**：${font.vendor}`);
  lines.push(`- **授权**：${licenseInfo?.name ?? font.license}`);
  lines.push(`- **字重**：${font.weights.join('、')}`);
  lines.push(`- **格式**：${font.formats.join('、')}`);
  lines.push(`- **语言**：${font.languages.join('、')}`);
  if (font.category) {
    lines.push(`- **分类**：${font.category}`);
  }
  if (font.glyphCount) {
    lines.push(`- **字数**：${font.glyphCount.toLocaleString()}`);
  }
  lines.push('');

  lines.push('## 下载');
  lines.push('');
  lines.push(`- [GitHub 直接下载](${directDownloadUrlFor(font)})`);
  lines.push(`- [jsDelivr 加速](${jsdelivrUrlFor(font)})`);
  lines.push('');
  lines.push(`> 字体 ZIP 已提交至仓库 \`zips/\` 目录，上述链接在推送 tag 后自动生效。`);

  if (font.constraints.length > 0) {
    lines.push('');
    lines.push('## 使用限制');
    lines.push('');
    for (const c of font.constraints) {
      lines.push(`- ${c}`);
    }
  }

  const body = lines.join('\n') + '\n';

  await mkdir(BUILD_DIR, { recursive: true });
  await writeFile(path.join(BUILD_DIR, 'RELEASE_NAME.txt'), title, 'utf8');
  await writeFile(path.join(BUILD_DIR, 'RELEASE_NOTES.md'), body, 'utf8');

  console.log(`Release 信息已生成：`);
  console.log(`  标题：${title}`);
  console.log(`  文件：build/RELEASE_NAME.txt, build/RELEASE_NOTES.md`);
  return 0;
}

process.exitCode = await main();
