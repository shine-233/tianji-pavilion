<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { sfx } from '../lib/sfx'

export interface RadarItem { name: string; score: number; max: number }

const props = defineProps<{ items: RadarItem[] }>()

const CX = 150
const CY = 140
const R = 105
const progress = ref(0)
const hover = ref<number | null>(null)
let raf = 0

function animateTo(target: number): void {
  cancelAnimationFrame(raf)
  const from = progress.value
  const t0 = performance.now()
  const step = (t: number): void => {
    const k = Math.min(1, (t - t0) / 900)
    const e = 1 - Math.pow(1 - k, 3)
    progress.value = from + (target - from) * e
    if (k < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
onMounted(() => animateTo(1))
watch(() => props.items, () => { progress.value = 0.05; animateTo(1) })

const N = computed(() => props.items.length)

function pt(i: number, ratio: number): [number, number] {
  const ang = (Math.PI * 2 * i) / N.value - Math.PI / 2
  return [CX + R * ratio * Math.cos(ang), CY + R * ratio * Math.sin(ang)]
}

const rings = computed(() => [0.25, 0.5, 0.75, 1].map((rr) => ({
  pts: props.items.map((_, i) => pt(i, rr)).map((p) => p.join(',')).join(' '),
})))

const spokes = computed(() => props.items.map((_, i) => pt(i, 1)))

function ratioOf(it: RadarItem): number {
  return Math.max(0.02, Math.min(1, it.score / it.max)) * progress.value
}

const dataPoly = computed(() =>
  props.items
    .map((it, i) => {
      const p = pt(i, ratioOf(it))
      return `${p[0].toFixed(1)},${p[1].toFixed(1)}`
    })
    .join(' '),
)

/** hover 扇区：从中心到顶点的楔形，用于点击热区与视觉反馈 */
function wedgePath(i: number): string {
  const half = Math.PI / N.value
  const ang = (Math.PI * 2 * i) / N.value - Math.PI / 2
  const a0 = ang - half
  const a1 = ang + half
  const x0 = CX + R * Math.cos(a0)
  const y0 = CY + R * Math.sin(a0)
  const x1 = CX + R * Math.cos(a1)
  const y1 = CY + R * Math.sin(a1)
  return `M ${CX} ${CY} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`
}

const labels = computed(() =>
  props.items.map((it, i) => {
    const p = pt(i, 1.18)
    return { x: p[0], y: p[1], name: it.name, score: it.score.toFixed(1), max: it.max, pct: ((it.score / it.max) * 100).toFixed(0), anchor: p[0] > CX + 8 ? 'start' : p[0] < CX - 8 ? 'end' : 'middle' }
  }),
)

function onWedge(i: number): void {
  hover.value = i
  sfx.tick()
}

/** 点按固定/取消：触屏没有 hover */
function toggleWedge(i: number): void {
  hover.value = hover.value === i ? null : i
  sfx.tick()
}
</script>

<template>
  <svg width="300" height="290" viewBox="0 0 300 290" class="radar">
    <!-- 交互扇区（透明热区，置底） -->
    <path
      v-for="(_, i) in items" :key="'w' + i"
      :d="wedgePath(i)"
      fill="rgba(232,196,115,0.10)"
      :fill-opacity="hover === i ? 1 : 0"
      class="wedge"
      @mouseenter="onWedge(i)"
      @mouseleave="hover = null"
      @click="toggleWedge(i)"
    />
    <polygon v-for="(ring, i) in rings" :key="i" :points="ring.pts" fill="none" stroke="#262d40" stroke-width="1" pointer-events="none" />
    <line v-for="(sp, i) in spokes" :key="'l' + i" :x1="CX" :y1="CY" :x2="sp[0]" :y2="sp[1]" stroke="#262d40" stroke-width="1" pointer-events="none" />
    <polygon :points="dataPoly" fill="rgba(232,196,115,0.22)" stroke="#e8c473" stroke-width="2" pointer-events="none" />
    <circle
      v-for="(it, i) in items" :key="'d' + i"
      :cx="pt(i, ratioOf(it))[0]"
      :cy="pt(i, ratioOf(it))[1]"
      :r="hover === i ? 5.5 : 3.5"
      :fill="hover === i ? '#5eead4' : '#ffe3a8'"
      class="dot"
      pointer-events="none"
    />
    <text
      v-for="(lb, i) in labels" :key="'t' + i"
      :x="lb.x" :y="lb.y" :text-anchor="lb.anchor"
      class="lbl" :class="{ hot: hover === i }"
      @mouseenter="onWedge(i)"
      @mouseleave="hover = null"
      @click="toggleWedge(i)"
    >
      {{ lb.name }} <tspan class="val">{{ lb.score }}</tspan>
    </text>
    <g v-if="hover !== null" pointer-events="none">
      <rect :x="CX - 66" y="6" width="132" height="42" rx="9" class="tip-box" />
      <text :x="CX" y="23" text-anchor="middle" class="tip-name">{{ items[hover]!.name }} 得分</text>
      <text :x="CX" y="41" text-anchor="middle" class="tip-val">
        {{ items[hover]!.score.toFixed(1) }} / {{ items[hover]!.max }} · {{ labels[hover]!.pct }}%
      </text>
    </g>
  </svg>
</template>

<style scoped>
.radar { max-width: 100%; }
.lbl { font-size: 12px; fill: var(--dim); cursor: pointer; transition: fill 0.2s ease; }
.lbl.hot { fill: var(--gold-bright); }
.val { fill: var(--gold-bright); font-weight: bold; }
.wedge { transition: fill-opacity 0.22s ease; }
.dot { transition: r 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), fill 0.22s ease; filter: drop-shadow(0 0 4px rgba(255, 227, 168, 0.6)); }
.tip-box { fill: rgba(11, 13, 18, 0.88); stroke: rgba(232, 196, 115, 0.45); }
.tip-name { font-size: 11px; fill: var(--dim); }
.tip-val { font-size: 13px; fill: var(--gold-bright); font-weight: bold; }
</style>
