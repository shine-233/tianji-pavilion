<script setup lang="ts">
/**
 * 今日节气牌：从 lunar-javascript 取当前节气与农历，翻牌入场。
 * 点击可翻回背面再翻回来；键盘同样可操作。
 */
import { computed, onMounted, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { sfx } from '../lib/sfx'

const jieqi = ref('')
const jqDays = ref(0)
const lunarText = ref('')
const flipped = ref(false)

const ELE_OF_JQ: Record<string, string> = {
  立春: '木', 雨水: '水', 惊蛰: '木', 春分: '木', 清明: '木', 谷雨: '土',
  立夏: '火', 小满: '火', 芒种: '火', 夏至: '火', 小暑: '火', 大暑: '土',
  立秋: '金', 处暑: '金', 白露: '金', 秋分: '金', 寒露: '金', 霜降: '土',
  立冬: '水', 小雪: '水', 大雪: '水', 冬至: '水', 小寒: '土', 大寒: '土',
}

const ele = computed(() => ELE_OF_JQ[jieqi.value] ?? '')

function flipCard(): void {
  flipped.value = !flipped.value
  sfx.flip()
}

onMounted(() => {
  const lunar = Solar.fromDate(new Date()).getLunar()
  const jqTable = lunar.getJieQiTable()
  const now = Date.now()
  // lunar-javascript 节气表值兼容三种形态：Date / Solar / 'YYYY-MM-DD' 串；键含拼音别名（DA_XUE=大雪）
  const ALIAS: Record<string, string> = { DA_XUE: '大雪' }
  const toMs = (v: unknown): number => {
    const o = v as { toDate?: () => Date; getTime?: () => number }
    if (o && typeof o.toDate === 'function') return o.toDate().getTime()
    if (o && typeof o.getTime === 'function') return o.getTime()
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v))
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : 0
  }
  let prev = ''
  let prevTime = 0
  for (const [rawName, t] of Object.entries(jqTable)) {
    const name = ALIAS[rawName] ?? rawName
    const ms = toMs(t)
    if (ms <= now && ms > prevTime) {
      prev = name
      prevTime = ms
    }
  }
  if (!prev) {
    // 年初还没到第一个节气：取表里最早的
    const entries = Object.entries(jqTable)
      .map(([k, t]) => [ALIAS[k] ?? k, toMs(t)] as const)
      .sort((a, b) => a[1] - b[1])
    if (entries.length) {
      prev = entries[0]![0]
      prevTime = entries[0]![1]
    }
  }
  jieqi.value = prev
  jqDays.value = Math.floor((now - prevTime) / 86400000)
  lunarText.value = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`

  window.setTimeout(() => (flipped.value = true), 500 + Math.random() * 600)
})
</script>

<template>
  <div
    v-if="jieqi"
    class="jq-card" :class="{ flipped }"
    role="button" tabindex="0" aria-label="今日节气牌，点按翻面"
    @click="flipCard"
    @keydown.enter.prevent="flipCard"
    @keydown.space.prevent="flipCard"
  >
    <div class="jq-face front">
      <span class="jq-label">今日节气</span>
      <span class="jq-dot">✦</span>
    </div>
    <div class="jq-face back">
      <b class="jq-name">{{ jieqi }}</b>
      <i class="ele jq-ele" :class="ele ? `ele-${ele}` : ''">{{ ele }}</i>
      <span class="note">已入{{ jqDays }}天</span>
      <span class="tag teal">农历{{ lunarText }}</span>
    </div>
  </div>
</template>

<style scoped>
.jq-card {
  position: relative;
  width: 128px; height: 128px;
  cursor: pointer;
  perspective: 640px;
}
.jq-face {
  position: absolute; inset: 0;
  border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
  backface-visibility: hidden;
  transition: transform 0.8s cubic-bezier(0.4, 0.1, 0.2, 1.2);
}
.front {
  background:
    radial-gradient(circle at 50% 22%, rgba(232,196,115,0.16), transparent 60%),
    repeating-linear-gradient(45deg, #1a2030 0 8px, #161a28 8px 16px);
  border: 1px solid rgba(232,196,115,0.4);
}
.jq-label { font-size: 0.72rem; letter-spacing: 0.3em; padding-left: 0.3em; color: var(--dim); }
.jq-dot { font-size: 1.5rem; color: var(--gold-bright); animation: dot-tw 1.8s ease-in-out infinite; }
@keyframes dot-tw { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.15); } }

.back {
  transform: rotateY(180deg);
  background: linear-gradient(160deg, #20263a, #161a28);
  border: 1px solid var(--gold);
}
.jq-card.flipped .front { transform: rotateY(180deg); }
.jq-card.flipped .back { transform: rotateY(360deg); }
.jq-name { font-family: var(--cute); font-size: 1.5rem; color: var(--gold-bright); text-shadow: 0 0 16px rgba(232,196,115,0.45); }
.jq-ele { font-size: 0.85rem; }
.jq-card:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; border-radius: 16px; }
</style>
