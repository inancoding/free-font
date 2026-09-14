import { normalizeFontBytes, signatureOf } from '../parse/font'
import { woff2ToSfnt } from '../parse/woff2'

// CLI 专用字体字节解码（按文件签名分发，兼容扩展名与实际格式不符的文件）：
// - woff2：Node 内置 zlib 解包（FR-1.1）
// - ttc：拆包取集合内第一个字体（渲染用的 FontFace 同样只认单个字体）
// - 其余格式直接透传
export function decodeFontBytes(bytes: Uint8Array): Uint8Array {
  if (signatureOf(bytes) === 'wOF2') return woff2ToSfnt(bytes)
  return normalizeFontBytes(bytes)
}
