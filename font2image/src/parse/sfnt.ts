// SFNT 容器重建：woff2 解包与 ttc 拆包共用。
// 目录按标签排序，表数据 4 字节对齐，校验和按目录要求重新计算。

export interface SfntTableInput {
  tag: string
  data: Uint8Array
}

export function tableChecksum(data: Uint8Array): number {
  let sum = 0
  const padded = Math.ceil(data.length / 4) * 4
  for (let i = 0; i < padded; i += 4) {
    sum =
      (sum +
        (((data[i] ?? 0) << 24) |
          ((data[i + 1] ?? 0) << 16) |
          ((data[i + 2] ?? 0) << 8) |
          (data[i + 3] ?? 0))) >>>
      0
  }
  return sum >>> 0
}

export function buildSfnt(flavor: number, tables: SfntTableInput[]): Uint8Array {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : 1))
  const numTables = sorted.length
  const dirSize = 12 + numTables * 16
  let dataOffset = dirSize
  const layout = sorted.map(({ tag, data }) => {
    const aligned = dataOffset
    dataOffset += Math.ceil(data.length / 4) * 4
    return { tag, data, offset: aligned }
  })

  const out = new Uint8Array(dataOffset)
  const view = new DataView(out.buffer)

  view.setUint32(0, flavor)
  view.setUint16(4, numTables)
  const entrySelector = Math.floor(Math.log2(numTables))
  const searchRange = 16 * 2 ** entrySelector
  view.setUint16(6, searchRange)
  view.setUint16(8, entrySelector)
  view.setUint16(10, numTables * 16 - searchRange)

  layout.forEach(({ tag, data, offset }, i) => {
    const dirPos = 12 + i * 16
    const tagBytes = tag.padEnd(4, ' ')
    for (let j = 0; j < 4; j++) out[dirPos + j] = tagBytes.charCodeAt(j)
    view.setUint32(dirPos + 4, tableChecksum(data))
    view.setUint32(dirPos + 8, offset)
    view.setUint32(dirPos + 12, data.length)
    out.set(data, offset)
  })

  return out
}
