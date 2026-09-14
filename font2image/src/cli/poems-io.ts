import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parsePoems, type Poem } from '../core/poems'

export const POEMS_FILE = 'poems.json'

// 诗词库外部文件加载（FR-5 v1.3）：从工作目录读取，失败时给出明确原因
export function loadPoemsFile(cwd: string = process.cwd()): Poem[] {
  const file = path.join(cwd, POEMS_FILE)
  if (!existsSync(file)) {
    throw new Error(`未找到诗词库文件 ${file}（请在项目根目录运行，或恢复 poems.json）`)
  }
  let raw: string
  try {
    raw = readFileSync(file, 'utf8')
  } catch (err) {
    throw new Error(`poems.json 读取失败：${(err as Error).message}`)
  }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (err) {
    throw new Error(`poems.json 不是合法 JSON：${(err as Error).message}`)
  }
  return parsePoems(data)
}
