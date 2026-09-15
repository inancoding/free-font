import { REPO_OWNER, REPO_NAME } from './config.ts';
import type { Font } from './schema.ts';
import { isMirrored } from './schema.ts';

/**
 * Release tag 命名规则。
 *
 * 每个字体独立发版，tag 形如 source-han-sans-v2.004。
 * 不用斜杠分隔（font/<slug>/v1.0）是因为斜杠会让 GitHub 的
 * releases/tag/ URL 需要编码，出现在 README 里很难看也容易出错。
 */
export function tagNameFor(font: Font): string {
  return `${font.slug}-v${font.version}`;
}

export function releaseUrlFor(font: Font): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tagNameFor(font)}`;
}

/** 打包产物名，同时用作 Release 附件名 */
export function artifactNameFor(font: Font): string {
  return `${font.slug}-${font.version}.zip`;
}

/** GitHub Release 附件直接下载链接（点击即开始下载） */
export function directDownloadUrlFor(font: Font): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tagNameFor(font)}/${artifactNameFor(font)}`;
}

/** jsDelivr CDN 加速下载链接 */
export function jsdelivrUrlFor(font: Font): string {
  return `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${tagNameFor(font)}/${artifactNameFor(font)}`;
}

export interface DownloadLink {
  label: string;
  url: string;
  primary: boolean;
}

/**
 * 返回某款字体所有可用的下载链接。
 * 已发版的字体会有 GitHub 直链 + CDN 加速链接。
 */
export function downloadLinksFor(font: Font): DownloadLink[] {
  const links: DownloadLink[] = [];
  if (isMirrored(font)) {
    links.push({ label: 'GitHub 直接下载', url: directDownloadUrlFor(font), primary: true });
    links.push({ label: 'jsDelivr 加速', url: jsdelivrUrlFor(font), primary: false });
  }
  return links;
}
