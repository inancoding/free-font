/**
 * 授权注册表 —— 合规的唯一事实来源。
 *
 * 设计原则是 fail-safe：只有 verified 且 redistributable 同时为 true 的授权，
 * 才允许把字体二进制镜像到本仓库的 Release。任何存疑的授权默认禁止镜像，
 * 宁可少分发一个字体，也不能分发一个侵权字体。
 *
 * verified=true 必须同时给出 verifiedFrom 与 verifiedAt，由 policy 层强制校验。
 * 没有可追溯的一手来源，就不算核实过。
 */

export interface LicenseInfo {
  id: string;
  name: string;
  /** 授权全文的官方 URL */
  url: string;
  /** 授权条款是否已对照官方原文人工核实。未核实者一律禁止镜像 */
  verified: boolean;
  /** 核实所依据的一手来源 URL（授权原文所在页面或 raw 文件） */
  verifiedFrom?: string;
  /** 核实日期 YYYY-MM-DD。授权条款会随版本变化，过期需重新核对 */
  verifiedAt?: string;
  /** 是否允许本仓库镜像并再分发字体二进制文件 */
  redistributable: boolean;
  /** 是否允许免费商用 */
  commercialUse: boolean;
  /** 收录时必须在 licenses/<slug>/ 存放授权原文副本 */
  requiresLicenseText: boolean;
  /** 该授权普遍适用的再分发限制，会展示在 README */
  constraints?: string[];
  notes?: string;
}

const OFL_CONSTRAINTS = [
  '字体本身不得单独销售，但可随软件、文档或其他作品捆绑分发',
  '衍生字体必须沿用 OFL-1.1，且不得使用原字体的保留名称（Reserved Font Name）',
  '分发时须附带授权文本',
];

export const LICENSES = {
  'OFL-1.1': {
    id: 'OFL-1.1',
    name: 'SIL Open Font License 1.1',
    url: 'https://openfontlicense.org/document/',
    verified: true,
    verifiedFrom: 'https://openfontlicense.org/document/',
    verifiedAt: '2026-09-13',
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
    constraints: OFL_CONSTRAINTS,
  },
  'Apache-2.0': {
    id: 'Apache-2.0',
    name: 'Apache License 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0',
    verified: true,
    verifiedFrom: 'https://www.apache.org/licenses/LICENSE-2.0',
    verifiedAt: '2026-09-13',
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
  },
  MIT: {
    id: 'MIT',
    name: 'MIT License',
    url: 'https://opensource.org/license/mit',
    verified: true,
    verifiedFrom: 'https://opensource.org/license/mit',
    verifiedAt: '2026-09-13',
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
  },
  // LPPL 的维护者条款会让再分发义务变得复杂，且中文圈几乎用不到。
  // 保持未核实状态，等真有字体需要时再逐条核对。
  'LPPL-1.3c': {
    id: 'LPPL-1.3c',
    name: 'LaTeX Project Public License 1.3c',
    url: 'https://www.latex-project.org/lppl/lppl-1-3c/',
    verified: false,
    redistributable: true,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '维护者条款影响再分发义务，收录前需逐条核对。',
  },
} satisfies Record<string, LicenseInfo>;

/**
 * 厂商自定义授权。「允许免费商用」和「允许再分发」是两件独立的事，
 * 必须逐个核对官方授权原文后才能把 verified 改成 true。
 */
export const VENDOR_LICENSES = {
  /**
   * 小米 MiSans —— 已核实，结论是**禁止镜像**。
   *
   * 官方协议原文明文禁止再分发与改编，且授权可撤销。
   * 注意 npm 上的 misans 包标注 Apache-2.0，那是第三方打包者的元数据，
   * 与小米的字体授权无关，采信即构成侵权。
   */
  'Xiaomi-MiSans': {
    id: 'Xiaomi-MiSans',
    name: 'MiSans 字体知识产权许可协议',
    url: 'https://hyperos.mi.com/font/download',
    verified: true,
    verifiedFrom: 'https://hyperos.mi.com/font/download',
    verifiedAt: '2026-09-13',
    redistributable: false,
    commercialUse: true,
    requiresLicenseText: true,
    constraints: [
      '禁止对外租赁、再许可、赠与、出借或进一步分发字体软件及其任何副本',
      '禁止对字体或其组件进行改编或二次开发 —— 自制子集化 / 转 woff2 同样违约',
      '授权为可撤销的非独占许可',
      '须在软件中特别注明使用了 MiSans 字体',
    ],
    notes:
      '原文：「您不得单独将 MiSans 字体或其组件对外租赁、再许可、给予、出借或进一步分发字体软件或其任何副本以及重新分发或售卖。此限制不适用于您使用 MiSans 字体创作的任何其他作品。」',
  },

  /**
   * 阿里巴巴普惠体 —— 待核实。
   * alibabafonts.com 是纯客户端渲染的 SPA，抓不到授权正文，
   * 第三方站点的描述又互相矛盾。核实前只能外链。
   */
  'Alibaba-PuHuiTi': {
    id: 'Alibaba-PuHuiTi',
    name: '阿里巴巴普惠体授权协议',
    url: 'https://www.alibabafonts.com/',
    verified: false,
    redistributable: false,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '官网为 SPA，授权正文需人工打开页面核对再分发条款后方可放开镜像。',
  },

  /**
   * 华为 HarmonyOS Sans —— 待核实。
   * 旧地址 /design/harmonyos-font/ 已 404，正文由 JS 动态加载抓不到。
   * 有第三方来源称「仅限 HarmonyOS 应用内使用、不得单独提取再分发」，
   * 但该来源可信度不足，只能视为风险信号。核实前禁止镜像。
   */
  'Huawei-HarmonyOS-Sans': {
    id: 'Huawei-HarmonyOS-Sans',
    name: 'HarmonyOS Sans 字体授权协议',
    url: 'https://developer.huawei.com/consumer/cn/design/resource/',
    verified: false,
    redistributable: false,
    commercialUse: true,
    requiresLicenseText: true,
    notes: '存在「仅限 HarmonyOS 应用内使用」的未经证实说法，风险偏高，核实前不得镜像。',
  },
} satisfies Record<string, LicenseInfo>;

export const ALL_LICENSES: Record<string, LicenseInfo> = {
  ...LICENSES,
  ...VENDOR_LICENSES,
};

export const LICENSE_IDS = Object.keys(ALL_LICENSES);

export function getLicense(id: string): LicenseInfo | undefined {
  return ALL_LICENSES[id];
}

/** 是否允许把该授权下的字体二进制镜像到本仓库 Release */
export function isMirrorAllowed(license: LicenseInfo): boolean {
  return license.verified && license.redistributable;
}
