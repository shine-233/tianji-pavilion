/**
 * 六爻纳甲引擎（京房一脉）
 *
 * 分工：本模块负责「摇卦 → 成卦 → 用神分析」的完整链路；
 * 纳甲、六亲、六兽、八宫卦序等静态表统一由 liuyaoExtra 的查表实现提供，
 * 这里不再自备一套（历史上有两套，已合并，parity 测试对拍兜底）。
 *
 * 断语只是把传统套路整理成人话，供把玩参考。
 */

import { ELE_B } from './constants'
import { TRI_BITS, TRIGRAMS, TRI_WUXING, install, nameFromBits, xunKong } from './liuyaoExtra'

export type Element = '木' | '火' | '土' | '金' | '水'

export const TRIGRAM_NAMES = TRIGRAMS
/** 先天八卦按二进制自下而上存位（1 阳 0 阴） */
export const TRIGRAM_BITS: number[][] = TRIGRAMS.map((t) => TRI_BITS[t]!.split('').map(Number))
/** 先天八卦数 ↔ 三爻数组下标 */
export const XIANTIAN_NUM_TO_TRIG = [7, 0, 1, 2, 3, 4, 5, 6] as const // 数1~8 → 下标
export const ZHI_WUXING = ELE_B
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

const E_SHENG: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const E_KE: Record<Element, Element> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }

/** 生我者 */
export function shengWo(e: Element): Element {
  return (Object.keys(E_SHENG) as Element[]).find((k) => E_SHENG[k] === e)!
}
/** 克我者 */
export function keWo(e: Element): Element {
  return (Object.keys(E_KE) as Element[]).find((k) => E_KE[k] === e)!
}

/** 八宫首卦与本宫五行（由三爻八卦五行推导） */
export const PALACE_ELEMENT: Record<string, Element> = Object.fromEntries(
  TRIGRAMS.map((g) => [g + '宫', TRI_WUXING[g]]),
)

/**
 * 卦索引约定：hex = trigVal(lower) * 8 + trigVal(upper)
 * trigVal = b0 + 2*b1 + 4*b2（b0 最下一爻）
 */
const TV = [0, 0, 0, 0, 0, 0, 0, 0]
TRIGRAM_BITS.forEach((bits, i) => {
  TV[i] = bits[0]! + bits[1]! * 2 + bits[2]! * 4
})
/** 二进制值 → 数组下标（TRIGRAM_NAMES 下标） */
const POS_FROM_TV: number[] = []
TV.forEach((v, i) => {
  POS_FROM_TV[v] = i
})

/** 卦名：参数为「下卦、上卦」的数组下标（0=乾 … 7=坤） */
export function hexName(lowerPos: number, upperPos: number): string {
  return nameFromBits(TRI_BITS[TRIGRAMS[lowerPos]!]! + TRI_BITS[TRIGRAMS[upperPos!]!]!)
}

export function bitsToIdx(bits: number[]): number {
  // bits 自下而上 6 位
  const lower = bits[0]! + bits[1]! * 2 + bits[2]! * 4
  const upper = bits[3]! + bits[4]! * 2 + bits[5]! * 4
  return lower * 8 + upper
}
export function idxToBits(idx: number): number[] {
  const lo = POS_FROM_TV[Math.floor(idx / 8)]!
  const hi = POS_FROM_TV[idx % 8]!
  return TRIGRAM_BITS[lo]!.concat(TRIGRAM_BITS[hi]!)
}

export interface LiuYaoLine {
  pos: number // 1..6 自下而上
  bit: 0 | 1
  najia: string // 干支
  element: Element
  liuqin: string // 六亲
  beast: string // 六兽
  moving: boolean
  /** 老阳(重)○ / 老阴(交)× 的记号 */
  mark?: string
  shiYing?: '世' | '应'
  changedBit?: 0 | 1
}

export interface LiuYaoChart {
  name: string
  palace: string
  gongWuxing: Element
  lowerIdx: number
  upperIdx: number
  lines: LiuYaoLine[]
  shiPos: number
  yingPos: number
  seqRole: string // 首卦/一世…游魂/归魂
  hasMoving: boolean
  changedName: string | null
  xunkong: [string, string]
}

export function liuqinOf(gong: Element, target: Element): string {
  if (target === gong) return '兄弟'
  if (shengWo(gong) === target) return '父母' // 生我者父母：target 生 gong
  if (E_SHENG[gong] === target) return '子孙' // 我生者子孙
  if (E_KE[gong] === target) return '妻财' // 我克者妻财
  return '官鬼' // 克我者官鬼
}

/** 占日干支 → 旬空两支 */
export function xunkong(dayGanzhi: string): [string, string] {
  const kx = xunKong(dayGanzhi)
  return [kx[0]!, kx[1]!]
}

export interface BuildOpts {
  /** 每爻掷出的背数 0~3（3背=老阳动，0背=老阴动，1背=少阳，2背=少阴） */
  tosses: number[]
  dayGan: string
  dayZhi: string
  monthZhi: string // 月建地支（节气月，简化取农历月支亦可）
}

export function buildChart(opts: BuildOpts): LiuYaoChart {
  const { tosses, dayGan, dayZhi } = opts
  if (tosses.length !== 6) throw new Error('需要六次掷币结果')

  // 背数 → 爻：1背=少阳(阳静)，2背=少阴(阴静)，3背=老阳(阳动)，0背=老阴(阴动)
  const bits = tosses.map((b) => (b === 1 || b === 3 ? 1 : 0))
  const moving = tosses.map((b) => b === 3 || b === 0)
  const sixBits = bits as Array<0 | 1>

  // 装卦统一走查表引擎（纳甲/六亲/六兽/世应的唯一来源）
  const bitsStr = sixBits.join('')
  const installed = install(bitsStr, dayGan)
  const shiPos = installed.yaos.find((y) => y.shi)!.pos
  const yingPos = installed.yaos.find((y) => y.ying)!.pos

  const lines: LiuYaoLine[] = installed.yaos.map((y, i) => ({
    pos: y.pos,
    bit: sixBits[i]!,
    najia: y.najia,
    element: y.element,
    liuqin: y.liuqin,
    beast: y.liushou,
    moving: moving[i]!,
    mark: tosses[i] === 3 ? '○' : tosses[i] === 0 ? '×' : undefined,
    shiYing: y.shi ? ('世' as const) : y.ying ? ('应' as const) : undefined,
    changedBit: moving[i] ? ((sixBits[i] === 1 ? 0 : 1) as 0 | 1) : undefined,
  }))

  let changedName: string | null = null
  if (moving.some(Boolean)) {
    const nb = sixBits.map((b, i) => (moving[i] ? ((b === 1 ? 0 : 1) as 0 | 1) : b))
    changedName = install(nb.join(''), dayGan).name
  }

  return {
    name: installed.name,
    palace: installed.gong + '宫',
    gongWuxing: installed.gongWuxing,
    lowerIdx: TRIGRAMS.findIndex((t) => TRI_BITS[t] === bitsStr.slice(0, 3)),
    upperIdx: TRIGRAMS.findIndex((t) => TRI_BITS[t] === bitsStr.slice(3)),
    lines,
    shiPos,
    yingPos,
    seqRole: ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'][installed.idx],
    hasMoving: moving.some(Boolean),
    changedName,
    xunkong: xunkong(dayGan + dayZhi),
  }
}

/** 常用所问之事 → 用神六亲 */
export const YONGSHEN_MAP: Array<{ key: string; label: string; liuqin: string }> = [
  { key: 'wealth', label: '求财生意', liuqin: '妻财' },
  { key: 'career', label: '事业功名', liuqin: '官鬼' },
  { key: 'marryF', label: '婚姻（女问男方）', liuqin: '官鬼' },
  { key: 'marryM', label: '婚姻（男问女方）', liuqin: '妻财' },
  { key: 'study', label: '学业文书考试', liuqin: '父母' },
  { key: 'child', label: '子女晚辈医药', liuqin: '子孙' },
  { key: 'friend', label: '朋友同伴合伙', liuqin: '兄弟' },
]

interface LineScore {
  yueSheng: boolean
  yueKe: boolean
  riSheng: boolean
  riKe: boolean
}

function judgeLine(el: Element, monthZhi: string, dayZhi: string): LineScore {
  const mEl = ZHI_WUXING[monthZhi]
  const dEl = ZHI_WUXING[dayZhi]
  return {
    yueSheng: mEl === shengWo(el),
    yueKe: E_KE[mEl] === el,
    riSheng: dEl === shengWo(el),
    riKe: E_KE[dEl] === el,
  }
}

export interface YongshenVerdict {
  liuqin: string
  foundAt: number[] // 出现爻位
  moving: number[]
  strengthScore: number // -100 ~ 100
  phrases: string[]
  conclusion: '旺' | '平' | '弱'
}

export function analyzeYongshen(chart: LiuYaoChart, liuqin: string, monthZhi: string, dayZhi: string): YongshenVerdict {
  const hits = chart.lines.filter((l) => l.liuqin === liuqin)
  const phrases: string[] = []
  let score = 0

  if (hits.length === 0) {
    return {
      liuqin,
      foundAt: [],
      moving: [],
      strengthScore: -60,
      phrases: [`卦中不见${liuqin}用神，传统说法叫「用神不现」，事情多半还没到火候，或者心念不在这件事上。`],
      conclusion: '弱',
    }
  }

  const movingHits = hits.filter((l) => l.moving)
  for (const l of hits) {
    const j = judgeLine(l.element, monthZhi, dayZhi)
    if (j.yueSheng) score += 28
    if (j.yueKe) score -= 26
    if (l.element === ZHI_WUXING[monthZhi]) score += 22
    if (j.riSheng) score += 18
    if (j.riKe) score -= 18
    if (l.element === ZHI_WUXING[dayZhi]) score += 14
    if (chart.xunkong.includes(l.najia[1])) {
      score -= 15
      phrases.push(`${l.liuqin}${l.najia}在${l.pos}爻，恰逢旬空（${chart.xunkong.join('、')}），传统认为此事眼下落空，出空之日才有眉目。`)
    }
  }

  for (const l of movingHits) {
    phrases.push(`用神${l.liuqin}（${l.najia}）在第${l.pos}爻发动${l.mark ?? ''}，主事情本身有变化、有动静。`)
  }

  // 其他动爻对用神的生克
  for (const l of chart.lines.filter((x) => x.moving && x.liuqin !== liuqin)) {
    const target = hits[0].element
    if (E_SHENG[l.element] === target) phrases.push(`第${l.pos}爻${l.liuqin}${l.najia}发动来生用神，是帮手。`)
    else if (E_KE[l.element] === target) phrases.push(`第${l.pos}爻${l.liuqin}${l.najia}发动克用神，是阻力，留意这个方向。`)
  }

  // 世爻状态
  const shi = chart.lines[chart.shiPos - 1]
  const shiRel = liuqinOf(chart.gongWuxing, shi.element)
  phrases.push(`世爻持${shiRel}（${shi.najia}），应爻在${chart.yingPos}爻持${chart.lines[chart.yingPos - 1].liuqin}。`)

  score = Math.max(-100, Math.min(100, score))
  return {
    liuqin,
    foundAt: hits.map((h) => h.pos),
    moving: movingHits.map((m) => m.pos),
    strengthScore: score,
    phrases,
    conclusion: score >= 25 ? '旺' : score >= -15 ? '平' : '弱',
  }
}

/** 白话总断 */
export function summarize(verdict: YongshenVerdict, chart: LiuYaoChart, questionLabel: string): string {
  const tone =
    verdict.conclusion === '旺'
      ? '整体看是往上走的势头，该出手时不必犹豫太久。'
      : verdict.conclusion === '平'
        ? '不好不坏，属于稳中有变的一类，按部就班最稳妥。'
        : '眼下时机偏弱，与其强求，不如等一等、缓一缓。'
  const head = `这一卦问的是${questionLabel}，取${verdict.liuqin}为用神${verdict.foundAt.length ? `（见${verdict.foundAt.join('、')}爻）` : ''}。`
  const tail = chart.changedName
    ? `本卦${chart.name}动而变${chart.changedName}，变化的方向值得琢磨。`
    : `六爻安静（本卦${chart.name}），局面暂时不会有大变动。`
  return [head, ...verdict.phrases, tone, tail].join('')
}

/** 掷币文案 */
export function tossText(backCount: number): { label: string; detail: string; moving: boolean } {
  switch (backCount) {
    case 3:
      return { label: '老阳 ○', detail: '三个背面 · 阳爻动', moving: true }
    case 2:
      return { label: '少阴 ‥', detail: '两个背面一个正面 · 阴爻', moving: false }
    case 1:
      return { label: '少阳 ——', detail: '一个背面两个正面 · 阳爻', moving: false }
    default:
      return { label: '老阴 ×', detail: '三个正面 · 阴爻动', moving: true }
  }
}
