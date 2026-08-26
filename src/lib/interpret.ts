import { Element, SHENSHA_MEANING, SHENG, WOKE, YIN } from './constants'
import { shiShen, ChartResult } from './engine'

/** 由评分结果离线生成白话解读（确定性文本拼装，无任何网络调用）。
 *  文案原则：说人话、给场景、不排比、不喊口号。 */
export function interpret(r: ChartResult): Array<{ title: string; text: string }> {
  const out: Array<{ title: string; text: string }> = []

  // ---------- 日主强弱（按强弱带细分五档） ----------
  out.push({ title: '日主强弱', text: strengthCopy(r) })

  // ---------- 格局与根气 ----------
  out.push({
    title: '格局与根气',
    text: r.gdet.length
      ? `格局按「根气信用」打分：${r.gdet.map((x) => x.replace(':', ' 得根 ')).join('；')}。` +
        (r.byao
          ? ' 这盘还有个难得之处——病药相济。命里最碍事的那个字，恰好有另一个字治得住它，行到药运的年头，爆发力比四平八稳的命大得多。'
          : ' 根气就是天干在地支里扎下的根：根深的字说话算数，虚浮的字容易雷声大雨点小。')
      : `财、官、印三类用神在天干地支都没找到有根的字，格局信用偏低。
直白点说：这盘的成色更多要靠大运来补，原局是「半成品」，走对运才能出厂。`,
  })

  // ---------- 十神配置 ----------
  out.push({ title: '十神速写', text: shiShenCopy(r) })

  // ---------- 十神搭配（经典组合检测） ----------
  out.push({ title: '十神搭配', text: patternCopy(r) })

  // ---------- 调候寒燥 ----------
  const cold = ['亥', '子', '丑'].includes(r.ps[1]![1]!)
  const hot = ['巳', '午', '未'].includes(r.ps[1]![1]!)
  out.push({
    title: '调候寒燥',
    text: cold
      ? `生在${r.ps[1]![1]}月隆冬，一盘寒气，调候头等大事是丙火解冻。
盘里火字 ${r.cnt['火']} 个——${r.cnt['火']! >= 2 ? '够用，冬木冬金得了暖气，人显得有精神头，做事也热得起来。' : r.cnt['火'] === 1 ? '只有一个，聊胜于无。早年会觉得施展不开，等到南方火运，就像屋里生了炉子。' : '一个都没有，寒气全靠硬扛。这类盘怕冷也怕慢，遇火运如枯木逢春，遇水运则加倍阴冷。'}`
      : hot
        ? `生在${r.ps[1]![1]}月盛夏，燥气明显，最盼壬水润局。
盘里水字 ${r.cnt['水']} 个——${r.cnt['水']! >= 2 ? '润局有成。烈火得制反而显贵，人聪明、反应快，只是别把性子磨得太急。' : r.cnt['水'] === 1 ? '一滴水救不了大火炉，脾气上来的时候记得给自己泼盆冷水。' : '滴水皆无，纯阳之燥。行事容易上头，凡事先放一晚再决定，能避开大半冲动型坑。'}`
        : `月令${r.ps[1]![1]}，不寒不燥，调候上没什么可操心的。
省下来的注意力可以放在结构上：这盘的高低，主要看五行搭配本身。`,
  })

  // ---------- 冲刑提示 ----------
  if (r.chong > 0 || r.zx > 0) {
    out.push({
      title: '冲刑提示',
      text: `${r.chong > 0 ? `地支六冲 ${r.chong} 组。冲主变动：搬家、换工作、聚散，多半应在被冲动的流年。忌神被冲反而是好事，相当于拔掉了钉子。` : ''}${r.zx > 0 ? `自刑 ${r.zx} 组。自刑说白了就是内耗——翻旧账、自我怀疑、睡前开复盘会。古书说得玄乎，落到今天就是提醒你少跟自己较劲。` : ''}`,
    })
  }

  // ---------- 大运节奏 ----------
  const best = [...r.dlist].sort((a, b) => b.fin - a.fin)[0]
  const worst = [...r.dlist].sort((a, b) => a.fin - b.fin)[0]
  if (best && worst) {
    const current = r.dlist.find((d) => {
      const [a, b] = d.window.split('–').map(Number)
      const now = new Date().getFullYear()
      return now >= (a ?? 0) && now <= (b ?? 0)
    })
    out.push({
      title: '大运节奏',
      text: `${current ? `你现在正走在 ${current.gz} 运里（${current.window}）。` : ''}` +
        `评估窗口内最顺的一段是 ${best.gz} 运（${best.window}，亲和度 ${best.fin.toFixed(2)}）——${best.fin >= 0.6 ? '顺风局，想做的事趁那十年铺开，别拖。' : '不算大顺，但比其他年份省力。'}` +
        (worst.gz !== best.gz ? `最费劲的是 ${worst.gz} 运（${worst.window}），那段日子宜守不宜攻，管好身体和现金流就算赢。` : '') +
        `\n喜用神是【${r.fav.join('、')}】：逢这些五行的流年办事顺一些，挑方位、颜色、行业时也可以拿它们当参考系。`,
    })
  }

  // ---------- 神煞点缀 ----------
  if (r.got.length) {
    out.push({
      title: '神煞点缀',
      text: r.got.map((g) => `【${g}】${shensa(g)}`).join('\n'),
    })
  } else {
    out.push({ title: '神煞点缀', text: '常见吉凶神煞一概没检出。别失望——少刑冲就少波澜，平淡的盘往往睡得安稳。' })
  }

  // ---------- 紫微三方（读取真实星曜明细） ----------
  out.push({ title: '紫微三方', text: ziweiCopy(r) })

  return out
}

/** 强弱文案：按 r 值分五档，附同党异党拆解 */
function strengthCopy(r: ChartResult): string {
  const dmg = r.dmg
  const ye = YIN[dmg]
  const sameCnt = r.cnt[dmg]
  const supCnt = r.cnt[ye]
  const strong = r.r >= 0.62
  const weak = r.r <= 0.38
  const base = `日主${dmg}，帮它的字（${dmg}＋${ye}）共 ${sameCnt + supCnt} 个，强弱系数 r=${r.r.toFixed(2)}。`

  if (r.cong) {
    return (
      base +
      (r.pure
        ? ` 更特别的是：满盘找不到一个克泄${dmg}的字，构成「纯从格」。弃命从势，反以势大为贵——这类盘不看身强身弱，看的是大势往哪边倒。`
        : ` 它接近「假从格」：想从却从得不干净。反映在生活里就是反复横跳——一会儿想彻底躺平随大流，一会儿又想自己单干，岁运一来这种拉扯会更明显。`)
    )
  }
  if (r.r >= 0.75) {
    return base + ' 明显身旺，而且旺过了头。这类盘的人主意大、不听劝，财官就在对面摆着——学会「耗」自己：找事做、找人合作、把精力花出去，比补什么都有用。'
  }
  if (strong) {
    return base + ' 属身旺。扛得住财官，适合自己去闯：业绩岗、创业、牵头做事都行。要注意的反而是别揽太多——身旺人的累，多是自找的。'
  }
  if (r.r >= 0.45 && r.r <= 0.55) {
    return base + ' 中和偏衡，是教科书里最喜欢的「中和」盘。不过别高兴太早：中和的命最吃岁运，大运走向几乎决定人生节奏——运好比什么都好。'
  }
  if (weak) {
    return base + ' 属身弱。先扶身再谈别的：印星（学习、证书、贵人）和比劫（朋友、团队）是两根拐杖。硬扛高压岗位或重资产创业，容易把自己压垮。' 
  }
  return base + ' 略偏弱但不至于扶不起来。选平台比拼胆量重要——跟着对的团队，你的输出反而比身旺人更稳。'
}

/** 年月时三干的十神角色计数（地支藏干太细，此处只数天干） */
function rolesOf(r: ChartResult): Record<string, number> {
  const roles: Record<string, number> = {}
  r.ps.forEach((p, i) => {
    if (i === 2) return
    const s = shiShen(r.dmg, p[0]!)
    roles[s] = (roles[s] ?? 0) + 1
  })
  return roles
}

/** 十神速写：其余三干的十神角色 + 场景化解读 */
function shiShenCopy(r: ChartResult): string {
  const roles = rolesOf(r)
  const parts: string[] = []
  const desc: Record<string, string> = {
    比肩: '平辈分量的自己人——同事、合伙人、也包括跟你抢资源的对手',
    劫财: '带竞争属性的自己人，合作愉快时是帮手，分钱时容易红脸',
    食神: '输出与口福之星，代表表达、手艺、慢慢打磨的东西',
    伤官: '才华外露的那根刺，创意顶呱呱，说话也得罪人',
    偏财: '活钱——经营、流动、机会型的收入',
    正财: '死工资式的稳钱，也代表男命的妻星',
    七杀: '压力源兼发动机，逼你成长的狠角色',
    正官: '规则、名誉、约束，也是女命的夫星',
    偏印: '偏门学问与直觉，学东西快，但容易想太多',
    正印: '庇护伞——学历、长辈、名声，缺了它安全感会打折',
  }
  Object.entries(roles).forEach(([k, v]) => {
    parts.push(`${k}×${v}`)
  })
  const headline = parts.length ? `年、月、时三干落了：${parts.join('、')}。` : '年、月、时三干没有透出明显的十神角色（少见的地支主导盘）。'
  const top = Object.entries(roles).sort((a, b) => b[1] - a[1])[0]
  const tail = top
    ? `分量最重的是「${top[0]}」——${desc[top[0]]}。它就是你这张盘的日常背景音，习惯了它的存在，就知道哪些事顺手、哪些事别扭。`
    : ''
  return headline + tail
}

/** 十神搭配：检测古籍里的经典组合，给场景化判词（纯增量文案，不参与评分） */
function patternCopy(r: ChartResult): string {
  const roles = rolesOf(r)
  const has = (...ks: string[]): boolean => ks.some((k) => (roles[k] ?? 0) > 0)
  const hits: string[] = []
  if (has('正官', '七杀') && has('正印', '偏印')) {
    hits.push('【官印相生】压力会自动转化成资历：交给你的难题，最后都长成了你的履历。体制、大平台、考证评职称这条路，你走起来比一般人顺。')
  }
  if (has('食神') && has('七杀')) {
    hits.push('【食神制杀】狠角色遇上了化解它的巧手：压力越大你输出越稳，是危机公关型的结构——越是乱局，越显出你的从容。')
  }
  if (has('伤官') && has('正官', '七杀')) {
    hits.push('【伤官见官】才华与规矩同柱相战。古书断「为祸百端」，翻译过来就一句：别跟制度硬顶。锋芒留着做作品，别用来怼领导。')
  }
  if (has('偏印') && has('食神')) {
    hits.push('【枭印夺食】想得多会卡住表达：方案在脑子里排练一百遍，出手时窗口已经关了。先发六十分版本，再迭代到九十，你会快很多。')
  }
  if (has('比肩', '劫财') && has('正财', '偏财')) {
    hits.push('【比劫夺财】合作与分钱是同一件事的两面。合伙协议、股权比例、账目往来——越是亲近的人，越要提前写清楚。')
  }
  if (has('偏财') && has('正财')) {
    hits.push('【财星双透】财路不止一条是福气，也是注意力陷阱。主攻一条，其余定投，别两头奔波两头空。')
  }
  if (!hits.length) {
    return '年月时三干没有组成教科书式的经典搭配（官印相生、食神制杀这一类）。这不代表盘弱——你的戏不在「组合技」，而在五行流通与调候本身，回看上两段即可。'
  }
  return hits.join('\n') + '\n搭配从天干取象，供把玩参考；成色高低仍以格局根气与喜用向背为准。'
}

/** 紫微段：点名真实星曜而不是套话 */
function ziweiCopy(r: ChartResult): string {
  const head = `三方四正综合 ${r.zs.toFixed(1)}/10。`
  if (!r.ziweiDetail?.length) {
    return head + ' 此分与八字体系相互独立：八字看禀气深浅，紫微看宫星配置，两者相关性实测 ρ≈-0.06（不显著）——本就是两把不同的尺子。'
  }
  const named = r.ziweiDetail
    .map((d) => `「${d.palace}」${d.stars.length ? d.stars.join('、') : '空宫（借对宫星）'}`)
  const good = [...r.ziweiDetail].sort((a, b) => b.delta - a.delta)[0]
  const bad = [...r.ziweiDetail].sort((a, b) => a.delta - b.delta)[0]
  let body = `命宫四方分别是：${named.join('；')}。`
  if (good && good.delta > 0) {
    body += `\n加分最多的是「${good.palace}」（+${good.delta.toFixed(1)}）：这一宫的吉星密度最高，是你天生占便宜的角落，重要的事尽量往这个领域靠。`
  }
  if (bad && bad.delta < 0 && bad.palace !== good?.palace) {
    body += `\n拖后腿的是「${bad.palace}」（${bad.delta.toFixed(1)}）：煞忌集中在此，相关事务多留书面凭证、多做两手准备，不吃亏。`
  }
  body += '\n提醒一句：八字与紫微测的不是同一个维度，两边的分数没法互相换算，分开看各自的意义。'
  return body
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
