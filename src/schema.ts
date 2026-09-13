import { z } from 'zod';
import { LICENSE_IDS } from './licenses.ts';

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

/**
 * 字体元数据结构。
 *
 * 这里只校验「形状」。合规策略（授权是否允许镜像、授权原文是否存在）
 * 在 policy.ts 中单独校验，因为那需要访问授权注册表和文件系统，
 * 分开写才能给出精确的错误定位。
 */
export const fontSchema = z.object({
  slug: slugSchema,
  name: z.object({
    zh: z.string().min(1),
    en: z.string().min(1).optional(),
  }),
  vendor: z.string().min(1),
  version: z.string().min(1),

  /** 必须是 LICENSE_IDS 之一，由 policy 层交叉校验 */
  license: z.enum(LICENSE_IDS as [string, ...string[]]),

  /** 覆盖语言/字符集，BCP 47 风格，如 zh-Hans、zh-Hant、ja、ko、latin */
  languages: z.array(z.string().min(1)).min(1),
  formats: z.array(fontFormatSchema).min(1),
  weights: z.array(z.string().min(1)).min(1),

  /** 官方仓库或官方下载页 */
  officialUrl: z.url(),
  /** 可直接下载字体文件的地址，用于死链检查 */
  sourceUrl: z.url().optional(),

  /**
   * 是否把字体二进制镜像到本仓库 Release。
   * true 时 policy 层会强制要求授权已核实且允许再分发，并要求授权原文副本存在。
   */
  mirror: z.boolean(),

  tags: z.array(z.string().min(1)).default([]),
  /** preview/<file> 的相对路径 */
  preview: z.string().min(1).optional(),
  addedAt: isoDateSchema,
  notes: z.string().optional(),
});

export type Font = z.infer<typeof fontSchema>;
export type FontFormat = z.infer<typeof fontFormatSchema>;
