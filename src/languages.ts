/** 语言代码 → 中文显示名 */
export const LANGUAGE_NAMES: Record<string, string> = {
  'zh-Hans': '简体中文',
  'zh-Hant': '繁体中文',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  vi: '越南语',
  th: '泰语',
  ar: '阿拉伯语',
  ru: '俄语',
  el: '希腊语',
};

export function languageDisplayName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}
