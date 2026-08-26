/** 六爻装卦引擎：京房八宫查表实现。全站唯一的纳甲/六亲/六兽表，主引擎 buildChart 也走这里 */
import { ELE_B } from './constants'
import type { Element } from './constants'

export const TRIGRAMS = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const
export type Trigram = (typeof TRIGRAMS)[number]

export const TRI_BITS: Record<Trigram, string> = {
  乾: '111', 兑: '110', 离: '101', 震: '100', 巽: '011', 坎: '010', 艮: '001', 坤: '000',
}

export const TRI_WUXING: Record<Trigram, Element> = {
  乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土',
}

export const TRI_NATURE: Record<Trigram, string> = {
  乾: '天', 兑: '泽', 离: '火', 震: '雷', 巽: '风', 坎: '水', 艮: '山', 坤: '地',
}

const NAJIA_INNER: Record<Trigram, string[]> = {
  乾: ['甲子', '甲寅', '甲辰'],
  坤: ['乙未', '乙巳', '乙卯'],
  震: ['庚子', '庚寅', '庚辰'],
  巽: ['辛丑', '辛亥', '辛酉'],
  坎: ['戊寅', '戊辰', '戊午'],
  离: ['己卯', '己丑', '己亥'],
  艮: ['丙辰', '丙午', '丙申'],
  兑: ['丁巳', '丁卯', '丁丑'],
}

const NAJIA_OUTER: Record<Trigram, string[]> = {
  乾: ['壬午', '壬申', '壬戌'],
  坤: ['癸丑', '癸亥', '癸酉'],
  震: ['庚午', '庚申', '庚戌'],
  巽: ['辛未', '辛巳', '辛卯'],
  坎: ['戊申', '戊戌', '戊子'],
  离: ['己酉', '己未', '己巳'],
  艮: ['丙戌', '丙子', '丙寅'],
  兑: ['丁亥', '丁酉', '丁未'],
}

interface GuaEntry {
  name: string
  gong: Trigram
  idx: number
  lower: Trigram
  upper: Trigram
}

const PALACE_TABLE: Array<{ gong: Trigram; members: Array<[string, Trigram, Trigram]> }> = [
  { gong: '乾', members: [['乾为天', '乾', '乾'], ['天风姤', '乾', '巽'], ['天山遁', '乾', '艮'], ['天地否', '乾', '坤'], ['风地观', '巽', '坤'], ['山地剥', '艮', '坤'], ['火地晋', '离', '坤'], ['火天大有', '离', '乾']] },
  { gong: '坤', members: [['坤为地', '坤', '坤'], ['地雷复', '坤', '震'], ['地泽临', '坤', '兑'], ['地天泰', '坤', '乾'], ['雷天大壮', '震', '乾'], ['泽天夬', '兑', '乾'], ['水天需', '坎', '乾'], ['水地比', '坎', '坤']] },
  { gong: '震', members: [['震为雷', '震', '震'], ['雷地豫', '震', '坤'], ['雷水解', '震', '坎'], ['雷风恒', '震', '巽'], ['地风升', '坤', '巽'], ['水风井', '坎', '巽'], ['泽风大过', '兑', '巽'], ['泽雷随', '兑', '震']] },
  { gong: '巽', members: [['巽为风', '巽', '巽'], ['风天小畜', '巽', '乾'], ['风火家人', '巽', '离'], ['风雷益', '巽', '震'], ['天雷无妄', '乾', '震'], ['火雷噬嗑', '离', '震'], ['山雷颐', '艮', '震'], ['山风蛊', '艮', '巽']] },
  { gong: '坎', members: [['坎为水', '坎', '坎'], ['水泽节', '坎', '兑'], ['水雷屯', '坎', '震'], ['水火既济', '坎', '离'], ['泽火革', '兑', '离'], ['雷火丰', '震', '离'], ['地火明夷', '坤', '离'], ['地水师', '坤', '坎']] },
  { gong: '离', members: [['离为火', '离', '离'], ['火山旅', '离', '艮'], ['火风鼎', '离', '巽'], ['火水未济', '离', '坎'], ['山水蒙', '艮', '坎'], ['风水涣', '巽', '坎'], ['天水讼', '乾', '坎'], ['天火同人', '乾', '离']] },
  { gong: '艮', members: [['艮为山', '艮', '艮'], ['山火贲', '艮', '离'], ['山天大畜', '艮', '乾'], ['山泽损', '艮', '兑'], ['火泽睽', '离', '兑'], ['天泽履', '乾', '兑'], ['风泽中孚', '巽', '兑'], ['风山渐', '巽', '艮']] },
  { gong: '兑', members: [['兑为泽', '兑', '兑'], ['泽水困', '兑', '坎'], ['泽地萃', '兑', '坤'], ['泽山咸', '兑', '艮'], ['水山蹇', '坎', '艮'], ['地山谦', '坤', '艮'], ['雷山小过', '震', '艮'], ['雷泽归妹', '震', '兑']] },
]

const GUA_MAP: Record<string, GuaEntry> = {}
PALACE_TABLE.forEach(({ gong, members }) => {
  members.forEach(([name, upper, lower], idx) => {
    GUA_MAP[TRI_BITS[lower]! + TRI_BITS[upper]!] = { name, gong, idx, lower, upper }
  })
})

const SHI_LINES = [6, 1, 2, 3, 4, 5, 4, 3]

export interface InstalledYao {
  pos: number
  yang: boolean
  moving: boolean
  najia: string
  element: Element
  liuqin: string
  liushou: string
  shi: boolean
  ying: boolean
}

export interface InstalledGua {
  name: string
  gong: Trigram
  gongWuxing: Element
  /** 八宫中的位次 0..7：本宫/一世…游魂/归魂 */
  idx: number
  yaos: InstalledYao[]
}

const LIUQIN_REL: Record<string, string> = {
  同: '兄弟', 生我: '父母', 我生: '子孙', 我克: '妻财', 克我: '官鬼',
}

function relTo(gongWx: Element, lineWx: Element): string {
  if (gongWx === lineWx) return '同'
  const sheng: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  const ke: Record<Element, Element> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }
  if (sheng[gongWx] === lineWx) return '我生'
  if (sheng[lineWx] === gongWx) return '生我'
  if (ke[gongWx] === lineWx) return '我克'
  return '克我'
}

const LIUSHOU_SEQ = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']

function liushouStart(dayGan: string): number {
  if ('甲乙'.includes(dayGan)) return 0
  if ('丙丁'.includes(dayGan)) return 1
  if (dayGan === '戊') return 2
  if (dayGan === '己') return 3
  if ('庚辛'.includes(dayGan)) return 4
  return 5
}

export function install(bits: string, dayGan: string): InstalledGua {
  const entry = GUA_MAP[bits]
  if (!entry) throw new Error('未知卦象: ' + bits)
  const gongWuxing = TRI_WUXING[entry.gong]
  const inner = NAJIA_INNER[entry.lower]
  const outer = NAJIA_OUTER[entry.upper]
  const shiPos = SHI_LINES[entry.idx]!
  const yaos: InstalledYao[] = []
  const allBits = TRI_BITS[entry.lower]! + TRI_BITS[entry.upper]!
  const start = liushouStart(dayGan)
  for (let i = 0; i < 6; i++) {
    const gz = i < 3 ? inner[i]! : outer[i - 3]!
    const wx = ELE_B[gz[1]!]!
    yaos.push({
      pos: i + 1,
      yang: allBits[i] === '1',
      moving: false,
      najia: gz,
      element: wx,
      liuqin: LIUQIN_REL[relTo(gongWuxing, wx)]!,
      liushou: LIUSHOU_SEQ[(i + start) % 6]!,
      shi: i + 1 === shiPos,
      ying: Math.abs(i + 1 - shiPos) === 3,
    })
  }
  return { name: entry.name, gong: entry.gong, gongWuxing, idx: entry.idx, yaos }
}

/** 由六位二进制（自下而上）查卦名，未知卦返回空串 */
export function nameFromBits(bits: string): string {
  return GUA_MAP[bits]?.name ?? ''
}

export type CoinResult = 6 | 7 | 8 | 9

export function tossCoins(): CoinResult {
  let backs = 0
  for (let i = 0; i < 3; i++) if (Math.random() < 0.5) backs++
  return ([6, 7, 8, 9] as CoinResult[])[backs]!
}

export const COIN_LABEL: Record<CoinResult, string> = {
  6: '老阴 · 交', 7: '少阳 · 单', 8: '少阴 · 拆', 9: '老阳 · 重',
}

export function bitsFromCast(cast: number[]): string {
  return cast.map((v) => (v === 7 || v === 9 ? '1' : '0')).join('')
}

export function changedBits(bits: string, cast: number[]): string {
  return bits
    .split('')
    .map((b, i) => {
      const v = cast[i]
      if (v === 9) return '0'
      if (v === 6) return '1'
      return b
    })
    .join('')
}

export function xunKong(gz: string): string {
  const GAN = '甲乙丙丁戊己庚辛壬癸'
  const ZHI = '子丑寅卯辰巳午未申酉戌亥'
  const gi = GAN.indexOf(gz[0]!)
  let zi = ZHI.indexOf(gz[1]!)
  while (((zi % 10) + 10) % 10 !== ((gi % 10) + 10) % 10) zi += 12
  const start = Math.floor(zi / 10) * 10
  return ZHI[(start + 10) % 12]! + ZHI[(start + 11) % 12]!
}

export function yongshenLiuqin(category: string): string | null {
  const map: Record<string, string> = {
    财运: '妻财', 寻物: '妻财', 事业: '官鬼', 学业: '父母', 行人: '父母',
  }
  return map[category] ?? null
}

export interface GuaCatalogEntry extends GuaEntry {
  bits: string
}

export function guaCatalog(): GuaCatalogEntry[] {
  return Object.entries(GUA_MAP).map(([bits, e]) => ({ ...e, bits }))
}

export const GUA_TIP: Record<string, string> = {
  乾为天: '刚健进取，自强不息',
  坤为地: '厚德承载，以柔济刚',
  水雷屯: '草创多艰，蓄势待发',
  山水蒙: '启蒙求教，虚心则明',
  水天需: '等待时机，安闲勿躁',
  天水讼: '争讼宜解，退一步宽',
  地水师: '兴师动众，纪律为先',
  水地比: '亲附相帮，择善而从',
  风天小畜: '小有积蓄，力尚未足',
  天泽履: '如履虎尾，礼让则吉',
  地天泰: '通泰和畅，上下相交',
  天地否: '塞滞不通，守静待变',
  天火同人: '同心协力，志同道合',
  火天大有: '大有所获，盛时需敛',
  地山谦: '谦尊而光，低处纳福',
  雷地豫: '和乐豫备，顺动而喜',
  泽雷随: '随时而动，择善而随',
  山风蛊: '整饬积弊，治乱有序',
  地泽临: '临事而惧，渐进得位',
  风地观: '观仰瞻视，静看大局',
  火雷噬嗑: '咬合去梗，除障则通',
  山火贲: '文饰其表，质为文本',
  山地剥: '剥落衰微，厚下安宅',
  地雷复: '一阳来复，迷途知返',
  天雷无妄: '无妄至诚，循理而行',
  山天大畜: '大畜其德，止而后养',
  山雷颐: '慎言节食，自养自求',
  泽风大过: '大过之时，行非常之事',
  坎为水: '重险叠陷，守恒涉险',
  离为火: '附丽光明，柔顺守正',
  泽山咸: '二气感应，以诚相感',
  雷风恒: '恒久有守，立不易方',
  天山遁: '遁世避锋，退保其余',
  雷天大壮: '壮而守礼，恃强则折',
  火地晋: '晋升向明，柔进上行',
  地火明夷: '晦而转明，用晦自藏',
  风火家人: '家道齐整，内外有别',
  火泽睽: '同床异梦，小事可谐',
  水山蹇: '行路蹇难，反身修德',
  雷水解: '解缓舒困，赦过宥罪',
  山泽损: '损己利人，减以求进',
  风雷益: '损上益下，施惠得众',
  泽天夬: '决而去之，刚断莫留',
  天风姤: '不期而遇，防微杜渐',
  泽地萃: '聚而成群，敬之则安',
  水风井: '井养不穷，守常济人',
  泽火革: '变革有时，顺天应人',
  火风鼎: '鼎定新成，养贤凝命',
  震为雷: '震惊而动，惧以致福',
  艮为山: '时止则止，笃实安静',
  风山渐: '循序渐进，鸿羽有序',
  雷泽归妹: '归妹有情，守礼则吉',
  雷火丰: '盛大丰明，日中则昃',
  火山旅: '旅居在外，谨慎自处',
  巽为风: '随风入物，谦柔行事',
  兑为泽: '朋友讲习，和悦相处',
  风水涣: '涣散将聚，涉川有功',
  水泽节: '节而有度，张弛中节',
  风泽中孚: '中诚感通，信及豚鱼',
  雷山小过: '小事可过，大事守正',
  水火既济: '既济功成，守成防患',
  火水未济: '未济待时，慎辨居方',
}
