import { createHash } from 'node:crypto'
import type { AppConfig } from '../core/types'

export function sha256Hex(data: Uint8Array | string): string {
  const hash = createHash('sha256')
  hash.update(data)
  return `sha256:${hash.digest('hex')}`
}

// 配置哈希覆盖所有影响输出的配置项（FR-6.8），包括 CLI 覆盖项
export function configHash(config: AppConfig, cliText?: string, cliScripts?: string): string {
  const payload = {
    sizes: config.sizes,
    format: config.format,
    quality: config.quality,
    threshold: config.threshold,
    background: config.background,
    color: config.color,
    maxImageWidth: config.maxImageWidth,
    coverWidth: config.coverWidth,
    showMissing: config.showMissing,
    poem: config.poem,
    cliText: cliText ?? null,
    cliScripts: cliScripts ?? null,
  }
  return sha256Hex(JSON.stringify(payload))
}
