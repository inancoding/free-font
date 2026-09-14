import type { FontOutcome } from './pipeline'

const LABELS: Record<FontOutcome['status'], string> = {
  ok: '[✓]',
  skipped: '[→]',
  error: '[✗]',
}

export function printReport(outcomes: FontOutcome[], elapsedMs: number): void {
  console.log('')
  for (const o of outcomes) {
    const name = o.file
    let line = `${LABELS[o.status]} ${name}`
    if (o.status === 'ok') {
      line += ` → ${o.imageCount} 张图片`
      if (o.entry?.charset) {
        const c = o.entry.charset
        line += ` · GB2312 ${Math.round(c.gb2312 * 100)}% · GBK ${Math.round(c.gbk * 100)}% · Big5 ${Math.round(c.big5 * 100)}% · ${c.glyphCount.toLocaleString('zh-CN')} 字形`
      }
    }
    if (o.reason) line += `（${o.reason}）`
    console.log(line)
    for (const w of o.warnings) {
      console.log(`    ⚠ ${w}`)
    }
  }

  const ok = outcomes.filter((o) => o.status === 'ok').length
  const skipped = outcomes.filter((o) => o.status === 'skipped').length
  const errors = outcomes.filter((o) => o.status === 'error').length
  const imageCount = outcomes.reduce((sum, o) => sum + o.imageCount, 0)

  console.log('')
  console.log(
    `完成：共 ${outcomes.length} 个字体，成功 ${ok}，增量跳过 ${skipped}，失败 ${errors}，输出 ${imageCount} 张图片，耗时 ${(elapsedMs / 1000).toFixed(1)}s`,
  )
}
