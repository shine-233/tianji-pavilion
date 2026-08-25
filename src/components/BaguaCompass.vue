<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'

/** 可拖拽旋转的八卦罗盘：松手带惯性，吸附卦位并显示该卦断辞 */

interface Gua {
  name: string
  symbol: string
  nature: string
  verdict: string
}

const GUAS: Gua[] = [
  { name: '乾', symbol: '☰', nature: '天 · 刚健', verdict: '天行健。乾者健也——宜自强不息，谋事在己不在人。' },
  { name: '兑', symbol: '☱', nature: '泽 · 悦', verdict: '丽泽相滋。兑为口舌亦为喜悦，言谈之间自有生机。' },
  { name: '离', symbol: '☲', nature: '火 · 明', verdict: '明两作，离。光明相续之象，文书喜事近而不远。' },
  { name: '震', symbol: '☳', nature: '雷 · 动', verdict: '洊雷，震。变动将起，君子恐惧修省则无咎。' },
  { name: '巽', symbol: '☴', nature: '风 · 入', verdict: '随风，巽。柔顺渗透之事可成，急进反覆无功。' },
  { name: '坎', symbol: '☵', nature: '水 · 险', verdict: '洊至，坎。水流而不盈，险中求信，守正方吉。' },
  { name: '艮', symbol: '☶', nature: '山 · 止', verdict: '兼山，艮。时止则止，时行则行，动静不失其时。' },
  { name: '坤', symbol: '☷', nature: '地 · 顺', verdict: '地势坤。厚德载物，以柔济刚，后发而得大利。' },
]

const angle = ref(-90)
const dragging = ref(false)
const settled = ref<number | null>(null)

let lastX = 0
let vel = 0
let raf = 0
let idleRaf = 0

function norm(a: number): number {
  return ((a % 360) + 360) % 360
}

const idx = computed(() => {
  const a = norm(angle.value + 90 + 22.5)
  return Math.floor(a / 45) % 8
})

function settle(): void {
  const target = (idx.value * 45 + -90 - 22.5 + 360 * 2) % 360
  const from = angle.value
  let delta = target - from
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  const t0 = performance.now()
  cancelAnimationFrame(raf)
  const step = (t: number): void => {
    const k = Math.min(1, (t - t0) / 420)
    const e = 1 - Math.pow(1 - k, 3)
    angle.value = from + delta * e
    if (k < 1) raf = requestAnimationFrame(step)
    else {
      settled.value = idx.value
      sfx.ding()
    }
  }
  raf = requestAnimationFrame(step)
}

function idleSpin(t: number): void {
  if (!dragging.value && settled.value === null) {
    angle.value += 0.02 + Math.sin(t / 2400) * 0.015
  }
  idleRaf = requestAnimationFrame(idleSpin)
}

function down(e: PointerEvent): void {
  dragging.value = true
  settled.value = null
  cancelAnimationFrame(raf)
  lastX = e.clientX
  ;(e.target as Element).setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent): void {
  if (!dragging.value) return
  const dx = e.clientX - lastX
  lastX = e.clientX
  vel = dx
  angle.value += dx * 0.35
  if (Math.random() < 0.12) sfx.tick()
}
function up(): void {
  if (!dragging.value) return
  dragging.value = false
  angle.value += vel * 9
  window.setTimeout(settle, 30)
}

onMounted(() => {
  idleRaf = requestAnimationFrame(idleSpin)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(idleRaf)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="compass-wrap">
    <div class="hint note">按住拖转 · 松手听签</div>
    <div class="ring-outer" :class="{ grabbing: dragging }">
      <svg viewBox="0 0 320 320" class="dial">
        <circle cx="160" cy="160" r="152" fill="none" stroke="rgba(232,196,115,0.16)" />
        <circle cx="160" cy="160" r="128" fill="none" stroke="rgba(232,196,115,0.28)" stroke-dasharray="3 6" />
        <g v-for="n in 24" :key="n" class="tick-g">
          <line
            x1="160" y1="10" x2="160"
            :y2="n % 6 === 0 ? 26 : 18"
            :stroke="n % 6 === 0 ? 'rgba(232,196,115,0.7)' : 'rgba(139,147,167,0.4)'"
            :stroke-width="n % 6 === 0 ? 2 : 1"
            :transform="`rotate(${(n - 1) * 15} 160 160)`"
          />
        </g>
      </svg>
      <div class="gua-ring" :style="{ transform: `rotate(${angle}deg)` }">
        <button
          v-for="(g, i) in GUAS" :key="g.name"
          class="gua" :class="{ lit: settled === i }"
          :style="{ '--a': `${i * 45}deg` }"
          @click="settled = i; sfx.blip()"
        >
          <b>{{ g.symbol }}</b>
          <span>{{ g.name }}</span>
        </button>
      </div>
      <div class="core" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
        ☯
      </div>
    </div>
    <transition name="verdict-pop">
      <div v-if="settled !== null" class="verdict card">
        <span class="v-name">{{ GUAS[settled]!.symbol }} {{ GUAS[settled]!.name }}</span>
        <span class="tag gold">{{ GUAS[settled]!.nature }}</span>
        <p class="sub">{{ GUAS[settled]!.verdict }}</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.compass-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; user-select: none; }
.hint { letter-spacing: 0.25em; padding-left: 0.25em; }

.ring-outer { position: relative; width: 300px; height: 300px; cursor: grab; touch-action: pan-y; }
.ring-outer.grabbing { cursor: grabbing; }
.dial { position: absolute; inset: 0; pointer-events: none; }

.gua-ring { position: absolute; inset: 0; transition: none; }
.ring-outer:not(.grabbing) .gua-ring { transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1); }

.gua {
  position: absolute;
  left: calc(50% + 118px * cos(var(--a) - 90deg) - 27px);
  top: calc(50% + 118px * sin(var(--a) - 90deg) - 27px);
  width: 54px; height: 54px;
  border-radius: 50%;
  border: 1px solid rgba(232, 196, 115, 0.3);
  background: radial-gradient(closest-side, var(--card-2), var(--panel));
  color: var(--fg);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: inherit;
  cursor: pointer;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.gua b { font-size: 1.15rem; line-height: 1.1; color: var(--gold-bright); }
.gua span { font-size: 0.58rem; color: var(--dim); }
.gua:hover { border-color: var(--gold); box-shadow: 0 0 18px rgba(232, 196, 115, 0.35); }
.gua.lit {
  border-color: var(--teal);
  box-shadow: 0 0 26px rgba(94, 234, 212, 0.5);
  animation: lit-pulse 1.6s ease-in-out infinite;
}
@keyframes lit-pulse {
  0%, 100% { box-shadow: 0 0 14px rgba(94, 234, 212, 0.35); }
  50% { box-shadow: 0 0 30px rgba(94, 234, 212, 0.65); }
}

.core {
  position: absolute; left: 50%; top: 50%;
  width: 84px; height: 84px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem;
  background: radial-gradient(closest-side, rgba(232, 196, 115, 0.14), transparent);
  filter: drop-shadow(0 0 20px rgba(232, 196, 115, 0.5));
  cursor: grab;
}
.ring-outer.grabbing .core { cursor: grabbing; }

.verdict { max-width: 340px; text-align: center; margin-top: 2px; padding: 13px 18px; }
.v-name { font-family: var(--cute); font-size: 1.2rem; color: var(--gold-bright); margin-right: 8px; }

.verdict-pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.verdict-pop-enter-from { opacity: 0; transform: translateY(10px) scale(0.95); }
.verdict-pop-leave-active { display: none; }
</style>
