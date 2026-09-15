import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, FONTS_DIR } from '../src/paths.ts';
import { fontSchema } from '../src/schema.ts';
import { LICENSE_IDS, ALL_LICENSES } from '../src/licenses.ts';
import ejs from 'ejs';

const PORT = Number(process.env.PORT ?? 3000);
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

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
  const licenseOptions = LICENSE_IDS.map((id) => ({
    id,
    name: ALL_LICENSES[id]?.name ?? id,
  }));
  const body = ejs.render(template, { licenseOptions }, { filename: path.join(TEMPLATES_DIR, 'admin.ejs') });

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

function parseFormData(body: string): Record<string, string | string[]> {
  const params = new URLSearchParams(body);
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of params) {
    const existing = result[key];
    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
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

  const asArray = (value: string | string[] | undefined): string[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  };
  const asString = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
  };

  const slug = asString(form.slug).trim() || await getNextSlug();

  const rawFont: Record<string, unknown> = {
    slug,
    name: {
      zh: asString(form.nameZh).trim() || undefined,
      en: asString(form.nameEn).trim() || undefined,
    },
    vendor: asString(form.vendor).trim() ?? '',
    version: asString(form.version).trim() ?? '1.0.0',
    license: asString(form.license).trim() ?? '',
    languages: asArray(form.languages),
    formats: asArray(form.formats),
    weights: asArray(form.weights),
    officialUrl: asString(form.officialUrl).trim() ?? '',
    description: asString(form.description).trim() || undefined,
    category: asString(form.category).trim() || undefined,
    tags: asArray(form.tags),
    constraints: asString(form.constraints).split('\n').map((s) => s.trim()).filter(Boolean),
    addedAt: asString(form.addedAt).trim() || new Date().toISOString().slice(0, 10),
    notes: asString(form.notes).trim() || undefined,
  };

  if (asString(form.sha256).trim()) {
    rawFont.sha256 = asString(form.sha256).trim();
  }
  if (asString(form.glyphCount).trim()) {
    rawFont.glyphCount = Number(asString(form.glyphCount).trim());
  }
  if (asString(form.cover).trim()) {
    rawFont.cover = asString(form.cover).trim();
  }
  if (asString(form.preview).trim()) {
    rawFont.preview = asString(form.preview).trim();
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

  if (url.pathname === '/images/list.json') {
    const imagesDir = path.join(PUBLIC_DIR, 'images');
    try {
      const files = await readdir(imagesDir);
      const images = files.filter((f) => /\.(png|webp|jpg|jpeg|svg|gif)$/i.test(f)).sort();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(images));
      return;
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('[]');
      return;
    }
  }

  if (url.pathname.startsWith('/images/')) {
    const filePath = path.join(PUBLIC_DIR, url.pathname);
    try {
      const content = await readFile(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
      res.end(content);
      return;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
  }

  const served = await serveStatic(res, url.pathname);
  if (!served) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`错误：端口 ${PORT} 已被占用`);
    console.error(`请关闭占用该端口的程序，或使用 PORT=<端口号> pnpm run dev 指定其他端口`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`开发服务器已启动：http://localhost:${PORT}`);
  console.log(`新增字体页面：http://localhost:${PORT}/admin`);
  console.log(`按 Ctrl+C 停止`);
});
