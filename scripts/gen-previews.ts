/**
 * 批量生成字体预览图。
 *
 * 用法：
 *   npm run preview:all                    # 扫描 fonts/binary/ 目录
 *   npm run preview:all -- --in /path      # 指定字体目录
 *   npm run preview:all -- --force         # 忽略增量缓存
 *
 * 前提：字体文件需预先放入 fonts/binary/ 目录（可从 Release 下载或手动放置）。
 * 产物输出到 docs/images/，附带 manifest.json。
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_IN = path.join(ROOT, 'fonts', 'binary');
const OUT = path.join(ROOT, 'docs', 'images');

// 解析 CLI 参数
const args = process.argv.slice(2);
let inDir = DEFAULT_IN;
let force = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--in' && args[i + 1]) {
    inDir = path.resolve(args[++i]!);
  } else if (args[i] === '--force') {
    force = true;
  }
}

if (!existsSync(inDir)) {
  console.error(`错误：字体目录不存在：${inDir}`);
  console.error('请先将字体文件（.ttf/.otf/.woff/.woff2）放入该目录，或使用 --in 指定路径。');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

console.log(`字体目录：${inDir}`);
console.log(`输出目录：${OUT}`);
console.log('---');

// 构建 font2image CLI 参数
const cliArgs = [
  'font2image/src/cli/index.ts',
  '--in', inDir,
  '--out', OUT,
  '--format', 'webp',
  '--sizes', '192',
];

if (force) {
  cliArgs.push('--force');
}

// 调用 font2image CLI
const result = spawnSync('tsx', cliArgs, {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env },
});

if (result.error) {
  console.error('启动 font2image 失败：', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
