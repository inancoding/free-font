import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { randomGradient } from '../core/gradient'
import { detectLanguage, computeCoverage } from '../core/detect'
import { filterMissing } from '../core/filter'
import { dedupe, fontBaseName, outputFileNameFromBase } from '../core/naming'
import { getPoem, type Poem } from '../core/poems'
import { composeSpecimen } from '../core/samples'
import type { AppConfig, ManifestFont, ScriptId } from '../core/types'
import { extractCharsetInfo, extractMeta, makeHasGlyph, parseFont } from '../parse/font'
import type { RenderSession } from './browser'
import { decodeFontBytes } from './decode'
import { sha256Hex } from './incremental'

export interface PipelineContext {
  config: AppConfig
  cfgHash: string
  poems: Poem[]
  cliText?: string
  cliScripts?: ScriptId[]
  force: boolean
  outDir: string
  session: RenderSession
  usedIds: Set<string>
}

export interface FontOutcome {
  file: string
  status: 'ok' | 'skipped' | 'error'
  reason?: string
  warnings: string[]
  imageCount: number
  entry?: ManifestFont
}

export async function processFont(
  filePath: string,
  existing: ManifestFont | undefined,
  ctx: PipelineContext,
): Promise<FontOutcome> {
  const { config } = ctx
  const file = path.resolve(filePath)
  const base = path.basename(file)
  const warnings: string[] = []

  const sizeMB = statSync(file).size / (1024 * 1024)
  if (sizeMB > config.maxFileSizeMB) {
    return {
      file,
      status: 'error',
      reason: `文件过大（${sizeMB.toFixed(1)}MB > ${config.maxFileSizeMB}MB 上限）`,
      warnings,
      imageCount: 0,
    }
  }

  const gradient = randomGradient()

  const bytes = new Uint8Array(readFileSync(file))
  const fileHash = sha256Hex(bytes)

  // 增量判定（FR-6.8）：字体哈希 + 配置哈希均未变化且产物齐全时跳过
  if (
    !ctx.force &&
    existing &&
    existing.fileHash === fileHash &&
    existing.configHash === ctx.cfgHash &&
    existing.images.length > 0 &&
    existing.images.every((img) => existsSync(path.join(ctx.outDir, img.path)))
  ) {
    return { file, status: 'skipped', reason: '增量跳过（字体与配置均未变化）', warnings, imageCount: 0 }
  }

  let decoded: Uint8Array
  try {
    decoded = decodeFontBytes(bytes)
  } catch (err) {
    return { file, status: 'error', reason: `字体解码失败：${(err as Error).message}`, warnings, imageCount: 0 }
  }

  let font
  try {
    font = parseFont(decoded)
  } catch (err) {
    return { file, status: 'error', reason: `字体解析失败：${(err as Error).message}`, warnings, imageCount: 0 }
  }

  const meta = extractMeta(font, base)
  const hasGlyph = makeHasGlyph(font)
  const coverage = computeCoverage(hasGlyph)
  const detection = detectLanguage(coverage, config.threshold)
  const charset = extractCharsetInfo(font, hasGlyph)

  if (detection.lang === 'unknown') {
    warnings.push('字符覆盖不足，无法可靠判定语种，按「英文（字母+数字）」处理')
  }

  const scripts = ctx.cliScripts ?? detection.scripts
  const outBase = dedupe(fontBaseName(base), ctx.usedIds)
  ctx.usedIds.add(outBase)

  // 单图模式（FR-6.3）：每字体每高度一张图，样张为组合后的单一多行文本
  const rawText = ctx.cliText ?? composeSpecimen(scripts, getPoem(ctx.poems, config.poem))
  const filtered = filterMissing(rawText, hasGlyph, config.showMissing)
  if (filtered.removedCount > 0) {
    warnings.push(
      `样张过滤了 ${filtered.removedCount} 个缺字：${filtered.missingChars.slice(0, 16).join(' ')}${filtered.missingChars.length > 16 ? '…' : ''}`,
    )
  }
  if (filtered.text.trim().length === 0) {
    return { file, status: 'error', reason: '样张过滤后为空，无法生成图片', warnings, imageCount: 0 }
  }

  const images: ManifestFont['images'] = []
  mkdirSync(ctx.outDir, { recursive: true })

  for (const size of config.sizes) {
    const result = await ctx.session.render({
      fontBytes: decoded,
      text: filtered.text,
      targetHeight: size,
      background: config.background,
      color: config.color,
      maxWidth: config.maxImageWidth,
      format: config.format,
      quality: config.quality,
      gradient,
    })
    const fileName = outputFileNameFromBase(outBase, size, config.format)
    writeFileSync(path.join(ctx.outDir, fileName), Buffer.from(result.base64, 'base64'))
    images.push({
      path: fileName,
      size,
      format: config.format,
      specimen: filtered.text,
      width: result.width,
      height: result.height,
      generatedAt: new Date().toISOString(),
    })
  }

  // 网页封面图（FR-6.9）：3:1，字体名称 + Hello World! 123
  const displayName = meta.family.zh || meta.family.en || outBase
  const cover = await ctx.session.renderCover({
    fontBytes: decoded,
    name: displayName,
    width: config.coverWidth,
    background: config.background,
    color: config.color,
    format: config.format,
    quality: config.quality,
    gradient,
  })
  const coverName = `${outBase}-cover.${config.format}`
  writeFileSync(path.join(ctx.outDir, coverName), Buffer.from(cover.base64, 'base64'))
  images.push({
    path: coverName,
    size: cover.height,
    format: config.format,
    specimen: displayName,
    width: cover.width,
    height: cover.height,
    generatedAt: new Date().toISOString(),
  })

  const entry: ManifestFont = {
    file,
    fileHash,
    configHash: ctx.cfgHash,
    family: meta.family,
    style: meta.style,
    license: meta.license,
    detected: detection.lang,
    scripts,
    coverage,
    charset,
    images,
  }
  return { file, status: 'ok', warnings, imageCount: images.length, entry }
}
