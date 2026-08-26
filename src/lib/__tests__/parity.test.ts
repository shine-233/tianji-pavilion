import { describe, expect, it } from 'vitest'
import { TRIGRAMS, TRI_BITS, install } from '../liuyaoExtra'
import { buildChart } from '../liuyao'

/**
 * 双引擎对拍：同一卦象分别喂给 buildChart（主引擎）与 install（查表引擎），
 * 卦名、宫、五行、每爻纳甲/五行/六亲/六兽/世应必须完全一致。
 * 两套表并存期间，这个测试就是防翻车的对账单。
 */
describe('双引擎对拍 · buildChart ↔ install', () => {
  const DAY_GANS = ['甲', '庚']

  TRIGRAMS.forEach((lower) => {
    TRIGRAMS.forEach((upper) => {
      const bits = TRI_BITS[lower]! + TRI_BITS[upper]!
      // 无动爻掷法：阳爻 1 背（少阳），阴爻 2 背（少阴）
      const tosses = bits.split('').map((b) => (b === '1' ? 1 : 2))

      it(`${install(bits, '甲').name}：两引擎全字段一致`, () => {
        for (const dayGan of DAY_GANS) {
          const main = buildChart({ tosses, dayGan, dayZhi: '子', monthZhi: '寅' })
          const ref = install(bits, dayGan)

          expect(main.name).toBe(ref.name)
          expect(main.palace).toBe(ref.gong + '宫')
          expect(main.gongWuxing).toBe(ref.gongWuxing)
          expect(main.lines.map((l) => l.najia)).toEqual(ref.yaos.map((y) => y.najia))
          expect(main.lines.map((l) => l.element)).toEqual(ref.yaos.map((y) => y.element))
          expect(main.lines.map((l) => l.liuqin)).toEqual(ref.yaos.map((y) => y.liuqin))
          expect(main.lines.map((l) => l.beast)).toEqual(ref.yaos.map((y) => y.liushou))
          expect(main.lines.map((l) => l.shiYing === '世')).toEqual(ref.yaos.map((y) => y.shi))
          expect(main.lines.map((l) => l.shiYing === '应')).toEqual(ref.yaos.map((y) => y.ying))
          expect([main.shiPos, main.yingPos]).toEqual([
            ref.yaos.find((y) => y.shi)!.pos,
            ref.yaos.find((y) => y.ying)!.pos,
          ])
        }
      })
    })
  })

  it('动爻与变卦也应对拍：夬之初爻动', () => {
    const tosses = [3, 1, 1, 1, 1, 2]
    const main = buildChart({ tosses, dayGan: '丙', dayZhi: '午', monthZhi: '午' })
    const ref = install('111110', '丙')
    expect(main.name).toBe(ref.name)
    expect(main.changedName).toBe('泽风大过')
    expect(main.lines.filter((l) => l.moving).map((l) => l.pos)).toEqual(
      ref.yaos.filter((_, i) => tosses[i] === 3 || tosses[i] === 0).map((y) => y.pos),
    )
  })
})
