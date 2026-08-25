import { describe, expect, it } from 'vitest'
import { bitsFromCast, changedBits, install, TRIGRAMS, TRI_BITS, xunKong } from '../liuyao'

describe('liuyao engine', () => {
  it('八卦阴阳位自洽', () => {
    expect(TRI_BITS['乾']).toBe('111')
    expect(TRI_BITS['坤']).toBe('000')
    expect(TRI_BITS['离']).toBe('101')
    expect(Object.keys(TRI_BITS)).toHaveLength(8)
    expect(new Set(TRIGRAMS).size).toBe(8)
  })

  it('八宫六十四卦无重无漏', () => {
    const seen = new Set<string>()
    for (const lo of TRIGRAMS) {
      for (const up of TRIGRAMS) {
        const bits = TRI_BITS[lo]! + TRI_BITS[up]!
        expect(() => install(bits, '甲')).not.toThrow()
        seen.add(bits)
      }
    }
    expect(seen.size).toBe(64)
  })

  it('乾为天装卦：世在上爻，初爻甲子子孙', () => {
    const g = install('111111', '甲')
    expect(g.name).toBe('乾为天')
    expect(g.gong).toBe('乾')
    expect(g.yaos[0]!.najia).toBe('甲子')
    expect(g.yaos[0]!.liuqin).toBe('子孙')
    expect(g.yaos[3]!.najia).toBe('壬午')
    expect(g.yaos[3]!.liuqin).toBe('官鬼')
    expect(g.yaos.find((y) => y.shi)!.pos).toBe(6)
    expect(g.yaos.find((y) => y.ying)!.pos).toBe(3)
  })

  it('天风姤一世：世在初爻应四爻', () => {
    const g = install('011111', '甲')
    expect(g.name).toBe('天风姤')
    expect(g.yaos.find((y) => y.shi)!.pos).toBe(1)
    expect(g.yaos.find((y) => y.ying)!.pos).toBe(4)
  })

  it('坤宫归魂卦泽雷随：世在三爻', () => {
    const g = install('100110', '甲')
    expect(g.name).toBe('泽雷随')
    expect(g.yaos.find((y) => y.shi)!.pos).toBe(3)
  })

  it('六兽按日干起青龙', () => {
    const jia = install('111111', '甲')
    expect(jia.yaos[0]!.liushou).toBe('青龙')
    const geng = install('111111', '庚')
    expect(geng.yaos[0]!.liushou).toBe('白虎')
  })

  it('变爻换位', () => {
    expect(bitsFromCast([9, 7, 8, 8, 7, 6])).toBe('110010')
    expect(changedBits('110010', [9, 7, 8, 8, 7, 6])).toBe('010011')
  })

  it('旬空与历书一致', () => {
    expect(xunKong('甲子')).toBe('戌亥')
    expect(xunKong('甲戌')).toBe('申酉')
    expect(xunKong('壬申')).toBe('戌亥')
    expect(xunKong('庚辰')).toBe('申酉')
  })
})
