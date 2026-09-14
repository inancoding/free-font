// WOFF2 → SFNT 解包（CLI 模式专用，FR-1.1）
// 使用 Node 内置 zlib 的 brotli 解压缩，按 WOFF2 规范重建字体容器。
// 当前支持未做表格变换（transformVersion = 0）的字体；
// 使用了 glyf/loca 变换的 woff2 会抛出明确错误，在报告中记为跳过。
import { brotliDecompressSync } from 'node:zlib'
import { buildSfnt } from './sfnt'

// WOFF2 规范 Table 1 中本工具可可靠映射的前 20 个已知标签；
// 索引 >= 20 的标签无法确认映射时直接报错，避免产出错误字体。
const KNOWN_TAGS: Record<number, string> = {
  0: 'cmap',
  1: 'head',
  2: 'hhea',
  3: 'hmtx',
  4: 'maxp',
  5: 'name',
  6: 'OS/2',
  7: 'post',
  8: 'cvt ',
  9: 'fpgm',
  10: 'glyf',
  11: 'hdmx',
  12: 'kern',
  13: 'loca',
  14: 'prep',
  15: 'CFF ',
  16: 'VORG',
  17: 'EBDT',
  18: 'EBLC',
  19: 'gasp',
}

interface Woff2TableEntry {
  tag: string
  transformVersion: number
  origLength: number
  transformLength?: number
}

class Reader {
  private pos = 0
  constructor(private data: Uint8Array) {}

  get position() {
    return this.pos
  }

  byte(): number {
    if (this.pos >= this.data.length) throw new Error('woff2 数据提前结束')
    return this.data[this.pos++]!
  }

  u16(): number {
    return (this.byte() << 8) | this.byte()
  }

  u32(): number {
    return ((this.byte() << 24) | (this.byte() << 16) | (this.byte() << 8) | this.byte()) >>> 0
  }

  tag(): string {
    const bytes = [this.byte(), this.byte(), this.byte(), this.byte()]
    return String.fromCharCode(...bytes)
  }

  // UIntBase128：每字节高位为延续标志，最多 5 字节
  base128(): number {
    let result = 0
    for (let i = 0; i < 5; i++) {
      const b = this.byte()
      if (i === 0 && b === 0x80) throw new Error('woff2 UIntBase128 存在前导零')
      if (result >>> 25 !== 0) throw new Error('woff2 UIntBase128 数值溢出')
      result = (result << 7) | (b & 0x7f)
      if ((b & 0x80) === 0) return result >>> 0
    }
    throw new Error('woff2 UIntBase128 超过 5 字节')
  }
}

export function woff2ToSfnt(buffer: Uint8Array): Uint8Array {
  const r = new Reader(buffer)

  const signature = r.tag()
  if (signature !== 'wOF2') throw new Error(`不是有效的 woff2 文件（签名 ${signature}）`)
  const flavor = r.u32()
  const totalLength = r.u32()
  const numTables = r.u16()
  r.u16() // reserved
  r.u32() // totalSfntSize：重建时以实际表数据为准，不使用该声明值
  const totalCompressedSize = r.u32()
  r.u16() // majorVersion
  r.u16() // minorVersion
  r.u32() // metaOffset
  r.u32() // metaLength
  r.u32() // metaOrigLength
  r.u32() // privOffset
  r.u32() // privLength

  if (totalLength !== buffer.length) {
    throw new Error(`woff2 声明长度 ${totalLength} 与实际 ${buffer.length} 不符`)
  }

  const entries: Woff2TableEntry[] = []
  for (let i = 0; i < numTables; i++) {
    const flags = r.byte()
    const tagIdx = flags & 0x3f
    const transformVersion = (flags >> 6) & 0x03
    let tag: string
    if (tagIdx === 63) {
      tag = r.tag()
    } else if (tagIdx in KNOWN_TAGS) {
      tag = KNOWN_TAGS[tagIdx]!
    } else {
      throw new Error(`woff2 使用了本工具暂不支持的已知表索引（${tagIdx}），请先转换为 ttf/otf`)
    }
    const origLength = r.base128()
    let transformLength: number | undefined
    if ((tag === 'glyf' || tag === 'loca') && transformVersion !== 0) {
      transformLength = r.base128()
    }
    entries.push({ tag, transformVersion, origLength, transformLength })
  }

  const compressed = buffer.slice(r.position, r.position + totalCompressedSize)
  const decompressed = new Uint8Array(brotliDecompressSync(Buffer.from(compressed)))

  // 按目录顺序切分解压后的表数据
  const tables: { entry: Woff2TableEntry; data: Uint8Array }[] = []
  let offset = 0
  for (const entry of entries) {
    const len = entry.transformLength ?? entry.origLength
    const data = decompressed.slice(offset, offset + len)
    if (data.length !== len) throw new Error(`woff2 解压数据不足（表 ${entry.tag}）`)
    offset += len
    if (entry.transformVersion !== 0 && (entry.tag === 'glyf' || entry.tag === 'loca')) {
      throw new Error('该 woff2 对 glyf/loca 使用了表格变换，暂不支持解包，请先转换为 ttf/otf 后重试')
    }
    if (entry.transformVersion !== 0) {
      throw new Error(`woff2 表 ${entry.tag} 使用了暂不支持的变换，请先转换为 ttf/otf`)
    }
    tables.push({ entry, data })
  }

  // loca 一致性校验（需要 maxp 的 numGlyphs）
  const maxp = tables.find((t) => t.entry.tag === 'maxp')
  const loca = tables.find((t) => t.entry.tag === 'loca')
  if (maxp && loca) {
    const numGlyphs = (maxp.data[4]! << 8) | maxp.data[5]!
    const expectedShort = (numGlyphs + 1) * 2
    const expectedLong = (numGlyphs + 1) * 4
    if (loca.entry.origLength !== expectedShort && loca.entry.origLength !== expectedLong) {
      throw new Error('woff2 解包结果校验失败：loca 表长度与 maxp 不一致')
    }
  }

  // 重建 SFNT（共享实现：目录按标签排序，表数据 4 字节对齐）
  return buildSfnt(
    flavor,
    tables.map(({ entry, data }) => ({ tag: entry.tag, data })),
  )
}
