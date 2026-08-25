/**
 * 六爻纳甲引擎（京房一脉）
 *
 * 数据与规则：
 * - 先天八卦按二进制自下而上存位（1 阳 0 阴），hex = 下卦*8 + 上卦
 * - 八宫卦序定本宫五行与世应爻位（含游魂归魂）
 * - 纳甲：干支逐爻装卦；六亲以本宫五行为「我」
 * - 六兽按占日天干起初爻顺行
 * - 旬空由占日干支推得
 *
 * 断语只是把传统套路整理成人话，供把玩参考。
 */

export type Element = '木' | '火' | '土' | '金' | '水'

export const TRIGRAM_NAMES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const
export const TRIGRAM_BITS: number[][] = [
  [1, 1, 1], // 乾
  [1, 1, 0], // 兑
  [1, 0, 1], // 离
  [1, 0, 0], // 震
  [0, 1, 1], // 巽
  [0, 1, 0], // 坎
  [0, 0, 1], // 艮
  [0, 0, 0], // 坤
]
/** 先天八卦数 ↔ 三爻数组下标 */
export const XIANTIAN_NUM_TO_TRIG = [7, 0, 1, 2, 3, 4, 5, 6] as const // 数1~8 → 下标
export const ZHI_WUXING: Record<string, Element> = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' }
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

/** 八宫首卦与本宫五行 */
export const PALACE_ELEMENT: Record<string, Element> = {
  乾宫: '金',
  兑宫: '金',
  离宫: '火',
  震宫: '木',
  巽宫: '木',
  坎宫: '水',
  艮宫: '土',
  坤宫: '土',
}

/**
 * 卦索引约定：hex = trigVal(lower) * 8 + trigVal(upper)
 * trigVal = b0 + 2*b1 + 4*b2（b0 最下一爻）
 */
const TV = [0, 0, 0, 0, 0, 0, 0, 0]
TRIGRAM_BITS.forEach((bits, i) => {
  TV[i] = bits[0] + bits[1] * 2 + bits[2] * 4
})
/** 二进制值 → 数组下标（TRIGRAM_NAMES 下标） */
const POS_FROM_TV: number[] = []
TV.forEach((v, i) => {
  POS_FROM_TV[v] = i
})

/** 64 卦名表 [下卦名][上卦名] */
const NAME_TABLE: Record<string, Record<string, string>> = {
  乾: { 乾: '乾为天', 兑: '天泽履', 离: '天火同人', 震: '天雷无妄', 巽: '天风姤', 坎: '天水讼', 艮: '天山遁', 坤: '天地否' },
  兑: { 乾: '泽天夬', 兑: '兑为泽', 离: '泽火革', 震: '泽雷随', 巽: '泽风大过', 坎: '泽水困', 艮: '泽山咸', 坤: '泽地萃' },
  离: { 乾: '火天大有', 兑: '火泽睽', 离: '离为火', 震: '火雷噬嗑', 巽: '火风鼎', 坎: '火水未济', 艮: '火山旅', 坤: '火地晋' },
  震: { 乾: '雷天大壮', 兑: '雷泽归妹', 离: '雷火丰', 震: '震为雷', 巽: '雷风恒', 坎: '雷水解', 艮: '雷山小过', 坤: '雷地豫' },
  巽: { 乾: '风天小畜', 兑: '风泽中孚', 离: '风火家人', 震: '风雷益', 巽: '巽为风', 坎: '风水涣', 艮: '风山渐', 坤: '风地观' },
  坎: { 乾: '水天需', 兑: '水泽节', 离: '水火既济', 震: '水雷屯', 巽: '水风井', 坎: '坎为水', 艮: '水山蹇', 坤: '水地比' },
  艮: { 乾: '山天大畜', 兑: '山泽损', 离: '山火贲', 震: '山雷颐', 巽: '山风蛊', 坎: '山水蒙', 艮: '艮为山', 坤: '山地剥' },
  坤: { 乾: '地天泰', 兑: '地泽临', 离: '地火明夷', 震: '地雷复', 巽: '地风升', 坎: '地水师', 艮: '地山谦', 坤: '坤为地' },
}

/** 表按 [上卦][下卦] 排列（与通行卦序表一致） */
export function hexName(lowerPos: number, upperPos: number): string {
  return NAME_TABLE[TRIGRAM_NAMES[upperPos]][TRIGRAM_NAMES[lowerPos]]
}

export function bitsToIdx(bits: number[]): number {
  // bits 自下而上 6 位
  const lower = bits[0] + bits[1] * 2 + bits[2] * 4
  const upper = bits[3] + bits[4] * 2 + bits[5] * 4
  return lower * 8 + upper
}
export function idxToBits(idx: number): number[] {
  const lo = POS_FROM_TV[Math.floor(idx / 8)]
  const hi = POS_FROM_TV[idx % 8]
  return TRIGRAM_BITS[lo].concat(TRIGRAM_BITS[hi])
}

/** 八宫卦序：从每宫首卦出发的 8 个卦名，依次为首卦至五世、游魂、归魂 */
export const PALACE_SEQUENCE: Record<string, string[]> = {
  乾宫: ['乾为天', '天风姤', '天山遁', '天地否', '风地观', '山地剥', '火地晋', '火天大有'],
  坎宫: ['坎为水', '水泽节', '水雷屯', '水火既济', '泽火革', '雷火丰', '地火明夷', '地水师'],
  艮宫: ['艮为山', '山火贲', '山天大畜', '山泽损', '火泽睽', '天泽履', '风泽中孚', '风山渐'],
  震宫: ['震为雷', '雷地豫', '雷水解', '雷风恒', '地风升', '水风井', '泽风大过', '泽雷随'],
  巽宫: ['巽为风', '风天小畜', '风火家人', '风雷益', '天雷无妄', '火雷噬嗑', '山雷颐', '山风蛊'],
  离宫: ['离为火', '火山旅', '火风鼎', '火水未济', '山水蒙', '风水涣', '天水讼', '天火同人'],
  坤宫: ['坤为地', '地雷复', '地泽临', '地天泰', '雷天大壮', '泽天夬', '水天需', '水地比'],
  兑宫: ['兑为泽', '泽水困', '泽地萃', '泽山咸', '水山蹇', '地山谦', '雷山小过', '雷泽归妹'],
}

/** 世应爻位：index 0..7 对应 首卦至归魂；值为世爻位置(1..6)，应爻=世±3 */
export const SHI_POS = [6, 1, 2, 3, 4, 5, 4, 3]

/** 纳甲：内三卦与外三卦的干支（自下而上） */
const NAJIA_IN: Record<string, string[]> = {
  乾: ['甲子', '甲寅', '甲辰'],
  坎: ['戊寅', '戊辰', '戊午'],
  艮: ['丙辰', '丙午', '丙申'],
  震: ['庚子', '庚寅', '庚辰'],
  巽: ['辛丑', '辛亥', '辛酉'],
  离: ['己卯', '己丑', '己亥'],
  坤: ['乙未', '乙巳', '乙卯'],
  兑: ['丁巳', '丁卯', '丁丑'],
}
const NAJIA_OUT: Record<string, string[]> = {
  乾: ['壬午', '壬申', '壬戌'],
  坎: ['戊申', '戊戌', '戊子'],
  艮: ['丙戌', '丙子', '丙寅'],
  震: ['庚午', '庚申', '庚戌'],
  巽: ['辛未', '辛巳', '辛卯'],
  离: ['己酉', '己未', '己巳'],
  坤: ['癸亥', '癸酉', '癸丑'],
  兑: ['丁亥', '丁酉', '丁未'],
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

const BEAST_SEQ = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']
export function beastsOfDay(dayGan: string): string[] {
  const startMap: Record<string, number> = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 }
  const s = startMap[dayGan] ?? 0
  return Array.from({ length: 6 }, (_, i) => BEAST_SEQ[(s + i) % 6])
}

/** 由卦名查八宫信息 */
const NAME_TO_PALACE: Record<string, { palace: string; role: string }> = {}
for (const [palace, names] of Object.entries(PALACE_SEQUENCE)) {
  names.forEach((n, i) => {
    NAME_TO_PALACE[n] = { palace, role: ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'][i] }
  })
}

/** 占日干支 → 旬空两支 */
export function xunkong(dayGanzhi: string): [string, string] {
  let idx = 0
  for (let i = 0; i < 60; i++) {
    if (STEMS[i % 10] === dayGanzhi[0] && BRANCHES[i % 12] === dayGanzhi[1]) {
      idx = i
      break
    }
  }
  const xunStart = Math.floor(idx / 10) * 10
  return [BRANCHES[(xunStart + 10) % 12], BRANCHES[(xunStart + 11) % 12]]
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
  const idx = bitsToIdx(bits)
  // 数组下标（用于取名与纳甲查表）
  const lowerPos = POS_FROM_TV[Math.floor(idx / 8)]
  const upperPos = POS_FROM_TV[idx % 8]
  const name = hexName(lowerPos, upperPos)
  const info = NAME_TO_PALACE[name]
  const palace = info.palace
  const gongElement = PALACE_ELEMENT[palace]
  const roleIdx = PALACE_SEQUENCE[palace].indexOf(name)
  const shiPos = SHI_POS[roleIdx]
  const yingPos = ((shiPos + 2) % 6) + 1

  const lowerName = TRIGRAM_NAMES[lowerPos]
  const upperName = TRIGRAM_NAMES[upperPos]
  const beasts = beastsOfDay(dayGan)

  const lines: LiuYaoLine[] = sixBits.map((bit, i) => {
    const pos = i + 1
    const gz = pos <= 3 ? NAJIA_IN[lowerName][pos - 1] : NAJIA_OUT[upperName][pos - 4]
    const el = ZHI_WUXING[gz[1]]
    const isMoving = moving[i]
    return {
      pos,
      bit,
      najia: gz,
      element: el,
      liuqin: liuqinOf(gongElement, el),
      beast: beasts[i],
      moving: isMoving,
      mark: tosses[i] === 3 ? '○' : tosses[i] === 0 ? '×' : undefined,
      shiYing: pos === shiPos ? '世' : pos === yingPos ? '应' : undefined,
      changedBit: isMoving ? ((bit === 1 ? 0 : 1) as 0 | 1) : undefined,
    }
  })

  let changedName: string | null = null
  if (moving.some(Boolean)) {
    const nb = sixBits.map((b, i) => (moving[i] ? ((b === 1 ? 0 : 1) as 0 | 1) : b))
    const nidx = bitsToIdx(nb)
    changedName = hexName(POS_FROM_TV[Math.floor(nidx / 8)], POS_FROM_TV[nidx % 8])
  }

  return {
    name,
    palace,
    gongWuxing: gongElement,
    lowerIdx: lowerPos,
    upperIdx: upperPos,
    lines,
    shiPos,
    yingPos,
    seqRole: ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'][roleIdx],
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
