import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Manifest, ManifestFont } from '../core/types'

export const MANIFEST_FILE = 'manifest.json'

export function loadManifest(outDir: string): Manifest {
  const file = path.join(outDir, MANIFEST_FILE)
  if (existsSync(file)) {
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as Manifest
      if (parsed && Array.isArray(parsed.fonts)) return parsed
    } catch {
      // 损坏的 manifest 视为空，重新生成
    }
  }
  return { version: 1, tool: 'font2image', generatedAt: '', fonts: [] }
}

export function saveManifest(outDir: string, manifest: Manifest): void {
  mkdirSync(outDir, { recursive: true })
  manifest.generatedAt = new Date().toISOString()
  writeFileSync(path.join(outDir, MANIFEST_FILE), JSON.stringify(manifest, null, 2), 'utf8')
}

export function upsertFont(manifest: Manifest, entry: ManifestFont): void {
  const idx = manifest.fonts.findIndex((f) => f.file === entry.file)
  if (idx >= 0) manifest.fonts[idx] = entry
  else manifest.fonts.push(entry)
}
