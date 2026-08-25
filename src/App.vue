<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import PixelSage from './components/PixelSage.vue'
import { isSoundOn, sfx, toggleSound } from './lib/sfx'
import { THEMES, applyTheme, initTheme } from './data/themes'

const soundOn = ref(isSoundOn())

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

const NAV = [
  { to: '/', label: '首页', glyph: '☯' },
  { to: '/chart', label: '排盘评分', glyph: '🀄' },
  { to: '/ziwei', label: '紫微命盘', glyph: '✷' },
  { to: '/wuxing', label: '五行天穹', glyph: '🌌' },
  { to: '/liuyao', label: '六爻问卦', glyph: '⚱' },
  { to: '/oracle', label: '轻卜抽签', glyph: '❀' },
  { to: '/classics', label: '典籍语料', glyph: '📜' },
  { to: '/geju', label: '格局辞典', glyph: '⚔' },
  { to: '/rules', label: '规则库', glyph: '⚖' },
  { to: '/cases', label: '案例库', glyph: '🗂' },
  { to: '/sages', label: '道长图鉴', glyph: '⛩' },
]

const ROUTE_SAGE: Record<string, string> = {
  '/': 'qingxuan',
  '/chart': 'danxia',
  '/ziwei': 'xinglan',
  '/wuxing': 'suwen',
  '/liuyao': 'lingshi',
  '/oracle': 'meixue',
  '/classics': 'yunji',
  '/geju': 'shuanghua',
  '/rules': 'shouzhuo',
  '/cases': 'shiyi',
  '/sages': 'qingxuan',
}

const route = useRoute()
const sageChar = computed(() => ROUTE_SAGE[route.path] ?? 'qingxuan')

const TRAILS: Record<string, string[]> = {
  xuan: ['☯', '✦', '⋆', '·'],
  yue: ['❄', '✧', '·', '◦'],
  zhu: ['符', '✦', '火', '·'],
  shui: ['墨', '〰', '·', '山'],
  zi: ['✷', '⋆', '✦', '·'],
  qing: ['梅', '✿', '·', '雨'],
}
const trailGlyphs = computed(() => TRAILS[document.documentElement.dataset.theme ?? 'xuan'] ?? TRAILS.xuan!)

const showThemes = ref(false)
const activeTheme = ref('xuan')

function pickTheme(id: string): void {
  activeTheme.value = id
  applyTheme(id)
  sfx.pop()
}

let lastTrail = 0
let trailCount = 0

function onMouseMove(e: MouseEvent): void {
  const now = performance.now()
  if (now - lastTrail < 55 || trailCount > 26) return
  lastTrail = now
  const glyphs = trailGlyphs.value
  const el = document.createElement('span')
  el.className = 'cursor-trail'
  el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)]
  el.style.left = `${e.clientX + (Math.random() - 0.5) * 14}px`
  el.style.top = `${e.clientY + (Math.random() - 0.5) * 14}px`
  document.body.appendChild(el)
  trailCount++
  window.setTimeout(() => {
    el.remove()
    trailCount--
  }, 620)

  document.documentElement.style.setProperty('--par-x', ((e.clientX / window.innerWidth) - 0.5).toFixed(3))
  document.documentElement.style.setProperty('--par-y', ((e.clientY / window.innerHeight) - 0.5).toFixed(3))
}

let starTimer: number | null = null
function scheduleShootingStar(): void {
  starTimer = window.setTimeout(() => {
    spawnShootingStar()
    scheduleShootingStar()
  }, 7000 + Math.random() * 8000)
}
function spawnShootingStar(): void {
  const el = document.createElement('span')
  el.className = 'shooting-star'
  el.style.left = `${-60 + Math.random() * 40}vw`
  el.style.top = `${5 + Math.random() * 35}vh`
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 1300)
}

function onDocClick(e: MouseEvent): void {
  const t = e.target as HTMLElement | null
  if (showThemes.value && t && !t.closest('.theme-pop') && !t.closest('.theme-btn')) showThemes.value = false
}

onMounted(() => {
  activeTheme.value = initTheme()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('click', onDocClick)
  scheduleShootingStar()
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('click', onDocClick)
  if (starTimer !== null) window.clearTimeout(starTimer)
})
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand" @click="sfx.blip()">
      <span class="logo">☯</span>
      <span class="name">命理天工<small>八字量化研究</small></span>
    </RouterLink>
    <nav class="nav">
      <RouterLink v-for="n in NAV" :key="n.to" :to="n.to" class="nav-link" @click="sfx.blip()">
        <span class="glyph">{{ n.glyph }}</span>{{ n.label }}
      </RouterLink>
    </nav>
    <div class="top-actions">
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
    开源研究项目 · 规则与权重全部公开 · 引擎与 Python 版自检对齐 · 内容仅供传统文化研究与娱乐，不构成人生建议
  </footer>

  <PixelSage :key="sageChar" :char="sageChar" />
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 20px;
  background: var(--topbar-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 9px; color: var(--fg); }
.brand:hover { text-decoration: none; }
.logo { font-size: 1.5rem; filter: drop-shadow(0 0 8px rgba(var(--acc-rgb), 0.7)); animation: spin-slow 14s linear infinite; }
@keyframes spin-slow { to { transform: rotate(360deg); } }
.name { font-family: var(--cute); font-size: 1.12rem; color: var(--gold-bright); line-height: 1.05; display: flex; flex-direction: column; }
.name small { font-size: 0.62rem; color: var(--dim); letter-spacing: 0.35em; }

.nav { display: flex; gap: 2px; flex: 1; overflow-x: auto; scrollbar-width: none; }
.nav::-webkit-scrollbar { display: none; }
.nav-link {
  white-space: nowrap;
  color: var(--dim);
  font-size: 0.86rem;
  padding: 7px 11px;
  border-radius: 9px;
  transition: all 0.2s ease;
}
.nav-link:hover { color: var(--gold-bright); background: rgba(var(--acc-rgb), 0.07); text-decoration: none; }
.nav-link.router-link-exact-active { color: var(--on-accent); background: linear-gradient(140deg, var(--gold), color-mix(in srgb, var(--gold) 72%, #000)); font-weight: bold; }
.nav-link .glyph { margin-right: 4px; font-size: 0.78rem; }

.top-actions { display: flex; gap: 6px; align-items: center; }
.snd, .theme-btn { padding: 7px 11px; border-radius: 9px; }

.theme-wrap { position: relative; }
.theme-pop {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 250px;
  padding: 12px;
  z-index: 1200;
  margin-bottom: 0;
}
.tp-title { font-family: var(--cute); color: var(--gold); font-size: 0.85rem; margin-bottom: 8px; }
.tp-item {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 10px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  margin-bottom: 6px;
  color: var(--fg);
  font-weight: normal;
  font-family: inherit;
}
.tp-item:last-child { margin-bottom: 0; }
.tp-item:hover { border-color: rgba(var(--acc-rgb), 0.5); transform: none; filter: none; }
.tp-item.on { border-color: var(--gold); box-shadow: inset 0 0 0 1px rgba(var(--acc-rgb), 0.4); }
.swatches { grid-row: span 2; align-self: center; display: flex; flex-direction: column; gap: 3px; }
.swatches i { width: 16px; height: 8px; border-radius: 3px; border: 1px solid rgba(127, 127, 127, 0.25); }
.tp-name { font-family: var(--cute); font-size: 0.86rem; }
.tp-note { grid-column: 2; font-size: 0.68rem; color: var(--dim); }

.pop-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.96); }

.footer {
  text-align: center;
  color: var(--dim);
  font-size: 0.72rem;
  padding: 30px 16px 90px;
}

@media (max-width: 860px) {
  .topbar { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
  .nav { order: 3; width: 100%; }
  .name small { display: none; }
  .theme-pop { right: -60px; }
}
</style>
