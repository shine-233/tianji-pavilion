<script setup lang="ts">
/** 今日宜忌：lunar-javascript 直出当日黄历，宜忌各取前五条 */
import { computed } from 'vue'
import { Solar } from 'lunar-javascript'

const lunar = Solar.fromDate(new Date()).getLunar()
const dayGZ = lunar.getDayInGanZhi()
const yi = (lunar.getDayYi() ?? []).slice(0, 5)
const ji = (lunar.getDayJi() ?? []).slice(0, 5)
const monthText = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`

const ganColor = computed(() => {
  const e = ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' } as Record<string, string>)[dayGZ[0]!] ?? ''
  return `ele-${e}`
})
</script>

<template>
  <div class="yiji">
    <h2>今日黄历 <small class="sub">{{ monthText }} · <b :class="ganColor">{{ dayGZ }}</b>日</small></h2>
    <p v-if="yi.length" class="row"><span class="lab yi">宜</span><span v-for="t in yi" :key="'y' + t" class="chip y">{{ t }}</span></p>
    <p v-if="ji.length" class="row"><span class="lab ji">忌</span><span v-for="t in ji" :key="'j' + t" class="chip j">{{ t }}</span></p>
    <p v-else-if="!yi.length" class="note">今日黄历暂无条目。</p>
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
.chip {
  font-size: 0.76rem;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--fg);
}
.chip.y { border-color: rgba(var(--acc2-rgb), 0.35); }
.chip.j { border-color: rgba(var(--red-rgb), 0.3); color: var(--dim); }
</style>
