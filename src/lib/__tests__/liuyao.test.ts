import { describe, expect, it } from 'vitest'
import { analyzeYongshen, buildChart, hexName, idxToBits, summarize, xunkong, YONGSHEN_MAP } from '../liuyao'

describe('六爻纳甲', () => {
  it('乾为天：纳甲、六亲、世应全部符合传统装卦', () => {
    // 六个少阳 → 乾为天
    const c = buildChart({ tosses: [1, 1, 1, 1, 1, 1], dayGan: '甲', dayZhi: '子', monthZhi: '寅' })
    expect(c.name).toBe('乾为天')
    expect(c.palace).toBe('乾宫')
    expect(c.gongWuxing).toBe('金')
    expect(c.seqRole).toBe('本宫')
    expect(c.shiPos).toBe(6)
    expect(c.yingPos).toBe(3)
    const gz = c.lines.map((l) => l.najia)
    expect(gz).toEqual(['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'])
    const lq = c.lines.map((l) => l.liuqin)
    expect(lq).toEqual(['子孙', '妻财', '父母', '官鬼', '兄弟', '父母'])
    const beasts = c.lines.map((l) => l.beast)
    // 甲乙日青龙起初爻
    expect(beasts[0]).toBe('青龙')
    expect(beasts[1]).toBe('朱雀')
    expect(c.hasMoving).toBe(false)
    expect(c.changedName).toBeNull()
  })

  it('地天泰属坤宫三世，世三应上', () => {
    // 下乾上坤：初爻起依次 阳×3 + 阴×3（少阴=2背）
    const c = buildChart({ tosses: [1, 1, 1, 2, 2, 2], dayGan: '庚', dayZhi: '戌', monthZhi: '卯' })
    expect(c.name).toBe('地天泰')
    expect(c.palace).toBe('坤宫')
    expect(c.gongWuxing).toBe('土')
    expect(c.seqRole).toBe('三世')
    expect(c.shiPos).toBe(3)
    expect(c.yingPos).toBe(6)
  })

  it('动爻与变卦', () => {
    // 三背=老阳动；泽天夬下乾上兑，初爻动变泽风大过
    const c = buildChart({ tosses: [3, 1, 1, 1, 1, 2], dayGan: '丙', dayZhi: '午', monthZhi: '午' })
    expect(c.name).toBe('泽天夬')
    expect(c.lines[0].moving).toBe(true)
    expect(c.lines[0].mark).toBe('○')
    expect(c.changedName).toBe('泽风大过')
  })

  it('老阴动记 ×，三字成老阴', () => {
    const c = buildChart({ tosses: [0, 2, 2, 2, 2, 2], dayGan: '壬', dayZhi: '寅', monthZhi: '巳' })
    expect(c.lines[0].bit).toBe(0)
    expect(c.lines[0].mark).toBe('×')
    expect(c.lines[0].changedBit).toBe(1)
  })

  it('旬空：甲辰日在甲辰旬，空寅卯', () => {
    expect(xunkong('甲辰')).toEqual(['寅', '卯'])
    expect(xunkong('甲子')).toEqual(['戌', '亥'])
  })

  it('用神分析给出结论与白话短语', () => {
    const c = buildChart({ tosses: [1, 1, 1, 1, 1, 1], dayGan: '甲', dayZhi: '子', monthZhi: '亥' })
    const v = analyzeYongshen(c, '妻财', '亥', '子')
    expect(v.foundAt.length).toBeGreaterThan(0)
    expect(['旺', '平', '弱']).toContain(v.conclusion)
    const s = summarize(v, c, YONGSHEN_MAP[0].label)
    expect(s.length).toBeGreaterThan(20)
  })

  it('idxToBits 与卦名互逆', () => {
    // hexName 参数为「下卦、上卦」的数组下标：0=乾 … 7=坤
    expect(hexName(0, 0)).toBe('乾为天')
    expect(hexName(7, 7)).toBe('坤为地')
    expect(idxToBits(56)).toEqual([1, 1, 1, 0, 0, 0])
  })
})
