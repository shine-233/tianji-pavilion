<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sparkle } from '../lib/sparkle'
import { buildTaoess, TAOESSES } from '../data/sageSprite'
import { motionOf } from '../data/motionPersonas'
import { sfx } from '../lib/sfx'

const props = withDefaults(defineProps<{
  char?: string
  greet?: boolean
}>(), { char: 'qingxuan', greet: true })

const def = computed(() => TAOESSES[props.char] ?? TAOESSES.qingxuan!)
const pixels = computed(() => buildTaoess(def.value.id))
const motion = computed(() => motionOf(def.value.id))
const motionVars = computed(() => ({
  '--bd': `${motion.value.dur}s`,
  '--ba': motion.value.mode === 'tilt' ? `${motion.value.amp}deg` : `${motion.value.amp}px`,
  '--bk': `${motion.value.blink}s`,
  '--bdel': `${motion.value.delay}s`,
}))

const CELL = 6
const GRID_W = 25
const GRID_H = 27
const WIDTH = GRID_W * CELL
const HEIGHT = GRID_H * CELL

const eyePixels = computed(() => pixels.value.filter((p) => p.isEye))

const TIPS = [
  '心静了，卦才准。先坐直，再落子。',
  '子时不排盘，不是迷信，是让熬夜的人早点睡。',
  '五行不是五种材料，是五种走势，别把它们当积木。',
  '喜用神就像顺风，帆不用换，换个方向就轻快。',
  '大运如四季。冬天别硬开花，先扎根。',
  '冲者动也。怕变动的人，往往正需要动一动。',
  '《滴天髓》讲：能知衰旺之真机，三命之奥思过半矣。',
  '百分位只是参照系，命盘从不给人贴标签。',
  '紫微看星曜，八字看禀气，两盘互参，别偏听一边。',
  '今天宜：翻一页《穷通宝鉴》，胜过刷十页短视频。',
  '摇卦之前把问题想清楚，一卦只问一事。',
  '格局无高下，会用的人自有分寸。',
  '规则是死的，组合是活的——所以引擎才要公开让人挑错。',
  '我师父说：算得再细，不如活得明白。',
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
      closeTimer = window.setTimeout(() => (bubbleOpen.value = false), 4600)
    }
  }, 42)
}

function onClick(event: MouseEvent): void {
  const t = Math.random() < 0.35 ? def.value.hello : TIPS[Math.floor(Math.random() * TIPS.length)]!
  say(t)
  sparkle(event.clientX, event.clientY, 10)
  sfx.blip()
}

watch(() => props.char, () => {
  if (!props.greet) return
  window.setTimeout(() => say(def.value.hello), 500)
})

function onSageSay(e: Event): void {
  const text = (e as CustomEvent<string>).detail
  if (typeof text === 'string' && text) say(text)
}

onMounted(() => {
  window.setTimeout(() => (visible.value = true), 500)
  if (props.greet) window.setTimeout(() => say(def.value.hello), 1500)
  chatterTimer = window.setInterval(() => {
    if (!bubbleOpen.value && document.visibilityState === 'visible') say(TIPS[Math.floor(Math.random() * TIPS.length)]!)
  }, 46000)
  window.addEventListener('sage-say', onSageSay)
})

onBeforeUnmount(() => {
  if (typeTimer !== null) window.clearInterval(typeTimer)
  if (closeTimer !== null) window.clearTimeout(closeTimer)
  if (chatterTimer !== null) window.clearInterval(chatterTimer)
  window.removeEventListener('sage-say', onSageSay)
})
</script>

<template>
  <div class="sage-corner" :class="{ visible }">
    <transition name="bubble">
      <div v-if="bubbleOpen" class="speech-bubble">
        <span class="who">{{ def.nameCn }}<i>路</i>{{ def.title }}</span>
        {{ typedText }}<span class="caret">▌</span>
      </div>
    </transition>
    <button
      class="sage-btn" :class="`motion-${motion.mode}`"
      :style="motionVars" :aria-label="def.nameCn" @click="onClick"
    >
      <span class="orbit-glyph g1">{{ def.orbit }}</span>
      <span class="orbit-glyph g2">✦</span>
      <span class="orbit-glyph g3">⋆</span>
      <svg class="sage-sprite" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" :width="WIDTH" :height="HEIGHT" shape-rendering="crispEdges">
        <rect v-for="(p, i) in pixels" :key="i" :x="p.x * CELL" :y="p.y * CELL" :width="CELL" :height="CELL" :fill="p.fill" />
        <rect
          v-for="(e, i) in eyePixels" :key="'e' + i"
          class="eyelid" :x="e.x * CELL" :y="e.y * CELL" :width="CELL" :height="CELL"
          :fill="def.palette.H ?? '#34294a'"
        />
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
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  animation: k-bob var(--bd, 3.4s) ease-in-out var(--bdel, 0s) infinite;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5));
}
.sage-btn:hover { transform: scale(1.08); }
.sage-btn:active { transform: scale(0.94); }

/* 动作人格：同一张骨架，不同的脾气 */
.motion-bounce { animation-name: k-bounce; animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
.motion-sway { animation-name: k-sway; }
.motion-tilt { animation-name: k-tilt; }
.motion-glow { animation-name: k-glow; }
.motion-glow::after {
  content: '';
  position: absolute;
  inset: -18%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 214, 130, 0.28), transparent 72%);
  animation: glow-breath var(--bd, 3.4s) ease-in-out infinite;
  pointer-events: none;
}
@keyframes k-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 calc(var(--ba, 6px) * -1); }
}
@keyframes k-sway {
  0%, 100% { translate: calc(var(--ba, 4px) * -0.8) 0; rotate: -1.5deg; }
  50% { translate: var(--ba, 4px) calc(var(--ba, 4px) * -0.7); rotate: 1.5deg; }
}
@keyframes k-tilt {
  0%, 100% { rotate: calc(var(--ba, 4deg) * 0.45); translate: 0 0; }
  50% { rotate: calc(var(--ba, 4deg) * -0.45); translate: 0 calc(var(--ba, 4px) * -0.5); }
}
@keyframes k-bounce {
  0%, 100% { translate: 0 0; }
  38% { translate: 0 calc(var(--ba, 8px) * -1); }
  55% { translate: 0 0; }
  70% { translate: 0 calc(var(--ba, 8px) * -0.32); }
  82% { translate: 0 0; }
}
@keyframes k-glow {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 calc(var(--ba, 6px) * -1); }
}
@keyframes glow-breath {
  0%, 100% { opacity: 0.35; transform: scale(0.9); }
  50% { opacity: 0.9; transform: scale(1.08); }
}

.eyelid { opacity: 0; animation: blink var(--bk, 5.2s) infinite; }
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
  max-width: 250px;
  background: #f6f1e3;
  color: #33404d;
  font-family: var(--cute);
  font-size: 0.92rem;
  line-height: 1.7;
  padding: 10px 15px 12px;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  margin-right: 6px;
  min-height: 1.7em;
}
.speech-bubble .who {
  display: block;
  font-size: 0.7rem;
  color: #a3543e;
  letter-spacing: 0.12em;
  margin-bottom: 3px;
}
.speech-bubble .who i { font-style: normal; opacity: 0.5; margin: 0 3px; }
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
