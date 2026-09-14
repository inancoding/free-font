import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export const FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2', '.ttc']

export function isFontFile(file: string): boolean {
  return FONT_EXTENSIONS.includes(path.extname(file).toLowerCase())
}

export function scanFonts(dir: string, recursive: boolean): string[] {
  const found: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (recursive) walk(full)
      } else if (entry.isFile() && isFontFile(entry.name)) {
        found.push(full)
      }
    }
  }
  const stat = statSync(dir)
  if (stat.isFile()) {
    if (isFontFile(dir)) found.push(dir)
  } else {
    walk(dir)
  }
  return found.sort()
}
