import { CHARSET_TABLE } from './charsets'
import type { CoverageResult, DetectedLang, DetectionResult, ScriptId } from './types'

export function computeCoverage(hasGlyph: (ch: string) => boolean): CoverageResult {
  const result = {} as Record<ScriptId, number>
  for (const set of CHARSET_TABLE) {
    const hit = set.chars.filter(hasGlyph).length
    result[set.id] = set.chars.length === 0 ? 0 : hit / set.chars.length
  }
  return result as CoverageResult
}

export function detectLanguage(coverage: CoverageResult, threshold: number): DetectionResult {
  const hasHans = coverage.hans >= threshold
  const hasHant = coverage.hant >= threshold
  const hasLetter = coverage.letter >= threshold
  const hasDigit = coverage.digit >= threshold

  let lang: DetectedLang
  if (hasHans && hasHant) lang = 'both'
  else if (hasHans) lang = 'hans'
  else if (hasHant) lang = 'hant'
  else if (hasLetter) lang = 'latin'
  else lang = 'unknown'

  const scripts: ScriptId[] = []
  if (lang === 'both') {
    scripts.push('hans', 'hant')
  } else if (lang === 'hans') {
    scripts.push('hans')
  } else if (lang === 'hant') {
    scripts.push('hant')
  }
  if (lang === 'latin' || lang === 'both' || lang === 'hans' || lang === 'hant') {
    if (hasLetter) scripts.push('letter')
    if (hasDigit) scripts.push('digit')
  }
  if (lang === 'unknown') scripts.push('letter', 'digit')

  return { lang, scripts, coverage }
}
