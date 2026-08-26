<script setup lang="ts">
/**
 * 地支关系盘：十二支环坐，六合（内弧）/三合（中弧）/相冲（直径）/相害（外弧）一次看全。
 * 悬停任意一支，与它相关的关系弧全部点亮；传入命局地支时，命里自带的关系常亮。
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{ present?: string[] }>(), { present: () => [] })

const ZHI: readonly string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 关系组（角度按支序 n*30°，子=顶部 -90°） */
const LIUHE: Array<[string, string]> = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]
const SANHE: Array<[string, string, string]> = [
  ['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑'],
]
const CHONG: Array<[string, string]> = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]
const HAI: Array<[string, string]> = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

interface Arc {
  id: string
  kind: '六合' | '三合' | '相冲' | '相害'
  a: string
  b: string
  d: string
  members: string[]
}

const R = 132
const cx = 160
const cy = 160

function ang(zhi: string): number {
  return ((ZHI.indexOf(zhi) * 30 - 90) * Math.PI) / 180
}
function pt(zhi: string, r: number): [number, number] {
  return [cx + r * Math.cos(ang(zhi)), cy + r * Math.sin(ang(zhi))]
}
/** 两支之间的弧：r 为弧半径，向内弯 */
function arcPath(a: string, b: string, r: number, bend: number): string {
  const [x1, y1] = pt(a, R)
  const [x2, y2] = pt(b, R)
  const [m1, m2] = pt(a, R + bend)
  const [n1, n2] = pt(b, R + bend)
  const mx = (m1 + n1) / 2
  const my = (m2 + n2) / 2
  void r
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

const ARCS: Arc[] = [
  ...LIUHE.map(([a, b]) => ({ id: `lh${a}${b}`, kind: '六合' as const, a, b, d: arcPath(a, b, R, -46), members: [a, b] })),
  ...SANHE.flatMap(([a, b, c]) => [
    { id: `sh${a}${b}`, kind: '三合' as const, a, b, d: arcPath(a, b, R, -78), members: [a, b, c] },
    { id: `sh${b}${c}`, kind: '三合' as const, a: b, b: c, d: arcPath(b, c, R, -78), members: [a, b, c] },
  ]),
  ...CHONG.map(([a, b]) => ({ id: `ch${a}${b}`, kind: '相冲' as const, a, b, d: arcPath(a, b, R, 0), members: [a, b] })),
  ...HAI.map(([a, b]) => ({ id: `hh${a}${b}`, kind: '相害' as const, a, b, d: arcPath(a, b, R, 34), members: [a, b] })),
]

const hover = ref<string | null>(null)
/** 点按固定：触屏没有 hover，点一支钉住它的关系网 */
const pinned = ref<string | null>(null)
const focus = computed(() => hover.value ?? pinned.value)

function togglePin(z: string): void {
  pinned.value = pinned.value === z ? null : z
}

const presentSet = computed(() => new Set(props.present))

function arcState(arc: Arc): 'on' | 'mine' | 'dim' {
  if (focus.value) {
    return arc.members.includes(focus.value) ? 'on' : 'dim'
  }
  if (presentSet.value.size) {
    return arc.members.every((m) => presentSet.value.has(m)) ? 'mine' : 'dim'
  }
  return 'on'
}

function zhiState(z: string): boolean {
  if (focus.value) return focus.value === z
  if (presentSet.value.size) return presentSet.value.has(z)
  return true
}

const LEGEND = [
  { kind: '六合' as const, note: '六合 · 暗合相亲' },
  { kind: '三合' as const, note: '三合 · 会局成势' },
  { kind: '相冲' as const, note: '相冲 · 对冲动荡' },
  { kind: '相害' as const, note: '相害 · 暗耗牵扯' },
]
</script>

<template>
  <div class="branch-wheel">
    <svg viewBox="0 0 320 320" class="wheel" role="img" aria-label="十二地支刑冲合害关系盘">
      <circle cx="160" cy="160" :r="R + 22" fill="none" stroke="rgba(139,147,167,0.25)" stroke-dasharray="2 6" />
      <g
        v-for="arc in ARCS"
        :key="arc.id"
        class="arc"
        :class="[`k-${arc.kind}`, arcState(arc)]"
      >
        <path :d="arc.d" fill="none" />
      </g>
      <g v-for="z in ZHI" :key="z" class="node-g">
        <circle
          :cx="pt(z, R)![0]" :cy="pt(z, R)![1]" r="15"
          class="node" :class="{ on: zhiState(z), mine: presentSet.has(z), pin: pinned === z }"
          @mouseenter="hover = z" @mouseleave="hover = null" @click="togglePin(z)"
        />
        <text
          :x="pt(z, R)![0]" :y="pt(z, R)![1]" class="zhi"
          :class="{ on: zhiState(z), mine: presentSet.has(z) }"
          @mouseenter="hover = z" @mouseleave="hover = null" @click="togglePin(z)"
        >{{ z }}</text>
      </g>
    </svg>
    <div class="legend">
      <span v-for="l in LEGEND" :key="l.kind" class="lg"><i :class="`dot-${l.kind}`"></i>{{ l.note }}</span>
    </div>
    <p class="note hint-line">
      <template v-if="pinned">「{{ pinned }}」已钉住，再点一次解除。</template>
      <template v-else-if="hover">「{{ hover }}」相关的关系弧已点亮，移开恢复。</template>
      <template v-else-if="presentSet.size">命局地支（{{ present.join(' · ') }}）齐备的关系常亮；悬停或点按任意支查看它的关系网。</template>
      <template v-else>悬停或点按任意地支，点亮它的六合 / 三合 / 相冲 / 相害。</template>
    </p>
  </div>
</template>

<style scoped>
.branch-wheel { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.wheel { width: 100%; max-width: 360px; }

.arc path {
  stroke-linecap: round;
  fill: none;
  opacity: 0.34;
  transition: opacity 0.3s ease, stroke-width 0.3s ease;
}
.arc.on path, .arc.mine path { opacity: 0.95; }
.arc.dim path { opacity: 0.08; }
.k-六合 path { stroke: #5eead4; stroke-width: 1.6; }
.k-三合 path { stroke: #e8c473; stroke-width: 1.7; }
.k-相冲 path { stroke: #f87171; stroke-width: 1.4; stroke-dasharray: 5 4; }
.k-相害 path { stroke: #8b93a7; stroke-width: 1.2; stroke-dasharray: 2 5; }
.arc.mine path { stroke-width: 2.2; filter: drop-shadow(0 0 5px currentColor); }
.k-六合.mine path { color: #5eead4; }
.k-三合.mine path { color: #e8c473; }
.k-相冲.mine path { color: #f87171; }
.k-相害.mine path { color: #8b93a7; }

.node {
  fill: var(--card-2);
  stroke: rgba(139, 147, 167, 0.4);
  stroke-width: 1;
  cursor: pointer;
  transition: all 0.25s ease;
}
.node.on { stroke: var(--gold-bright); stroke-width: 1.6; }
.node.pin { stroke: var(--gold-bright); stroke-width: 2; }
.node.mine { stroke: var(--teal); stroke-width: 2; filter: drop-shadow(0 0 6px rgba(94, 234, 212, 0.5)); }
.zhi {
  font-family: var(--cute);
  font-size: 15px;
  fill: var(--dim);
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
  transition: fill 0.25s ease;
}
.zhi.on { fill: var(--gold-bright); }
.zhi.mine { fill: #5eead4; }

.legend { display: flex; flex-wrap: wrap; gap: 4px 14px; justify-content: center; }
.lg { font-size: 0.74rem; color: var(--dim); display: inline-flex; align-items: center; gap: 5px; }
.lg i { width: 14px; height: 0; border-top: 2px solid; display: inline-block; }
.dot-六合 { border-color: #5eead4; }
.dot-三合 { border-color: #e8c473; }
.dot-相冲 { border-color: #f87171; border-top-style: dashed; }
.dot-相害 { border-color: #8b93a7; border-top-style: dotted; }
.hint-line { min-height: 1.2em; text-align: center; }
</style>
