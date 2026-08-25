/**
 * 梅花易数：时间起卦与数字起卦，体用生克断法。
 * 规则口径：
 * - 年支数（子1…亥12）+ 农历月 + 农历日，除8取余为上卦（整除作8）
 * - 再加时辰数除8取余为下卦
 * - 四数总和除6取余为动爻（整除作6）
 * - 先天数：乾1兑2离3震4巽5坎6艮7坤8
 */
import type { Element } from './liuyao'

export const NUM_TO_TRIG = ['坤', '艮', '坎', '巽', '震', '离', '兑', '乾'] as const // 二进制值0~7 → 卦名
export const TRIG_SYMBOL: Record<string, string> = { 乾: '☰', 兑: '☱', 离: '☲', 震: '☳', 巽: '☴', 坎: '☵', 艮: '☶', 坤: '☷' }
export const TRIG_WUXING: Record<string, Element> = { 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' }
export const TRIG_DESC: Record<string, string> = {
  乾: '天 · 刚健进取',
  兑: '泽 · 喜悦口舌',
  离: '火 · 文明礼乐',
  震: '雷 · 动而奋起',
  巽: '风 · 入也柔顺',
  坎: '水 · 险陷多思',
  艮: '山 · 止而有守',
  坤: '地 · 厚德承载',
}

const SHENG: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const KE: Record<Element, Element> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }

export interface MeihuaChart {
  upperName: string
  lowerName: string
  movingLine: number // 1..6 自下而上
  tiName: string
  yongName: string
  changedUpper?: string
  changedLower?: string
  huUpper: string
  huLower: string
  verdict: { level: '吉' | '小凶' | '凶' | '平'; text: string }
}

function bits(name: string): number[] {
  const table: Record<string, number[]> = {
    乾: [1, 1, 1], 兑: [0, 1, 1], 离: [1, 0, 1], 震: [0, 0, 1],
    巽: [1, 1, 0], 坎: [0, 1, 0], 艮: [1, 0, 0], 坤: [0, 0, 0],
  }
  return table[name]
}
/** 自下而上取爻后翻转 */
function flipAt(lines: number[], pos: number): string[] {
  const b = [...lines]
  b[pos - 1] = b[pos - 1] === 1 ? 0 : 1
  const lower = b.slice(0, 3)
  const upper = b.slice(3)
  const keyOf = (a: number[]): string => {
    const v = a[0] + a[1] * 2 + a[2] * 4
    return NUM_TO_TRIG[v]
  }
  return [keyOf(lower), keyOf(upper)]
}

export function judgeTiYong(ti: string, yong: string): MeihuaChart['verdict'] {
  const t = TRIG_WUXING[ti]
  const y = TRIG_WUXING[yong]
  if (t === y) {
    return { level: '吉', text: `体用同属${t}，比和之象。事情顺着自己的性子来，商量着办就能成。` }
  }
  if (SHENG[t] === y) {
    return { level: '小凶', text: `体${t}而生用${y}，是「体去生他」，主耗损。精力钱财往外掏得多，回笼得慢，量力而行。` }
  }
  if (SHENG[y] === t) {
    return { level: '吉', text: `用${y}而生体${t}，是外头来帮你，进益之象。有人送机会上门，接住就是。` }
  }
  if (KE[t] === y) {
    return { level: '平', text: `体${t}克用${y}，能成事但要费力气。主动权在你手里，只是这单生意做得辛苦。` }
  }
  if (KE[y] === t) {
    return { level: '凶', text: `用${y}克体${t}，外头压着你一头。此时不宜硬碰，先避其锋芒再图后计。` }
  }
  return { level: '平', text: '体用关系平平，不功不过。' }
}

export interface TimeInput {
  yearZhiNum: number // 子=1…亥=12
  month: number
  day: number
  hourZhiNum: number // 子=1…
}

export function timeChart(inp: TimeInput): MeihuaChart {
  const n1 = inp.yearZhiNum + inp.month + inp.day
  const upNum = ((n1 - 1) % 8) + 1
  const n2 = n1 + inp.hourZhiNum
  const lowNum = ((n2 - 1) % 8) + 1
  const mv = ((n2 - 1) % 6) + 1
  return fromNumbers(upNum, lowNum, mv)
}

/** 数字起卦：两个自然数 */
export function numberChart(a: number, b: number, movingOverride?: number): MeihuaChart {
  const na = ((Math.floor(Math.abs(a)) - 1) % 8) + 1
  const nb = ((Math.floor(Math.abs(b)) - 1) % 8) + 1
  const mv = movingOverride ?? (((Math.abs(a) + Math.abs(b)) % 6) || 6)
  return fromNumbers(na, nb, mv)
}

/** 上卦先天数、下卦先天数、动爻（1下-6上） */
export function fromNumbers(upNum: number, lowNum: number, mv: number): MeihuaChart {
  const order = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
  const upperName = order[(upNum - 1 + 8) % 8]
  const lowerName = order[(lowNum - 1 + 8) % 8]
  const movingLine = ((mv - 1 + 6) % 6) + 1
  const inLower = movingLine <= 3
  const lines = bits(lowerName).concat(bits(upperName))
  const [changedLower, changedUpper] = flipAt(lines, movingLine)
  const tiName = inLower ? upperName : lowerName
  const yongName = inLower ? lowerName : upperName
  const verdict = judgeTiYong(tiName, yongName)

  // 互卦：234爻为下，345爻为上
  const huLowerBits = [lines[1], lines[2], lines[3]]
  const huUpperBits = [lines[2], lines[3], lines[4]]
  const keyOf = (a: number[]): string => NUM_TO_TRIG[a[0] + a[1] * 2 + a[2] * 4]

  return {
    upperName,
    lowerName,
    movingLine,
    tiName,
    yongName,
    changedUpper,
    changedLower,
    huUpper: keyOf(huUpperBits),
    huLower: keyOf(huLowerBits),
    verdict,
  }
}

export function chartText(c: MeihuaChart): string[] {
  return [
    `本卦「${c.upperName}${c.lowerName}」上下相重——上${TRIG_DESC[c.upperName]}，下${TRIG_DESC[c.lowerName]}。`,
    `第${c.movingLine}爻动：动在${c.movingLine <= 3 ? '下卦' : '上卦'}，故取${c.yongName}为用卦、${c.tiName}为体卦。`,
    c.verdict.text,
    `互卦见${c.huUpper}${c.huLower}，是事情的中间过程；变卦走到${c.changedUpper}${c.changedLower}，是最终的走向。`,
  ]
}
