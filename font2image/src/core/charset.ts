import { CJK_CHARSET_TABLE } from './charset-probes'
import type { CjkCharsetStandard } from './types'

export function computeCharsetCoverage(
  hasGlyph: (ch: string) => boolean,
): Record<CjkCharsetStandard, number> {
  const result = {} as Record<CjkCharsetStandard, number>
  for (const set of CJK_CHARSET_TABLE) {
    const hit = set.chars.filter(hasGlyph).length
    result[set.id] = set.chars.length === 0 ? 0 : hit / set.chars.length
  }
  return result
}
