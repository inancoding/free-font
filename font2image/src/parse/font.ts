import * as opentype from 'opentype.js'
import { CHARSET_PROBE_VERSION } from '../core/charset-probes'
import { computeCharsetCoverage } from '../core/charset'
import type { CharsetInfo, FontMeta } from '../core/types'
import { isTtc, ttcFirstFaceToSfnt } from './ttc'

// Node 解析到 UMD 构建（仅 default 导出），Vite 解析到 ESM 构建（仅具名导出），两者兼容
const ot = ((opentype as { default?: unknown }).default ?? opentype) as typeof opentype

export type OTFont = opentype.Font

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export function signatureOf(bytes: Uint8Array): string {
  if (bytes.length < 4) return ''
  return String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!)
}

// 把浏览器无法直接加载的容器拆成单个 SFNT 字体（当前仅 TTC）。
// UI 渲染（FontFace）与 CLI 渲染都需要独立字体，故两侧共用。
export function normalizeFontBytes(bytes: Uint8Array): Uint8Array {
  if (isTtc(bytes)) return ttcFirstFaceToSfnt(bytes)
  return bytes
}

// 注意：woff2 解包依赖 node:zlib，仅在 CLI 侧处理（见 cli/decode.ts），本模块保持浏览器可用
export function parseFont(rawBytes: Uint8Array): OTFont {
  const bytes = normalizeFontBytes(rawBytes)
  const sig = signatureOf(bytes)
  if (sig === 'wOF2') {
    throw new Error('该文件实际为 woff2 格式，本地 UI 无法解包。请先用 CLI 转换：pnpm gen <文件>.woff2')
  }
  const known = sig === 'OTTO' || sig === 'wOFF' || sig === 'true' || sig === 'typ1' || sig === '\x00\x01\x00\x00'
  if (!known) {
    const pretty = sig.replace(/[^\x20-\x7e]/g, '?') || '（空文件）'
    throw new Error(`无法识别的字体格式（签名 ${pretty}），支持 ttf / otf / woff / ttc`)
  }
  return ot.parse(toArrayBuffer(bytes))
}

function pickName(entry: unknown): { en?: string; zh?: string } {
  if (!entry) return {}
  if (typeof entry === 'string') return { en: entry }
  if (typeof entry !== 'object') return {}
  const record = entry as Record<string, string>
  const zhKey = Object.keys(record).find((k) => k.startsWith('zh'))
  return {
    en: record.en ?? record['en-US'],
    zh: zhKey ? record[zhKey] : undefined,
  }
}

export function extractMeta(font: OTFont, fileName: string): FontMeta {
  const names = font.names as Record<string, unknown>
  const family = pickName(names.fontFamily)
  if (!family.en && !family.zh) {
    family.en = fileName.replace(/\.[^.]+$/, '')
  }
  const styleEntry = pickName(names.fontSubfamily)
  const licenseEntry = pickName(names.license ?? names.licenseDescription)
  return {
    family,
    style: styleEntry.en ?? styleEntry.zh ?? 'Regular',
    license: licenseEntry.en ?? licenseEntry.zh,
  }
}

export function makeHasGlyph(font: OTFont): (ch: string) => boolean {
  return (ch: string) => font.charToGlyphIndex(ch) > 0
}

export function extractGlyphCount(font: OTFont): number {
  return font.tables?.maxp?.numGlyphs ?? 0
}

export function extractCharsetInfo(font: OTFont, hasGlyph: (ch: string) => boolean): CharsetInfo {
  return {
    ...computeCharsetCoverage(hasGlyph),
    glyphCount: extractGlyphCount(font),
    probeVersion: CHARSET_PROBE_VERSION,
  }
}
