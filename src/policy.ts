import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { LICENSES_DIR, PREVIEW_DIR } from './paths.ts';
import { getLicense, isMirrorAllowed } from './licenses.ts';
import type { LoadedFont, ValidationError } from './load-fonts.ts';

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

/** licenses/<slug>/ 下是否存在至少一个非空文件 */
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
 * 合规与一致性策略。
 *
 * schema 只管结构，这里管「能不能这么干」。核心不变量：
 * mirror=true 的字体，其授权必须已核实且明确允许再分发，
 * 并且仓库里必须有授权原文副本和明确的来源地址。
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

    const license = getLicense(font.license);
    if (!license) {
      push('license', `未知授权 "${font.license}"，请先在 src/licenses.ts 注册`);
      continue;
    }

    // 缺少溯源信息的 "verified" 标记不可信，会架空整个 fail-safe 设计
    if (license.verified && (!license.verifiedFrom || !license.verifiedAt)) {
      push(
        'license',
        `授权 ${license.id} 标记为 verified 但缺少 verifiedFrom / verifiedAt，` +
          `请在 src/licenses.ts 补全一手来源 URL 与核实日期`,
      );
    }

    if (font.mirror) {
      if (!isMirrorAllowed(license)) {
        const reason = !license.verified
          ? '授权条款尚未经人工核实（verified=false）'
          : '该授权不允许再分发字体二进制';
        push(
          'mirror',
          `禁止镜像：${reason}。只能设 mirror=false 并以外链形式收录 ${license.name}`,
        );
      }

      if (!font.sourceUrl) {
        push(
          'sourceUrl',
          'mirror=true 时必须提供 sourceUrl，用于记录被镜像二进制的官方来源，便于核实与响应删除请求',
        );
      }

      if (!font.sha256) {
        push(
          'sha256',
          'mirror=true 时必须提供 sourceUrl 产物的 SHA-256，否则 CI 无法验证下载到的字节就是核实过的那一份',
        );
      }

      if (license.requiresLicenseText && !(await hasLicenseText(font.slug))) {
        push(
          'license',
          `mirror=true 时必须在 licenses/${font.slug}/ 存放 ${license.name} 原文副本`,
        );
      }
    }

    if (font.preview) {
      const previewPath = path.join(PREVIEW_DIR, path.basename(font.preview));
      if (!(await exists(previewPath))) {
        push('preview', `预览图不存在：preview/${path.basename(font.preview)}`, 'warn');
      }
    }

    const added = new Date(font.addedAt);
    if (!Number.isNaN(added.getTime()) && added.getTime() > Date.now()) {
      push('addedAt', `addedAt ${font.addedAt} 是未来日期`, 'warn');
    }
  }

  return errors;
}
