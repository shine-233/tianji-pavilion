<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import PixelSage from './components/PixelSage.vue'
import Palette from './components/Palette.vue'
import TransitionVeil from './components/TransitionVeil.vue'
import TalismanEgg from './components/TalismanEgg.vue'
import BackToTop from './components/BackToTop.vue'
import ScrollProgress from './components/ScrollProgress.vue'
// 极光后处理很重，按需异步加载：触屏/省电用户不掏这份流量
const AuroraBloom = defineAsyncComponent(() => import('./components/AuroraBloom.vue'))
import { isSoundOn, sfx, toggleSound } from './lib/sfx'
import { THEMES, applyTheme, initTheme, themeId } from './data/themes'
import ThemeDecor from './components/ThemeDecor.vue'
import { buildTaoess, TAOESS_IDS } from './data/sageSprite'

const soundOn = ref(isSoundOn())

/* 双击山门 logo：符箓雨 */
const talisman = ref<InstanceType<typeof TalismanEgg> | null>(null)
function onBrandDblClick(): void {
  talisman.value?.rain()
}

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

/* 皮肤选择 */
const showThemes = ref(false)
const activeTheme = themeId
function pickTheme(id: string): void {
  applyTheme(id)
  sfx.toggle()
}
function onDocClick(e: MouseEvent): void {
  const t = e.target as HTMLElement | null
  if (!t?.closest('.theme-wrap')) showThemes.value = false
}



const route = useRoute()

/** 导航四簇：算（排盘问命）/ 占（每日速占）/ 游（互动体验）/ 藏（资料库） */
const NAV_GROUPS: Array<{ label: string; items: Array<{ to: string; label: string; glyph: string }> }> = [
  {
    label: '算',
    items: [
      { to: '/chart', label: '八字排盘', glyph: '八' },
      { to: '/ziwei', label: '紫微命盘', glyph: '紫' },
      { to: '/liuyao', label: '六爻纳甲', glyph: '爻' },
      { to: '/meihua', label: '梅花易数', glyph: '梅' },
      { to: '/shuzi', label: '数字能量', glyph: '数' },
    ],
  },
  {
    label: '占',
    items: [
      { to: '/daily', label: '每日一签', glyph: '签' },
      { to: '/almanac', label: '今日黄历', glyph: '历' },
      { to: '/xiaoliuren', label: '小六壬', glyph: '掌' },
      { to: '/jiaobei', label: '杯筊问事', glyph: '筊' },
    ],
  },
  {
    label: '游',
    items: [
      { to: '/wuxing', label: '五行天穹', glyph: '五' },
      { to: '/yanyi', label: '演易', glyph: '䷀' },
      { to: '/story', label: '易道长卷', glyph: '卷' },
      { to: '/qimen', label: '奇门入门', glyph: '奇' },
      { to: '/map', label: '道观地图', glyph: '观' },
      { to: '/sages', label: '道长图鉴', glyph: '鉴' },
      { to: '/memory', label: '卦象记忆', glyph: '忆' },
    ],
  },
]

const ROUTE_SAGE: Record<string, string> = {
  '/': 'qingxuan',
  '/chart': 'danxia',
  '/ziwei': 'xinglan',
  '/wuxing': 'suwen',
  '/liuyao': 'lingshi',
  '/meihua': 'lingshi',
  '/daily': 'meixue',
  '/almanac': 'yunji',
  '/oracle': 'meixue',
  '/xiaoliuren': 'meixue',
  '/classics': 'yunji',
  '/geju': 'shuanghua',
  '/rules': 'shouzhuo',
  '/cases': 'shiyi',
  '/sages': 'qingxuan',
  '/memory': 'lingshi',
}
const sageChar = computed(() => ROUTE_SAGE[route.path] ?? 'qingxuan')

/** 切页轻响，让导航有"翻页"的实感 */
watch(() => route.path, () => sfx.tick())

let lastTrail = 0
let trailCount = 0
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')

/* 一炷香：滚动进度 */
const incensePct = ref(0)
function onScroll(): void {
  const h = document.documentElement
  const max = h.scrollHeight - h.clientHeight
  incensePct.value = max > 4 ? Math.min(100, Math.max(0, (h.scrollTop / max) * 100)) : 0
}

/* 光标伴飞环 */
const ringX = ref(-80)
const ringY = ref(-80)
const ringHot = ref(false)
let rx = -80
let ry = -80
let tx = -80
let ty = -80
let rafId = 0
function ringLoop(): void {
  rx += (tx - rx) * 0.16
  ry += (ty - ry) * 0.16
  ringX.value = rx
  ringY.value = ry
  rafId = requestAnimationFrame(ringLoop)
}

/* 连点 logo：道长巡游 */
const brandClicks = ref(0)
const paraders = ref<Array<{ key: number; char: string; dur: number; delay: number; bobDur: number }>>([])
let paradeTimer: number | null = null
let clickReset: number | null = null

function onBrandClick(): void {
  sfx.blip()
  brandClicks.value++
  if (clickReset !== null) window.clearTimeout(clickReset)
  clickReset = window.setTimeout(() => (brandClicks.value = 0), 2400)
  if (brandClicks.value >= 7) {
    brandClicks.value = 0
    startParade()
  }
}

function startParade(): void {
  sfx.gong()
  const base = Date.now()
  paraders.value = TAOESS_IDS.map((c, i) => ({
    key: base + i,
    char: c,
    dur: 12 + Math.random() * 5,
    delay: i * 1.05,
    bobDur: 0.5 + Math.random() * 0.35,
  }))
  if (paradeTimer !== null) window.clearTimeout(paradeTimer)
  paradeTimer = window.setTimeout(() => (paraders.value = []), 20000)
}

function onMouseMove(e: MouseEvent): void {
  document.documentElement.style.setProperty('--par-x', ((e.clientX / window.innerWidth) - 0.5).toFixed(3))
  document.documentElement.style.setProperty('--par-y', ((e.clientY / window.innerHeight) - 0.5).toFixed(3))
  if (prefersReduced.matches) return
  const now = performance.now()
  tx = e.clientX
  ty = e.clientY
  const t = e.target as HTMLElement | null
  ringHot.value = !!t?.closest('a, button, input, select, .tag, .lib-card')
  if (now - lastTrail < 55 || trailCount > 26) return
  lastTrail = now
  const el = document.createElement('span')
  el.className = 'cursor-trail'
  el.textContent = ['☯', '✦', '⋆', '·'][Math.floor(Math.random() * 4)]
  el.style.left = `${e.clientX + (Math.random() - 0.5) * 14}px`
  el.style.top = `${e.clientY + (Math.random() - 0.5) * 14}px`
  document.body.appendChild(el)
  trailCount++
  window.setTimeout(() => {
    el.remove()
    trailCount--
  }, 620)
}

let starTimer: number | null = null
function scheduleShootingStar(): void {
  starTimer = window.setTimeout(() => {
    spawnShootingStar()
    scheduleShootingStar()
  }, 7000 + Math.random() * 8000)
}
function spawnShootingStar(): void {
  if (prefersReduced.matches) return
  const el = document.createElement('span')
  el.className = 'shooting-star'
  el.style.left = `${-60 + Math.random() * 40}vw`
  el.style.top = `${5 + Math.random() * 35}vh`
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 1300)
}

/** 粗指针设备（手机/平板）：光标拖尾、伴飞环、视差变量都是鼠标专属，触屏上一律不装 */
const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/* 极光背景按需点亮：省流量，也让首屏更快 */
const bloomReady = ref(false)

onMounted(() => {
  initTheme()
  if (!coarsePointer) {
    window.addEventListener('mousemove', onMouseMove)
    rafId = requestAnimationFrame(ringLoop)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('click', onDocClick)
  onScroll()
  scheduleShootingStar()
  if (!prefersReduced.matches && !coarsePointer) {
    window.setTimeout(() => (bloomReady.value = true), 500)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('click', onDocClick)
  cancelAnimationFrame(rafId)
  if (starTimer !== null) window.clearTimeout(starTimer)
  if (paradeTimer !== null) window.clearTimeout(paradeTimer)
  if (clickReset !== null) window.clearTimeout(clickReset)
})
</script>

<template>
  <ScrollProgress />
  <AuroraBloom v-if="bloomReady" />
  <div class="grain" aria-hidden="true"></div>
  <header class="topbar">
    <RouterLink to="/" class="brand" @click="onBrandClick()" @dblclick.prevent="onBrandDblClick()">
      <span class="logo" :class="{ wiggle: brandClicks > 0 }">☯</span>
      <span class="name">命理天工<small>八字量化研究</small></span>
    </RouterLink>
    <nav class="nav">
      <RouterLink to="/" class="nav-link home-link" :class="{ 'router-link-exact-active': route.path === '/' }" @click="sfx.blip()">
        <span class="glyph">☯</span>山门
      </RouterLink>
      <div v-for="g in NAV_GROUPS" :key="g.label" class="nav-group">
        <i class="group-cap">{{ g.label }}</i>
        <RouterLink
          v-for="n in g.items" :key="n.to" :to="n.to" class="nav-link"
          :class="{ fresh: route.path === n.to && ['/liuyao','/meihua','/daily','/almanac','/settings'].includes(n.to) }"
          @click="sfx.blip()"
        >
          <span class="glyph">{{ n.glyph }}</span>{{ n.label }}
        </RouterLink>
      </div>
    </nav>
    <div class="top-actions">
    <Palette />
      <div class="theme-wrap">
        <button class="ghost theme-btn" title="换一套皮肤" @click.stop="showThemes = !showThemes; sfx.toggle()">🎨</button>
        <transition name="pop">
          <div v-if="showThemes" class="theme-pop card">
            <div class="tp-title">挑一件道袍</div>
            <button
              v-for="t in THEMES" :key="t.id"
              class="tp-item" :class="{ on: t.id === activeTheme }"
              @click="pickTheme(t.id)"
            >
              <span class="swatches">
                <i :style="{ background: t.swatch[0] }"></i>
                <i :style="{ background: t.swatch[1] }"></i>
                <i :style="{ background: t.swatch[2] }"></i>
              </span>
              <span class="tp-name">{{ t.nameCn }}</span>
              <span class="tp-note">{{ t.note }}</span>
            </button>
          </div>
        </transition>
      </div>
      <button class="ghost snd" :title="soundOn ? '关闭音效' : '开启音效'" @click="onToggleSound">{{ soundOn ? '🔊' : '🔇' }}</button>
    </div>
  </header>

  <RouterView v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>

  <footer class="footer">
    规则全部公开，欢迎挑错 · 断语仅供把玩参考，大事请多商量 · 数据不出你的浏览器
  </footer>

  <ThemeDecor :theme="activeTheme" />

  <TransitionVeil />

  
  <!-- 一炷香：滚动进度 -->
  <div class="incense" aria-hidden="true">
    <div class="incense-ash"></div>
    <div class="incense-stick" :style="{ height: `${incensePct}%` }">
      <span class="incense-tip"><i></i></span>
    </div>
  </div>

  <!-- 光标伴飞环 -->
  <div
    class="cursor-ring"
    :class="{ hot: ringHot }"
    :style="{ transform: `translate3d(${ringX - 14}px, ${ringY - 14}px, 0)` }"
    aria-hidden="true"
  ></div>

  <!-- 道长巡游 -->
  <div v-if="paraders.length" class="parade" aria-hidden="true">
    <span
      v-for="p in paraders" :key="p.key"
      class="parader"
      :style="{ '--dur': `${p.dur}s`, '--delay': `${p.delay}s`, '--bob': `${p.bobDur}s` }"
    >
<svg viewBox="0 0 26 29">
<rect v-for="(px, i) in buildTaoess(p.char)" :key="i" :x="px.x + 0.06" :y="px.y + 0.06" width="0.88" height="0.88" rx="0.22" :fill="px.fill" :opacity="(px.op ?? 1) * (0.93 + ((px.x * 7 + px.y * 13) % 5) * 0.0175)" />
      </svg>
      <i>{{ (TAOESS_IDS.indexOf(p.char) + 1) }}</i>
    </span>
  </div>

  <PixelSage :key="sageChar" :char="sageChar" />
  <BackToTop />
  <TalismanEgg ref="talisman" />
</template>

<style scoped>
/* 胶片噪点：给整站一层纸感/颗粒质感（不拦截交互，低透明度） */
.grain {
  position: fixed;
  inset: -50%;
  z-index: 1400;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain-shift 1.1s steps(4) infinite;
}
@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-2%, 1.4%); }
  50% { transform: translate(1.6%, -1%); }
  75% { transform: translate(-1%, -1.8%); }
  100% { transform: translate(0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .grain { animation: none; }
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: calc(10px + env(safe-area-inset-top)) calc(20px + env(safe-area-inset-right)) 10px calc(20px + env(safe-area-inset-left));
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 9px; color: var(--fg); }
.brand:hover { text-decoration: none; }
.logo { font-size: 1.5rem; filter: drop-shadow(0 0 8px var(--glow)); animation: spin-slow 14s linear infinite; }
@keyframes spin-slow { to { transform: rotate(360deg); } }
.name { font-family: var(--cute); font-size: 1.12rem; color: var(--gold-bright); line-height: 1.05; display: flex; flex-direction: column; }
.name small { font-size: 0.62rem; color: var(--dim); letter-spacing: 0.35em; }

.nav { display: flex; gap: 4px; flex: 1; overflow-x: auto; scrollbar-width: none; align-items: center; }
.nav::-webkit-scrollbar { display: none; }
.nav-group {
  display: flex; align-items: center; gap: 2px;
  padding: 2px 8px 2px 6px;
  border-right: 1px solid var(--line);
}
.group-cap {
  font-style: normal;
  font-family: var(--cute);
  font-size: 0.72rem;
  color: var(--dim);
  opacity: 0.85;
  margin-right: 3px;
  padding: 1px 5px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(var(--acc-rgb), 0.05);
}
.nav-link {
  white-space: nowrap;
  color: var(--dim);
  font-size: 0.86rem;
  padding: 7px 11px;
  border-radius: 9px;
  transition: all 0.2s ease;
}
.nav-link:hover { color: var(--gold-bright); background: rgba(232, 196, 115, 0.07); text-decoration: none; }
.nav-link.router-link-exact-active { color: var(--btn-ink); background: linear-gradient(140deg, var(--btn-a), var(--btn-b)); font-weight: bold; }
.nav-link .glyph {
  margin-right: 5px;
  font-size: 0.68rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35em;
  height: 1.35em;
  border: 1px solid rgba(var(--acc-rgb), 0.4);
  border-radius: 4px;
  color: var(--gold);
  line-height: 1;
}

.tools { display: flex; gap: 6px; }
.snd { padding: 7px 11px; border-radius: 9px; }

.footer {
  text-align: center;
  color: var(--dim);
  font-size: 0.72rem;
  padding: 30px 16px 90px;
}

.logo.wiggle { animation: logo-wiggle 0.3s ease-in-out infinite; }
@keyframes logo-wiggle {
  0%, 100% { transform: rotate(-9deg) scale(1.06); }
  50% { transform: rotate(9deg) scale(1.14); }
}

/* 一炷香 */
.incense {
  position: fixed;
  right: 7px;
  top: 50%;
  height: 200px;
  width: 5px;
  transform: translateY(-50%);
  z-index: 850;
  border-radius: 3px;
  background: rgba(127, 127, 127, 0.12);
  overflow: visible;
}
.incense-stick {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  border-radius: 3px;
  background: linear-gradient(180deg, #8a5a3b, #6e4428);
  transition: height 0.28s ease;
}
.incense-tip {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 7px;
}
.incense-tip i {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, #ffd76e 20%, #ff7a3c 55%, transparent 75%);
  box-shadow: 0 0 10px 2px rgba(255, 150, 60, 0.75);
  animation: ember-pulse 1.5s ease-in-out infinite;
}
.incense-tip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  width: 2px;
  height: 26px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, rgba(180, 180, 190, 0.35));
  filter: blur(1.5px);
  animation: smoke-rise 2.8s linear infinite;
}
@keyframes ember-pulse {
  50% { box-shadow: 0 0 16px 4px rgba(255, 150, 60, 0.95); }
}
@keyframes smoke-rise {
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  25% { opacity: 1; }
  to { opacity: 0; transform: translateX(-70%) translateY(-18px); }
}
@media (max-width: 900px) { .incense { display: none; } }

/* 光标伴飞环 */
.cursor-ring {
  position: fixed;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--acc-rgb), 0.65);
  box-shadow: 0 0 12px rgba(var(--acc-rgb), 0.25), inset 0 0 8px rgba(var(--acc-rgb), 0.12);
  pointer-events: none;
  z-index: 2050;
  transition: width 0.18s ease, height 0.18s ease, border-color 0.18s ease;
}
.cursor-ring.hot {
  width: 40px;
  height: 40px;
  border-color: rgba(var(--acc2-rgb), 0.85);
}
@media (pointer: coarse) { .cursor-ring { display: none; } }

/* 道长巡游 */
.parade {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 6px;
  height: 120px;
  z-index: 1400;
  pointer-events: none;
  overflow: hidden;
}
.parader {
  position: absolute;
  bottom: -6px;
  left: -90px;
  animation: parade-march var(--dur) linear var(--delay) both;
}
.parader svg {
  width: 64px;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
  animation: parade-bob var(--bob) ease-in-out infinite alternate;
  transform-origin: 50% 100%;
}
.parader i {
  position: absolute;
  top: -4px;
  right: -6px;
  font-style: normal;
  font-family: var(--cute);
  font-size: 0.62rem;
  color: var(--gold-bright);
  text-shadow: 0 0 8px rgba(var(--acc-rgb), 0.8);
}
@keyframes parade-march {
  from { left: -90px; }
  to { left: calc(100vw + 40px); }
}
@keyframes parade-bob {
  from { transform: rotate(-4deg) scaleY(1); }
  to { transform: rotate(4deg) scaleY(0.97); }
}

@media (max-width: 900px) {
  .topbar { flex-wrap: wrap; gap: 8px; padding: calc(8px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 8px calc(12px + env(safe-area-inset-left)); }
  .nav { order: 3; width: 100%; }
  .name small { display: none; }
  .corner-maiden { width: 96px !important; }
}
</style>
