import { checkLinks } from '../src/check-links.ts';
import { loadFonts, type ValidationError } from '../src/load-fonts.ts';
import { checkPolicies } from '../src/policy.ts';
import { isMirrored } from '../src/schema.ts';

const RED = '\u001b[31m';
const YELLOW = '\u001b[33m';
const DIM = '\u001b[2m';
const BOLD = '\u001b[1m';
const RESET = '\u001b[0m';

const USAGE = `用法: npm run validate [-- --check-links]

  --check-links   额外校验 officialUrl 是否可达（需联网，较慢）
`;

function report(errors: ValidationError[]): void {
  if (errors.length === 0) return;

  const byFile = new Map<string, ValidationError[]>();
  for (const error of errors) {
    const group = byFile.get(error.file);
    if (group) group.push(error);
    else byFile.set(error.file, [error]);
  }

  for (const [file, items] of [...byFile.entries()].sort()) {
    console.error(`\n${BOLD}${file}${RESET}`);
    for (const item of items) {
      const isError = item.severity === 'error';
      const mark = isError ? `${RED}✗${RESET}` : `${YELLOW}!${RESET}`;
      const field = item.field ? `${DIM}${item.field}${RESET}` : '';
      const gap = item.field ? ' '.repeat(Math.max(1, 16 - item.field.length)) : ' '.repeat(16);
      console.error(`  ${mark} ${field}${gap}${item.message}`);
    }
  }
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    return 0;
  }
  const shouldCheckLinks = args.includes('--check-links');

  const unknown = args.filter((arg) => arg !== '--check-links');
  if (unknown.length > 0) {
    console.error(`未知参数: ${unknown.join(', ')}\n`);
    console.error(USAGE);
    return 2;
  }

  const { fonts, errors: shapeErrors } = await loadFonts();
  // 结构都没过的条目不再跑策略检查，避免在缺字段的数据上报一堆连带错误
  const policyErrors = await checkPolicies(fonts);
  const linkErrors = shouldCheckLinks ? await checkLinks(fonts) : [];

  const all = [...shapeErrors, ...policyErrors, ...linkErrors];
  report(all);

  const errorCount = all.filter((item) => item.severity === 'error').length;
  const warnCount = all.length - errorCount;
  const mirrored = fonts.filter((item) => isMirrored(item.font)).length;

  console.log(
    `\n${DIM}${'─'.repeat(52)}${RESET}\n` +
      `字体条目 ${BOLD}${fonts.length}${RESET} 个` +
      `${DIM}（已发版 ${mirrored} / 待发版 ${fonts.length - mirrored}）${RESET}\n` +
      `错误 ${errorCount > 0 ? RED + BOLD + errorCount + RESET : BOLD + '0' + RESET}` +
      `    警告 ${warnCount > 0 ? YELLOW + BOLD + warnCount + RESET : BOLD + '0' + RESET}` +
      (shouldCheckLinks ? '' : `    ${DIM}(未检查死链，加 --check-links 开启)${RESET}`),
  );

  if (errorCount === 0) {
    console.log(`\n${DIM}校验通过${RESET}`);
  }
  return errorCount > 0 ? 1 : 0;
}

process.exitCode = await main();
