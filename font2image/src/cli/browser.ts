import { chromium, type Browser, type Page } from 'playwright-core'
import { drawCover, drawSpecimen, mimeType } from '../render/draw'
import type { OutputFormat } from '../core/types'

const PAGE_HTML =
  '<!doctype html><html><head><meta charset="utf-8"></head>' +
  '<body style="margin:0"><canvas id="c"></canvas></body></html>'

export interface RenderArgs {
  fontBytes: Uint8Array
  text: string
  targetHeight: number
  background: string
  color: string
  maxWidth: number
  format: OutputFormat
  quality: number
  gradient?: { angle: number; stops: string[] }
}

export interface CoverArgs {
  fontBytes: Uint8Array
  name: string
  width: number
  background: string
  color: string
  format: OutputFormat
  quality: number
  gradient?: { angle: number; stops: string[] }
}

export interface RenderResult {
  width: number
  height: number
  base64: string
}

// 复用本机 Edge/Chrome 的无头渲染会话（FR-7.3：与 UI 共用 drawSpecimen / drawCover）
export class RenderSession {
  private browser: Browser | null = null
  private page: Page | null = null
  private familySeq = 0

  async start(): Promise<string> {
    const failures: string[] = []
    for (const channel of ['msedge', 'chrome'] as const) {
      try {
        this.browser = await chromium.launch({ channel })
        break
      } catch (err) {
        failures.push(`${channel}: ${(err as Error).message.split('\n')[0]}`)
      }
    }
    if (!this.browser) {
      throw new Error(
        '未找到可用的本机浏览器（已尝试 Edge 与 Chrome）：\n  ' + failures.join('\n  '),
      )
    }
    this.page = await this.browser.newPage()
    await this.page.setContent(PAGE_HTML)
    await this.page.addScriptTag({
      content:
        `window.__drawSpecimen = ${drawSpecimen.toString()};` +
        `window.__drawCover = ${drawCover.toString()};`,
    })
    const channelName = (this.browser as unknown as { _name?: string })._name ?? 'browser'
    return channelName
  }

  async render(args: RenderArgs): Promise<RenderResult> {
    if (!this.page) throw new Error('RenderSession 尚未启动')
    const family = `f2i-${++this.familySeq}`
    const fontB64 = Buffer.from(args.fontBytes).toString('base64')
    const mime = mimeType(args.format)

    return this.page.evaluate(
      async (a: {
        fontB64: string
        family: string
        text: string
        targetHeight: number
        background: string
        color: string
        maxWidth: number
        format: OutputFormat
        quality: number
        mime: string
        gradient?: { angle: number; stops: string[] }
      }) => {
        const bin = atob(a.fontB64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)

        const face = new FontFace(a.family, bytes)
        await face.load()
        document.fonts.add(face)

        try {
          const canvas = document.getElementById('c') as HTMLCanvasElement
          const draw = (
            window as unknown as {
              __drawSpecimen: (
                canvas: HTMLCanvasElement,
                opts: {
                  text: string
                  fontFamily: string
                  targetHeight: number
                  background: string
                  color: string
                  maxWidth: number
                  gradient?: { angle: number; stops: string[] }
                },
              ) => { width: number; height: number }
            }
          ).__drawSpecimen
          const dims = draw(canvas, {
            text: a.text,
            fontFamily: a.family,
            targetHeight: a.targetHeight,
            background: a.background,
            color: a.color,
            maxWidth: a.maxWidth,
            gradient: a.gradient,
          })
          const quality = a.format === 'png' ? undefined : a.quality / 100
          const url = canvas.toDataURL(a.mime, quality)
          const base64 = url.slice(url.indexOf(',') + 1)
          return { width: dims.width, height: dims.height, base64 }
        } finally {
          document.fonts.delete(face)
        }
      },
      {
        fontB64,
        family,
        text: args.text,
        targetHeight: args.targetHeight,
        background: args.background,
        color: args.color,
        maxWidth: args.maxWidth,
        format: args.format,
        quality: args.quality,
        mime,
        gradient: args.gradient,
      },
    )
  }

  async renderCover(args: CoverArgs): Promise<RenderResult> {
    if (!this.page) throw new Error('RenderSession 尚未启动')
    const family = `f2i-${++this.familySeq}`
    const fontB64 = Buffer.from(args.fontBytes).toString('base64')
    const mime = mimeType(args.format)

    return this.page.evaluate(
      async (a: {
        fontB64: string
        family: string
        name: string
        width: number
        background: string
        color: string
        format: OutputFormat
        quality: number
        mime: string
        gradient?: { angle: number; stops: string[] }
      }) => {
        const bin = atob(a.fontB64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)

        const face = new FontFace(a.family, bytes)
        await face.load()
        document.fonts.add(face)

        try {
          const canvas = document.getElementById('c') as HTMLCanvasElement
          const draw = (
            window as unknown as {
              __drawCover: (
                canvas: HTMLCanvasElement,
                opts: { name: string; fontFamily: string; width: number; background: string; color: string; gradient?: { angle: number; stops: string[] } },
              ) => { width: number; height: number }
            }
          ).__drawCover
          const dims = draw(canvas, {
            name: a.name,
            fontFamily: a.family,
            width: a.width,
            background: a.background,
            color: a.color,
            gradient: a.gradient,
          })
          const quality = a.format === 'png' ? undefined : a.quality / 100
          const url = canvas.toDataURL(a.mime, quality)
          const base64 = url.slice(url.indexOf(',') + 1)
          return { width: dims.width, height: dims.height, base64 }
        } finally {
          document.fonts.delete(face)
        }
      },
      {
        fontB64,
        family,
        name: args.name,
        width: args.width,
        background: args.background,
        color: args.color,
        format: args.format,
        quality: args.quality,
        mime,
        gradient: args.gradient,
      },
    )
  }

  async close(): Promise<void> {
    await this.browser?.close()
    this.browser = null
    this.page = null
  }
}
