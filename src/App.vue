<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import TaoistMaiden from './components/TaoistMaiden.vue'
import { isSoundOn, sfx, toggleSound } from './lib/sfx'
import { currentThemeId, applyTheme, THEMES } from './lib/themes'

const soundOn = ref(isSoundOn())

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

function cycleTheme(): void {
  const ids = THEMES.map((t) => t.id)
  const next = ids[(ids.indexOf(currentThemeId()) + 1) % ids.length]
  applyTheme(next)
}

const NAV = [
  { to: '/', label: '山门', glyph: '☯' },
  { to: '/chart', label: '八字排盘', glyph: '🀄' },
  { to: '/ziwei', label: '紫微命盘', glyph: '✷' },
  { to: '/liuyao', label: '六爻纳甲', glyph: '🪙' },
  { to: '/meihua', label: '梅花易数', glyph: '❄' },
  { to: '/daily', label: '每日一签', glyph: '🎋' },
  { to: '/almanac', label: '今日黄历', glyph: '📅' },
  { to: '/wuxing', label: '五行天穹', glyph: '🌌' },
  { to: '/classics', label: '典籍语料', glyph: '📜' },
  { to: '/geju', label: '格局辞典', glyph: '⚔' },
  { to: '/rules', label: '规则库', glyph: '⚖' },
  { to: '/cases', label: '案例库', glyph: '🗂' },
  { to: '/oracle', label: '轻卜抽签', glyph: '❀' },
  { to: '/sages', label: '道长图鉴', glyph: '⛩' },
  { to: '/settings', label: '设置', glyph: '👘' },
]

const route = useRoute()

const MAIDEN_TIPS = [
  '云鹤观今天也平安。香火是虚拟的，清净是真的。',
  '摇卦之前先把问题想清楚，卦才答得明白。',
  '子时不算，这是老祖宗留的温柔。',
  '我师姐妹六个，各有各的差事，见着谁就问谁。',
  '《三命通会》我又翻了一遍，还是有新东西。',
  '别一天算八遍，命不会更准，心会更乱。',
  '黄历上的「忌」字看看就好，真要紧的事哪天都能做。',
]

let lastTrail = 0
let trailCount = 0
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')

function onMouseMove(e: MouseEvent): void {
  document.documentElement.style.setProperty('--par-x', ((e.clientX / window.innerWidth) - 0.5).toFixed(3))
  document.documentElement.style.setProperty('--par-y', ((e.clientY / window.innerHeight) - 0.5).toFixed(3))
  if (prefersReduced.matches) return
  const now = performance.now()
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

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  scheduleShootingStar()
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  if (starTimer !== null) window.clearTimeout(starTimer)
})
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand" @click="sfx.blip()">
      <span class="logo">☯</span>
      <span class="name">云鹤观<small>命理案头研究所</small></span>
    </RouterLink>
    <nav class="nav">
      <RouterLink v-for="n in NAV" :key="n.to" :to="n.to" class="nav-link" :class="{ fresh: route.path === n.to && ['/liuyao','/meihua','/daily','/almanac','/settings'].includes(n.to) }" @click="sfx.blip()">
        <span class="glyph">{{ n.glyph }}</span>{{ n.label }}
      </RouterLink>
    </nav>
    <div class="tools">
      <button class="ghost snd" title="换一套主题（设置里可以慢慢挑）" @click="cycleTheme">👘</button>
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

  <TaoistMaiden variant="xuanwei" :width="140" class="corner-maiden" :tips="MAIDEN_TIPS" />
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
.nav-link:hover { color: var(--gold-bright); background: rgba(232, 196, 115, 0.07); text-decoration: none; }
.nav-link.router-link-exact-active { color: var(--btn-ink); background: linear-gradient(140deg, var(--btn-a), var(--btn-b)); font-weight: bold; }
.nav-link .glyph { margin-right: 4px; font-size: 0.78rem; }

.tools { display: flex; gap: 6px; }
.snd { padding: 7px 11px; border-radius: 9px; }

.footer {
  text-align: center;
  color: var(--dim);
  font-size: 0.72rem;
  padding: 30px 16px 90px;
}

.corner-maiden {
  position: fixed;
  right: max(12px, env(safe-area-inset-right));
  bottom: 8px;
  z-index: 800;
}

@media (max-width: 860px) {
  .topbar { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
  .nav { order: 3; width: 100%; }
  .name small { display: none; }
  .corner-maiden { width: 96px !important; }
}
</style>
