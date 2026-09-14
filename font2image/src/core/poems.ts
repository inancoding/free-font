// 样张文本库（FR-5）：诗词数据在项目根目录 poems.json，UI 与 CLI 共用，可人工新增。
// 每首诗词提供简体、繁体两个版本，逐字对应，不做运行时简繁转换。

export interface Poem {
  id: string
  title: string
  author: string
  hans: string
  hant: string
}

// 固定片段（FR-5.2）：大写在 M 后换行、小写在 m 后换行
export const LETTERS_UPPER_A_M = 'ABCDEFGHIJKLM'
export const LETTERS_UPPER_N_Z = 'NOPQRSTUVWXYZ'
export const LETTERS_LOWER_A_M = 'abcdefghijklm'
export const LETTERS_LOWER_N_Z = 'nopqrstuvwxyz'
export const DIGITS = '0123456789'

const SENTENCE_ENDINGS = '，。！？；、,.!?'

// 按标点断句，每两句排为一行（FR-5.1）
export function splitPoemLines(text: string, phrasesPerLine = 2): string[] {
  const phrases: string[] = []
  let current = ''
  for (const ch of text) {
    current += ch
    if (SENTENCE_ENDINGS.includes(ch)) {
      phrases.push(current)
      current = ''
    }
  }
  if (current.trim().length > 0) phrases.push(current)
  const lines: string[] = []
  for (let i = 0; i < phrases.length; i += phrasesPerLine) {
    lines.push(phrases.slice(i, i + phrasesPerLine).join(''))
  }
  return lines
}

export function parsePoems(data: unknown): Poem[] {
  if (!Array.isArray(data)) throw new Error('poems.json 格式错误：顶层应为诗词对象数组')
  const poems: Poem[] = []
  const seen = new Set<string>()
  for (let i = 0; i < data.length; i++) {
    const item = data[i] as Record<string, unknown>
    const where = `第 ${i + 1} 首`
    if (!item || typeof item !== 'object') throw new Error(`poems.json ${where}不是对象`)
    for (const key of ['id', 'title', 'hans', 'hant'] as const) {
      const v = item[key]
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw new Error(`poems.json ${where}缺少有效的 ${key} 字段（非空字符串）`)
      }
    }
    const id = (item.id as string).trim()
    if (seen.has(id)) throw new Error(`poems.json 存在重复 id：${id}`)
    seen.add(id)
    poems.push({
      id,
      title: (item.title as string).trim(),
      author: typeof item.author === 'string' ? item.author.trim() : '',
      hans: (item.hans as string).trim(),
      hant: (item.hant as string).trim(),
    })
  }
  if (poems.length === 0) throw new Error('poems.json 为空，至少需要一首诗词')
  return poems
}

export function getPoem(poems: Poem[], id: string | undefined): Poem {
  return poems.find((p) => p.id === id) ?? poems[0]!
}
