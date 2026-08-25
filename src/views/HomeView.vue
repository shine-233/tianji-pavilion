<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaguaCompass from '../components/BaguaCompass.vue'
import { SHENG_CYCLE, KE_CYCLE } from '../data/wuxingData'
import { Element, SHENG_ORDER } from '../lib/constants'
import { sfx } from '../lib/sfx'

const router = useRouter()
const hoverEle = ref<Element | null>(null)

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

const STATS = [
  { num: '21,912', label: '同龄男命全量百分位池', sub: '2001–2005 出生 · 逐盘复算' },
  { num: '7 部', label: '典籍数字化语料', sub: '滴天髓/三命通会/穷通宝鉴 等' },
  { num: '~100万', label: '古籍校对字数', sub: '章节级主题密度已量化' },
  { num: '2,037', label: '案例自动标注入库', sub: '含置信度与教学样本分层' },
  { num: '49 个', label: '特殊格局谱系', sub: '五书互证 · 源流可溯' },
  { num: 'ρ=-0.059', label: '引擎×古典断语一致性', sub: 'n=120 双通道核对 · 不显著' },
]

const MODULES = [
  { to: '/chart', glyph: '🀄', title: '排盘评分', desc: '四柱翻牌、评分环动画、七维雷达、大运时间轴与白话解读，全部离线计算。', tags: ['v5 引擎', 'Python 自检'] },
  { to: '/ziwei', glyph: '✷', title: '紫微命盘', desc: '安星即算，十二宫交互点选，三方四正吉煞四化一目了然。', tags: ['三方四正', '生年四化'] },
  { to: '/wuxing', glyph: '🌌', title: '五行天穹', desc: '体素建模的五行环游太极台：拖拽旋转、缩放、点击聚焦看生克。', tags: ['Three.js', '辉光后处理'] },
  { to: '/classics', glyph: '📜', title: '典籍语料', desc: '章节检索 + 八大主题密度条形图，看看每部书到底在讲什么。', tags: ['语料库', '主题密度'] },
  { to: '/geju', glyph: '⚔', title: '格局辞典', desc: '49 个特殊格局五书互证，附原文书摘与源流年代。', tags: ['五书互证', '源流谱系'] },
  { to: '/rules', glyph: '⚖', title: '规则库', desc: '799 条清洗规则、调候速查表、女命章法、六亲断语分栏浏览。', tags: ['可审计', '条件-结论'] },
  { to: '/cases', glyph: '🗂', title: '案例库', desc: '千里命稿 166 例 + 已验证标注 2,037 例，支持按置信度筛选。', tags: ['千里命稿', '标注体系'] },
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

const heroTitle = computed(() => '把命理变成'.split(''))
const heroTitle2 = computed(() => '可审计的科学'.split(''))

function copyQuote(): void {
  void navigator.clipboard?.writeText(`「${today.text}」——${today.src}`)
  sfx.ding()
}
</script>

<template>
  <main class="page">
    <section class="hero card hoverable">
      <div class="hero-left">
        <h1>
          <span v-for="(ch, i) in heroTitle" :key="'a' + i" class="h-ch" :style="{ '--d': `${i * 0.07}s` }">{{ ch }}</span><br />
          <span v-for="(ch, i) in heroTitle2" :key="'b' + i" class="h-ch gold-t" :style="{ '--d': `${0.5 + i * 0.07}s` }">{{ ch }}</span>
        </h1>
        <p class="sub hero-sub">
          传统子平命理 × 紫微斗数的完整量化研究工程：公开规则引擎、两万余盘百分位池、
          七本典籍数字化语料、格局谱系与一致性测量。每一分都可回归、可证伪。
        </p>
        <div class="hero-btns">
          <button @click="go('/chart')">☯ 立即排盘</button>
          <button class="ghost" @click="go('/wuxing')">🌌 五行 3D 天穹</button>
          <button class="ghost" @click="go('/classics')">📜 典籍语料</button>
        </div>
      </div>
      <div class="hero-wheel" aria-hidden="true">
        <div class="wheel-ring"></div>
        <div class="wheel-core">☯</div>
        <div v-for="(e, i) in SHENG_ORDER" :key="e" class="orbit-ele" :class="[`ele-${e}`, `bg-${e}`, { hov: hoverEle === e }]" :style="{ '--i': i }" @mouseenter="hoverEle = e; sfx.blip()" @mouseleave="hoverEle = null">
          {{ e }}
        </div>
        <svg class="wheel-arrows" viewBox="0 0 300 300">
          <defs>
            <marker id="arrH" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8c473" /></marker>
            <marker id="arrR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f87171" /></marker>
          </defs>
          <path v-for="(p, i) in SHENG_CYCLE" :key="'s' + i" :d="arcPath(SHENG_ORDER.indexOf(p[0]), SHENG_ORDER.indexOf(p[1]), -24)" class="arc-s" marker-end="url(#arrH)" />
          <path v-for="(p, i) in KE_CYCLE" :key="'k' + i" :d="arcPath(SHENG_ORDER.indexOf(p[0]), SHENG_ORDER.indexOf(p[1]), 26)" class="arc-k" marker-end="url(#arrR)" />
        </svg>
      </div>
    </section>

    <section class="play-grid">
      <div class="card compass-card">
        <h2>八卦罗盘 · 转一签</h2>
        <BaguaCompass />
      </div>
      <div class="card quote-card">
        <h2>今日一签</h2>
        <p class="q-text">「{{ today.text }}」</p>
        <p class="note q-src">—— {{ today.src }}</p>
        <button class="ghost q-copy" @click="copyQuote()">✍ 复制这句话</button>
      </div>
    </section>

    <section class="stats">
      <div v-for="s in STATS" :key="s.label" class="card stat-card hoverable">
        <div class="big-num">{{ s.num }}</div>
        <div class="stat-label">{{ s.label }}</div>
        <div class="note">{{ s.sub }}</div>
      </div>
    </section>

    <h2>七间殿 · 各司其职</h2>
    <section class="modules">
      <a v-for="m in MODULES" :key="m.to" class="card module-card hoverable" @click.prevent="go(m.to)">
        <div class="m-glyph">{{ m.glyph }}</div>
        <div class="m-title">{{ m.title }}</div>
        <p class="sub">{{ m.desc }}</p>
        <div><span v-for="t in m.tags" :key="t" class="tag gold">{{ t }}</span></div>
        <div class="m-go">进入 →</div>
      </a>
    </section>

    <section class="card">
      <h2>这项研究的诚实边界</h2>
      <p class="sub">
        引擎与古典断语的一致性 ρ=-0.059（不显著）——我们如实公布这一测量结果：
        现有规则化打分并不能复现古人的「贵贱」判断，这正是后续研究方向。
        所有权重、阈值、数据管线全部开源；晚子时因换日流派争议暂不支持；
        女命百分位池建设中；真太阳时未自动校正。
      </p>
    </section>

    <div class="note center-note">
      当前悬浮五行：
      <template v-if="hoverEle">
        <b :class="`ele-${hoverEle}`">{{ hoverEle }}</b> 生 {{ shengTarget(hoverEle) }} · 克 {{ keTarget(hoverEle) }} —— 把鼠标移到别的字上试试
      </template>
      <template v-else>把鼠标移到右侧轮盘的任意五行上</template>
    </div>
  </main>
</template>

<style scoped>
.hero { display: flex; gap: 30px; align-items: center; padding: 34px 34px; }
.hero-left { flex: 1; min-width: 260px; }
.h-ch { display: inline-block; opacity: 0; animation: hero-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; animation-delay: var(--d); }
@keyframes hero-in { from { opacity: 0; transform: translateY(16px) rotate(4deg); filter: blur(5px); } to { opacity: 1; transform: none; filter: none; } }
.hero h1 { font-size: 2.15rem; line-height: 1.35; margin-bottom: 14px; }

.play-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; margin-bottom: 26px; align-items: start; }
.compass-card :deep(.compass-wrap) { margin-top: 6px; }
.quote-card { display: flex; flex-direction: column; align-items: flex-start; padding-top: 24px; }
.q-text { font-size: 1.18rem; font-family: var(--cute); color: var(--gold-bright); line-height: 2.1; margin: 10px 0 8px; text-shadow: 0 0 20px rgba(232,196,115,0.25); }
.q-src { align-self: flex-end; }
.q-copy { margin-top: auto; }

.gold-t { color: var(--gold-bright); text-shadow: 0 0 26px rgba(232, 196, 115, 0.45); }
.hero-sub { max-width: 460px; margin-bottom: 20px; }
.hero-btns { display: flex; gap: 10px; flex-wrap: wrap; }

.hero-wheel { position: relative; width: 300px; height: 300px; flex-shrink: 0; }
.wheel-ring {
  position: absolute; inset: 32px;
  border-radius: 50%;
  border: 1px dashed rgba(232, 196, 115, 0.35);
  animation: spin 40s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.wheel-core {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  filter: drop-shadow(0 0 18px rgba(232, 196, 115, 0.55));
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
  left: calc(50% + 108px * cos(var(--i) * 72deg - 90deg) - 26px);
  top: calc(50% + 108px * sin(var(--i) * 72deg - 90deg) - 26px);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
}
.orbit-ele.hov { transform: scale(1.28); box-shadow: 0 0 22px currentColor; z-index: 2; }
.wheel-arrows { position: absolute; inset: 0; pointer-events: none; }
.arc-s { fill: none; stroke: rgba(232, 196, 115, 0.65); stroke-width: 1.6; stroke-dasharray: 5 4; animation: dashmove 1.6s linear infinite; }
.arc-k { fill: none; stroke: rgba(248, 113, 113, 0.5); stroke-width: 1.2; stroke-dasharray: 3 5; animation: dashmove 2.2s linear infinite reverse; }
@keyframes dashmove { to { stroke-dashoffset: -18; } }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 26px; }
.stat-card { padding: 16px; text-align: center; }
.stat-label { color: var(--fg); font-size: 0.85rem; margin: 6px 0 4px; }

.modules { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 20px; }
.module-card { cursor: pointer; position: relative; display: block; color: var(--fg); }
.module-card:hover { text-decoration: none; }
.m-glyph { font-size: 1.7rem; margin-bottom: 8px; }
.m-title { font-family: var(--cute); color: var(--gold-bright); font-size: 1.08rem; margin-bottom: 7px; }
.m-go { position: absolute; right: 16px; bottom: 12px; color: var(--teal); font-size: 0.78rem; opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease; transform: translateX(-6px); }
.module-card:hover .m-go { opacity: 1; transform: none; }

.center-note { text-align: center; margin-top: 8px; }

@media (max-width: 800px) {
  .hero { flex-direction: column; }
  .hero-wheel { transform: scale(0.82); }
  .play-grid { grid-template-columns: 1fr; }
}
</style>
