<script setup lang="ts">
import { computed } from 'vue'

/** 数值条：标签 + 进度条 + 数值，评分明细/五行气数等处统一形态。 */
const props = withDefaults(
  defineProps<{
    label: string
    value: number
    max?: number
    /** 条色，默认主题金 */
    color?: string
    /** 数值右侧的文字，默认自动按 value/max 显示 */
    text?: string
  }>(),
  { max: 10, color: undefined, text: undefined },
)

const pct = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)))
const shown = computed(() => props.text ?? `${props.value.toFixed(1)} / ${props.max}`)
</script>

<template>
  <div class="stat-bar">
    <span class="lb">{{ label }}</span>
    <span class="track" role="img" :aria-label="`${label} ${shown}`">
      <i class="fill" :style="{ width: pct + '%', background: color ?? 'linear-gradient(90deg, var(--teal), var(--gold))' }"></i>
    </span>
    <b class="val">{{ shown }}</b>
  </div>
</template>

<style scoped>
.stat-bar { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-1) 0; }
.lb { flex: 0 0 4.5em; font-size: var(--fs-sub); color: var(--dim); }
.track { flex: 1; height: 8px; border-radius: var(--r-pill); background: var(--bar); overflow: hidden; }
.fill { display: block; height: 100%; border-radius: inherit; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.val { flex-shrink: 0; font-size: var(--fs-sub); color: var(--fg); font-weight: 600; min-width: 5.5em; text-align: right; }
</style>
