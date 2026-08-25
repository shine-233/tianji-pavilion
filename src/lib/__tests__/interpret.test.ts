import { describe, expect, it } from 'vitest'
import { runChart } from '../runtime'
import { elementAdvice, interpret } from '../interpret'

describe('interpret 输出结构', () => {
  it('每个 section 都有 title 和非空 text', () => {
    const r = runChart(2002, 10, 26, 10, 15, 1)
    const secs = interpret(r)
    expect(secs.length).toBeGreaterThanOrEqual(6)
    for (const s of secs) {
      expect(s.title).toBeTruthy()
      expect(s.text.length).toBeGreaterThan(8)
    }
  })

  it('身强盘的强弱段落在「身旺」分支', () => {
    let hit = false
    for (const d of [5, 9, 17]) {
      const r = runChart(2001, 1, d, 4, 30, 1)
      if (r.r >= 0.62) {
        const sec = interpret(r)[0]!
        expect(sec.text).toContain('身旺')
        hit = true
        break
      }
    }
    expect(hit).toBe(true)
  })

  it('冬月盘调候段落提到丙火或润局或中和', () => {
    const r = runChart(2001, 12, 15, 10, 30, 1)
    const jq = interpret(r).find((s) => s.title === '调候寒燥')!
    expect(jq.text).toMatch(/丙火|润局|寒燥适中/)
  })

  it('神煞段落要么列出神煞要么给兜底句', () => {
    const r = runChart(1997, 10, 22, 3, 30, 1)
    const sec = interpret(r).find((s) => s.title === '神煞点缀')!
    expect(sec.text.length).toBeGreaterThan(10)
  })
})

describe('elementAdvice 五行建议', () => {
  it('缺字、中和、偏旺三种分支都有产出', () => {
    expect(elementAdvice('火', { 木: 2, 火: 0, 土: 2, 金: 2, 水: 2 })).toContain('缺失')
    expect(elementAdvice('木', { 木: 2, 火: 2, 土: 2, 金: 1, 水: 1 })).toContain('中和')
    expect(elementAdvice('金', { 木: 1, 火: 1, 土: 1, 金: 4, 水: 1 })).toContain('偏旺')
  })
})
