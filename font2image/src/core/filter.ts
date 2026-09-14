export interface FilterResult {
  text: string
  removedCount: number
  missingChars: string[]
}

// 剔除字体不包含的字符；空格与换行保留。
// showMissing = true 时保留缺字（渲染为豆腐块），仅统计。
export function filterMissing(
  text: string,
  hasGlyph: (ch: string) => boolean,
  showMissing = false,
): FilterResult {
  const missing: string[] = []
  let kept = ''
  let removed = 0
  for (const ch of text) {
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      kept += ch
      continue
    }
    if (hasGlyph(ch)) {
      kept += ch
    } else {
      removed++
      if (!missing.includes(ch)) missing.push(ch)
      if (showMissing) kept += ch
    }
  }
  return { text: kept.trim(), removedCount: removed, missingChars: missing }
}
