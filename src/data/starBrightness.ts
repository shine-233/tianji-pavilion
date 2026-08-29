/**
 * 十四主星亮度表：庙 / 旺 / 得 / 利 / 平 / 不 / 陷
 *
 * 数据源：iztro（MIT License）`lib/data/stars.js` STARS_INFO.brightness，
 * 逐字对照移植；其数值源自《紫微斗数全书》安星旧表，各派通用。
 * 数组下标按宫位地支从「寅」起排：寅 卯 辰 巳 午 未 申 酉 戌 亥 子 丑。
 *
 * 用法：brightnessOf('紫微', '丁巳') → { level: '旺', rank: 1 }
 * 查不到（借宫安星之辅星等）返回 null，调用方自行隐藏标签——宁缺勿错。
 */

export type BrightnessLevel = '庙' | '旺' | '得' | '利' | '平' | '不' | '陷'

const BRANCH_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const

const LEVELS: Record<string, BrightnessLevel> = {
  miao: '庙',
  wang: '旺',
  de: '得',
  li: '利',
  ping: '平',
  bu: '不',
  xian: '陷',
}

/** 亮度序：庙最强、陷最弱，用于着色分级（0-2 亮 / 3-4 平 / 5-6 弱） */
const RANK: Record<BrightnessLevel, number> = { 庙: 0, 旺: 1, 得: 2, 利: 3, 平: 4, 不: 5, 陷: 6 }

type Row = Array<keyof typeof LEVELS>

const TABLE: Record<string, Row> = {
  紫微: ['wang', 'wang', 'de', 'wang', 'miao', 'miao', 'wang', 'wang', 'de', 'wang', 'ping', 'miao'],
  天机: ['de', 'wang', 'li', 'ping', 'miao', 'xian', 'de', 'wang', 'li', 'ping', 'miao', 'xian'],
  太阳: ['wang', 'miao', 'wang', 'wang', 'wang', 'de', 'de', 'xian', 'bu', 'xian', 'xian', 'bu'],
  武曲: ['de', 'li', 'miao', 'ping', 'wang', 'miao', 'de', 'li', 'miao', 'ping', 'wang', 'miao'],
  天同: ['li', 'ping', 'ping', 'miao', 'xian', 'bu', 'wang', 'ping', 'ping', 'miao', 'wang', 'bu'],
  廉贞: ['miao', 'ping', 'li', 'xian', 'ping', 'li', 'miao', 'ping', 'li', 'xian', 'ping', 'li'],
  天府: ['miao', 'de', 'miao', 'de', 'wang', 'miao', 'de', 'wang', 'miao', 'de', 'miao', 'miao'],
  太阴: ['wang', 'xian', 'xian', 'xian', 'bu', 'bu', 'li', 'bu', 'wang', 'miao', 'miao', 'miao'],
  贪狼: ['ping', 'li', 'miao', 'xian', 'wang', 'miao', 'ping', 'li', 'miao', 'xian', 'wang', 'miao'],
  巨门: ['miao', 'miao', 'xian', 'wang', 'wang', 'bu', 'miao', 'miao', 'xian', 'wang', 'wang', 'bu'],
  天相: ['miao', 'xian', 'de', 'de', 'miao', 'de', 'miao', 'xian', 'de', 'de', 'miao', 'miao'],
  天梁: ['miao', 'miao', 'miao', 'xian', 'miao', 'wang', 'xian', 'de', 'miao', 'xian', 'miao', 'wang'],
  七杀: ['miao', 'wang', 'miao', 'ping', 'wang', 'miao', 'miao', 'miao', 'miao', 'ping', 'wang', 'miao'],
  破军: ['de', 'xian', 'wang', 'ping', 'miao', 'wang', 'de', 'xian', 'wang', 'ping', 'miao', 'wang'],
}

export interface Brightness {
  level: BrightnessLevel
  /** 0=庙 … 6=陷 */
  rank: number
}

export function brightnessOf(star: string, palaceGanzhi: string): Brightness | null {
  const row = TABLE[star]
  if (!row) return null
  const branch = palaceGanzhi[1]
  const idx = BRANCH_ORDER.indexOf(branch as (typeof BRANCH_ORDER)[number])
  if (idx < 0) return null
  const level = LEVELS[row[idx]!]
  if (!level) return null
  return { level, rank: RANK[level] }
}
