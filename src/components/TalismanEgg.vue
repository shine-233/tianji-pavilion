<script setup lang="ts">
/** 彩蛋：连续输入 tianji 或双击山门 logo —— 符箓雨落 + 老道长驾鹤横穿 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { buildTaoess } from '../data/sageSprite'
import { sfx } from '../lib/sfx'

const raining = ref(false)
const TALISMANS = ['符', '敕', '令', '☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷', '✦']

let buffer = ''
let keyHandler: ((e: KeyboardEvent) => void) | null = null

const CRANE_PATHS = ['crane-a', 'crane-b']
const craneClass = ref('')
const cranePixels = buildTaoess('xinglan')

function rain(): void {
  if (raining.value) return
  raining.value = true
  sfx.gong()
  craneClass.value = CRANE_PATHS[Math.floor(Math.random() * 2)]!
  window.setTimeout(() => {
    raining.value = false
    craneClass.value = ''
    sfx.ding()
  }, 4200)
}

onMounted(() => {
  keyHandler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    buffer = (buffer + e.key.toLowerCase()).slice(-6)
    if (buffer.endsWith('tianji')) {
      buffer = ''
      rain()
    }
  }
  window.addEventListener('keydown', keyHandler)
})
onBeforeUnmount(() => {
  if (keyHandler) window.removeEventListener('keydown', keyHandler)
})

defineExpose({ rain })
</script>

<template>
  <teleport to="body">
    <div v-if="raining" class="egg-layer" aria-hidden="true">
      <span
        v-for="n in 26" :key="n"
        class="talisman"
        :style="{
          '--x': `${Math.random() * 100}vw`,
          '--d': `${Math.random() * 1.6}s`,
          '--dur': `${2.4 + Math.random() * 1.8}s`,
          '--rot': `${(Math.random() - 0.5) * 60}deg`,
        }"
      >{{ TALISMANS[n % TALISMANS.length]! }}</span>
      <div class="crane" :class="craneClass">
        <span class="crane-bird">🜁</span>
        <svg class="crane-sage" viewBox="0 0 25 27" shape-rendering="crispEdges">
          <rect v-for="(p, i) in cranePixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.fill" />
        </svg>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.egg-layer {
  position: fixed;
  inset: 0;
  z-index: 2600;
  pointer-events: none;
  overflow: hidden;
}
.talisman {
  position: absolute;
  top: -40px;
  left: var(--x);
  font-family: var(--cute);
  font-size: 1.5rem;
  color: var(--gold-bright);
  text-shadow: 0 0 14px rgba(var(--acc-rgb), 0.9), 0 0 30px rgba(var(--acc-rgb), 0.5);
  animation: talisman-fall var(--dur) linear forwards;
  animation-delay: var(--d);
  transform: rotate(var(--rot));
}
@keyframes talisman-fall {
  from { transform: translateY(-6vh) rotate(var(--rot)); opacity: 0; }
  12% { opacity: 1; }
  to { transform: translateY(108vh) rotate(calc(var(--rot) * 3)); opacity: 0.15; }
}

.crane {
  position: absolute;
  top: 16vh;
  left: -140px;
  display: flex;
  align-items: center;
  gap: 10px;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.55));
}
.crane.crane-a { animation: crane-fly-a 4s cubic-bezier(0.3, 0, 0.7, 1) forwards; }
.crane.crane-b { animation: crane-fly-b 4.2s cubic-bezier(0.3, 0, 0.7, 1) forwards; }
@keyframes crane-fly-a {
  from { transform: translateX(0) translateY(0); }
  50% { transform: translateX(48vw) translateY(-6vh); }
  to { transform: translateX(112vw) translateY(2vh); }
}
@keyframes crane-fly-b {
  from { transform: translateX(0); }
  50% { transform: translateX(52vw) translateY(7vh); }
  to { transform: translateX(112vw) translateY(-4vh); }
}
.crane-bird {
  font-size: 2.2rem;
  color: var(--gold-bright);
  animation: wing 0.7s ease-in-out infinite;
}
@keyframes wing {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.12); }
}
.crane-sage { width: 62px; height: auto; image-rendering: pixelated; }
</style>
