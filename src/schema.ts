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

export const categorySchema = z.enum(['楷体', '宋体', '黑体', '手写体', '艺术体', '手绘体', '英文字体']);

/**
 * 字体元数据结构。
 *
 * 只校验形状，不管合规策略。
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

  /** 来源页（字体官网，非下载链接） */
  officialUrl: z.url(),
  /** 产物 SHA-256，有值即视为已发版 */
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, 'sha256 必须是 64 位十六进制字符串')
    .optional(),

  /** 一句话简介，用于网站卡片展示 */
  description: z.string().optional(),
  /** 字体分类 */
  category: categorySchema.optional(),
  /** 字形数（收录字数） */
  glyphCount: z.number().int().positive().optional(),
  /** 直接下载链接（Release 附件直链） */
  downloadUrl: z.url().optional(),

  tags: z.array(z.string().min(1)).default([]),
  constraints: z.array(z.string().min(1)).default([]),

  /** 封面图文件名（400px，首页卡片用） */
  cover: z.string().min(1).optional(),
  /** 预览图文件名（192px，详情页用） */
  preview: z.string().min(1).optional(),

  addedAt: isoDateSchema,
  notes: z.string().optional(),
});

export type Font = z.infer<typeof fontSchema>;
export type FontFormat = z.infer<typeof fontFormatSchema>;
export type Category = z.infer<typeof categorySchema>;

/** 有 sha256 即视为已发版（手动上传到 Release） */
export function isMirrored(font: Font): boolean {
  return Boolean(font.sha256);
}
