<script setup lang="ts">
/**
 * 命运长河：把大运画成一条蜿蜒的河。
 * 河段颜色 = 亲和度（青→金→红），小船停在当前年份，
 * 点击河段弹出该步大运的解读；河流虚线持续流动。
 */
import { computed, ref } from 'vue'
import { sfx } from '../lib/sfx'

export interface RiverStop {
  gz: string
  window: string
  fin: number
}

const props = defineProps<{ stops: RiverStop[] }>()
const sel = ref<number | null>(null)

const W = 860
const H = 210
const PAD_X = 46

/** 当前年份落在哪一段、段内进度 */
const NOW = new Date().getFullYear()

function startYear(w: string): number {
  return Number(w.split('–')[0])
}
function endYear(w: string): number {
  return Number(w.split('–')[1])
}

const selInfo = computed(() => (sel.value === null ? null : props.stops[sel.value] ?? null))

function color(fin: number): string {
  if (fin >= 0.6) return '#5eead4'
  if (fin >= 0.3) return '#e8c473'
  return '#f87171'
}

/** 河道中心线：柔和正弦波 */
function riverY(t: number): number {
  return H / 2 + Math.sin(t * Math.PI * 2) * 34
}
function pointAt(t: number): [number, number] {
  const x = PAD_X + t * (W - PAD_X * 2)
  return [x, riverY(t)]
}

const riverPath = computed(() => {
  const pts: string[] = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    const [x, y] = pointAt(t)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
})

/** 每段大运的河道区间 */
function segT(i: number): [number, number] {
  const n = props.stops.length || 1
  return [i / n, (i + 1) / n]
}
function segPath(i: number): string {
  const [t0, t1] = segT(i)
  const pts: string[] = []
  const steps = 14
  for (let k = 0; k <= steps; k++) {
    const t = t0 + ((t1 - t0) * k) / steps
    const [x, y] = pointAt(t)
    pts.push(`${k === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}
function segMid(i: number): [number, number] {
  const [t0, t1] = segT(i)
  return pointAt((t0 + t1) / 2)
}

/** 小船位置：按当前年在总窗口中的比例 */
const boatPos = computed<[number, number]>(() => {
  if (!props.stops.length) return pointAt(0)
  const y0 = startYear(props.stops[0]!.window)
  const y1 = endYear(props.stops[props.stops.length - 1]!.window)
  const clamped = Math.max(y0, Math.min(y1, NOW))
  const total = y1 - y0 || 1
  // 找到所在段，在段内再插值
  let acc = 0
  for (let i = 0; i < props.stops.length; i++) {
    const s = props.stops[i]!
    const len = endYear(s.window) - startYear(s.window) + 1
    const segT0 = acc / props.stops.length
    if (clamped <= endYear(s.window) || i === props.stops.length - 1) {
      const inner = (clamped - startYear(s.window)) / (len || 1)
      return pointAt(segT0 + (inner * (1 / props.stops.length)))
    }
    acc += len
  }
  void total
  return pointAt(1)
})

function pick(i: number): void {
  sel.value = sel.value === i ? null : i
  sfx.pop()
}
</script>

<template>
  <div class="river-wrap">
    <svg :viewBox="`0 0 ${W} ${H}`" class="river-svg">
      <defs>
        <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="rgba(100,167,232,0.10)" />
          <stop offset="0.5" stop-color="rgba(94,234,212,0.16)" />
          <stop offset="1" stop-color="rgba(232,196,115,0.12)" />
        </linearGradient>
      </defs>
      <!-- 主河道 -->
      <path :d="riverPath" fill="none" stroke="url(#riverGrad)" stroke-width="44" stroke-linecap="round" />
      <!-- 流动水纹 -->
      <path :d="riverPath" fill="none" stroke="rgba(236,233,223,0.30)" stroke-width="2" stroke-dasharray="14 20" class="flow-line" />
      <path :d="riverPath" fill="none" stroke="rgba(236,233,223,0.16)" stroke-width="1.4" stroke-dasharray="6 26" class="flow-line slow" />
      <!-- 各段高亮描边 -->
      <path
        v-for="(s, i) in stops"
        :key="'seg' + i"
        :d="segPath(i)"
        fill="none"
        :stroke="color(s.fin)"
        :stroke-width="sel === i ? 6 : 3"
        :stroke-opacity="sel === null || sel === i ? 0.9 : 0.28"
        stroke-linecap="round"
        class="seg-line"
        @click="pick(i)"
      />
      <!-- 节点与干支标签 -->
      <g v-for="(s, i) in stops" :key="'node' + i" class="node-g" @click="pick(i)">
        <circle
          :cx="segMid(i)[0]"
          :cy="segMid(i)[1]"
          :r="sel === i ? 7.5 : 5"
          :fill="color(s.fin)"
          class="node-dot"
        />
        <text :x="segMid(i)[0]" :y="segMid(i)[1] - 24" text-anchor="middle" class="gz-label" :class="{ on: sel === i }">{{ s.gz }}</text>
        <text :x="segMid(i)[0]" :y="segMid(i)[1] + 30" text-anchor="middle" class="yr-label">{{ s.window }}</text>
      </g>
      <!-- 小船：外层定位，内层浮动 -->
      <g :transform="`translate(${boatPos[0]},${boatPos[1]})`">
        <g class="boat">
          <path d="M -11 2 Q 0 9 11 2 Q 0 6 -11 2 Z" fill="#ffe3a8" opacity="0.95" />
          <line x1="0" y1="2" x2="0" y2="-11" stroke="#e8c473" stroke-width="1.6" />
          <path d="M 0 -11 L 7 -2 L 0 -2 Z" fill="#f0a6ca" opacity="0.9" />
        </g>
      </g>
    </svg>

    <transition name="popr" mode="out-in">
      <div v-if="selInfo" :key="sel!" class="detail card">
        <span class="tag gold">{{ selInfo.gz }} 大运</span>
        <span class="tag teal">{{ selInfo.window }}</span>
        <span class="tag" :style="{ color: color(selInfo.fin), borderColor: color(selInfo.fin) + '66' }">亲和度 {{ selInfo.fin.toFixed(2) }}</span>
        <p class="sub d-text">
          {{ selInfo.fin >= 0.6 ? '顺水行舟——这十年风助火势，想做的事趁势铺开，别犹豫。' : selInfo.fin >= 0.3 ? '水面平稳——不冲不碍的十年，稳扎稳打，适合修内功、还旧账。' : '逆流滩涂——这十年走得费力，宜守不宜攻，把身体和现金流看紧。' }}
        </p>
      </div>
    </transition>
    <p class="note hint">船是今年 · 点河段看那十年的说法</p>
  </div>
</template>

<style scoped>
.river-wrap { display: flex; flex-direction: column; gap: 8px; }
.river-svg { width: 100%; height: auto; }

.flow-line { animation: flowmove 2.6s linear infinite; }
.flow-line.slow { animation-duration: 4.2s; }
@keyframes flowmove { to { stroke-dashoffset: -68; } }

.seg-line { cursor: pointer; transition: stroke-opacity 0.25s ease, stroke-width 0.25s ease; }
.node-g { cursor: pointer; }
.node-dot { filter: drop-shadow(0 0 6px rgba(232,196,115,0.55)); transition: r 0.2s ease; }
.gz-label { font-family: var(--cute); font-size: 19px; fill: #ece9df; transition: fill 0.25s ease; }
.gz-label.on { fill: var(--gold-bright); }
.yr-label { font-size: 12px; fill: #8b93a7; }

.boat { animation: bob-boat 2.4s ease-in-out infinite; filter: drop-shadow(0 0 8px rgba(255,227,168,0.65)); }
@keyframes bob-boat {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-3px) rotate(2deg); }
}

.detail { padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.d-text { flex-basis: 100%; margin-top: 4px; line-height: 1.9; }
.hint { text-align: center; letter-spacing: 0.18em; padding-left: 0.18em; }

.popr-enter-active { transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
.popr-enter-from { opacity: 0; transform: translateY(8px); }
.popr-leave-active { display: none; }
</style>
