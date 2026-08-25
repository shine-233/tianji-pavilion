import { describe, expect, it } from 'vitest'
import { Solar } from 'lunar-javascript'
import { ziweiChart, ziweiScore } from '../ziwei'

function chartFor(y: number, m: number, d: number, hh: number) {
  const lunar = Solar.fromYmdHms(y, m, d, hh, 30, 0).getLunar()
  return ziweiChart(lunar)
}

describe('ziweiChart 基本结构', () => {
  it('2002-10-26 巳时：12宫齐全，命宫索引合法', () => {
    const zc = chartFor(2002, 10, 26, 10)
    expect(zc.palaces).toHaveLength(12)
    expect(zc.mingIndex).toBeGreaterThanOrEqual(0)
    expect(zc.mingIndex).toBeLessThan(12)
    expect(zc.juName).toMatch(/局$/)
    for (const p of zc.palaces) {
      expect(p.name).toBeTruthy()
      expect(p.ganzhi).toHaveLength(2)
    }
  })

  it('四化标记出现在对应主星宫位', () => {
    const zc = chartFor(1997, 10, 22, 3)
    const marks = zc.palaces.flatMap((p) => p.extras.filter((x) => /[禄权科忌]$/.test(x)))
    expect(marks.length).toBeGreaterThanOrEqual(4)
  })

  it('宫名从命宫起逆布：命宫所在支必名「命宫」，十二宫名不重复', () => {
    for (const [y, m, d, h] of [[2002, 10, 26, 10], [1997, 10, 22, 3], [2001, 2, 15, 23 - 1]] as const) {
      const zc = chartFor(y, m, d, h)
      expect(zc.palaces[zc.mingIndex]!.name).toBe('命宫')
      const names = new Set(zc.palaces.map((p) => p.name))
      expect(names.size).toBe(12)
      // 兄弟宫应在命宫逆时针次位（mingIndex-1 的地支）
      expect(zc.palaces[(zc.mingIndex + 11) % 12]!.name).toBe('兄弟')
    }
  })
})

describe('ziweiScore 分值边界', () => {
  it('分数落在 [0,10]，明细为四方四宫', () => {
    for (const [y, m, d, h] of [[2002, 10, 26, 10], [1997, 10, 22, 3], [1997, 10, 22, 11]] as const) {
      const { score, detail } = ziweiScore(chartFor(y, m, d, h))
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(10)
      expect(detail).toHaveLength(4)
    }
  })
})
