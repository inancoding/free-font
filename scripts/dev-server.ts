import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, FONTS_DIR } from '../src/paths.ts';
import { fontSchema } from '../src/schema.ts';
import ejs from 'ejs';

const PORT = Number(process.env.PORT ?? 3000);
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function renderAdmin(): Promise<string> {
  const template = await readFile(path.join(TEMPLATES_DIR, 'admin.ejs'), 'utf8');
  const body = ejs.render(template, {}, { filename: path.join(TEMPLATES_DIR, 'admin.ejs') });

  const layout = await readFile(path.join(TEMPLATES_DIR, '_layout.ejs'), 'utf8');
  return ejs.render(layout, { body, pageTitle: '新增字体', baseUrl: '' }, { filename: path.join(TEMPLATES_DIR, '_layout.ejs') });
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

async function getNextSlug(): Promise<string> {
  const files = await readdir(FONTS_DIR);
  const slugs = files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  return `new-font-${slugs.length + 1}`;
}

async function handlePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await parseBody(req);
  const form = parseFormData(body);

  const slug = form.slug?.trim() || await getNextSlug();

  const arraysFromComma = (value: string | undefined): string[] =>
    (value ?? '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);

  const rawFont: Record<string, unknown> = {
    slug,
    name: {
      zh: form.nameZh?.trim() || undefined,
      en: form.nameEn?.trim() || undefined,
    },
    vendor: form.vendor?.trim() ?? '',
    version: form.version?.trim() ?? '1.0.0',
    license: form.license?.trim() ?? '',
    languages: arraysFromComma(form.languages),
    formats: arraysFromComma(form.formats),
    weights: arraysFromComma(form.weights),
    officialUrl: form.officialUrl?.trim() ?? '',
    description: form.description?.trim() || undefined,
    category: form.category?.trim() || undefined,
    tags: arraysFromComma(form.tags),
    constraints: (form.constraints ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
    addedAt: form.addedAt?.trim() ?? new Date().toISOString().slice(0, 10),
    notes: form.notes?.trim() || undefined,
  };

  if (form.sha256?.trim()) {
    rawFont.sha256 = form.sha256.trim();
  }
  if (form.glyphCount?.trim()) {
    rawFont.glyphCount = Number(form.glyphCount.trim());
  }
  if (form.cover?.trim()) {
    rawFont.cover = form.cover.trim();
  }
  if (form.preview?.trim()) {
    rawFont.preview = form.preview.trim();
  }

  const result = fontSchema.safeParse(rawFont);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`校验失败：\n${issues}`);
    return;
  }

  const fontPath = path.join(FONTS_DIR, `${slug}.json`);
  await writeFile(fontPath, JSON.stringify(result.data, null, 2) + '\n', 'utf8');

  res.writeHead(302, { Location: '/admin?ok=1' });
  res.end();
}

async function serveStatic(res: ServerResponse, urlPath: string): Promise<boolean> {
  const filePath = path.join(DOCS_DIR, urlPath === '/' ? 'index.html' : urlPath);
  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/admin') {
    if (req.method === 'POST') {
      try {
        await handlePost(req, res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`服务器错误：${(err as Error).message}`);
      }
      return;
    }
    const html = await renderAdmin();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  const served = await serveStatic(res, url.pathname);
  if (!served) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`开发服务器已启动：http://localhost:${PORT}`);
  console.log(`新增字体页面：http://localhost:${PORT}/admin`);
  console.log(`按 Ctrl+C 停止`);
});
