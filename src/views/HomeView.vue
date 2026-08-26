<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SHENG_CYCLE, KE_CYCLE } from '../data/wuxingData'
import { Element, SHENG_ORDER } from '../lib/constants'
import { buildTaoessHd } from '../data/sageSprite'
import BaguaCompass from '../components/BaguaCompass.vue'
import GanzhiClock from '../components/GanzhiClock.vue'
import JieqiCard from '../components/JieqiCard.vue'
import YiJiCard from '../components/YiJiCard.vue'
import ParticleAltar from '../components/ParticleAltar.vue'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import { vTilt } from '../lib/tilt'

const router = useRouter()
const hoverEle = ref<Element | null>(null)
let lastPtr = 'mouse'
/** 触屏的合成 mouseenter 先于 click，不能在这里开箱，否则点按立刻自消 */
function hoverEnter(e: Element): void {
  if (lastPtr === 'touch') return
  hoverEle.value = e
  sfx.blip()
}

/* 标题鎏金显影：光标扫到哪儿，金字亮到哪儿 */
const gx = ref(-9999)
const gy = ref(-9999)
const heroTitle = ref<HTMLElement | null>(null)
function heroGlow(e: MouseEvent): void {
  const host = heroTitle.value
  if (!host) return
  const r = host.getBoundingClientRect()
  gx.value = e.clientX - r.left
  gy.value = e.clientY - r.top
}
function heroGlowOff(): void {
  gx.value = -9999
  gy.value = -9999
}

const SAGE = buildTaoessHd('qingxuan')

/** 每日一签：按日期固定抽取，全天不变 */
const QUOTES = [
  { text: '命贵中和，偏枯终于有损；理求平正，奇异不足为凭。', src: '滴天髓阐微 · 知命' },
  { text: '天战犹自可，地战急如火。', src: '滴天髓阐微 · 天干' },
  { text: '用之财不可劫，用之官不可伤，用之印绶不可坏。', src: '滴天髓阐微 · 用神' },
  { text: '得时俱为旺论，失令便作衰看，虽是至理，亦活法也。', src: '滴天髓阐微 · 旺衰' },
  { text: '病药两停，贵不可言。', src: '神峰通考 · 病药说' },
  { text: '有病方为贵，无伤不是奇。格中如去病，财禄喜相随。', src: '神峰通考 · 病药说' },
  { text: '论命者，先观日主之强弱，次察用神之向背。', src: '子平真诠评注 · 自序' },
  { text: '春木炎炎，本宜水润，夏金铄铄，最喜湿土。', src: '穷通宝鉴 · 总纲' },
  { text: '凡观女命，关系非小，不可轻断淫邪，以渎神怒。', src: '滴天髓阐微 · 女命章' },
  { text: '官星带禄，贵而且秀。', src: '三命通会 · 论正官' },
  { text: '财乃养命之源，人人之所欲。', src: '渊海子平 · 论财' },
  { text: '杀不离印，印不离杀，杀印相生，功名显达。', src: '渊海子平 · 继善篇' },
  { text: '太岁乃年中之天子，故不可犯，犯之则凶。', src: '渊海子平 · 论太岁' },
  { text: '一命二运三风水，四积阴德五读书。', src: '民间命谚' },
  { text: '福祸无门，惟人自召。命自我立，福自己求。', src: '了凡四训' },
  { text: '乐天知命，故不忧。', src: '周易 · 系辞' },
]

function daySeed(): number {
  const d = new Date()
  return d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()
}
const today = QUOTES[daySeed() % QUOTES.length]!

async function copyQuote(): Promise<void> {
  const text = `「${today.text}」——${today.src}`
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      sfx.ding()
      return
    }
    // 旧环境兜底：隐藏文本域 + execCommand
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    if (ok) sfx.ding()
    else toast('复制没成功，长按文字手动复制吧')
  } catch {
    toast('复制没成功，长按文字手动复制吧')
  }
}

const STATS = [
  { n: 21912 as number | null, pre: '', suf: '', label: '同龄男命全量百分位池', sub: '2001–2005 年出生，每一盘都是逐个复算的' },
  { n: 7, pre: '', suf: ' 部', label: '典籍数字化语料', sub: '滴天髓、三命通会、穷通宝鉴等，整本入库' },
  { n: 100, pre: '', suf: '万+', label: '古籍校对字数', sub: '按章节统计过主题密度，不是拍脑袋' },
  { n: 2037, pre: '', suf: '', label: '案例自动标注入库', sub: '带置信度，教学样本单独分层' },
  { n: 49, pre: '', suf: ' 个', label: '特殊格局谱系', sub: '五部书互相印证，源流都标了年代' },
  { n: null, pre: '', suf: '', text: 'ρ=-0.059', label: '引擎×古典断语一致性', sub: '120 例双通道核对，结论：不显著' },
]

/** 模块按人气梯队分三区：速占日活 → 排盘主力 → 体验与研究（一个不少） */
interface ModuleDef { to: string; glyph: string; title: string; desc: string; tags: string[] }

const MODULE_TIERS: Array<{ title: string; sub: string; items: ModuleDef[] }> = [
  {
    title: '先算一算 · 三十秒出结果',
    sub: '不填资料不纠结，今天的事今天问',
    items: [
      { to: '/daily', glyph: '签', title: '每日一签', desc: '按日期固定一签，全天不变。附十二时辰吉凶，出门前扫一眼。', tags: ['每日同签', '黄黑道'] },
      { to: '/almanac', glyph: '历', title: '今日黄历', desc: '宜忌、吉时、幸运色，老黄历翻新页。当参考，别当圣旨。', tags: ['宜忌', '吉时'] },
      { to: '/xiaoliuren', glyph: '掌', title: '小六壬', desc: '心里想事随口报数，指尖点过六宫落定吉凶。诸葛马前课，最快的一种。', tags: ['掐指一算', '报数起课'] },
      { to: '/jiaobei', glyph: '筊', title: '杯筊问事', desc: '掷两片木筊问允否，连得三圣才算数。庙里问事的老规矩。', tags: ['圣杯阴杯', '三问定夺'] },
    ],
  },
  {
    title: '排盘问命 · 正主在这儿',
    sub: '输入生辰，引擎离线全算，规则全部公开',
    items: [
      { to: '/chart', glyph: '八', title: '八字排盘', desc: '四柱翻牌、评分环、七维雷达、大运长河，输入生辰一键出全套。', tags: ['v5 引擎', '与 Python 版对齐'] },
      { to: '/ziwei', glyph: '紫', title: '紫微命盘', desc: '安星即算。十二宫点哪看哪，三方四正连线自己画，大限标到每一宫。', tags: ['三方四正', '生年四化'] },
      { to: '/liuyao', glyph: '爻', title: '六爻问卦', desc: '三枚铜钱摇六次，纳甲装卦、六亲六兽自动排好，附白话用神分析。', tags: ['火珠林法', '京房八宫'] },
      { to: '/meihua', glyph: '梅', title: '梅花易数', desc: '万物皆可起卦：报两个数、报个时间，体用互变断吉凶。邵雍的老玩法。', tags: ['数字起卦', '体用生克'] },
      { to: '/shuzi', glyph: '数', title: '数字能量', desc: '手机号生日拆两半求和起卦，梅花旧法的新玩法，图个乐趣。', tags: ['号码起卦', '京房装卦'] },
    ],
  },
  {
    title: '再逛逛 · 玩点大的',
    sub: '体验区和资料库都在这儿，慢慢翻',
    items: [
      { to: '/wuxing', glyph: '五', title: '五行天穹', desc: '体素搭出来的五行太极台，能拖能转能缩放，点一下看生克爆粒子花。', tags: ['Three.js', '辉光后处理'] },
      { to: '/yanyi', glyph: '演', title: '推演长卷', desc: '往下滚，看八字怎么从一团混沌之气一步步长成四柱，一镜到底。', tags: ['滚动叙事', '七幕'] },
      { to: '/sages', glyph: '鉴', title: '道长图鉴', desc: '观里十位当值女道士的名册，点一下会跟你搭话，还能随缘指派。', tags: ['吉祥物', '彩蛋'] },
      { to: '/memory', glyph: '忆', title: '卦象记忆', desc: '八卦翻牌配对小游戏，几步配完，八卦长相顺便记牢。', tags: ['小游戏', '记八卦'] },
      { to: '/classics', glyph: '卷', title: '典籍语料', desc: '章节检索加主题密度条形图，看看每部古书到底在讲什么。', tags: ['语料库', '主题密度'] },
      { to: '/geju', glyph: '格', title: '格局辞典', desc: '49 个特殊格局，五部书互证，原文书摘和源流年代都在。', tags: ['五书互证', '源流谱系'] },
      { to: '/rules', glyph: '规', title: '规则库', desc: '799 条清洗过的规则，调候速查、女命章法、六亲断语分栏可查。', tags: ['全部公开', '条件-结论'] },
      { to: '/cases', glyph: '案', title: '案例库', desc: '千里命稿 166 例加标注案例 2,037 例，按置信度筛着看。', tags: ['千里命稿', '标注体系'] },
    ],
  },
]

function shengTarget(e: Element): Element {
  return SHENG_CYCLE.find((p) => p[0] === e)![1]
}
function keTarget(e: Element): Element {
  return KE_CYCLE.find((p) => p[0] === e)![1]
}
function go(to: string): void {
  sfx.ding()
  router.push(to)
}

function arcPath(i: number, j: number, off: number): string {
  const R = 118
  const cx = 150
  const cy = 150
  const ang = (k: number): [number, number] => {
    const a = (Math.PI * 2 * k) / 5 - Math.PI / 2
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)]
  }
  const [x1, y1] = ang(i)
  const [x2, y2] = ang(j)
  const mx = (x1 + x2) / 2 + off * Math.cos(((i + j) / 2) * ((Math.PI * 2) / 5) - Math.PI / 2)
  const my = (y1 + y2) / 2 + off * Math.sin(((i + j) / 2) * ((Math.PI * 2) / 5) - Math.PI / 2)
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
}
</script>

<template>
  <main class="page">
    <section class="hero card hoverable">
      <ParticleAltar />
      <div class="hero-left" @mouseleave="heroGlowOff">
         <h1 ref="heroTitle" @mousemove="heroGlow">把命理摊开来<br />做成<b class="gold-t">看得见规则</b>的样子</h1>
         <h1 class="reveal-ghost" aria-hidden="true" :style="{ '--mx': `${gx}px`, '--my': `${gy}px` }">把命理摊开来<br />做成看得见规则的样子</h1>
        <p class="sub hero-sub">
          子平八字 × 紫微斗数的量化研究工程。权重公开、数据公开、连引擎算得不准的地方也公开——
          每一分都能复核，每条断语都能溯源。
        </p>
        <div class="hero-btns">
          <button v-magnetic @click="go('/chart')">☯ 立即排盘</button>
          <button v-magnetic="0.22" class="ghost" @click="go('/wuxing')">五 五行 3D 天穹</button>
          <button v-magnetic="0.22" class="ghost" @click="go('/liuyao')">爻 摇一卦</button>
        </div>
      </div>
      <div class="hero-wheel" aria-hidden="true">
        <div class="wheel-ring"></div>
        <div class="wheel-core">☯</div>
        <div v-for="(e, i) in SHENG_ORDER" :key="e" class="orbit-ele" :class="[`ele-${e}`, `bg-${e}`, { hov: hoverEle === e }]" :style="{ '--i': i }" role="button" tabindex="0" @pointerdown="lastPtr = $event.pointerType" @mouseenter="hoverEnter(e)" @mouseleave="hoverEle = null" @click="hoverEle = hoverEle === e ? null : e; sfx.blip()" @keydown.enter="hoverEle = e; sfx.blip()">
          {{ e }}
        </div>
        <svg class="wheel-arrows" viewBox="0 0 300 300">
          <defs>
            <marker id="arrH" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--gold)" /></marker>
            <marker id="arrR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--red)" /></marker>
          </defs>
          <path v-for="(p, i) in SHENG_CYCLE" :key="'s' + i" :d="arcPath(SHENG_ORDER.indexOf(p[0]), SHENG_ORDER.indexOf(p[1]), -24)" class="arc-s" marker-end="url(#arrH)" />
          <path v-for="(p, i) in KE_CYCLE" :key="'k' + i" :d="arcPath(SHENG_ORDER.indexOf(p[0]), SHENG_ORDER.indexOf(p[1]), 26)" class="arc-k" marker-end="url(#arrR)" />
        </svg>
<svg class="hero-sage" viewBox="0 0 52 60">
<rect v-for="(p, i) in SAGE" :key="i" :x="p.x + 0.12" :y="p.y + 4.12" width="0.88" height="0.88" rx="0.22" :fill="p.fill" />
        </svg>
      </div>
    </section>

    <section v-reveal class="play-grid">
      <div class="card compass-card">
        <h2>八卦罗盘 · 拨一拨</h2>
        <BaguaCompass />
      </div>
      <div class="card quote-card">
        <JieqiCard class="jq-pos" />
        <YiJiCard />
        <h2>今日一签</h2>
        <p class="q-text">「{{ today.text }}」</p>
        <p class="note q-src">—— {{ today.src }}</p>
        <button class="ghost q-copy" @click="copyQuote()">✍ 复制这句</button>
      </div>
    </section>

    <section v-reveal class="stats">
      <div v-for="(s, i) in STATS" :key="s.label" v-reveal="i * 60" class="card stat-card hoverable">
          <div class="big-num">
            <template v-if="s.n != null">
              <span v-countup="s.n">{{ s.n.toLocaleString('en-US') }}</span><span v-if="s.pre">{{ s.pre }}</span><span>{{ s.suf }}</span>
            </template>
            <template v-else>{{ s.text }}</template>
          </div>
        <div class="stat-label">{{ s.label }}</div>
        <div class="note">{{ s.sub }}</div>
      </div>
    </section>

    <template v-for="tier in MODULE_TIERS" :key="tier.title">
      <h2 v-reveal>{{ tier.title }} <small class="sub tier-sub">{{ tier.sub }}</small></h2>
      <section class="modules">
        <a v-for="(m, i) in tier.items" :key="m.to" v-reveal="(i % 4) * 70" v-tilt="6" class="card module-card hoverable" :href="'#' + m.to" @click.prevent="go(m.to)">
          <div class="m-glyph">{{ m.glyph }}</div>
          <div class="m-title">{{ m.title }}</div>
          <p class="sub">{{ m.desc }}</p>
          <div><span v-for="t in m.tags.slice(0, 2)" :key="t" class="tag gold">{{ t }}</span></div>
          <div class="m-go">进去看看 →</div>
        </a>
      </section>
    </template>

    <section v-reveal class="time-grid">
      <div class="card clock-card">
        <h2>十二时辰 · 拨盘看宜忌</h2>
        <GanzhiClock />
      </div>
      <div class="card">
        <h2>先把丑话说在前面</h2>
        <p class="sub">
          引擎打分和古典「贵贱」断语的一致性只有 ρ=-0.059（不显著）。我们照实公布：
          现在这套规则化打分，复现不了古人那套判断——这正是接着往下研究的理由。
          权重、阈值、数据管线全部开源可查；晚子时因换日争议暂不支持；女命百分位池还在建；
          真太阳时没有自动校正。
        </p>
      </div>
    </section>

    <div class="note center-note">
      当前选中五行：
      <template v-if="hoverEle">
        <b :class="`ele-${hoverEle}`">{{ hoverEle }}</b> 生 {{ shengTarget(hoverEle) }} · 克 {{ keTarget(hoverEle) }} —— 点别的字换一个试试
      </template>
      <template v-else>点一下右边轮盘的任意一个字</template>
    </div>
  </main>
</template>

<style scoped>
.hero { position: relative; display: flex; gap: 30px; align-items: center; padding: 34px 34px; }
.hero-left { flex: 1; min-width: 260px; position: relative; z-index: 1; }
.hero h1 { font-size: 2.15rem; line-height: 1.35; margin-bottom: 14px; }
.reveal-ghost {
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  pointer-events: none;
  color: transparent;
  background: linear-gradient(115deg, #ffe9b8, var(--gold-bright) 45%, #7ef0c8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-mask-image: radial-gradient(120px circle at var(--mx, -9999px) var(--my, -9999px), rgba(0, 0, 0, 0.95), transparent 78%);
  mask-image: radial-gradient(120px circle at var(--mx, -9999px) var(--my, -9999px), rgba(0, 0, 0, 0.95), transparent 78%);
}
@media (pointer: coarse) { .reveal-ghost { display: none; } }
.gold-t { color: var(--gold-bright); text-shadow: 0 0 26px rgba(var(--acc-rgb), 0.45); }
.hero-sub { max-width: 470px; margin-bottom: 20px; }
.hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }

.hero-wheel { position: relative; width: 300px; height: 320px; flex-shrink: 0; z-index: 1; }
.wheel-ring {
  position: absolute;
  left: 0;
  top: 10px;
  width: 300px;
  height: 300px;
  inset: auto;
  border-radius: 50%;
  border: 1px dashed rgba(var(--acc-rgb), 0.35);
  animation: spin 40s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.wheel-core {
  position: absolute; left: 50%; top: 160px;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  filter: drop-shadow(0 0 18px rgba(var(--acc-rgb), 0.55));
  animation: pulse 3.2s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.08); } }
.orbit-ele {
  position: absolute;
  width: 52px; height: 52px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--cute);
  font-size: 1.35rem;
  cursor: pointer;
  left: calc(150px + 108px * cos(var(--i) * 72deg - 90deg) - 26px);
  top: calc(160px + 108px * sin(var(--i) * 72deg - 90deg) - 26px);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
}
.orbit-ele.hov { transform: scale(1.28); box-shadow: 0 0 22px currentColor; z-index: 2; }
.wheel-arrows { position: absolute; inset: 0; pointer-events: none; }
.arc-s { fill: none; stroke: rgba(var(--acc-rgb), 0.65); stroke-width: 1.6; stroke-dasharray: 5 4; animation: dashmove 1.6s linear infinite; }
.arc-k { fill: none; stroke: rgba(var(--red-rgb), 0.5); stroke-width: 1.2; stroke-dasharray: 3 5; animation: dashmove 2.2s linear infinite reverse; }
@keyframes dashmove { to { stroke-dashoffset: -18; } }

.hero-sage {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 78px;
  image-rendering: pixelated;
  animation: sage-float 4.2s ease-in-out infinite;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
}
@keyframes sage-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-9px); }
}

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 26px; }
.stat-card { padding: 16px; text-align: center; }
/* 长数字（ρ=-0.059 / 100万+）在 150px 窄卡里不再折行溢出 */
.stats .big-num { font-size: clamp(1.35rem, 1.9vw, 2.1rem); white-space: nowrap; }
.stat-label { color: var(--fg); font-size: 0.85rem; margin: 6px 0 4px; }

.play-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; margin-bottom: 26px; align-items: start; }
.compass-card :deep(.compass-wrap) { margin-top: 6px; }
.quote-card { position: relative; display: flex; flex-direction: column; align-items: flex-start; padding-top: 24px; overflow: hidden; }
.jq-pos { position: absolute; right: 14px; top: 14px; width: 96px; height: 96px; }
.q-text { font-size: 1.16rem; font-family: var(--cute); color: var(--gold-bright); line-height: 2.1; margin: 10px 0 8px; text-shadow: 0 0 20px rgba(var(--acc-rgb), 0.25); max-width: 88%; }
.q-src { align-self: flex-end; }
.q-copy { margin-top: auto; }

.time-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; margin-bottom: 26px; align-items: start; }
.clock-card { display: flex; flex-direction: column; align-items: center; }
.clock-card :deep(.clock-wrap) { width: 100%; }

.modules { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 20px; }
.tier-sub { font-size: 0.78rem; margin-left: 10px; letter-spacing: 0.05em; }
.module-card { cursor: pointer; position: relative; display: block; color: var(--fg); }
.module-card:hover { text-decoration: none; }
.m-glyph { font-size: 1.7rem; margin-bottom: 8px; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.module-card:hover .m-glyph { transform: scale(1.25) rotate(-8deg); }
.m-title { font-family: var(--cute); color: var(--gold-bright); font-size: 1.08rem; margin-bottom: 7px; }
.m-go { position: absolute; right: 16px; bottom: 12px; color: var(--teal); font-size: 0.78rem; opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease; transform: translateX(-6px); }
.module-card:hover .m-go { opacity: 1; transform: none; }
.module-card:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; }
.module-card:focus-visible .m-go { opacity: 1; transform: none; }

.center-note { text-align: center; margin-top: 8px; }

@media (max-width: 720px) {
  .hero { flex-direction: column; }
  .hero-wheel { transform: scale(0.82); margin: -20px 0; }
  .play-grid, .time-grid { grid-template-columns: 1fr; }
  /* 窄屏下轮盘+装饰道长+常驻吉祥物三层叠，撤掉装饰那层 */
  .hero-sage { display: none; }
}
</style>
