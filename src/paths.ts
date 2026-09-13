import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, '..');
export const FONTS_DIR = path.join(REPO_ROOT, 'fonts');
export const LICENSES_DIR = path.join(REPO_ROOT, 'licenses');
export const PREVIEW_DIR = path.join(REPO_ROOT, 'preview');
