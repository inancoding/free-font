import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ejs from 'ejs';
import { checkPolicies } from '../src/policy.ts';
import { loadFonts } from '../src/load-fonts.ts';
import { ALL_LICENSES } from '../src/licenses.ts';
import { isMirrored, type Font } from '../src/schema.ts';
import { REPO_ROOT } from '../src/paths.ts';
import { releaseUrlFor } from '../src/tags.ts';

const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const MANIFEST_PATH = path.join(IMAGES_DIR, 'manifest.json');

interface ManifestImage {
  path: string;
  size: number;
  format: string;
}

interface ManifestFont {
  file: string;
  family: { en?: string; zh?: string };
  images: ManifestImage[];
}

interface Manifest {
  fonts: ManifestFont[];
}

function loadPreviewManifest(): Manifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function findPreviewForFont(manifest: Manifest | null, font: Font): string | undefined {
  if (!manifest) return undefined;
  const fontNameEn = font.name.en?.toLowerCase();
  const fontNameZh = font.name.zh?.toLowerCase();

  let prefixMatch: string | undefined;

  for (const mf of manifest.fonts) {
    const mfEn = mf.family.en?.toLowerCase();
    const mfZh = mf.family.zh?.toLowerCase();

    const exactEn = fontNameEn && mfEn && fontNameEn === mfEn;
    const exactZh = fontNameZh && mfZh && fontNameZh === mfZh;
    if (exactEn || exactZh) {
      const img = mf.images.find((i) => i.size === 192);
      if (img) return img.path;
    }

    if (!prefixMatch) {
      const startsEn = fontNameEn && mfEn && mfEn.startsWith(fontNameEn);
      const startsZh = fontNameZh && mfZh && mfZh.startsWith(fontNameZh);
      if (startsEn || startsZh) {
        const img = mf.images.find((i) => i.size === 192);
        if (img) prefixMatch = img.path;
      }
    }
  }
  return prefixMatch;
}

async function renderTemplate(name: string, data: Record<string, unknown>): Promise<string> {
  const template = await readFile(path.join(TEMPLATES_DIR, name), 'utf8');
  return ejs.render(template, data, { filename: path.join(TEMPLATES_DIR, name) });
}

function wrapLayout(body: string, pageTitle: string, baseUrl: string): string {
  const layoutTemplate = readFileSync(path.join(TEMPLATES_DIR, '_layout.ejs'), 'utf8');
  return ejs.render(layoutTemplate, { body, pageTitle, baseUrl }, { filename: path.join(TEMPLATES_DIR, '_layout.ejs') });
}

function toFontData(font: Font, manifest: Manifest | null) {
  const mirrored = isMirrored(font);
  return {
    slug: font.slug,
    name: font.name,
    vendor: font.vendor,
    version: font.version,
    license: font.license,
    languages: font.languages,
    formats: font.formats,
    weights: font.weights,
    officialUrl: font.officialUrl,
    sourceUrl: font.sourceUrl,
    sha256: font.sha256,
    description: font.description,
    category: font.category,
    downloadUrl: font.downloadUrl,
    tags: font.tags,
    constraints: font.constraints,
    preview: findPreviewForFont(manifest, font),
    addedAt: font.addedAt,
    notes: font.notes,
    mirrored,
    releaseUrl: mirrored ? releaseUrlFor(font) : undefined,
  };
}

function buildDataJson(fonts: Font[], manifest: Manifest | null): string {
  const items = fonts.map((font) => ({
    slug: font.slug,
    name: font.name,
    vendor: font.vendor,
    license: font.license,
    languages: font.languages,
    category: font.category,
    tags: font.tags,
    description: font.description,
    preview: findPreviewForFont(manifest, font),
    officialUrl: font.officialUrl,
    downloadUrl: font.downloadUrl,
    mirrored: isMirrored(font),
  }));
  return JSON.stringify(items, null, 2);
}

async function main(): Promise<number> {
  const { fonts: loaded, errors } = await loadFonts();

  if (errors.length > 0) {
    const blocking = errors.filter((e) => e.severity === 'error');
    if (blocking.length > 0) {
      console.error(`存在 ${blocking.length} 个校验错误，请先运行 npm run validate 修复。`);
      return 1;
    }
  }

  const policyErrors = await checkPolicies(loaded);
  const blockingPolicy = policyErrors.filter((e) => e.severity === 'error');
  if (blockingPolicy.length > 0) {
    console.error(`存在 ${blockingPolicy.length} 个策略错误，请先运行 npm run validate 修复。`);
    return 1;
  }

  const fonts = loaded.map((l) => l.font);
  const manifest = loadPreviewManifest();
  const dataFonts = fonts.map((f) => toFontData(f, manifest));
  const mirroredCount = dataFonts.filter((f) => f.mirrored).length;
  const previewCount = dataFonts.filter((f) => f.preview).length;

  if (existsSync(DOCS_DIR)) {
    rmSync(DOCS_DIR, { recursive: true });
  }
  mkdirSync(DOCS_DIR, { recursive: true });
  mkdirSync(path.join(DOCS_DIR, 'fonts'), { recursive: true });

  const indexBody = await renderTemplate('index.ejs', { fonts: dataFonts, mirroredCount });
  const indexHtml = wrapLayout(indexBody, '首页', '');
  writeFileSync(path.join(DOCS_DIR, 'index.html'), indexHtml, 'utf8');
  console.log('生成 docs/index.html');

  for (const font of dataFonts) {
    const licenseInfo = ALL_LICENSES[font.license] ?? {
      id: font.license,
      name: font.license,
      url: '',
      verified: false,
      redistributable: false,
      commercialUse: false,
      requiresLicenseText: false,
    };
    const detailBody = await renderTemplate('font-detail.ejs', { font, licenseInfo });
    const detailHtml = wrapLayout(detailBody, `${font.name.zh || font.name.en || font.slug}`, '../');
    writeFileSync(path.join(DOCS_DIR, 'fonts', `${font.slug}.html`), detailHtml, 'utf8');
  }
  console.log(`生成 docs/fonts/ 下 ${dataFonts.length} 个详情页`);

  const aboutBody = await renderTemplate('about.ejs', {});
  const aboutHtml = wrapLayout(aboutBody, '关于', '');
  writeFileSync(path.join(DOCS_DIR, 'about.html'), aboutHtml, 'utf8');
  console.log('生成 docs/about.html');

  writeFileSync(path.join(DOCS_DIR, 'data.json'), buildDataJson(fonts, manifest), 'utf8');
  console.log('生成 docs/data.json');

  cpSync(PUBLIC_DIR, DOCS_DIR, { recursive: true });
  console.log('复制 public/ 静态资源到 docs/');

  console.log(`\n构建完成：${fonts.length} 款字体（镜像 ${mirroredCount} / 外链 ${fonts.length - mirroredCount} / 预览图 ${previewCount}）`);
  return 0;
}

process.exitCode = await main();
