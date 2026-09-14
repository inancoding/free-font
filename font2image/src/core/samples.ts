import {
  DIGITS,
  LETTERS_LOWER_A_M,
  LETTERS_LOWER_N_Z,
  LETTERS_UPPER_A_M,
  LETTERS_UPPER_N_Z,
  splitPoemLines,
  type Poem,
} from './poems'
import type { ScriptId } from './types'

// 单图模式（FR-5.1/5.2/5.3）：按所选字符类型组合为单一多行文本
// 顺序：简体诗词（两句一行）→ 繁体诗词 → 英文 → 数字
// english 可选：UI 传入可选择的英文预览句；CLI 不传则用固定字母四行
export function composeSpecimen(scripts: ScriptId[], poem: Poem, english?: string): string {
  const lines: string[] = []
  if (scripts.includes('hans')) lines.push(...splitPoemLines(poem.hans))
  if (scripts.includes('hant')) lines.push(...splitPoemLines(poem.hant))
  if (scripts.includes('letter')) {
    if (english !== undefined && english.trim()) lines.push(english)
    else lines.push(LETTERS_UPPER_A_M, LETTERS_UPPER_N_Z, LETTERS_LOWER_A_M, LETTERS_LOWER_N_Z)
  }
  if (scripts.includes('digit')) lines.push(DIGITS)
  return lines.join('\n')
}
