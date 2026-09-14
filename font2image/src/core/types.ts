export type ScriptId = 'hans' | 'hant' | 'letter' | 'digit'

export type DetectedLang = 'hans' | 'hant' | 'both' | 'latin' | 'unknown'

export type OutputFormat = 'png' | 'webp' | 'jpg'

export interface CharsetDef {
  id: ScriptId
  label: string
  chars: string[]
}

export interface CoverageResult {
  hans: number
  hant: number
  letter: number
  digit: number
}

export interface DetectionResult {
  lang: DetectedLang
  scripts: ScriptId[]
  coverage: CoverageResult
}

export interface FontMeta {
  family: { en?: string; zh?: string }
  style: string
  license?: string
}

export type CjkCharsetStandard = 'gb2312' | 'gbk' | 'big5'

export interface CharsetInfo {
  gb2312: number
  gbk: number
  big5: number
  glyphCount: number
  probeVersion: number
}

export interface AppConfig {
  sizes: number[]
  format: OutputFormat
  quality: number
  threshold: number
  background: string
  color: string
  maxFileSizeMB: number
  maxImageWidth: number
  coverWidth: number
  recursive: boolean
  showMissing: boolean
  poem: string
}

export interface ManifestImage {
  path: string
  size: number
  format: OutputFormat
  specimen: string
  width: number
  height: number
  generatedAt: string
}

export interface ManifestFont {
  file: string
  fileHash: string
  configHash: string
  family: { en?: string; zh?: string }
  style: string
  license?: string
  detected: DetectedLang
  scripts: ScriptId[]
  coverage: CoverageResult
  charset: CharsetInfo
  images: ManifestImage[]
}

export interface Manifest {
  version: number
  tool: string
  generatedAt: string
  fonts: ManifestFont[]
}
