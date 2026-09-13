import { REPO_OWNER, REPO_NAME } from './config.ts';
import type { Font } from './schema.ts';

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
