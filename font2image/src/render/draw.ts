export interface DrawSpecimenOptions {
  text: string
  fontFamily: string
  targetHeight: number
  background: string
  color: string
  maxWidth: number
  gradient?: { angle: number; stops: string[] }
}

export interface DrawSpecimenResult {
  width: number
  height: number
  lines: number
}

// 自包含绘制函数：不引用任何外部标识符。
// UI 直接 import 使用；CLI 通过 toString() 注入 Playwright 页面执行，两处逻辑完全一致。
export function drawSpecimen(canvas: HTMLCanvasElement, opts: DrawSpecimenOptions): DrawSpecimenResult {
  const text = opts.text
  const fontSize = Math.max(8, Math.round(opts.targetHeight * 0.55))
  const padY = Math.max(4, Math.round(opts.targetHeight * 0.22))
  const padX = Math.max(8, Math.round(opts.targetHeight * 0.3))
  const lineHeight = Math.round(fontSize * 1.4)
  const maxLineWidth = Math.max(100, opts.maxWidth - padX * 2)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 canvas 上下文')

  ctx.font = fontSize + 'px "' + opts.fontFamily + '", sans-serif'

  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const para of paragraphs) {
    if (para.length === 0) {
      lines.push('')
      continue
    }
    let current = ''
    for (const ch of para) {
      const test = current + ch
      if (ctx.measureText(test).width > maxLineWidth && current.length > 0) {
        lines.push(current)
        current = ch
      } else {
        current = test
      }
    }
    if (current.length > 0) lines.push(current)
  }
  if (lines.length === 0) lines.push('')

  let widest = 0
  for (const line of lines) {
    const w = ctx.measureText(line).width
    if (w > widest) widest = w
  }

  const width = Math.max(1, Math.ceil(widest + padX * 2))
  const height = Math.max(1, lines.length * lineHeight + padY * 2)
  canvas.width = width
  canvas.height = height

  // 调整画布尺寸会重置上下文状态，需重新设置
  if (opts.gradient) {
    var rad = opts.gradient.angle * Math.PI / 180
    var cx = width / 2, cy = height / 2
    var halfLen = (Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad))) / 2
    var gx0 = cx - halfLen * Math.cos(rad)
    var gy0 = cy - halfLen * Math.sin(rad)
    var gx1 = cx + halfLen * Math.cos(rad)
    var gy1 = cy + halfLen * Math.sin(rad)
    var grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1)
    var stops = opts.gradient.stops
    for (var si = 0; si < stops.length; si++) {
      grad.addColorStop(si / (stops.length - 1), stops[si])
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  } else if (opts.background !== 'transparent') {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, width, height)
  }
  ctx.font = fontSize + 'px "' + opts.fontFamily + '", sans-serif'
  ctx.fillStyle = opts.color
  ctx.textBaseline = 'middle'
  for (let i = 0; i < lines.length; i++) {
    const y = padY + i * lineHeight + lineHeight / 2
    const lineWidth = ctx.measureText(lines[i]!).width
    ctx.fillText(lines[i]!, (width - lineWidth) / 2, y)
  }

  return { width, height, lines: lines.length }
}

export function mimeType(format: 'png' | 'webp' | 'jpg'): string {
  if (format === 'webp') return 'image/webp'
  if (format === 'jpg') return 'image/jpeg'
  return 'image/png'
}

export interface DrawCoverOptions {
  name: string
  fontFamily: string
  width: number
  background: string
  color: string
  gradient?: { angle: number; stops: string[] }
}

export interface DrawCoverResult {
  width: number
  height: number
}

// 自包含封面绘制（FR-6.9）：3:1，仅字体名称一行，居中。
// 注意：函数体内不得出现嵌套函数/闭包——tsx 会为其注入 __name 包装，
// toString() 注入页面后该 helper 不存在，会导致运行时报错。
export function drawCover(canvas: HTMLCanvasElement, opts: DrawCoverOptions): DrawCoverResult {
  const width = Math.max(300, Math.round(opts.width))
  const height = Math.round(width / 3)
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 canvas 上下文')

  if (opts.gradient) {
    var rad = opts.gradient.angle * Math.PI / 180
    var cx = width / 2, cy = height / 2
    var halfLen = (Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad))) / 2
    var gx0 = cx - halfLen * Math.cos(rad)
    var gy0 = cy - halfLen * Math.sin(rad)
    var gx1 = cx + halfLen * Math.cos(rad)
    var gy1 = cy + halfLen * Math.sin(rad)
    var grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1)
    var stops = opts.gradient.stops
    for (var si = 0; si < stops.length; si++) {
      grad.addColorStop(si / (stops.length - 1), stops[si])
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  } else if (opts.background !== 'transparent') {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, width, height)
  }

  const padX = Math.round(width * 0.06)
  const maxTextWidth = width - padX * 2

  let nameSize = Math.round(height * 0.45)
  ctx.font = nameSize + 'px "' + opts.fontFamily + '", sans-serif'
  while (nameSize > 14 && ctx.measureText(opts.name).width > maxTextWidth) {
    nameSize -= 1
    ctx.font = nameSize + 'px "' + opts.fontFamily + '", sans-serif'
  }

  const nameLineHeight = Math.round(nameSize * 1.3)
  const top = Math.max(0, Math.round((height - nameLineHeight) / 2))

  ctx.fillStyle = opts.color
  ctx.textBaseline = 'middle'
  ctx.font = nameSize + 'px "' + opts.fontFamily + '", sans-serif'
  const nameWidth = ctx.measureText(opts.name).width
  ctx.fillText(opts.name, (width - nameWidth) / 2, top + nameLineHeight / 2)

  return { width, height }
}
