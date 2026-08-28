/** 排盘运行时：封装 lunar-javascript 调用，输出完整命盘结果 */
import { Solar } from 'lunar-javascript'
import { computeAll, ChartResult, Pillar, shensha } from './engine'
import { ziweiChart, ziweiScore } from './ziwei'

let POOL: number[] | null = null
let POOL_N = 0

export async function loadPool(): Promise<{ n: number }> {
  try {
    const r = await fetch('./data/percentiles_2001_2005_male.json')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    POOL = j.totals
    POOL_N = j.n
    return { n: j.n }
  } catch (e) {
    console.warn('百分位池装载失败:', e)
    throw e
  }
}

export function poolReady(): boolean {
  return POOL !== null
}

export function poolN(): number {
  return POOL_N
}

export function percentile(t: number): number {
  if (!POOL) return NaN
  const v = t * 100
  let lo = 0
  let hi = POOL.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (POOL[mid]! <= v) lo = mid + 1
    else hi = mid
  }
  return (lo / POOL.length) * 100
}

/** 全池总分中位数（原始分制）。池未装载返回 NaN。
 *  总分分布高度集中在中低分区，展示必须搭配百分位——否则 10/100 的盘会被误读成"不及格"。 */
export function poolMedian(): number {
  if (!POOL || POOL.length === 0) return NaN
  const mid = POOL.length >> 1
  const a = POOL[mid - 1] ?? POOL[mid]!
  const b = POOL[mid]!
  return (a + b) / 200
}

export function runChart(y: number, m: number, d: number, hh: number, mm: number, gender: number): ChartResult {
  const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const ps: Pillar = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()]
  const base = computeAll(ps, { ec, gender })
  const zsRaw = ziweiScore(ziweiChart(lunar))
  const [sh, got] = shensha(ps, base.r)
  const tot = (22 * base.s + 20 * base.g + 10 * base.c + 16 * base.t + 14 * base.lk + 10 * zsRaw.score + 8 * sh) / 100
  return {
    ...base,
    ps,
    hide: [ec.getYearHideGan(), ec.getMonthHideGan(), ec.getDayHideGan(), ec.getTimeHideGan()] as unknown as string[][],
    kong: xunKongOf(ps[2]!),
    zs: zsRaw.score,
    ziweiDetail: zsRaw.detail,
    sh,
    got,
    tot,
  } as ChartResult
}

/** 由日柱干支推旬空（甲子旬戌亥空…） */
function xunKongOf(dayGZ: string): string {
  const GAN = '甲乙丙丁戊己庚辛壬癸'
  const ZHI = '子丑寅卯辰巳午未申酉戌亥'
  const gi = GAN.indexOf(dayGZ[0]!)
  let zi = ZHI.indexOf(dayGZ[1]!)
  while (((zi % 10) + 10) % 10 !== ((gi % 10) + 10) % 10) zi += 12
  const start = Math.floor(zi / 10) * 10
  return ZHI[(start + 10) % 12]! + ZHI[(start + 11) % 12]!
}

/** 仅紫微：由公历生日生成十二宫命盘（含大限）与三方四正评分 */
export function ziweiFromDate(y: number, m: number, d: number, hh: number, mm: number, gender = 1): {
  zc: ReturnType<typeof ziweiChart>
  scored: ReturnType<typeof ziweiScore>
  pillars: Pillar
} {
  const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const ps: Pillar = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()]
  const zc = ziweiChart(lunar, gender)
  return { zc, scored: ziweiScore(zc), pillars: ps }
}
