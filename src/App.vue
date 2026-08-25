<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PixelSage from './components/PixelSage.vue'
import { isSoundOn, sfx, toggleSound } from './lib/sfx'

const soundOn = ref(isSoundOn())

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

const NAV = [
  { to: '/', label: '首页', glyph: '☯' },
  { to: '/chart', label: '排盘评分', glyph: '🀄' },
  { to: '/ziwei', label: '紫微命盘', glyph: '✷' },
  { to: '/wuxing', label: '五行天穹', glyph: '🌌' },
  { to: '/classics', label: '典籍语料', glyph: '📜' },
  { to: '/geju', label: '格局辞典', glyph: '⚔' },
  { to: '/rules', label: '规则库', glyph: '⚖' },
  { to: '/cases', label: '案例库', glyph: '🗂' },
]

let lastTrail = 0
let trailCount = 0

function onMouseMove(e: MouseEvent): void {
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
      <span class="name">命理天工<small>八字量化研究</small></span>
    </RouterLink>
    <nav class="nav">
      <RouterLink v-for="n in NAV" :key="n.to" :to="n.to" class="nav-link" @click="sfx.blip()">
        <span class="glyph">{{ n.glyph }}</span>{{ n.label }}
      </RouterLink>
    </nav>
    <button class="ghost snd" :title="soundOn ? '关闭音效' : '开启音效'" @click="onToggleSound">{{ soundOn ? '🔊' : '🔇' }}</button>
  </header>

  <RouterView v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>

  <footer class="footer">
    开源研究项目 · 全部规则公开可审计 · 引擎 v5 与 Python 版自检对齐 · 仅供传统文化研究与娱乐参考，不构成任何人生建议
  </footer>

  <PixelSage />
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
  background: rgba(11, 13, 18, 0.82);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 9px; color: var(--fg); }
.brand:hover { text-decoration: none; }
.logo { font-size: 1.5rem; filter: drop-shadow(0 0 8px rgba(232, 196, 115, 0.7)); animation: spin-slow 14s linear infinite; }
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
.nav-link.router-link-exact-active { color: #201804; background: linear-gradient(140deg, var(--gold), #caa14f); font-weight: bold; }
.nav-link .glyph { margin-right: 4px; font-size: 0.78rem; }

.snd { padding: 7px 11px; border-radius: 9px; }

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
}
</style>
