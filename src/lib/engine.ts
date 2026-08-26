import {
  AFF_S, AFF_W, BANXING, CHONG, ELE_B, ELE_S, Element, GANHE, GRP, HGAI, JX_, KEME, LIBR, LU,
  MA_, REN, SANHE, SANHUI, SANYE, SHENG, STRONG, TAO, TYR, WCH, WOKE, YIN, ZHIHE, ZIXING,
} from './constants'

export type Rel = '同我' | '生我' | '我生' | '我克' | '克我'
export type Pillar = [string, string, string, string]

export function rel(dmg: Element, e: Element): Rel {
  return e === dmg ? '同我' : e === YIN[dmg] ? '生我' : e === SHENG[dmg] ? '我生' : e === WOKE[dmg] ? '我克' : '克我'
}

function credit(e: Element, brs: string[]): number {
  return brs.some((b) => STRONG[e].includes(b)) ? 1.0 : brs.some((b) => LIBR[e].includes(b)) ? 0.6 : 0.25
}

function hasPair(a: string, list: [string, string][]): boolean {
  return list.some((x) => x.includes(a))
}

export interface BlockRow { name: string; score: number; max: number; detail: string }
export interface DayunItem { gz: string; window: string; fin: number }

export interface ChartResult {
  ps: Pillar
  cnt: Record<Element, number>
  dmg: Element
  r: number
  s: number; g: number; c: number; t: number; lk: number; zs: number; sh: number
  tot: number
  fav: Element[]
  byao: boolean
  gdet: string[]
  dlist: DayunItem[]
  chong: number; zx: number
  cong: boolean; pure: boolean
  got: string[]
  mingGong?: string
  shenGong?: string
  ziweiDetail?: Array<{ palace: string; stars: string[]; delta: number }>
}

interface Extra { ec: { getYun(gender: number): { getDaYun(): Array<{ getStartYear(): number; getEndYear(): number; getGanZhi(): string }> } }; gender: number }

export function computeAll(ps: Pillar, rExtra: Extra): Omit<ChartResult, 'zs' | 'sh' | 'got' | 'tot'> {
  const cnt: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  ps.forEach((p) => { cnt[ELE_S[p[0]]!]++; cnt[ELE_B[p[1]]!]++ })
  const dmg = ELE_S[ps[2][0]] as Element
  const brs = ps.map((p) => p[1])
  const sgs = ps.map((p) => p[0])
  const ye = YIN[dmg]
  const A = cnt[dmg] + cnt[ye]
  const r = A / 8
  let cong = false
  let pure = false
  if (A <= 1 && !brs.some((b) => ELE_B[b] === dmg || ELE_B[b] === ye)) {
    cong = true
    pure = sgs.every((gg) => ELE_S[gg] !== dmg && ELE_S[gg] !== ye)
  }
  // 结构
  const miss = Object.values(cnt).filter((v) => v === 0).length
  let s = miss === 0 ? 6 : -4 * miss
  let chong = 0
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++)
      if (CHONG.some((pr) => pr.includes(brs[i]!) && pr.includes(brs[j]!))) chong++
  s -= 6 * chong
  let zx = 0
  new Set(brs).forEach((x) => { if (ZIXING.has(x) && brs.filter((b) => b === x).length >= 2) zx++ })
  s -= 3 * zx
  if (brs.some((b) => LU[ps[2][0]]!.includes(b))) s += 5
  s += r >= 0.62 ? 3 : r >= 0.4 && r <= 0.62 ? 9 : r < 0.32 ? -9 : 0
  if (cong) s += pure ? 8 : -10
  // 格局（根气信用）
  let g = 0
  const gdet: string[] = []
  const yongTrio: [Element, string][] = [[WOKE[dmg], '财'], [KEME[dmg], '官'], [ye, '印']]
  yongTrio.forEach(([e, nm]) => {
    if (cnt[e] > 0) { const cr = credit(e, brs); g += 6 * cr; gdet.push(`${nm}:${cr}`) }
  })
  g = Math.round(g * 10) / 10
  const bijian = cnt[dmg] >= 1
  const byao = !cong && ((r >= 0.62 && (cnt[KEME[dmg]] || cnt[SHENG[dmg]] || cnt[WOKE[dmg]])) || (r <= 0.38 && (cnt[ye] || bijian)))
  if (byao) g += 7
  // 层次
  let cLay = 0
  ;[WOKE[dmg], KEME[dmg], ye].forEach((e) => {
    const sr = brs.some((b) => STRONG[e].includes(b))
    if (cnt[e] >= 3 && sr) cLay += 4
    else if (cnt[e] >= 2 && sr) cLay += 2
  })
  cLay = Math.min(10, cLay)
  // 调候值
  const mb = ps[1][1]
  let t = 0
  if (mb === '戌') { t += cnt['木'] >= 1 ? 6 : -7; if (cnt['火'] >= 3) t += cnt['水'] >= 1 ? 6 : -6 }
  else if (mb === '申' || mb === '酉') t += cnt['火'] >= 1 ? 5 : -6
  else if (mb === '亥' || mb === '子' || mb === '丑') t += cnt['火'] >= 2 ? 8 : cnt['火'] === 0 ? -10 : 0
  else if (mb === '巳' || mb === '午' || mb === '未') t += cnt['水'] >= 2 ? 8 : cnt['水'] === 0 ? -10 : 0
  else if (mb === '寅' || mb === '卯') t += cnt['金'] >= 1 ? 5 : -6
  t = Math.max(-20, Math.min(20, t))
  // 大运（平滑亲和度）
  let aff: Record<string, number>
  if (r >= 0.62) aff = AFF_S
  else if (r <= 0.38) aff = AFF_W
  else {
    const tt = (r - 0.38) / 0.24
    aff = {}
    for (const k in AFF_S) aff[k] = (1 - tt) * AFF_W[k]! + tt * AFF_S[k]!
  }
  const fav = (['木', '火', '土', '金', '水'] as Element[]).filter((e) => aff[rel(dmg, e)]! >= 0.6).sort()
  const favSet = new Set(fav)
  const inf = (e: Element): boolean => favSet.has(e)
  let raw = 0
  let sa = 0
  const dlist: DayunItem[] = []
  const nowY = new Date().getFullYear()
  const HORIZON = 25 // 只评估未来 25 年的大运窗口，随时间滑动
  try {
    const yun = rExtra.ec.getYun(rExtra.gender)
    yun.getDaYun().forEach((dy) => {
      const sy = dy.getStartYear()
      const ey = dy.getEndYear()
      if (!sy || !ey) return
      const a = Math.max(sy, nowY)
      const cEnd = Math.min(ey, nowY + HORIZON)
      if (cEnd < a) return
      const gz = dy.getGanZhi()
      if (!gz || gz.length < 2) return
      const es = ELE_S[gz[0]] as Element
      const eb = ELE_B[gz[1]] as Element
      let base = (aff[rel(dmg, es)]! + aff[rel(dmg, eb)]!) / 2
      let adj = 0
      if (GANHE[gz[0]] === sgs[2]) adj += inf(es) ? 0.15 : -0.25
      sgs.forEach((gd, i) => { if (i !== 2 && GANHE[gz[0]] === gd) adj += inf(ELE_S[gd] as Element) ? -0.35 : 0.25 })
      brs.forEach((bd) => {
        if (bd !== gz[1] && hasPair(gz[1], ZHIHE) && ZHIHE.some((z) => z.includes(gz[1]) && z.includes(bd)))
          adj += inf(ELE_B[bd] as Element) ? -0.35 : 0.25
        if (CHONG.some((z) => z.includes(gz[1]) && z.includes(bd)))
          adj += inf(ELE_B[bd] as Element) ? -0.35 : 0.3
        if (BANXING.some((z) => z.includes(gz[1]) && z.includes(bd))) adj -= 0.2
      })
      if (brs.includes(gz[1]) && ZIXING.has(gz[1])) adj -= 0.15
      SANHE.forEach(([grpE, e]) => {
        const hv = [...grpE].filter((x) => brs.includes(x))
        if (grpE.includes(gz[1]) && hv.length === 2 && !brs.includes(gz[1])) adj += inf(e) ? 0.45 : -0.45
      })
      SANHUI.forEach(([grpE, e]) => {
        const hv = [...grpE].filter((x) => brs.includes(x))
        if (grpE.includes(gz[1]) && hv.length === 2 && !brs.includes(gz[1])) adj += inf(e) ? 0.4 : -0.4
      })
      SANYE.forEach((grpE) => {
        const hv = grpE.filter((x) => brs.includes(x))
        if (grpE.includes(gz[1]) && hv.length === 2) adj -= 0.3
      })
      adj = Math.max(-0.9, Math.min(0.9, adj))
      const sp = cEnd - a + 1
      const fin = Math.max(0, Math.min(1, base + adj))
      raw += sp * fin
      sa += sp
      dlist.push({ gz, window: `${a}–${cEnd}`, fin })
    })
  } catch (e) {
    console.warn('大运计算异常:', e)
  }
  const lk = sa ? (14 * raw) / sa : 7
  return { cnt, dmg, r, s, g, c: cLay, t, lk, fav, byao, gdet, dlist, chong, zx, brs, cong, pure } as unknown as Omit<ChartResult, 'zs' | 'sh' | 'got' | 'tot'>
}

export function shensha(ps: Pillar, r: number): [number, string[]] {
  const ds = ps[2][0]
  const bal = ps.map((p) => p[1])
  const grp = GRP(ps[2][1])
  let pts = 0
  const got: string[] = []
  if (bal.some((b) => TYR[ds]!.includes(b))) { pts += 2; got.push('天乙贵人') }
  if (bal.includes(WCH[ds]!)) { pts += 2; got.push('文昌') }
  if (bal.includes(JX_[grp]!)) { pts += 1.5; got.push('将星') }
  if (bal.includes(TAO[grp]!)) { pts += 0.5; got.push('桃花') }
  if (bal.includes(HGAI[grp]!)) { pts += 0.5; got.push('华盖') }
  if (bal.includes(MA_[grp]!)) { pts += 0.5; got.push('驿马') }
  if (REN[ds] && bal.includes(REN[ds]!)) { const v = r >= 0.62 ? -2 : 0.5; pts += v; got.push(`羊刃${v.toFixed(1)}`) }
  return [Math.max(-3, Math.min(8, pts)), got]
}

const GAN_YANG: Record<string, boolean> = { 甲: true, 丙: true, 戊: true, 庚: true, 壬: true, 乙: false, 丁: false, 己: false, 辛: false, 癸: false }

export function shiShen(dayGan: string, otherGan: string): string {
  const dmg = ELE_S[dayGan] as Element
  const e = ELE_S[otherGan] as Element
  const sameYY = GAN_YANG[dayGan] === GAN_YANG[otherGan]
  if (e === dmg) return sameYY ? '比肩' : '劫财'
  if (e === SHENG[dmg]) return sameYY ? '食神' : '伤官'
  if (e === WOKE[dmg]) return sameYY ? '偏财' : '正财'
  if (e === KEME[dmg]) return sameYY ? '七杀' : '正官'
  return sameYY ? '偏印' : '正印'
}
