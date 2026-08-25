import { BR, GAN, Gan, HUA, JIXING, JUTAB, KUI, LPOS, NAYIN_OF, PALACE_NAMES, SHAXING, YUE } from './constants'

export interface ZiweiChart {
  palaces: Array<{ index: number; name: string; ganzhi: string; mains: string; extras: string[] }>
  mingIndex: number
  juName: string
  siHua: Record<string, string>
}

const MAINS_ORDER = [['紫微', '天机', '太阳', '武曲', '天同', '廉贞'], ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军']]

export function ziweiChart(lunar: {
  getYearGan(): string
  getYearZhi(): string
  getMonth(): number
  getDay(): number
  getTimeZhi(): string
}): ZiweiChart {
  const YG = lunar.getYearGan()
  const M = Math.abs(lunar.getMonth())
  const D = lunar.getDay()
  const H = BR.indexOf(lunar.getTimeZhi())
  const mpal = (2 + M - 1) % 12
  const ming = (mpal - H + 144) % 12
  const fyin = ((GAN.indexOf(YG as unknown as Gan) % 5) * 2 + 2) % 10
  const mgz = GAN[(fyin + ((ming - 2) % 12 + 12) % 12) % 10]! + BR[ming]!
  const ju = JUTAB[NAYIN_OF[mgz]!] ?? 3
  const q = Math.floor(D / ju)
  const rr = D % ju
  const bo = rr ? (ju - rr) % ju : 0
  const bs = q + (rr ? 1 : 0)
  let z = (2 + bs - 1) % 12
  z = bo % 2 === 1 ? ((z - bo) % 12 + 144) % 12 : (z + bo) % 12
  const tf = (4 - z + 144) % 12
  const mains: string[] = Array.from({ length: 12 }, () => '')
  mains[z] += '紫微'
  if (tf !== z) mains[tf] += '天府'
  ;[['天机', 1], ['太阳', 3], ['武曲', 4], ['天同', 5], ['廉贞', 8]].forEach(([nm, o]) => {
    mains[(z - (o as number) + 144) % 12] += nm as string
  })
  ;['太阴', '贪狼', '巨门', '天相', '天梁', '七杀'].forEach((nm, k) => { mains[(tf + k + 1) % 12] += nm })
  mains[(tf + 10) % 12] += '破军'
  const extras: Set<string>[] = Array.from({ length: 12 }, () => new Set<string>())
  const lc = BR.indexOf(LPOS[YG]!)
  extras[lc].add('禄存'); extras[(lc + 1) % 12].add('擎羊'); extras[(lc + 11) % 12].add('陀罗')
  extras[(10 - H + 144) % 12].add('文昌'); extras[(4 + H) % 12].add('文曲')
  extras[(4 + M - 1) % 12].add('左辅'); extras[(10 - (M - 1) + 144) % 12].add('右弼')
  extras[BR.indexOf(KUI[YG]!)].add('天魁'); extras[BR.indexOf(YUE[YG]!)].add('天钺')
  const grpKey = ['申子辰', '寅午戌', '巳酉丑', '亥卯未'].find((k) => k.includes(lunar.getYearZhi()))!
  const huob = { 申子辰: '寅', 寅午戌: '丑', 巳酉丑: '卯', 亥卯未: '酉' }[grpKey]!
  const linb = { 申子辰: '戌', 寅午戌: '卯', 巳酉丑: '戌', 亥卯未: '戌' }[grpKey]!
  extras[(BR.indexOf(huob) + H) % 12].add('火星')
  extras[(BR.indexOf(linb) + H) % 12].add('铃星')
  extras[(11 + H) % 12].add('地劫')
  extras[(11 - H + 144) % 12].add('地空')
  const [h1, h2, h3, h4] = HUA[YG]!
  const hm: Record<string, string> = {}
  hm[h1] = '禄'; hm[h2] = '权'; hm[h3] = '科'; hm[h4] = '忌'
  const allStars = MAINS_ORDER.flat()
  for (let i = 0; i < 12; i++)
    allStars.forEach((st) => { if (mains[i]!.includes(st) && hm[st]) extras[i].add(st + hm[st]) })

  const palaces = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    // 十二宫从命宫起逆布：兄弟居命宫之逆时针次位，其余依序
    name: PALACE_NAMES[(((ming - i) % 12) + 12) % 12]!,
    ganzhi: GAN[(fyin + i) % 10]! + BR[i]!,
    mains: mains[i]!,
    extras: [...extras[i]],
  }))
  const juName = NAYIN_OF[mgz]
  return { palaces, mingIndex: ming, juName: `${juName}局`, siHua: hm }
}

/** 三方四正评分（与 v5 引擎 twdsscore 同规则），返回分数与命宫三方明细 */
export function ziweiScore(zc: ZiweiChart): { score: number; detail: Array<{ palace: string; stars: string[]; delta: number }> } {
  const ming = zc.mingIndex
  const fang = new Set([ming, (ming + 4) % 12, (ming + 8) % 12, (ming + 6) % 12])
  let sc = 0
  const detail: Array<{ palace: string; stars: string[]; delta: number }> = []
  fang.forEach((pi) => {
    const p = zc.palaces[pi]!
    let d = 0
    if (!p.mains) d -= 0.6
    p.extras.forEach((x) => {
      if (JIXING.has(x)) d += 0.8
      else if (SHAXING.has(x)) d -= 0.8
      else if (x.endsWith('禄') || x.endsWith('权')) d += 1.0
      else if (x.endsWith('科')) d += 0.7
      else if (x.endsWith('忌')) d -= 1.2
    })
    sc += d
    detail.push({ palace: p.name, stars: [...p.mains], delta: Math.round(d * 10) / 10 })
  })
  return { score: Math.max(0, Math.min(10, ((sc + 6) / 14) * 10)), detail }
}
