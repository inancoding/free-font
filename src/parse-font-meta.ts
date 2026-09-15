/**
 * 从 TTF/OTF 字体文件的 name 表中提取元数据。
 * 不处理 WOFF/WOFF2（它们内部表有压缩，需要额外解压）。
 */

export interface FontMeta {
  format: string;
  familyName?: string;
  fullName?: string;
  version?: string;
  postscriptName?: string;
  manufacturer?: string;
  designer?: string;
  description?: string;
}

interface NameRecord {
  platformID: number;
  encodingID: number;
  languageID: number;
  nameID: number;
  length: number;
  offset: number;
}

export function parseFontMeta(buf: Buffer): FontMeta {
  if (buf.length < 12) return { format: 'unknown' };

  const sfVersion = buf.readUInt32BE(0);
  const numTables = buf.readUInt16BE(4);

  const format = sfVersionToFormat(sfVersion);
  if (format !== 'ttf' && format !== 'otf') {
    return { format };
  }

  let nameOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (rec + 16 > buf.length) break;
    const tag = buf.toString('ascii', rec, rec + 4);
    if (tag === 'name') {
      nameOffset = buf.readUInt32BE(rec + 8);
      break;
    }
  }

  if (!nameOffset || nameOffset + 6 > buf.length) return { format };

  const count = buf.readUInt16BE(nameOffset + 2);
  const stringOffset = buf.readUInt16BE(nameOffset + 4);
  const stringsBase = nameOffset + stringOffset;

  const records: NameRecord[] = [];
  for (let i = 0; i < count; i++) {
    const off = nameOffset + 6 + i * 12;
    if (off + 12 > buf.length) break;
    records.push({
      platformID: buf.readUInt16BE(off),
      encodingID: buf.readUInt16BE(off + 2),
      languageID: buf.readUInt16BE(off + 4),
      nameID: buf.readUInt16BE(off + 6),
      length: buf.readUInt16BE(off + 8),
      offset: buf.readUInt16BE(off + 10),
    });
  }

  const result: FontMeta = { format };

  const targetNameIDs = [1, 4, 5, 6, 8, 9, 10];
  const fieldMap: Record<number, keyof FontMeta> = {
    1: 'familyName',
    4: 'fullName',
    5: 'version',
    6: 'postscriptName',
    8: 'manufacturer',
    9: 'designer',
    10: 'description',
  };

  const windowsRecs = records.filter((r) => r.platformID === 3 && r.encodingID === 1);
  const macRecs = records.filter((r) => r.platformID === 1 && r.encodingID === 0);

  for (const nameID of targetNameIDs) {
    const field = fieldMap[nameID];
    if (!field || result[field]) continue;

    const winRec = windowsRecs.find((r) => r.nameID === nameID);
    if (winRec) {
      const strOff = stringsBase + winRec.offset;
      if (strOff + winRec.length <= buf.length) {
        result[field] = decodeUtf16BE(buf, strOff, winRec.length);
        continue;
      }
    }

    const macRec = macRecs.find((r) => r.nameID === nameID);
    if (macRec) {
      const strOff = stringsBase + macRec.offset;
      if (strOff + macRec.length <= buf.length) {
        result[field] = buf.toString('latin1', strOff, strOff + macRec.length);
      }
    }
  }

  if (result.version) {
    const m = result.version.match(/Version\s+([\d.]+)/i);
    if (m?.[1]) result.version = m[1];
  }

  return result;
}

function sfVersionToFormat(sfVersion: number): string {
  switch (sfVersion) {
    case 0x00010000: return 'ttf';
    case 0x4F54544F: return 'otf';
    case 0x774F4646: return 'woff';
    case 0x774F4632: return 'woff2';
    case 0x74746366: return 'ttc';
    default: return 'unknown';
  }
}

function decodeUtf16BE(buf: Buffer, offset: number, length: number): string {
  const chars: string[] = [];
  for (let i = 0; i + 1 < length; i += 2) {
    const code = buf.readUInt16BE(offset + i);
    chars.push(String.fromCharCode(code));
  }
  return chars.join('');
}
