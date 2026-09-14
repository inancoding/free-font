export interface GradientBg {
  angle: number
  stops: string[]
}

function randomPastelHsl(): string {
  const h = Math.floor(Math.random() * 360)
  const s = 40 + Math.floor(Math.random() * 25)
  const l = 84 + Math.floor(Math.random() * 10)
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function randomGradient(stopCount?: number): GradientBg {
  const angle = Math.floor(Math.random() * 360)
  const n = stopCount ?? (2 + Math.floor(Math.random() * 2))
  const stops: string[] = []
  for (let i = 0; i < n; i++) stops.push(randomPastelHsl())
  return { angle, stops }
}

export function gradientCSS(g: GradientBg): string {
  return `linear-gradient(${g.angle}deg, ${g.stops.join(', ')})`
}
