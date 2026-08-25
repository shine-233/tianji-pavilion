<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

export interface RadarItem { name: string; score: number; max: number }

const props = defineProps<{ items: RadarItem[] }>()

const CX = 150
const CY = 140
const R = 105
const progress = ref(0)
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

const dataPoly = computed(() =>
  props.items
    .map((it, i) => {
      const ratio = Math.max(0, Math.min(1, it.score / it.max)) * progress.value
      const p = pt(i, Math.max(0.02, ratio))
      return `${p[0].toFixed(1)},${p[1].toFixed(1)}`
    })
    .join(' '),
)

const labels = computed(() =>
  props.items.map((it, i) => {
    const p = pt(i, 1.18)
    return { x: p[0], y: p[1], name: it.name, score: it.score.toFixed(1), anchor: p[0] > CX + 8 ? 'start' : p[0] < CX - 8 ? 'end' : 'middle' }
  }),
)
</script>

<template>
  <svg width="300" height="290" viewBox="0 0 300 290" class="radar">
    <polygon v-for="(ring, i) in rings" :key="i" :points="ring.pts" fill="none" stroke="#262d40" stroke-width="1" />
    <line v-for="(sp, i) in spokes" :key="'l' + i" :x1="CX" :y1="CY" :x2="sp[0]" :y2="sp[1]" stroke="#262d40" stroke-width="1" />
    <polygon :points="dataPoly" fill="rgba(232,196,115,0.22)" stroke="#e8c473" stroke-width="2" />
    <circle
      v-for="(it, i) in items" :key="'d' + i"
      :cx="pt(i, Math.max(0.02, Math.min(1, it.score / it.max)) * progress)[0]"
      :cy="pt(i, Math.max(0.02, Math.min(1, it.score / it.max)) * progress)[1]"
      r="3.5" fill="#ffe3a8"
    />
    <text v-for="(lb, i) in labels" :key="'t' + i" :x="lb.x" :y="lb.y" :text-anchor="lb.anchor" class="lbl">
      {{ lb.name }} <tspan class="val">{{ lb.score }}</tspan>
    </text>
  </svg>
</template>

<style scoped>
.radar { max-width: 100%; }
.lbl { font-size: 12px; fill: var(--dim); }
.val { fill: var(--gold-bright); font-weight: bold; }
</style>
