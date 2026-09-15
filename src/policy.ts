import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { IMAGES_DIR, LICENSES_DIR, ZIPS_DIR } from './paths.ts';
import { ALL_LICENSES, isMirrorAllowed } from './licenses.ts';
import { isMirrored } from './schema.ts';
import { artifactNameFor } from './tags.ts';
import type { LoadedFont, ValidationError } from './load-fonts.ts';

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function hasLicenseText(slug: string): Promise<boolean> {
  const dir = path.join(LICENSES_DIR, slug);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return false;
  }
  for (const entry of entries) {
    const info = await stat(path.join(dir, entry));
    if (info.isFile() && info.size > 0) return true;
  }
  return false;
}

/**
 * 一致性校验。slug 匹配和重复检查是 error，其余均为 warn。
 */
export async function checkPolicies(fonts: LoadedFont[]): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const seenSlugs = new Map<string, string>();

  for (const { relPath, slugFromFilename, font } of fonts) {
    const push = (field: string, message: string, severity: 'error' | 'warn' = 'error') => {
      errors.push({ file: relPath, field, message, severity });
    };

    if (font.slug !== slugFromFilename) {
      push(
        'slug',
        `slug "${font.slug}" 与文件名 "${slugFromFilename}.json" 不一致，Release tag 与授权目录都依赖 slug，必须统一`,
      );
    }

    const dup = seenSlugs.get(font.slug);
    if (dup) {
      push('slug', `slug "${font.slug}" 重复，已出现在 ${dup}`);
    } else {
      seenSlugs.set(font.slug, relPath);
    }

    if (!(font.license in ALL_LICENSES)) {
      push('license', `未注册授权 "${font.license}"，建议在 src/licenses.ts 补充信息`, 'warn');
    }

    if (isMirrored(font)) {
      const license = ALL_LICENSES[font.license];
      if (license && !isMirrorAllowed(license)) {
        const reason = !license.verified
          ? '授权条款尚未经人工核实'
          : '该授权不允许再分发字体二进制';
        push('mirror', `发版提醒：${reason}，请确认法律风险`, 'warn');
      }

      if (license?.requiresLicenseText && !(await hasLicenseText(font.slug))) {
        push(
          'license',
          `建议在 licenses/${font.slug}/ 存放授权原文副本`,
          'warn',
        );
      }

      const zipPath = path.join(ZIPS_DIR, artifactNameFor(font));
      if (!(await exists(zipPath))) {
        push('sha256', `ZIP 产物不存在：zips/${artifactNameFor(font)}`, 'error');
      }
    }

    if (font.cover) {
      const coverPath = path.join(IMAGES_DIR, path.basename(font.cover));
      if (!(await exists(coverPath))) {
        push('cover', `封面图不存在：images/${path.basename(font.cover)}`, 'warn');
      }
    }

    if (font.preview) {
      const previewPath = path.join(IMAGES_DIR, path.basename(font.preview));
      if (!(await exists(previewPath))) {
        push('preview', `预览图不存在：images/${path.basename(font.preview)}`, 'warn');
      }
    }

    const added = new Date(font.addedAt);
    if (!Number.isNaN(added.getTime()) && added.getTime() > Date.now()) {
      push('addedAt', `addedAt ${font.addedAt} 是未来日期`, 'warn');
    }
  }

  return errors;
}
