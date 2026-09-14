import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { REPO_URL } from '../src/config.ts';
import { getLicense } from '../src/licenses.ts';
import { loadFonts } from '../src/load-fonts.ts';
import { REPO_ROOT } from '../src/paths.ts';
import { artifactNameFor, tagNameFor } from '../src/tags.ts';
import { isMirrored, type Font } from '../src/schema.ts';

const BUILD_DIR = path.join(REPO_ROOT, 'build');
const NOTES_PATH = path.join(BUILD_DIR, 'RELEASE_NOTES.md');
const NAME_PATH = path.join(BUILD_DIR, 'RELEASE_NAME.txt');
const TIMEOUT_MS = 10 * 60 * 1000;

const USAGE = `用法: npm run fetch-artifact -- <tag|slug>

  tag   形如 zhuque-fangsong-v0.212，会校验 tag 与元数据是否一致（CI 用这个）
  slug  形如 zhuque-fangsong，本地调试用

产物写入 build/，并生成 build/RELEASE_NOTES.md。
`;

function displayName(font: Font): string {
  const { zh, en } = font.name;
  return zh && en ? `${zh} / ${en}` : (zh ?? en ?? font.slug);
}

/**
 * 逐字节透传官方产物，不解包、不重打包、不做子集化。
 *
 * 这既是为了满足部分授权的附加条款（如霞鹜文楷禁止把改制版本
 * 作为可安装桌面字体发布），也让镜像不构成衍生作品。
 */
async function download(url: string, dest: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': `free-font-mirror (${REPO_URL})` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}: ${url}`);
  if (!res.body) throw new Error(`响应无 body: ${url}`);

  const hash = createHash('sha256');
  let bytes = 0;

  await pipeline(
    Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
    new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        hash.update(chunk);
        callback(null, chunk);
      },
    }),
    createWriteStream(dest),
  );

  console.log(`已下载 ${(bytes / 1048576).toFixed(2)} MB`);
  return hash.digest('hex');
}

function releaseNotes(font: Font, digest: string, size: number): string {
  const license = getLicense(font.license);
  const lines = [
    `## ${displayName(font)} ${font.version}`,
    '',
    `| | |`,
    `| --- | --- |`,
    `| 作者/厂商 | ${font.vendor} |`,
    `| 授权 | [${font.license}](${license?.url ?? ''}) |`,
    `| 免费商用 | ${license?.commercialUse ? '是' : '否'} |`,
    `| 字重 | ${font.weights.join(', ')} |`,
    `| 格式 | ${font.formats.join(', ')} |`,
    `| 语言 | ${font.languages.join(', ')} |`,
    `| 官方来源 | ${font.officialUrl} |`,
    `| 本包来源 | ${font.sourceUrl} |`,
    `| SHA-256 | \`${digest}\` |`,
    `| 大小 | ${(size / 1048576).toFixed(2)} MB |`,
    '',
  ];

  if (font.constraints.length > 0) {
    lines.push('### 分发与使用限制', '', ...font.constraints.map((c) => `- ${c}`), '');
  }

  const licenseConstraints = license?.constraints ?? [];
  if (licenseConstraints.length > 0) {
    lines.push(`### ${font.license} 通用条款`, '', ...licenseConstraints.map((c) => `- ${c}`), '');
  }

  if (font.notes) lines.push('### 备注', '', font.notes, '');

  lines.push(
    '---',
    '',
    '本压缩包为官方发布产物的**逐字节镜像**，未做任何解包、重打包或子集化处理。',
    '字体版权归原作者/厂商所有，本仓库仅作索引与镜像分发。',
    `详见 [免责声明](${REPO_URL}/blob/main/DISCLAIMER.md)。`,
    '',
  );

  return lines.join('\n');
}

async function main(): Promise<number> {
  const arg = process.argv[2];
  if (!arg || arg === '--help' || arg === '-h') {
    console.log(USAGE);
    return arg ? 0 : 2;
  }

  // tag 形如 <slug>-v<version>；贪婪匹配确保取最后一个 -v
  const tagMatch = /^(.*)-v(.+)$/.exec(arg);
  const slug = tagMatch?.[1] ?? arg;

  const { fonts } = await loadFonts();
  const entry = fonts.find((item) => item.font.slug === slug);
  if (!entry) {
    console.error(`找不到字体条目：fonts/${slug}.json`);
    return 1;
  }

  const { font } = entry;

  if (tagMatch && tagNameFor(font) !== arg) {
    console.error(
      `tag 与元数据不一致：收到 ${arg}，但 fonts/${slug}.json 记录的是 ${font.version}，` +
        `应为 ${tagNameFor(font)}`,
    );
    return 1;
  }

  if (!isMirrored(font)) {
    console.error(`${font.slug} 未设置镜像（缺少 sourceUrl 或 sha256），不发布二进制产物。`);
    return 1;
  }
  if (!font.sourceUrl || !font.sha256) {
    console.error(`${font.slug} 缺少 sourceUrl 或 sha256，无法镜像。请先运行 npm run validate。`);
    return 1;
  }

  await mkdir(BUILD_DIR, { recursive: true });
  const artifact = artifactNameFor(font);
  const dest = path.join(BUILD_DIR, artifact);

  console.log(`${displayName(font)} ${font.version}`);
  console.log(`来源 ${font.sourceUrl}`);

  let digest: string;
  try {
    digest = await download(font.sourceUrl, dest);
  } catch (err) {
    console.error(`下载失败：${(err as Error).message}`);
    await rm(dest, { force: true });
    return 1;
  }

  if (digest.toLowerCase() !== font.sha256.toLowerCase()) {
    console.error(
      `\nSHA-256 校验失败，产物已删除。\n  期望 ${font.sha256}\n  实际 ${digest}\n\n` +
        `上游产物可能已变更或传输损坏。请人工核对官方来源后再更新 fonts/${slug}.json 的 sha256。`,
    );
    await rm(dest, { force: true });
    return 1;
  }

  const { size } = await stat(dest);
  console.log(`SHA-256 校验通过：${digest}`);

  const notes = releaseNotes(font, digest, size);
  await writeFile(NOTES_PATH, notes, 'utf8');
  await writeFile(NAME_PATH, `${displayName(font)} ${font.version}`, 'utf8');
  console.log(`已生成 ${path.relative(REPO_ROOT, NOTES_PATH)}`);
  console.log(`产物 ${path.relative(REPO_ROOT, dest)}`);

  return 0;
}

process.exitCode = await main();
