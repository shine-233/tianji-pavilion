<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { daoguPixels, getVariant, type DaoguPixel } from '../data/taoistSprites'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

const props = withDefaults(
  defineProps<{
    variant?: string
    width?: number
    tips?: string[]
    /** 点击时是否冒一句话（关闭后只撒粒子） */
    chatty?: boolean
    /** 无操作时自言自语的间隔秒数；0 关闭 */
    idleSec?: number
  }>(),
  { variant: 'xuanwei', width: 150, tips: undefined, chatty: true, idleSec: 45 },
)

const v = computed(() => getVariant(props.variant))
const pixels = computed<DaoguPixel[]>(() => daoguPixels(v.value))
const cols = computed(() => Math.max(...pixels.value.map((p) => p.x)) + 1)
const rows = computed(() => Math.max(...pixels.value.map((p) => p.y)) + 1)

/** 眼睛聚类 → 眨眼眼皮矩形 */
const eyeLids = computed(() => {
  const eyes = pixels.value.filter((p) => p.isEye)
  if (eyes.length === 0) return []
  const xs = [...new Set(eyes.map((p) => p.x))].sort((a, b) => a - b)
  const groups: number[][] = []
  let cur = [xs[0]]
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] - cur[cur.length - 1] <= 2) cur.push(xs[i])
    else {
      groups.push(cur)
      cur = [xs[i]]
    }
  }
  groups.push(cur)
  return groups.map((g) => ({
    x: Math.min(...g),
    w: Math.max(...g) - Math.min(...g) + 1,
    y: Math.min(...eyes.filter((p) => g.includes(p.x)).map((p) => p.y)),
    h: Math.max(...eyes.filter((p) => g.includes(p.x)).map((p) => p.y)) - Math.min(...eyes.filter((p) => g.includes(p.x)).map((p) => p.y)) + 1,
  }))
})

const CELL = 7
const visible = ref(false)
const bubble = ref('')
const bubbleOpen = ref(false)
let typeTimer: number | null = null
let closeTimer: number | null = null
let idleTimer: number | null = null

const FALLBACK_TIPS = [
  '云鹤观今日也平安无事。',
  '卦不欺人，人常常自己骗自己。',
  '急事缓办，缓事别拖。',
]

function say(text: string): void {
  bubbleOpen.value = true
  bubble.value = ''
  if (typeTimer !== null) window.clearInterval(typeTimer)
  let i = 0
  typeTimer = window.setInterval(() => {
    i++
    bubble.value = text.slice(0, i)
    if (i >= text.length && typeTimer !== null) {
      window.clearInterval(typeTimer)
      typeTimer = null
    }
  }, 42)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  closeTimer = window.setTimeout(() => {
    bubbleOpen.value = false
  }, 4200 + text.length * 42)
}

function onClick(e: MouseEvent): void {
  sfx.blip()
  sparkle(e.clientX, e.clientY, 10)
  const pool = props.tips && props.tips.length > 0 ? props.tips : FALLBACK_TIPS
  say(pool[Math.floor(Math.random() * pool.length)])
}

function scheduleIdle(): void {
  if (props.idleSec <= 0) return
  idleTimer = window.setTimeout(() => {
    if (!bubbleOpen.value && !document.hidden) {
      const pool = props.tips && props.tips.length > 0 ? props.tips : FALLBACK_TIPS
      say(pool[Math.floor(Math.random() * pool.length)])
    }
    scheduleIdle()
  }, props.idleSec * 1000 + Math.random() * 8000)
}

/** 各页面通过 sage-say 自定义事件让道姑开口（如抽签结果、排盘完成） */
function onSageSay(e: Event): void {
  const detail = (e as CustomEvent<string>).detail
  if (typeof detail === 'string' && detail) say(detail)
}

onMounted(() => {
  window.setTimeout(() => {
    visible.value = true
  }, 350)
  scheduleIdle()
  window.addEventListener('sage-say', onSageSay)
})
onBeforeUnmount(() => {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  window.removeEventListener('sage-say', onSageSay)
})
</script>

<template>
  <div class="maiden" :class="{ visible }" :style="{ '--w': width + 'px' }" :title="`${v.nameCn} · ${v.title}`" @click="onClick">
    <div class="orbit o1">✦</div>
    <div class="orbit o2">☯</div>
    <div class="orbit o3">✧</div>

    <transition name="pop">
      <div v-if="bubbleOpen" class="bubble">{{ bubble }}<i class="tail" /></div>
    </transition>

    <svg :viewBox="`0 0 ${cols * CELL} ${rows * CELL}`" class="sprite" shape-rendering="crispEdges" role="img" :aria-label="`${v.nameCn}，${v.title}`">
      <rect v-for="(p, i) in pixels" :key="i" :x="p.x * CELL" :y="p.y * CELL" :width="CELL" :height="CELL" :fill="`var(${p.varName})`" />
      <template v-for="(lid, i) in eyeLids" :key="'l' + i">
        <rect class="eyelid" :x="lid.x * CELL" :y="lid.y * CELL" :width="lid.w * CELL" :height="lid.h * CELL" fill="var(--dg-skin)" />
        <rect class="lash" :x="lid.x * CELL" :y="(lid.y + lid.h) * CELL - 1.5" :width="lid.w * CELL" height="1.5" fill="var(--dg-line)" opacity="0.55" />
      </template>
    </svg>
    <div class="ground" />
  </div>
</template>

<style scoped>
.maiden {
  position: relative;
  width: var(--w);
  cursor: pointer;
  user-select: none;
  opacity: 0;
  transform: translateY(26px) rotate(-3deg);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.maiden.visible { opacity: 1; transform: none; }
.maiden:hover .sprite { transform: scale(1.06) rotate(-2deg); }
.maiden:active .sprite { transform: scale(0.94); }

.sprite {
  display: block;
  width: 100%;
  animation: maiden-bob 3.6s ease-in-out infinite;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
}
@keyframes maiden-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -7px; }
}
.ground {
  margin: -4px auto 0;
  width: 62%;
  height: 9px;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--dg-glow), transparent);
  filter: blur(2px);
}

.eyelid { animation: blink 4.7s infinite; transform-origin: center; }
.lash { animation: blink 4.7s infinite; }
@keyframes blink {
  0%, 92%, 100% { opacity: 0; }
  94%, 97% { opacity: 1; }
}

.orbit {
  position: absolute;
  color: var(--dg-gold);
  font-size: calc(var(--w) * 0.11);
  animation: orbit-twinkle 2.5s ease-in-out infinite;
  pointer-events: none;
}
.o1 { top: 2%; left: -8%; }
.o2 { top: 22%; right: -10%; font-size: calc(var(--w) * 0.13); animation-delay: 0.8s; }
.o3 { bottom: 18%; left: -12%; animation-delay: 1.5s; }
@keyframes orbit-twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.15) rotate(24deg); }
}

.bubble {
  position: absolute;
  left: calc(100% + 6px);
  top: 0;
  min-width: 130px;
  max-width: 230px;
  background: var(--card-2, #1b2030);
  border: 1px solid var(--line, #262d40);
  border-radius: 12px 12px 12px 3px;
  padding: 9px 12px;
  font-family: var(--cute);
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--fg);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  z-index: 30;
}
.bubble .tail {
  position: absolute;
  left: -6px;
  top: 16px;
  border: 6px solid transparent;
  border-right-color: var(--card-2, #1b2030);
}
.pop-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.18s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(8px) scale(0.92); }

@media (max-width: 720px) {
  .bubble { left: auto; right: -4px; border-radius: 12px 12px 3px 12px; }
  .bubble .tail { left: auto; right: -6px; border-right-color: transparent; border-left-color: var(--card-2, #1b2030); }
}
</style>
