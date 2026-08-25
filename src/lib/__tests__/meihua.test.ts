import { describe, expect, it } from 'vitest'
import { chartText, fromNumbers, judgeTiYong, timeChart } from '../meihua'

describe('梅花易数', () => {
  it('时间起卦：标准例（辰年十二月十七日申时 → 观之否）', () => {
    // 传统教材例：辰年12月17日申时，上卦(5+12+17)=34%8=2 兑，加申时9 → 43%8=3 离下，动爻43%6=1
    const c = timeChart({ yearZhiNum: 5, month: 12, day: 17, hourZhiNum: 9 })
    expect(c.upperName).toBe('兑')
    expect(c.lowerName).toBe('离')
    expect(c.movingLine).toBe(1)
  })

  it('先天数与卦名对应：乾一坤八', () => {
    const a = fromNumbers(1, 8, 6)
    expect(a.upperName).toBe('乾')
    expect(a.lowerName).toBe('坤')
  })

  it('体用判定覆盖五种关系', () => {
    expect(judgeTiYong('乾', '乾').level).toBe('吉') // 金金比和
    expect(judgeTiYong('乾', '震').level).toBe('平') // 体金克用木
    expect(judgeTiYong('艮', '震').level).toBe('凶') // 用木克体土
    expect(judgeTiYong('坎', '震').level).toBe('小凶') // 体水生用木
    expect(judgeTiYong('离', '震').level).toBe('吉') // 用木生体火
  })

  it('动爻位置决定体用归属', () => {
    const c = fromNumbers(8, 1, 2)
    expect(c.tiName).toBe('坤') // 动在下卦 → 上卦为体
    expect(c.yongName).toBe('乾')
    expect(chartText(c).length).toBe(4)
  })

  it('互卦取234/345爻', () => {
    // 天风姤：下巽[1,1,0] 上乾[1,1,1] 全爻= [1,1,0,1,1,1]，互卦下=[1,1,0]? 234爻=lines[1..3]=[1,0,1]→离，345爻=lines[2..4]=[0,1,1]→兑
    const c = fromNumbers(1, 5, 1) // 上乾下巽 = 姤
    expect(c.upperName).toBe('乾')
    expect(c.lowerName).toBe('巽')
    expect(c.huLower).toBe('离')
    expect(c.huUpper).toBe('兑')
  })
})
