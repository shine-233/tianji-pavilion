<script setup lang="ts">
/** 今日宜忌：lunar-javascript 直出当日黄历，宜忌各取前五条。
 *  条目可以点——道长会就着你点的那件事聊一句。 */
import { computed, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { sfx } from '../lib/sfx'

const lunar = Solar.fromDate(new Date()).getLunar()
const dayGZ = lunar.getDayInGanZhi()
const yi = (lunar.getDayYi() ?? []).slice(0, 5)
const ji = (lunar.getDayJi() ?? []).slice(0, 5)
const monthText = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`

const ganColor = computed(() => {
  const e = ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' } as Record<string, string>)[dayGZ[0]!] ?? ''
  return `ele-${e}`
})

const picked = ref<string | null>(null)

/** 就着点中的条目说人话——黄历是古人的生活节奏表，别当圣旨 */
function pickTerm(t: string, kind: 'yi' | 'ji'): void {
  sfx.tick()
  picked.value = kind + t
  window.setTimeout(() => (picked.value = null), 900)
  const line = kind === 'yi'
    ? `今日宜「${t}」。黄历上的宜忌是古人按节气排的生活节奏表——顺一顺，图个心安。`
    : `今日忌「${t}」。不是不能做，是今天气场不帮衬这件事，换个日子更省力。`
  window.dispatchEvent(new CustomEvent('sage-say', { detail: line }))
}
</script>

<template>
  <div class="yiji">
    <h2>今日黄历 <small class="sub">{{ monthText }} · <b :class="ganColor">{{ dayGZ }}</b>日</small></h2>
    <p v-if="yi.length" class="row">
      <span class="lab yi stamp">宜</span><span v-for="(t, i) in yi" :key="'y' + t" class="chip y" :style="{ '--i': i }" @click="pickTerm(t, 'yi')" :class="{ hit: picked === 'yi' + t }">{{ t }}</span>
    </p>
    <p v-if="ji.length" class="row">
      <span class="lab ji stamp stamp-2">忌</span><span v-for="(t, i) in ji" :key="'j' + t" class="chip j" :style="{ '--i': i }" @click="pickTerm(t, 'ji')" :class="{ hit: picked === 'ji' + t }">{{ t }}</span>
    </p>
    <p v-if="!yi.length && !ji.length" class="note">今日黄历暂无条目。</p>
    <p class="note tip-line">点条目试试——道长有话讲。</p>
  </div>
</template>

<style scoped>
.yiji {
  border-top: 1px dashed var(--line);
  margin-top: 14px;
  padding-top: 12px;
}
.yiji h2 small b { color: inherit; }
.row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.lab {
  font-family: var(--cute);
  width: 22px; height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 6px;
  font-size: 0.8rem;
  flex-shrink: 0;
}
.lab.yi { background: rgba(var(--acc2-rgb), 0.16); color: var(--teal); }
.lab.ji { background: rgba(var(--red-rgb), 0.13); color: var(--red); }
/* 印章式落款 */
.stamp { animation: stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.stamp-2 { animation-delay: 0.15s; }
@keyframes stamp-in {
  0% { transform: scale(1.9) rotate(-14deg); opacity: 0; }
  60% { transform: scale(0.92) rotate(3deg); opacity: 1; }
  100% { transform: none; }
}
.chip {
  font-size: 0.76rem;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--fg);
  cursor: pointer;
  animation: chip-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i, 0) * 70ms + 120ms);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
}
@keyframes chip-in {
  from { opacity: 0; transform: translateY(7px) scale(0.85); }
  to { opacity: 1; transform: none; }
}
.chip:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28); }
.chip.y:hover { border-color: rgba(var(--acc2-rgb), 0.75); }
.chip.j:hover { border-color: rgba(var(--red-rgb), 0.65); }
.chip.hit { animation: chip-hit 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes chip-hit {
  0% { transform: scale(1); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); }
}
.tip-line { opacity: 0.55; font-size: 0.72rem; margin-top: 4px; }
</style>
