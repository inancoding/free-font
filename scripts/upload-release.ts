import { stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { loadFonts } from '../src/load-fonts.ts';
import { tagNameFor, artifactNameFor } from '../src/tags.ts';

const USAGE = `用法: npm run upload -- <tag> <zip-path>

示例:
  npm run upload -- lxgw-wenkai-v1.522 ./lxgw-wenkai-1.522.zip

参数:
  tag        Release tag，形如 <slug>-v<version>
  zip-path   本地 zip 文件路径

前置条件:
  - 已安装 GitHub CLI (gh): https://cli.github.com/
  - 已登录: gh auth login
  - Release 已存在（由 CI 在 push tag 后自动创建）
`;

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(USAGE);
    return 0;
  }

  const [tag, zipPath] = args;

  if (!tag || !zipPath) {
    console.error('错误：需要 2 个参数\n');
    console.error(USAGE);
    return 1;
  }

  // 校验 tag 格式
  const match = tag.match(/^(.+)-v(.+)$/);
  if (!match) {
    console.error(`错误：tag "${tag}" 格式不正确，应为 <slug>-v<version>`);
    return 1;
  }
  const [, slug] = match;

  // 校验字体存在
  const { fonts, errors } = await loadFonts();
  if (errors.some((e) => e.severity === 'error')) {
    console.error('错误：字体数据存在校验问题，请先运行 npm run validate');
    return 1;
  }

  const font = fonts.find((f) => f.font.slug === slug);
  if (!font) {
    console.error(`错误：未找到 slug 为 "${slug}" 的字体`);
    return 1;
  }

  // 校验 tag 与字体版本匹配
  const expectedTag = tagNameFor(font.font);
  if (tag !== expectedTag) {
    console.error(`错误：tag 不匹配。期望 "${expectedTag}"，实际 "${tag}"`);
    return 1;
  }

  // 校验 zip 文件存在
  try {
    const info = await stat(zipPath);
    if (!info.isFile()) {
      console.error(`错误：${zipPath} 不是文件`);
      return 1;
    }
  } catch {
    console.error(`错误：文件不存在 ${zipPath}`);
    return 1;
  }

  // 期望的附件名
  const expectedArtifact = artifactNameFor(font.font);
  const actualName = zipPath.split(/[\\/]/).pop() ?? zipPath;

  if (actualName !== expectedArtifact) {
    console.warn(`警告：文件名 "${actualName}" 与期望的 "${expectedArtifact}" 不一致`);
    console.warn('       上传后将使用原始文件名。');
  }

  // 检查 gh 是否可用
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch {
    console.error('错误：未找到 GitHub CLI (gh)');
    console.error('请安装：https://cli.github.com/');
    return 1;
  }

  // 检查 Release 是否存在
  try {
    execSync(`gh release view ${tag}`, { stdio: 'ignore' });
  } catch {
    console.error(`错误：Release "${tag}" 不存在`);
    console.error('请先推送 tag 等待 CI 创建 Release：');
    console.error(`  git tag ${tag}`);
    console.error(`  git push origin ${tag}`);
    return 1;
  }

  // 上传
  console.log(`正在上传 ${zipPath} 到 Release ${tag}...`);
  try {
    execSync(`gh release upload ${tag} "${zipPath}" --clobber`, {
      stdio: 'inherit',
    });
    console.log(`\n上传成功！`);
    console.log(`下载链接：`);
    console.log(`  https://github.com/inancoding/free-font/releases/download/${tag}/${actualName}`);
    console.log(`  https://cdn.jsdelivr.net/gh/inancoding/free-font@${tag}/${actualName}`);
    return 0;
  } catch (err) {
    console.error('\n上传失败');
    return 1;
  }
}

process.exitCode = await main();
