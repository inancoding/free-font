declare module 'opentype.js' {
  export interface FontNames {
    [key: string]: unknown
  }

  export interface MaxpTable {
    numGlyphs?: number
  }

  export interface FontTables {
    maxp?: MaxpTable
    [tag: string]: unknown
  }

  export interface Font {
    names: FontNames
    tables: FontTables
    charToGlyphIndex(ch: string): number
  }

  export function parse(buffer: ArrayBuffer): Font
}
