<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sparkle } from '../lib/sparkle'
import { SAGE_PALETTE, SAGE_SPRITE } from '../data/sageSprite'
import { sfx } from '../lib/sfx'

const PALETTE = SAGE_PALETTE
const SPRITE = SAGE_SPRITE

interface Pixel { x: number; y: number; fill: string }

const pixels: Pixel[] = []
SPRITE.forEach((row, y) => {
  row.split('').forEach((ch, x) => {
    const fill = PALETTE[ch]
    if (fill) pixels.push({ x, y, fill })
  })
})

const CELL = 7
const WIDTH = 20 * CELL
const HEIGHT = SPRITE.length * CELL

const TIPS = [
  '阴阳互根，孤阳不生，独阴不长～',
  '排盘前静心三息，时辰莫要记错哦。',
  '子时不算，是老祖宗留给我们的温柔。',
  '大运如四季，冬藏是为了春发。',
  '《滴天髓》说：能知衰旺之真机，其于三命之奥，思过半矣！',
  '五行不是五种材料，是五种趋势。',
  '喜用神就像人生的顺风口，扬帆正当时。',
  '百分位只是参照，命盘从不给人贴标签。',
  '今天宜：读一页《穷通宝鉴》。',
  '冲者动也，不动不冲；怕什么变动～',
  '紫微与八字，一个看星宫，一个看禀气。',
  '阿衡我呀，正在研读《三命通会》第 1024 遍。',
]

const visible = ref(false)
const bubbleOpen = ref(false)
const typedText = ref('')
let typeTimer: number | null = null
let closeTimer: number | null = null
let chatterTimer: number | null = null

function say(text: string): void {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  bubbleOpen.value = true
  typedText.value = ''
  let i = 0
  typeTimer = window.setInterval(() => {
    i++
    typedText.value = text.slice(0, i)
    if (i >= text.length && typeTimer !== null) {
      window.clearInterval(typeTimer)
      typeTimer = null
      closeTimer = window.setTimeout(() => (bubbleOpen.value = false), 4200)
    }
  }, 45)
}

function onClick(event: MouseEvent): void {
  say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  sparkle(event.clientX, event.clientY, 10)
  sfx.blip()
}

onMounted(() => {
  window.setTimeout(() => (visible.value = true), 600)
  window.setTimeout(() => say('嗨！我是小道童阿衡，点我可以听命理小课堂～'), 1600)
  chatterTimer = window.setInterval(() => {
    if (!bubbleOpen.value) say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  }, 42000)
})

onBeforeUnmount(() => {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  if (chatterTimer !== null) window.clearInterval(chatterTimer)
})
</script>

<template>
  <div class="sage-corner" :class="{ visible }">
    <transition name="bubble">
      <div v-if="bubbleOpen" class="speech-bubble">{{ typedText }}<span class="caret">▌</span></div>
    </transition>
    <button class="sage-btn" aria-label="小道童阿衡" @click="onClick">
      <span class="orbit-glyph g1">☯</span>
      <span class="orbit-glyph g2">✦</span>
      <span class="orbit-glyph g3">✧</span>
      <svg class="sage-sprite" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" :width="WIDTH" :height="HEIGHT" shape-rendering="crispEdges">
        <rect v-for="(p, i) in pixels" :key="i" :x="p.x * CELL" :y="p.y * CELL" :width="CELL" :height="CELL" :fill="p.fill" />
        <rect class="eyelid" :x="7 * CELL" :y="11 * CELL" :width="CELL" :height="CELL" :fill="PALETTE.S" />
        <rect class="eyelid" :x="12 * CELL" :y="11 * CELL" :width="CELL" :height="CELL" :fill="PALETTE.S" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.sage-corner {
  position: fixed;
  right: 18px;
  bottom: 14px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}
.sage-corner.visible { opacity: 1; transform: none; pointer-events: auto; }

.sage-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  animation: sage-bob 3.4s ease-in-out infinite;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5));
}
.sage-btn:hover { transform: scale(1.08) rotate(-4deg); }
.sage-btn:active { transform: scale(0.94); }

@keyframes sage-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -7px; }
}

.eyelid { opacity: 0; animation: blink 4.8s infinite; }
@keyframes blink {
  0%, 91%, 100% { opacity: 0; }
  93%, 97% { opacity: 1; }
}

.orbit-glyph {
  position: absolute;
  pointer-events: none;
  animation: orbit-twinkle 2.4s ease-in-out infinite;
  color: var(--gold-bright);
  text-shadow: 0 0 8px rgba(255, 227, 168, 0.9);
}
.orbit-glyph.g1 { top: -6px; right: -8px; font-size: 14px; }
.orbit-glyph.g2 { top: 40%; left: -16px; font-size: 11px; animation-delay: 0.8s; color: var(--teal); }
.orbit-glyph.g3 { bottom: 4px; right: -13px; font-size: 12px; animation-delay: 1.5s; }
@keyframes orbit-twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.7) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.25) rotate(40deg); }
}

.speech-bubble {
  position: relative;
  max-width: 240px;
  background: #f6f1e3;
  color: #33404d;
  font-family: var(--cute);
  font-size: 0.92rem;
  line-height: 1.7;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  margin-right: 6px;
  min-height: 1.7em;
}
.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 22px;
  border: 8px solid transparent;
  border-top-color: #f6f1e3;
  border-bottom: 0;
}
.caret { animation: caret-blink 0.9s steps(1) infinite; color: var(--gold); }
@keyframes caret-blink { 50% { opacity: 0; } }

.bubble-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-leave-active { transition: all 0.2s ease; }
.bubble-enter-from { opacity: 0; transform: translateY(10px) scale(0.85); }
.bubble-leave-to { opacity: 0; transform: scale(0.9); }

@media (max-width: 600px) {
  .sage-corner { right: 8px; bottom: 8px; }
  .sage-sprite { width: 100px; height: auto; }
  .speech-bubble { max-width: 190px; font-size: 0.85rem; }
}
</style>
