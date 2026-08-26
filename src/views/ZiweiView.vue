<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import ZiweiSky3D from '../components/ZiweiSky3D.vue'
import { computed, ref } from 'vue'
import { ziweiFromDate } from '../lib/runtime'
import type { ZiweiChart } from '../lib/ziwei'
import { starSpritePixels, STAR_PERSONAS, starAccent } from '../data/starSprites'
import { sfx } from '../lib/sfx'

interface ScoredDetail { palace: string; stars: string[]; delta: number }
interface Scored { score: number; detail: ScoredDetail[] }

const dt = ref('2002-10-26')
const tm = ref('10:15')
const gender = ref(1)
const zc = ref<ZiweiChart | null>(null)
const scored = ref<Scored | null>(null)
const pillars = ref<string[]>([])
const sel = ref<number | null>(null)
const skyMode = ref(false)

const PALACE_MEANING: Record<string, string> = {
  命宫: '自我禀赋、格局层次与一生总纲。',
  兄弟: '手足缘分、合作伙伴与竞争关系。',
  夫妻: '婚姻感情、亲密关系的样貌。',
  子女: '子女缘、创造力与下属学生。',
  财帛: '财源形态与求财方式。',
  疾厄: '健康底子与情绪模式。',
  迁移: '外出机遇、远行与社会舞台。',
  交友: '人际网络、众生缘与贵人类型。',
  官禄: '事业形态、成就方向与社会位置。',
  田宅: '家运根基、不动产与家庭氛围。',
  福德: '精神生活、兴趣享受与福报。',
  父母: '父母长辈、庇护来源与文书相貌。',
}

// 十二宫按地支顺序排布；命宫高亮
function calc(): void {
  const dtp = dt.value.split('-').map(Number)
  const tmp = tm.value.split(':').map(Number)
  if (dtp.length < 3 || tmp.length < 2) return alert('请填写完整日期与时间')
  sfx.gong()
  const r = ziweiFromDate(dtp[0]!, dtp[1]!, dtp[2]!, tmp[0]!, tmp[1]!, gender.value)
  zc.value = r.zc
  scored.value = r.scored
  pillars.value = [...r.pillars]
  sel.value = null
}

function pick(i: number): void {
  sel.value = sel.value === i ? null : i
  sfx.blip()
}

/** 十二宫在 4×4 盘面上的行列位置 */
const RC: Array<[number, number]> = [
  [0, 0], [0, 1], [0, 2], [0, 3],
  [1, 3], [2, 3], [3, 3],
  [3, 2], [3, 1], [3, 0],
  [2, 0], [1, 0],
]

const fangSet = ref<Set<number>>(new Set())

function pickPalace(i: number): void {
  pick(i)
  if (sel.value === null) {
    fangSet.value = new Set()
  } else {
    fangSet.value = new Set([sel.value, (sel.value + 4) % 12, (sel.value + 8) % 12, (sel.value + 6) % 12])
    sfx.pop()
  }
}

function isFang(i: number): boolean {
  return fangSet.value.has(i)
}
/** 三方四正四宫中心的连线（百分比坐标） */
const fangLines = computed(() => {
  if (sel.value === null) return []
  const pts = [...fangSet.value].map((i) => {
    const [r, c] = RC[i]!
    return [(c * 25 + 12.5) as number, (r * 25 + 12.5) as number] as [number, number]
  })
  const lines: Array<[number, number, number, number]> = []
  for (let a = 0; a < pts.length; a++) {
    for (let b = a + 1; b < pts.length; b++) {
      lines.push([pts[a]![0]!, pts[a]![1]!, pts[b]![0]!, pts[b]![1]!])
    }
  }
  return lines
})

/** 当前虚岁是否落在大限区间内（如 '4-13'），用于高亮「正在走的十年」 */
function inLimit(range: string): boolean {
  const dtp = dt.value.split('-').map(Number)
  const birthYear = dtp[0] ?? 2000
  const age = new Date().getFullYear() - birthYear + 1
  const [a, b] = range.split('-').map(Number)
  return age >= (a ?? 0) && age <= (b ?? 0)
}

function starClass(s: string): string {
  if (s.endsWith('禄') || s.endsWith('权')) return 'tag teal'
  if (s.endsWith('科')) return 'tag gold'
  if (s.endsWith('忌') || ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].some((x) => s.startsWith(x))) return 'tag red'
  if (['文昌', '文曲', '天魁', '天钺', '左辅', '右弼', '禄存'].some((x) => s.startsWith(x))) return 'tag teal'
  return 'tag'
}

/** 星曜一句话释义：悬停即显 */
const STAR_TIP: Record<string, string> = {
  紫微: '帝座。主尊贵领袖，定盘子的格局高度',
  天机: '军师星。主智谋灵动，善策划而易多思',
  太阳: '光明星。主博爱付出，男命亦看父亲',
  武曲: '财星。主行动力与决断，刚毅务实',
  天同: '福德星。主安逸享受，性情温和',
  廉贞: '次桃花。主原则与纪律，亦主感情纠葛',
  天府: '库星。主稳重守成，善于积累',
  太阴: '月亮星。主温柔细腻，女命亦看母亲',
  贪狼: '大桃花。主欲望才艺，交际手腕高明',
  巨门: '暗星。主口舌与钻研，靠口才吃饭',
  天相: '印星。主辅弼服务，是很好的二把手',
  天梁: '荫星。主庇护长寿，像家里的长辈',
  七杀: '将星。主开创魄力，人生起伏大',
  破军: '先锋星。主破旧立新，先破坏后建设',
  文昌: '文书吉星，利考试与契约',
  文曲: '才艺吉星，利口才与艺术',
  左辅: '平辈贵人，助力来自身边人',
  右弼: '异性贵人，助力温和绵长',
  禄存: '财禄吉星，一生不缺零花钱',
  天魁: '阳贵人是长辈缘的化身',
  天钺: '阴贵人暗中有助力',
  擎羊: '刑星。主冲突刀伤，冲劲的双刃剑',
  陀罗: '忌星。主拖延纠缠，磨人的耐心',
  火星: '火六煞之一。突发与急躁',
  铃星: '火六煞之一。阴火内烧',
  地空: '空亡之星。想法天马行空，财缘看淡',
  地劫: '劫煞之星。破耗与非常规',
}

function starList(mains: string): string[] {
  return mains.split(/\s+/).filter(Boolean)
}

/** 宫位小星签的悬浮释义：首行道号司职，次行星曜本义 */
function chipTip(st: string): string {
  const p = STAR_PERSONAS[st]
  return p ? `${p.ming} · ${p.title}\n${STAR_TIP[st] ?? st}` : (STAR_TIP[st] ?? st)
}

/** 点击详情面板的星曜：让当值道长把她的台词转告给你 */
function speakStar(st: string): void {
  const p = STAR_PERSONAS[st]
  sfx.blip()
  window.dispatchEvent(new CustomEvent('sage-say', {
    detail: p ? `${st}·${p.ming}：「${p.hello}」` : `${st}：${STAR_TIP[st] ?? ''}`,
  }))
}
</script>

<template>
  <main class="page">
    <div class="card">
      <h2><DecryptTitle text="紫微十二宫 · 安星与三方四正" /></h2>
      <p class="sub" style="margin-bottom: 8px">五行局、紫微定位、十四主星、辅煞诸星与生年四化，一次算齐。点击任意宫位查看详情。</p>
      <div class="form-row">
        <div><label>公历出生日期</label><input v-model="dt" type="date" /></div>
        <div><label>出生时辰(24小时制)</label><input v-model="tm" type="time" /></div>
        <div><label>性别</label><select v-model="gender"><option :value="1">男</option><option :value="0">女</option></select></div>
        <div class="btn-cell"><button @click="calc()">✷ 安星排盘</button></div>
      </div>
    </div>

    <template v-if="zc && scored">
      <div class="card">
        <div class="board-head">
          <span class="tag gold">命宫在{{ zc.palaces[zc.mingIndex]!.ganzhi.slice(1) }}</span>
          <span class="tag">{{ zc.juName }}</span>
          <span class="tag teal">三方四正 {{ scored.score.toFixed(1) }} / 10</span>
          <span class="tag">大限{{ zc.forward ? '顺行' : '逆行' }} · 起限看宫角数字</span>
          <span class="sub sihua">四化：{{ Object.entries(zc.siHua).map(([s, h]) => s + h).join(' · ') }}</span>
          <button class="ghost sky-toggle" style="margin-left: auto" @click="skyMode = !skyMode; sfx.toggle()">
            {{ skyMode ? '⬚ 回到平面盘' : '🌌 升入星空' }}
          </button>
        </div>

        <ZiweiSky3D
          v-if="skyMode"
          :palaces="zc.palaces"
          :ming-index="zc.mingIndex"
          :selected="sel"
          @select="pickPalace"
        />
        <div v-else class="ziwei-grid">
          <button
            v-for="(p, i) in zc.palaces"
            :key="i"
            class="palace"
            :class="{ ming: p.index === zc.mingIndex, sel: sel === i, fang: isFang(i) && sel !== i }"
            @click="pickPalace(i)"
          >
            <span class="p-name">
              {{ p.name }}<i v-if="p.index === zc.mingIndex" class="ming-dot">命</i>
              <i v-if="zc.limits[p.index]" class="limit-tag" :class="{ now: inLimit(zc.limits[p.index]!) }">{{ zc.limits[p.index] }}</i>
            </span>
            <span class="p-gz">{{ p.ganzhi }}</span>
            <span class="p-mains twinkle">
              <template v-if="p.mains">
                <span v-for="st in starList(p.mains)" :key="st" class="star" :data-tip="chipTip(st)"><svg v-if="starSpritePixels(st).length" class="star-face" viewBox="0 0 12 13" shape-rendering="crispEdges"><rect v-for="(q, qi) in starSpritePixels(st)" :key="qi" :x="q.x" :y="q.y" width="1.04" height="1.04" :fill="q.fill" /></svg>{{ st }}</span>
              </template>
              <template v-else>空宫</template>
            </span>
            <span class="p-extras">
              <em v-for="x in p.extras.slice(0, 4)" :key="x" :class="starClass(x).replace('tag ', 'st-')">{{ x }}</em>
              <em v-if="p.extras.length > 4" class="more">+{{ p.extras.length - 4 }}</em>
            </span>
          </button>
          <svg v-if="sel !== null" class="fang-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line
              v-for="(l, li) in fangLines" :key="li"
              :x1="l[0]" :y1="l[1]" :x2="l[2]" :y2="l[3]"
              stroke="rgba(232,196,115,0.75)" stroke-width="0.45" stroke-dasharray="2 1.6"
              :style="{ animationDelay: `${li * 0.12}s` }"
            />
          </svg>
          <div class="center-info">
            <div class="ci-bazi">
              <div v-for="(pz, k) in pillars" :key="k">{{ pz }}</div>
            </div>
            <div class="note">四柱（八字）<br />与紫微同参</div>
          </div>
        </div>
      </div>

      <transition name="pop">
        <div v-if="sel !== null && zc.palaces[sel]" class="card">
          <h2>{{ zc.palaces[sel]!.name }}详情 · {{ zc.palaces[sel]!.ganzhi }}</h2>
          <p style="margin-bottom: 8px">
            主星：
            <template v-if="zc.palaces[sel]!.mains">
              <span
                v-for="(st, si) in starList(zc.palaces[sel]!.mains)" :key="'d' + st"
                class="star-big" role="button" tabindex="0"
                :style="{ '--star-accent': starAccent(st) }"
                :data-tip="STAR_TIP[st] ?? st"
                @click="speakStar(st)" @keydown.enter="speakStar(st)"
              >
                <span class="bob-wrap" :style="{ animationDelay: si * 0.4 + 's' }">
                  <svg class="star-face big" viewBox="0 0 12 13" shape-rendering="crispEdges"><rect v-for="(q, qi) in starSpritePixels(st)" :key="qi" :x="q.x" :y="q.y" width="1.04" height="1.04" :fill="q.fill" /></svg>
                </span>
                <span class="star-id">
                  <b class="gold-t2">{{ st }}</b>
                  <i v-if="STAR_PERSONAS[st]" class="star-ming">{{ STAR_PERSONAS[st].ming }} · {{ STAR_PERSONAS[st].title }}<em class="nat">{{ STAR_PERSONAS[st].nature }}</em></i>
                  <em v-if="STAR_PERSONAS[st]" class="star-hello">{{ STAR_PERSONAS[st].hello }}</em>
                </span>
              </span>
              <span class="sub tip-hint">悬停看释义，点一下让道长替她传话</span>
            </template>
            <b v-else class="gold-t2">空宫（借对宫）</b>
          </p>
          <div style="margin-bottom: 10px">
            辅煞：
            <span v-for="x in zc.palaces[sel]!.extras" :key="x" :class="starClass(x)" style="margin-right: 4px">{{ x }}</span>
            <span v-if="!zc.palaces[sel]!.extras.length" class="sub">无</span>
          </div>
          <p class="sub">
            宫位释义：{{ PALACE_MEANING[zc.palaces[sel]!.name] }}
          </p>
          <p v-if="zc.limits[zc.palaces[sel]!.index]" class="sub" style="margin-top: 4px">
            大限：{{ zc.limits[zc.palaces[sel]!.index] }} 岁（{{ inLimit(zc.limits[zc.palaces[sel]!.index]!) ? '正在走的十年' : '未行/已过' }}）·
            走这步限时，此宫星曜就是那十年的舞台布景。
          </p>
        </div>
      </transition>

      <div class="card">
        <h2>三方四正逐宫明细</h2>
        <table>
          <tr><th>宫位</th><th>主星</th><th>子分增减</th></tr>
          <tr v-for="d in scored.detail" :key="d.palace">
            <td>{{ d.palace }}</td>
            <td>{{ d.stars.join(' ') || '—' }}</td>
            <td :style="{ color: d.delta >= 0 ? 'var(--teal)' : '#f87171' }">{{ d.delta >= 0 ? '+' : '' }}{{ d.delta.toFixed(1) }}</td>
          </tr>
        </table>
        <p class="note" style="margin-top: 8px">
          记分规则与 v5 引擎一致：吉星+0.8 / 煞星-0.8 / 化禄权+1.0 / 化科+0.7 / 化忌-1.2 / 空宫-0.6，
          映射至 0–10 分。该分与八字七柱相关性 ρ≈-0.06，两套体系互相独立。
        </p>
      </div>
    </template>
  </main>
</template>

<style scoped>
.form-row { display: grid; grid-template-columns: 1.4fr 1fr auto; gap: 12px; align-items: end; }
.btn-cell { padding-bottom: 1px; }
.board-head { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.sihua { font-size: 0.78rem; }

.ziwei-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  position: relative;
}
.fang-lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; }
.fang-lines line { animation: line-draw 0.7s cubic-bezier(0.22, 1, 0.36, 1) both, dash-flow 1.2s linear infinite; stroke-dashoffset: 0; }
@keyframes line-draw { from { opacity: 0; } to { opacity: 1; } }
@keyframes dash-flow { to { stroke-dashoffset: -7.2; } }
.palace.fang { border-color: rgba(232, 196, 115, 0.65); box-shadow: inset 0 0 18px rgba(232, 196, 115, 0.08); }
.twinkle { animation: star-tw 3.4s ease-in-out infinite; text-shadow: 0 0 16px rgba(232,196,115,0.45); }
@keyframes star-tw {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
}
.palace {
  position: relative;
  min-height: 108px;
  text-align: left;
  background: linear-gradient(160deg, var(--card-2), var(--panel));
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 9px 11px;
  color: var(--fg);
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: all 0.22s ease;
  font-family: inherit;
  font-weight: normal;
}
.palace:hover { transform: translateY(-3px); border-color: rgba(232, 196, 115, 0.5); box-shadow: 0 8px 20px rgba(0,0,0,0.35); }
.palace.ming { border-color: rgba(232, 196, 115, 0.55); background: linear-gradient(160deg, #26221a, #17151f); }
.palace.sel { outline: 2px solid var(--teal); animation: palace-pulse 1.8s ease-in-out infinite; }
@keyframes palace-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(94, 234, 212, 0); }
  50% { box-shadow: 0 0 16px rgba(94, 234, 212, 0.4); }
}
.p-name { color: var(--dim); font-size: 0.72rem; display: flex; justify-content: space-between; align-items: center; gap: 4px; }
.limit-tag {
  font-style: normal;
  color: var(--dim);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0 4px;
  font-size: 0.6rem;
  white-space: nowrap;
}
.limit-tag.now {
  color: #10131c;
  background: linear-gradient(140deg, var(--teal), #3ec9b4);
  border-color: transparent;
  font-weight: bold;
  animation: lim-pulse 2s ease-in-out infinite;
}
@keyframes lim-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(94, 234, 212, 0.35); }
  50% { box-shadow: 0 0 12px rgba(94, 234, 212, 0.7); }
}
.ming-dot {
  font-style: normal;
  background: var(--gold);
  color: #201804;
  border-radius: 4px;
  padding: 0 5px;
  font-size: 0.62rem;
  font-weight: bold;
}
.p-gz { color: var(--teal); font-size: 0.68rem; opacity: 0.75; }
.p-mains { font-family: var(--cute); color: var(--gold-bright); font-size: 0.98rem; line-height: 1.3; min-height: 1.3em; text-shadow: 0 0 14px rgba(232,196,115,0.35); }
.star { position: relative; cursor: help; margin-right: 4px; display: inline-flex; align-items: center; gap: 2px; }
.star-face {
  width: 15px;
  height: 16px;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 5px rgba(var(--acc-rgb), 0.55));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.star:hover .star-face { transform: translateY(-2px) scale(1.18); }
.star-big {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 16px;
  cursor: pointer;
}
.star-big:focus-visible { outline: 2px solid var(--teal); outline-offset: 4px; border-radius: 10px; }
.bob-wrap { display: inline-flex; animation: face-bob 3.4s ease-in-out infinite; }
@keyframes face-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.tip-hint { margin-left: 4px; opacity: 0.7; }
.star-id { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; }
.star-ming { font-style: normal; font-size: 0.72rem; color: var(--dim); display: inline-flex; align-items: center; gap: 6px; }
.star-ming .nat {
  font-style: normal;
  font-size: 0.62rem;
  padding: 0 5px;
  border-radius: 999px;
  border: 1px solid var(--star-accent);
  color: var(--star-accent);
}
.star-hello {
  font-style: normal;
  max-width: 340px;
  font-size: 0.78rem;
  line-height: 1.75;
  color: var(--fg);
  background: rgba(127, 127, 127, 0.06);
  border-left: 3px solid var(--star-accent);
  border-radius: 0 8px 8px 0;
  padding: 5px 10px;
  animation: hello-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes hello-pop {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
.star-face.big { width: 42px; height: 46px; border: 1px solid rgba(var(--acc-rgb), 0.35); border-radius: 9px; background: rgba(127, 127, 127, 0.05); padding: 3px; }
.star-big::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 210px;
  white-space: normal;
  background: linear-gradient(160deg, var(--card-2), var(--panel));
  border: 1px solid rgba(var(--acc-rgb), 0.45);
  border-radius: 9px;
  padding: 7px 11px;
  font-size: 0.74rem;
  line-height: 1.85;
  color: var(--fg);
  z-index: 80;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.star-big:hover::after { opacity: 1; }
.star:hover::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 190px;
  white-space: pre-line;
  background: linear-gradient(160deg, var(--card-2), var(--panel));
  border: 1px solid rgba(var(--acc-rgb), 0.45);
  border-radius: 9px;
  padding: 6px 10px;
  font-family: var(--serif);
  font-size: 0.72rem;
  line-height: 1.8;
  color: var(--fg);
  z-index: 70;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.p-extras { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 2px; }
.p-extras em { font-style: normal; font-size: 0.64rem; padding: 0 5px; border-radius: 999px; border: 1px solid var(--line); color: var(--dim); }
.p-extras em.more { opacity: 0.6; }
.st-teal { color: var(--teal); border-color: rgba(94,234,212,0.35) !important; }
.st-gold { color: var(--gold-bright); border-color: rgba(232,196,115,0.4) !important; }
.st-red { color: #f87171; border-color: rgba(248,113,113,0.4) !important; }

.center-info {
  grid-column: 2 / span 2;
  grid-row: 2 / span 2;
  border: 1px dashed rgba(232, 196, 115, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: radial-gradient(closest-side, rgba(232, 196, 115, 0.05), transparent);
}
.ci-bazi { display: flex; gap: 14px; font-family: var(--cute); font-size: 1.25rem; color: var(--fg); }
.gold-t2 { color: var(--gold-bright); }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-enter-from { opacity: 0; transform: translateY(-8px); }
.pop-leave-active { display: none; }

@media (max-width: 720px) {
  .ziwei-grid { gap: 5px; }
  .palace { min-height: 88px; padding: 6px 7px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
