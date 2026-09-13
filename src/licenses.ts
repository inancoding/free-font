/**
 * 授权注册表 —— 合规的唯一事实来源。
 *
 * 设计原则是 fail-safe：只有 verified 且 redistributable 同时为 true 的授权，
 * 才允许把字体二进制镜像到本仓库的 Release。任何存疑的授权默认禁止镜像，
 * 宁可少分发一个字体，也不能分发一个侵权字体。
 */

export interface LicenseInfo {
  id: string;
  name: string;
  /** 授权全文的官方 URL */
  url: string;
  /** 授权条款是否已对照官方原文人工核实。未核实者一律禁止镜像 */
  verified: boolean;
  /** 是否允许本仓库镜像并再分发字体二进制文件 */
  redistributable: boolean;
  /** 是否允许免费商用 */
  commercialUse: boolean;
  /** 收录时必须在 licenses/<slug>/ 存放授权原文副本 */
  requiresLicenseText: boolean;
  notes?: string;
}

export const LICENSES = {
  'OFL-1.1': {
    id: 'OFL-1.1',
    name: 'SIL Open Font License 1.1',
    url: 'https://openfontlicense.org/document/',
    verified: true,
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '允许捆绑、嵌入、再分发和出售，但字体本身不得单独销售，且衍生作品须沿用 OFL。',
  },
  'Apache-2.0': {
    id: 'Apache-2.0',
    name: 'Apache License 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0',
    verified: true,
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
  },
  MIT: {
    id: 'MIT',
    name: 'MIT License',
    url: 'https://opensource.org/license/mit',
    verified: true,
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
  },
  'LPPL-1.3c': {
    id: 'LPPL-1.3c',
    name: 'LaTeX Project Public License 1.3c',
    url: 'https://www.latex-project.org/lppl/lppl-1-3c/',
    verified: true,
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
  },
} satisfies Record<string, LicenseInfo>;

/**
 * 厂商自定义授权。这些字体的"免费商用"和"允许再分发"是两件事，
 * 必须逐个核对官方授权原文后才能把 verified 改成 true。
 */
export const PENDING_LICENSES = {
  'Alibaba-PuHuiTi': {
    id: 'Alibaba-PuHuiTi',
    name: '阿里巴巴普惠体授权协议',
    url: 'https://www.alibabafonts.com/',
    verified: false,
    redistributable: false,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '待核实再分发条款。在 verified 改为 true 之前只能外链，不得镜像。',
  },
  'Xiaomi-MiSans': {
    id: 'Xiaomi-MiSans',
    name: 'MiSans 字体授权协议',
    url: 'https://hyperos.mi.com/font/',
    verified: false,
    redistributable: false,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '待核实再分发条款。在 verified 改为 true 之前只能外链，不得镜像。',
  },
  'Huawei-HarmonyOS-Sans': {
    id: 'Huawei-HarmonyOS-Sans',
    name: 'HarmonyOS Sans 字体授权协议',
    url: 'https://developer.huawei.com/consumer/cn/design/harmonyos-sans/',
    verified: false,
    redistributable: false,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '待核实再分发条款。在 verified 改为 true 之前只能外链，不得镜像。',
  },
} satisfies Record<string, LicenseInfo>;

export const ALL_LICENSES: Record<string, LicenseInfo> = {
  ...LICENSES,
  ...PENDING_LICENSES,
};

export const LICENSE_IDS = Object.keys(ALL_LICENSES);

export function getLicense(id: string): LicenseInfo | undefined {
  return ALL_LICENSES[id];
}

/** 是否允许把该授权下的字体二进制镜像到本仓库 Release */
export function isMirrorAllowed(license: LicenseInfo): boolean {
  return license.verified && license.redistributable;
}
