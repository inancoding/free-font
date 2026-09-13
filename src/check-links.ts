import type { LoadedFont, ValidationError } from './load-fonts.ts';

const CONCURRENCY = 5;
const TIMEOUT_MS = 15_000;

interface Target {
  file: string;
  field: string;
  url: string;
}

async function probe(url: string): Promise<{ ok: boolean; status: number | string }> {
  const init = {
    headers: {
      // 部分站点会拦截默认 UA，声明清楚反而更容易通过
      'User-Agent': 'free-font-link-checker (+https://github.com/)',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };

  try {
    const head = await fetch(url, { ...init, method: 'HEAD' });
    // 405/501/403 常见于不允许 HEAD 的站点，退回 GET 再试一次
    if (head.ok) return { ok: true, status: head.status };
    if ([403, 405, 501].includes(head.status)) {
      const get = await fetch(url, { ...init, method: 'GET' });
      return { ok: get.ok, status: get.status };
    }
    return { ok: false, status: head.status };
  } catch (err) {
    return { ok: false, status: (err as Error).name };
  }
}

/**
 * 死链检查。
 *
 * 只有 404/410 判为 error —— 那是确凿的链接失效。
 * 403/429/超时判为 warn，因为这类多半是站点反爬而非链接真的没了，
 * 让 CI 因为反爬而红灯会很快让人开始忽略所有告警。
 */
export async function checkLinks(fonts: LoadedFont[]): Promise<ValidationError[]> {
  const targets: Target[] = [];
  for (const { relPath, font } of fonts) {
    targets.push({ file: relPath, field: 'officialUrl', url: font.officialUrl });
    if (font.sourceUrl) {
      targets.push({ file: relPath, field: 'sourceUrl', url: font.sourceUrl });
    }
  }

  const unique = new Map<string, Target[]>();
  for (const target of targets) {
    const group = unique.get(target.url);
    if (group) group.push(target);
    else unique.set(target.url, [target]);
  }

  const errors: ValidationError[] = [];
  const queue = [...unique.entries()];

  async function worker(): Promise<void> {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      const [url, group] = next;
      const result = await probe(url);
      if (result.ok) continue;

      const dead = result.status === 404 || result.status === 410;
      for (const target of group) {
        errors.push({
          file: target.file,
          field: target.field,
          message: `链接不可达（${result.status}）：${url}`,
          severity: dead ? 'error' : 'warn',
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return errors;
}
