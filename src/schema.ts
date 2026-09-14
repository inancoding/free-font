import { z } from 'zod';

/** 小写 kebab-case，同时用作字体文件名与 Release tag 的一部分 */
export const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 必须是小写 kebab-case，如 source-han-sans');

export const fontFormatSchema = z.enum([
  'otf',
  'ttf',
  'woff',
  'woff2',
  'ttc',
  'variable-ttf',
  'variable-otf',
]);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'addedAt 必须是 YYYY-MM-DD 格式');

export const categorySchema = z.enum(['sans-serif', 'serif', 'monospace', 'display', 'handwriting']);

/**
 * 字体元数据结构。
 *
 * 只校验形状，不管合规策略。授权是否允许镜像等逻辑在 policy.ts 中处理。
 */
export const fontSchema = z.object({
  slug: slugSchema,
  name: z
    .object({
      zh: z.string().min(1).optional(),
      en: z.string().min(1).optional(),
    })
    .refine((name) => name.zh !== undefined || name.en !== undefined, {
      message: 'name 必须至少提供 zh 或 en 其中之一',
    }),
  vendor: z.string().min(1),
  version: z.string().min(1),

  /** 授权标识，可以是已注册的 SPDX 标识符或厂商自定义名称 */
  license: z.string().min(1),

  languages: z.array(z.string().min(1)).min(1),
  formats: z.array(fontFormatSchema).min(1),
  weights: z.array(z.string().min(1)).min(1),

  officialUrl: z.url(),
  sourceUrl: z.url().optional(),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, 'sha256 必须是 64 位十六进制字符串')
    .optional(),

  /** 一句话简介，用于网站卡片展示 */
  description: z.string().optional(),
  /** 字体分类 */
  category: categorySchema.optional(),
  /** 直接下载链接（Release 资产、CDN 等），用于网站展示 */
  downloadUrl: z.url().optional(),

  tags: z.array(z.string().min(1)).default([]),
  constraints: z.array(z.string().min(1)).default([]),
  preview: z.string().min(1).optional(),
  addedAt: isoDateSchema,
  notes: z.string().optional(),
});

export type Font = z.infer<typeof fontSchema>;
export type FontFormat = z.infer<typeof fontFormatSchema>;
export type Category = z.infer<typeof categorySchema>;

/** sourceUrl + sha256 同时存在即视为已镜像 */
export function isMirrored(font: Font): boolean {
  return Boolean(font.sourceUrl && font.sha256);
}
