import { Element, SHENSHA_MEANING, SHENG, WOKE, YIN } from './constants'
import { ChartResult } from './engine'

/** 由评分结果离线生成白话解读（确定性文本拼装，无任何网络调用） */
export function interpret(r: ChartResult): Array<{ title: string; text: string }> {
  const out: Array<{ title: string; text: string }> = []
  const dmg = r.dmg
  const strong = r.r >= 0.62
  const weak = r.r <= 0.38

  out.push({
    title: '日主强弱',
    text: strong
      ? `日主${dmg}，同党（${dmg}＋${YIN[dmg]}）占比 ${r.r.toFixed(2)}，属身旺之局。身旺喜克泄耗，宜财官食伤发挥。`
      : weak
        ? `日主${dmg}，同党占比仅 ${r.r.toFixed(2)}，属身弱之局。身弱喜印比扶身，忌官杀财星过重。${r.cong ? (r.pure ? '且满盘无异党，构成「纯从格」——弃命相从，反以从势为贵。' : '接近「假从格」，从得不纯，岁运引发摇摆。') : ''}`
        : `日主${dmg}，同党占比 ${r.r.toFixed(2)}，强弱中和偏衡。此类命局最重岁运引动，大运走向对人生节奏影响显著。`,
  })

  out.push({
    title: '格局与根气',
    text: r.gdet.length
      ? `格局取用按「根气信用」计分：${r.gdet.map((x) => x.replace(':', ' 得根气信用 ')).join('；')}。` + (r.byao ? ' 命局病药相济——有病有药，行药运则发，古诀所谓「病药两停，贵不可言」。' : '')
      : `财官印三类用神在天干地支均未见有根之气，格局信用偏低，层次更多依赖大运补救。`,
  })

  const cold = ['亥', '子', '丑'].includes(r.ps[1][1])
  const hot = ['巳', '午', '未'].includes(r.ps[1][1])
  out.push({
    title: '调候寒燥',
    text: cold
      ? `生于${r.ps[1][1]}月隆冬，寒气偏重，调候首重丙火解冻。盘中火字 ${r.cnt['火']} 个，${r.cnt['火'] >= 2 ? '暖局有成，冬金得暖、生机勃发。' : '火力不足，早岁多寒滞感，行南方火运如枯木逢春。'}`
      : hot
        ? `生于${r.ps[1][1]}月盛夏，燥热明显，调候首重壬水润局。盘中水字 ${r.cnt['水']} 个，${r.cnt['水'] >= 2 ? '润局有成，烈火得制，聪明秀气。' : '滴水难支，防急躁冒进，行北方水运方得舒展。'}`
        : `月令${r.ps[1][1]}，寒燥适中，调候压力不大，结构优劣主导层次高低。`,
  })

  if (r.chong > 0 || r.zx > 0) {
    out.push({
      title: '冲刑提示',
      text: `${r.chong > 0 ? `地支六冲 ${r.chong} 组，主动荡变迁、聚散无常，应期多在冲动之年。` : ''}${r.zx > 0 ? `自刑 ${r.zx} 组，主内耗纠结、自我拉扯，修心可解。` : ''}结构项因此扣分 ${6 * r.chong + 3 * r.zx} 分。`,
    })
  }

  const best = [...r.dlist].sort((a, b) => b.fin - a.fin)[0]
  const worst = [...r.dlist].sort((a, b) => a.fin - b.fin)[0]
  if (best && worst) {
    out.push({
      title: '大运节奏',
      text: `评估窗口内最顺为 ${best.gz} 大运（${best.window}，亲和度 ${best.fin.toFixed(2)}），${worst.gz !== best.gz ? `最需谨慎为 ${worst.gz} 运（${worst.window}，${worst.fin.toFixed(2)}）` : ''}。喜用神为【${r.fav.join('、')}】，逢此类五行流年多有顺风局。`,
    })
  }

  if (r.got.length) {
    out.push({
      title: '神煞点缀',
      text: r.got.map((g) => `【${g}】${shensa(g)}`).join('\n'),
    })
  } else {
    out.push({ title: '神煞点缀', text: '本盘未检出常见吉凶神煞，平淡亦是福——少刑冲则少波澜。' })
  }

  out.push({
    title: '紫微三方',
    text: `三方四正综合 ${r.zs.toFixed(1)}/10。此分与八字七柱体系相互独立：八字看「禀气深浅」，紫微看「宫星配置」，两者相关性实测 ρ≈-0.06（不显著），恰说明两套体系测的并非同一维度。`,
  })

  return out
}

function shensa(name: string): string {
  const key = Object.keys(SHENSHA_MEANING).find((k) => name.startsWith(k))
  return key ? SHENSHA_MEANING[key]! : '古籍所载辅星，参考即可，不必拘泥。'
}

/** 五行分布建议（用于 3D 视图联动文案） */
export function elementAdvice(e: Element, cnt: Record<Element, number>): string {
  const n = cnt[e]
  return `${e}共 ${n} 字，${n === 0 ? '盘中缺失——相关领域宜后天补足' : n >= 3 ? '偏旺——能量充沛但防过刚' : '中和有根——运转自如'}。它滋养${SHENG[e]}、克制${WOKE[e]}；当${WOKE[WOKE[e]]}过旺时还会反过来「反侮」${e}。`
}
