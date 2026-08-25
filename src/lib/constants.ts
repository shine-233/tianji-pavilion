export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
/** 宽松版地支数组（供 indexOf / 动态索引场景使用） */
export const BR: string[] = [...ZHI]
export type Gan = (typeof GAN)[number]
export type Zhi = (typeof ZHI)[number]
export type Element = '木' | '火' | '土' | '金' | '水'

export const ELE_S: Record<string, Element> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }
export const ELE_B: Record<string, Element> = { 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土' }

export const CHONG: [string, string][] = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]
export const ZIXING = new Set(['辰', '午', '酉', '亥'])
export const GANHE: Record<string, string> = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' }
export const ZHIHE: [string, string][] = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]
export const SANHE: [string, Element][] = [['寅午戌', '火'], ['申子辰', '水'], ['亥卯未', '木'], ['巳酉丑', '金']]
export const SANHUI: [string, Element][] = [['寅卯辰', '木'], ['巳午未', '火'], ['申酉戌', '金'], ['亥子丑', '水']]
export const SANYE: string[][] = [['寅', '巳', '申'], ['丑', '戌', '未']]
export const BANXING: [string, string][] = [['寅', '巳'], ['巳', '申'], ['丑', '戌'], ['戌', '未'], ['子', '卯']]

export const LU: Record<string, string[]> = {
  甲: ['寅', '卯'], 乙: ['寅', '卯'], 丙: ['巳', '午'], 丁: ['午', '巳'],
  戊: ['巳', '午'], 己: ['午', '巳'], 庚: ['申', '酉'], 辛: ['申', '酉'], 壬: ['亥', '子'], 癸: ['亥', '子'],
}
export const SHENG: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
export const WOKE: Record<Element, Element> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }
export const KEME: Record<Element, Element> = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' }
export const YIN: Record<Element, Element> = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' }
export const STRONG: Record<Element, string[]> = { 木: ['寅', '卯'], 火: ['巳', '午'], 金: ['申', '酉'], 水: ['亥', '子'], 土: ['巳', '午'] }
export const LIBR: Record<Element, string[]> = { 木: ['辰', '未', '亥'], 火: ['戌', '未', '寅'], 金: ['丑', '戌', '巳'], 水: ['辰', '丑', '申'], 土: ['辰', '戌', '丑', '未'] }

export const AFF_S: Record<string, number> = { 同我: 0.15, 生我: 0.05, 我生: 0.7, 我克: 0.85, 克我: 1.0 }
export const AFF_W: Record<string, number> = { 同我: 1.0, 生我: 0.9, 我生: 0.2, 我克: 0.15, 克我: 0.1 }

export const TYR: Record<string, string[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'], 乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'], 壬: ['巳', '卯'], 癸: ['巳', '卯'], 辛: ['午', '寅'],
}
export const WCH: Record<string, string> = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' }
export const TAO: Record<string, string> = { 申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子' }
export const HGAI: Record<string, string> = { 申子辰: '辰', 寅午戌: '戌', 巳酉丑: '丑', 亥卯未: '未' }
export const MA_: Record<string, string> = { 申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳' }
export const JX_: Record<string, string> = { 申子辰: '子', 寅午戌: '午', 巳酉丑: '酉', 亥卯未: '卯' }
export const REN: Record<string, string> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' }

export const GRP = (b: string): string => ['申子辰', '寅午戌', '巳酉丑', '亥卯未'].find((k) => k.includes(b))!

export const HUA: Record<string, string[]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'], 乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'], 丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'], 己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'], 辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'], 癸: ['破军', '巨门', '太阴', '贪狼'],
}
export const JIXING = new Set(['文昌', '文曲', '天魁', '天钺', '左辅', '右弼', '禄存', '天马'])
export const SHAXING = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'])

const NAYIN_PAIRS: Record<string, string[]> = {
  海中金: ['甲子', '乙丑'], 炉中火: ['丙寅', '丁卯'], 大林木: ['戊辰', '己巳'], 路旁土: ['庚午', '辛未'],
  剑锋金: ['壬申', '癸酉'], 山头火: ['甲戌', '乙亥'], 涧下水: ['丙子', '丁丑'], 城头土: ['戊寅', '己卯'],
  白蜡金: ['庚辰', '辛巳'], 杨柳木: ['壬午', '癸未'], 泉中水: ['甲申', '乙酉'], 屋上土: ['丙戌', '丁亥'],
  霹雳火: ['戊子', '己丑'], 松柏木: ['庚寅', '辛卯'], 长流水: ['壬辰', '癸巳'], 沙中金: ['甲午', '乙未'],
  山下火: ['丙申', '丁酉'], 平地木: ['戊戌', '己亥'], 壁上土: ['庚子', '辛丑'], 金箔金: ['壬寅', '癸卯'],
  覆灯火: ['甲辰', '乙巳'], 天河水: ['丙午', '丁未'], 大驿土: ['戊申', '己酉'], 钗钏金: ['庚戌', '辛亥'],
  桑柘木: ['壬子', '癸丑'], 大溪水: ['甲寅', '乙卯'], 沙中土: ['丙辰', '丁巳'], 天上火: ['戊午', '己未'],
  石榴木: ['庚申', '辛酉'], 大海水: ['壬戌', '癸亥'],
}
export const NAYIN_OF: Record<string, string> = {}
for (const n in NAYIN_PAIRS) NAYIN_PAIRS[n]!.forEach((g) => (NAYIN_OF[g] = n))

export const JUTAB: Record<string, number> = {
  海中金: 4, 炉中火: 6, 大林木: 3, 路旁土: 5, 剑锋金: 4, 山头火: 6, 涧下水: 2, 城头土: 5,
  白蜡金: 4, 杨柳木: 6, 泉中水: 4, 屋上土: 6, 霹雳火: 2, 松柏木: 5, 长流水: 2, 沙中金: 4,
  山下火: 4, 平地木: 5, 壁上土: 2, 金箔金: 4, 覆灯火: 6, 天河水: 2, 大驿土: 5, 钗钏金: 4,
  桑柘木: 2, 大溪水: 5, 沙中土: 6, 天上火: 2, 石榴木: 2, 大海水: 2,
}

export const LPOS: Record<string, string> = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' }
export const KUI: Record<string, string> = { 甲: '丑', 乙: '子', 丙: '亥', 丁: '亥', 戊: '丑', 己: '子', 庚: '丑', 辛: '寅', 壬: '卯', 癸: '卯' }
export const YUE: Record<string, string> = { 甲: '未', 乙: '申', 丙: '酉', 丁: '酉', 戊: '未', 己: '申', 庚: '未', 辛: '午', 壬: '巳', 癸: '巳' }

export const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'] as const
export const SHENG_ORDER: Element[] = ['木', '火', '土', '金', '水']

/** 六十甲子纳音：按甲子起顺序生成查表 */
const NAYIN_SEQ = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水',
]
export const NAYIN60: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (let i = 0; i < 30; i++) {
    out[`${GAN[i % 10]!}${ZHI[i % 12]!}`] = NAYIN_SEQ[i]!
  }
  return out
})()

export function nayinOf(gan: string, zhi: string): string {
  return NAYIN60[`${gan}${zhi}`] ?? ''
}

export const ELEMENT_DESC: Record<Element, { keyword: string; body: string; season: string; color: string }> = {
  木: { keyword: '生发·条达', body: '肝胆·筋目', season: '春·东方', color: '#7bc47f' },
  火: { keyword: '炎上·礼明', body: '心与小肠·血脉舌', season: '夏·南方', color: '#ef7d57' },
  土: { keyword: '稼穑·信厚', body: '脾胃·肌肉口', season: '四季月·中央', color: '#c9a15f' },
  金: { keyword: '从革·义刚', body: '肺与大肠·皮毛鼻', season: '秋·西方', color: '#d8dde6' },
  水: { keyword: '润下·智藏', body: '肾与膀胱·骨耳', season: '冬·北方', color: '#64a7e8' },
}

export const SHENSHA_MEANING: Record<string, string> = {
  天乙贵人: '最吉之神，主逢凶化吉、多得助力，一生近贵。',
  文昌: '聪明逢文昌，主利学业文书，气质清秀。',
  将星: '居权柄之星，主领导力与组织才干。',
  桃花: '主人缘魅力佳，艺术感受力强，忌泛滥则情多困扰。',
  华盖: '艺术宗教之星，主孤高好学，宜玄学技艺。',
  驿马: '主动迁奔走之象，主远行、变动、出差频繁。',
  羊刃: '刚烈之刃，旺极者掌权柄，弱者防刑伤破耗。',
}
