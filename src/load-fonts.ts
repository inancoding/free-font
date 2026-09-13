import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { FONTS_DIR, REPO_ROOT } from './paths.ts';
import { fontSchema, type Font } from './schema.ts';

export interface ValidationError {
  /** 相对仓库根目录的文件路径 */
  file: string;
  /** 出错的字段路径，非字段级错误为空串 */
  field: string;
  message: string;
  /** error 阻止发版；warn 仅提示 */
  severity: 'error' | 'warn';
}

export interface LoadedFont {
  /** 相对仓库根目录的文件路径，用于错误定位 */
  relPath: string;
  /** 由文件名推导出的 slug，用于和 JSON 内的 slug 交叉校验 */
  slugFromFilename: string;
  font: Font;
}

export interface LoadResult {
  fonts: LoadedFont[];
  errors: ValidationError[];
}

function rel(absPath: string): string {
  return path.relative(REPO_ROOT, absPath).replaceAll('\\', '/');
}

/** 把 zod 的 issue 列表转成本项目统一的错误结构 */
function toValidationErrors(file: string, issues: z.ZodIssue[]): ValidationError[] {
  return issues.map((issue) => ({
    file,
    field: issue.path.join('.'),
    message: issue.message,
    severity: 'error' as const,
  }));
}

export async function loadFonts(): Promise<LoadResult> {
  const fonts: LoadedFont[] = [];
  const errors: ValidationError[] = [];

  let entries: string[];
  try {
    entries = await readdir(FONTS_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        fonts,
        errors: [
          {
            file: 'fonts/',
            field: '',
            message: 'fonts/ 目录不存在，尚无任何字体元数据',
            severity: 'error',
          },
        ],
      };
    }
    throw err;
  }

  const jsonFiles = entries.filter((name) => name.endsWith('.json')).sort();

  for (const name of jsonFiles) {
    const abs = path.join(FONTS_DIR, name);
    const relPath = rel(abs);
    const slugFromFilename = name.slice(0, -'.json'.length);

    let raw: string;
    try {
      raw = await readFile(abs, 'utf8');
    } catch (err) {
      errors.push({
        file: relPath,
        field: '',
        message: `读取失败：${(err as Error).message}`,
        severity: 'error',
      });
      continue;
    }

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      errors.push({
        file: relPath,
        field: '',
        message: `JSON 解析失败：${(err as Error).message}`,
        severity: 'error',
      });
      continue;
    }

    const parsed = fontSchema.safeParse(data);
    if (!parsed.success) {
      errors.push(...toValidationErrors(relPath, parsed.error.issues));
      continue;
    }

    fonts.push({ relPath, slugFromFilename, font: parsed.data });
  }

  return { fonts, errors };
}
