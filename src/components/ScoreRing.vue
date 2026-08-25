<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ value: number; max: number; label: string; size?: number }>()

const R = 52
const CIRC = 2 * Math.PI * R
const shown = ref(0)
const dash = ref(0)
let raf = 0

function animate(target: number): void {
  cancelAnimationFrame(raf)
  const from = shown.value
  const t0 = performance.now()
  const dur = 900
  const step = (t: number): void => {
    const k = Math.min(1, (t - t0) / dur)
    const e = 1 - Math.pow(1 - k, 3)
    const v = from + (target - from) * e
    shown.value = v
    dash.value = CIRC * Math.max(0, Math.min(1, v / props.max))
    if (k < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => animate(props.value))
watch(() => props.value, (v) => animate(v))
</script>

<template>
  <div class="ring-wrap" :style="{ width: `${size ?? 150}px` }">
    <svg :width="size ?? 150" :height="size ?? 150" viewBox="0 0 130 130">
      <circle cx="65" cy="65" :r="R" fill="none" stroke="var(--bar)" stroke-width="10" />
      <circle
        cx="65" cy="65" :r="R" fill="none"
        stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round"
        :stroke-dasharray="`${dash} ${CIRC}`" transform="rotate(-90 65 65)"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5eead4" />
          <stop offset="100%" stop-color="#e8c473" />
        </linearGradient>
      </defs>
      <text x="65" y="60" text-anchor="middle" class="ring-num">{{ shown.toFixed(1) }}</text>
      <text x="65" y="80" text-anchor="middle" class="ring-sub">/ {{ max }}</text>
    </svg>
    <div class="ring-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.ring-wrap { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; }
.ring-num { font-family: var(--cute); font-size: 26px; font-weight: bold; fill: var(--gold-bright); }
.ring-sub { font-size: 11px; fill: var(--dim); }
.ring-label { color: var(--dim); font-size: 0.8rem; }
</style>
