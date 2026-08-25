import { describe, expect, it } from 'vitest'
import { computeAll, Pillar, rel, shensha, shiShen } from '../engine'
import type { Element } from '../constants'

describe('rel 五行关系', () => {
  const cases: Array<[Element, Element, string]> = [
    ['木', '木', '同我'],
    ['木', '水', '生我'],
    ['木', '火', '我生'],
    ['木', '土', '我克'],
    ['木', '金', '克我'],
    ['金', '木', '我克'],
    ['水', '火', '我克'],
  ]
  it.each(cases)('rel(%s, %s) = %s', (dmg, e, want) => {
    expect(rel(dmg, e)).toBe(want)
  })
})

describe('shiShen 十神', () => {
  it('甲日主对十天干', () => {
    const want: Record<string, string> = {
      甲: '比肩', 乙: '劫财', 丙: '食神', 丁: '伤官', 戊: '偏财',
      己: '正财', 庚: '七杀', 辛: '正官', 壬: '偏印', 癸: '正印',
    }
    for (const [g, w] of Object.entries(want)) expect(shiShen('甲', g)).toBe(w)
  })
  it('阴日主乙见庚为正官', () => {
    expect(shiShen('乙', '庚')).toBe('正官')
  })
})

describe('computeAll 结构完整性', () => {
  it('壬午 庚戌 丁卯 乙巳 返回完整字段', () => {
    const ps: Pillar = ['壬午', '庚戌', '丁卯', '乙巳']
    const fakeEc = {
      getYun: () => ({ getDaYun: () => [] }),
    }
    const r = computeAll(ps, { ec: fakeEc, gender: 1 })
    expect(r.dmg).toBe('火')
    expect(r.s).toBe(14)
    expect(r.g).toBeCloseTo(18.1, 1)
    expect(r.c).toBe(2)
    expect(r.t).toBe(12)
    expect(r.fav).toEqual(['土', '水', '金'])
    expect(r.chong).toBeGreaterThanOrEqual(0)
  })

  it('大运为空时 lk 取中性值 7', () => {
    const ps: Pillar = ['壬午', '庚戌', '丁卯', '乙巳']
    const fakeEc = { getYun: () => ({ getDaYun: () => [] }) }
    expect(computeAll(ps, { ec: fakeEc, gender: 1 }).lk).toBe(7)
  })
})

describe('shensha 神煞', () => {
  it('丁酉日见寅为天乙贵人（辛午寅例）', () => {
    const ps: Pillar = ['丁丑', '庚戌', '丁酉', '壬寅']
    const [pts, got] = shensha(ps, 0.5)
    expect(got).toContain('天乙贵人')
    expect(pts).toBeGreaterThan(0)
  })
})
