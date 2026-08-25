/** 排盘运行时：封装 lunar-javascript 调用，输出完整命盘结果 */
import { Solar } from 'lunar-javascript'
import { computeAll, ChartResult, Pillar, shensha } from './engine'
import { ziweiChart, ziweiScore } from './ziwei'

let POOL: number[] | null = null
let POOL_N = 0

export async function loadPool(): Promise<{ n: number }> {
  const j = await fetch('./data/percentiles_2001_2005_male.json').then((r) => r.json())
  POOL = j.totals
  POOL_N = j.n
  return { n: j.n }
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
    zs: zsRaw.score,
    ziweiDetail: zsRaw.detail,
    sh,
    got,
    tot,
  } as ChartResult
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
