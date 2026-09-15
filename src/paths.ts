import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, '..');
export const FONTS_DIR = path.join(REPO_ROOT, 'fonts');
export const LICENSES_DIR = path.join(REPO_ROOT, 'licenses');
export const IMAGES_DIR = path.join(REPO_ROOT, 'public', 'images');
export const ZIPS_DIR = path.join(REPO_ROOT, 'zips');
export const ZIPS_TMP_DIR = path.join(ZIPS_DIR, '.tmp');
