import { Command } from 'commander'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_CONFIG, mergeConfig } from '../core/config'
import type { AppConfig, OutputFormat, ScriptId } from '../core/types'
import { RenderSession } from './browser'
import { configHash } from './incremental'
import { loadManifest, saveManifest, upsertFont } from './manifest'
import { processFont } from './pipeline'
import { loadPoemsFile } from './poems-io'
import { printReport } from './report'
import { FONT_EXTENSIONS, scanFonts } from './scan'

const VALID_FORMATS: OutputFormat[] = ['png', 'webp', 'jpg']
const VALID_SCRIPTS: ScriptId[] = ['hans', 'hant', 'letter', 'digit']

function fail(message: string): never {
  console.error(`错误：${message}`)
  process.exit(1)
}

function loadConfigFile(configPath?: string): Partial<AppConfig> {
  const candidates = [configPath, 'font2image.config.json'].filter(Boolean) as string[]
  for (const file of candidates) {
    if (existsSync(file)) {
      try {
        return JSON.parse(readFileSync(file, 'utf8')) as Partial<AppConfig>
      } catch (err) {
        fail(`配置文件 ${file} 解析失败：${(err as Error).message}`)
      }
    }
    if (configPath) fail(`配置文件不存在：${configPath}`)
  }
  return {}
}

const program = new Command()
program
  .name('font2image')
  .description('本地离线字体预览图生成工具：字体 → PNG / WebP / JPG')
  .argument('[files...]', '字体文件（与 --in 二选一）')
  .option('--in <dir>', '字体目录（按配置决定是否递归扫描）')
  .option('--out <dir>', '输出目录', 'output')
  .option('--format <format>', '输出格式：png | webp | jpg（默认 webp）')
  .option('--text <text>', '强制指定样张文本（优先于默认样张）')
  .option('--poem <id>', '指定诗词（默认取诗词库第一首）')
  .option('--scripts <scripts>', '手动指定字符类型组合：hans,hant,letter,digit')
  .option('--sizes <sizes>', '尺寸列表，逗号分隔（默认 192）')
  .option('--quality <n>', 'webp/jpg 质量 1-100（默认 90）')
  .option('--background <color>', '背景色，或 transparent')
  .option('--color <color>', '文字颜色')
  .option('--config <path>', '配置文件路径（默认查找 font2image.config.json）')
  .option('--force', '忽略增量缓存，强制重新生成')

const parsed = program.parse()
const opts = parsed.opts<{
  in?: string
  out: string
  format?: string
  text?: string
  poem?: string
  scripts?: string
  sizes?: string
  quality?: string
  background?: string
  color?: string
  config?: string
  force?: boolean
}>()
const files = parsed.args

let format = DEFAULT_CONFIG.format
if (opts.format !== undefined) {
  if (!VALID_FORMATS.includes(opts.format as OutputFormat)) {
    fail(`--format 仅支持 ${VALID_FORMATS.join(' / ')}`)
  }
  format = opts.format as OutputFormat
  if (format === 'jpg') console.log('提示：jpg 为有损压缩，文字边缘质量较低，建议使用 png 或 webp')
}

let cliScripts: ScriptId[] | undefined
if (opts.scripts !== undefined) {
  cliScripts = opts.scripts.split(',').map((s) => s.trim()).filter(Boolean) as ScriptId[]
  for (const s of cliScripts) {
    if (!VALID_SCRIPTS.includes(s)) fail(`--scripts 含无效字符类型：${s}（可选 ${VALID_SCRIPTS.join(',')}）`)
  }
  if (cliScripts.length === 0) fail('--scripts 至少选择一种字符类型')
}

let sizes = DEFAULT_CONFIG.sizes
if (opts.sizes !== undefined) {
  sizes = opts.sizes.split(',').map((s) => Number(s.trim()))
  if (sizes.some((n) => !Number.isInteger(n) || n <= 0)) fail('--sizes 需为逗号分隔的正整数')
}

let quality = DEFAULT_CONFIG.quality
if (opts.quality !== undefined) {
  quality = Number(opts.quality)
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) fail('--quality 需为 1-100 的整数')
}

let poems
try {
  poems = loadPoemsFile()
} catch (err) {
  fail((err as Error).message)
}

if (opts.poem !== undefined && !poems.some((p) => p.id === opts.poem)) {
  fail(`--poem 无效：${opts.poem}（可选：${poems.map((p) => `${p.id}（${p.title}）`).join('、')}）`)
}

const config = mergeConfig(mergeConfig(DEFAULT_CONFIG, loadConfigFile(opts.config)), {
  format,
  sizes,
  quality,
  ...(opts.poem !== undefined ? { poem: opts.poem } : {}),
  ...(opts.background !== undefined ? { background: opts.background } : {}),
  ...(opts.color !== undefined ? { color: opts.color } : {}),
})

if (config.poem && !poems.some((p) => p.id === config.poem)) {
  console.log(`提示：配置中的默认诗词 "${config.poem}" 不在诗词库中，改用第一首`)
  config.poem = ''
}

let inputs: string[]
if (files.length > 0) {
  inputs = files
  for (const f of inputs) {
    if (!existsSync(f)) fail(`字体文件不存在：${f}`)
  }
} else if (opts.in) {
  if (!existsSync(opts.in)) fail(`输入目录不存在：${opts.in}`)
  inputs = scanFonts(opts.in, config.recursive)
  if (inputs.length === 0) fail(`目录中未找到字体文件（支持 ${FONT_EXTENSIONS.join(' ')}）`)
} else {
  fail('请指定字体文件，或使用 --in 指定字体目录')
}

const outDir = path.resolve(opts.out)
const manifest = loadManifest(outDir)
const cfgHash = configHash(config, opts.text, opts.scripts)

console.log(`font2image：共 ${inputs.length} 个字体，格式 ${config.format}，尺寸 ${config.sizes.join('/')}px`)

const session = new RenderSession()
const started = Date.now()

try {
  await session.start()
} catch (err) {
  fail((err as Error).message)
}

const outcomes = []
const usedIds = new Set<string>()
try {
  for (const file of inputs) {
    const resolved = path.resolve(file)
    const existing = manifest.fonts.find((f) => f.file === resolved)
    const outcome = await processFont(file, existing, {
      config,
      cfgHash,
      poems,
      cliText: opts.text,
      cliScripts,
      force: Boolean(opts.force),
      outDir,
      session,
      usedIds,
    })
    if (outcome.status === 'ok' && outcome.entry) {
      upsertFont(manifest, outcome.entry)
    }
    outcomes.push(outcome)
  }
} finally {
  await session.close()
}

saveManifest(outDir, manifest)
printReport(outcomes, Date.now() - started)

if (outcomes.every((o) => o.status === 'error')) {
  process.exitCode = 1
}
