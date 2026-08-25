import { describe, expect, it } from 'vitest'
import { runChart } from '../../lib/runtime'
import vectorsJson from '../../../public/data/test_vectors.json'

interface Vector {
  label: string
  y: number
  m: number
  d: number
  h: number
  gz: string
  s: number
  g: number
  c: number
  t: number
  lk: number
  zs: number
  sh: number
  tot: number
  fav: string[]
}

const vectors = vectorsJson as Vector[]

/** 与 ChartView 内置自检同一套思路。
 * 结构分（盘面/结构/格局/层次/调候/紫微）必须与 Python 标准答案一致；
 * 大运联动 lk 允许较大漂移——Python(mega7/lunar_python) 与 JS(lunar-javascript)
 * 的起运岁差与窗口切分存在已知版本差异，见 README「引擎一致性」。 */
const LK_DRIFT = 2.0
describe('v5 引擎回归：对照 Python 标准答案', () => {
  it.each(vectors.map((v) => [v.label, v] as const))('%s 盘', (_label, v) => {
    const r = runChart(v.y, v.m, v.d, v.h, 30, 1)
    expect(r.ps.join(' ')).toBe(v.gz)
    expect(r.s).toBe(v.s)
    expect(r.c).toBe(v.c)
    expect(r.t).toBe(v.t)
    expect(r.g).toBeCloseTo(v.g, 1)
    expect(Math.abs(r.lk - v.lk)).toBeLessThan(LK_DRIFT)
    expect(r.zs).toBeCloseTo(v.zs, 1)
    expect([...r.fav]).toEqual(v.fav)
    const rawTot = 22 * r.s + 20 * r.g + 10 * r.c + 16 * r.t + 14 * r.lk + 10 * r.zs + 8 * r.sh
    // 结构分已逐项锁定；tot 的浮动只可能来自 lk 漂移（权重14）
    expect(Math.abs(rawTot - v.tot)).toBeLessThan(1.5 + 14 * LK_DRIFT)
  })

  /** JS 快照：锁定当前实现输出，任何算法改动都会被察觉
   *（natal/yinshi 与 Python 全对齐；wushi 因历法库起运漂移见上注） */
  it.each([
    ['natal', 3.5],
    ['yinshi', 10.446],
    ['wushi', 7.471],
  ] as const)('%s 快照 lk', (label, want) => {
    const v = vectors.find((x) => x.label === label)!
    const r = runChart(v.y, v.m, v.d, v.h, 30, 1)
    expect(r.lk).toBeCloseTo(want, 2)
  })
})
