<script setup lang="ts">
import { computed, ref } from 'vue'
import { Lunar } from 'lunar-javascript'
import { chartText, fromNumbers, timeChart, TRIG_SYMBOL, TRIG_DESC, TRIG_WUXING, type MeihuaChart } from '../lib/meihua'
import { addRecord } from '../lib/records'
import { sfx } from '../lib/sfx'

const mode = ref<'time' | 'number'>('time')
const numA = ref('')
const numB = ref('')

const nowParts = computed(() => {
  const l = Lunar.fromDate(new Date())
  return {
    yearZhiNum: '子丑寅卯辰巳午未申酉戌亥'.indexOf(l.getYearZhi()) + 1,
    month: Math.abs(l.getMonth()),
    day: l.getDay(),
    hourZhiNum: '子丑寅卯辰巳午未申酉戌亥'.indexOf(l.getTimeZhi()) + 1,
    label: `${l.getYearInGanZhi()}年 农历${Math.abs(l.getMonth())}月${l.getDay()}日 ${l.getTimeZhi()}时`,
  }
})

const chart = computed<MeihuaChart | null>(() => {
  if (mode.value === 'time') {
    return timeChart(nowParts.value)
  }
  const a = Number(numA.value)
  const b = Number(numB.value)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null
  return numberChartSafe(a, b)
})

function numberChartSafe(a: number, b: number): MeihuaChart {
  // 动爻：两数之和除六取余（余0作六）
  const mv = (((a + b - 1) % 6) + 6) % 6 + 1
  return fromNumbers((((a - 1) % 8) + 8) % 8 + 1, (((b - 1) % 8) + 8) % 8 + 1, mv)
}

const texts = computed(() => (chart.value ? chartText(chart.value) : []))

const revealed = ref(false)
let lastRecordedKey = ''
function reroll(): void {
  sfx.ding()
  revealed.value = false
  window.setTimeout(() => {
    revealed.value = true
  }, 30)
  const c = chart.value
  if (!c) return
  // 同一时辰内时间卦不会变，别把手账刷成复读机
  const key = `${c.upperName}${c.lowerName}${c.movingLine}`
  if (key === lastRecordedKey) return
  lastRecordedKey = key
  addRecord({
    kind: 'meihua',
    title: `梅花 · ${c.upperName}${c.lowerName} 动${c.movingLine}`,
    detail: c.verdict.level,
  })
}
</script>

<template>
  <main class="page">
    <h1>梅花易数</h1>
    <p class="sub">
      不用铜钱也能起卦：抬头看个时辰、随手报两个数，都行。
      这套法子相传是邵雍先生走路时想出来的，讲究一个「触机而发」——你起念的那一刻，卦就成了。
      <br />顺手一提：<a href="#/memory">卦象记忆</a>能帮你把八卦长相记熟，<a href="#/shuzi">数字能量</a>是同款算法拿手机号来玩。
    </p>

    <section v-reveal="0" class="card">
      <div class="tabs">
        <button :class="{ active: mode === 'time' }" @click="mode = 'time'; sfx.blip()">⏱ 以当下时辰起卦</button>
        <button :class="{ active: mode === 'number' }" @click="mode = 'number'; sfx.blip()">🔢 以两数起卦</button>
      </div>

      <div v-if="mode === 'time'" class="time-info">
        <span class="tag gold">{{ nowParts.label }}</span>
        <p class="note">年支数 + 月 + 日 除八为上卦；再加时辰数除八为下卦；总数除六定动爻。</p>
      </div>

      <div v-else class="num-form">
        <div>
          <label>第一个数（任意正整数）</label>
          <input v-model="numA" inputmode="numeric" placeholder="比如 3" />
        </div>
        <div>
          <label>第二个数</label>
          <input v-model="numB" inputmode="numeric" placeholder="比如 7" />
        </div>
      </div>

      <button class="go-btn" :disabled="!chart" @click="reroll">☰ 起一卦看看</button>
    </section>

    <template v-if="revealed && chart">
      <section class="card result">
        <div class="trig-row">
          <div class="trig upper" :style="{ '--i': 0 }">
            <span class="sym">{{ TRIG_SYMBOL[chart.upperName] }}</span>
            <b>{{ chart.upperName }}</b>
            <i>{{ TRIG_DESC[chart.upperName] }}</i>
            <em>{{ TRIG_WUXING[chart.upperName] }}</em>
            <u v-if="chart.movingLine > 3">动</u>
          </div>
          <div class="vs">上<br />下</div>
          <div class="trig lower" :style="{ '--i': 1 }">
            <span class="sym">{{ TRIG_SYMBOL[chart.lowerName] }}</span>
            <b>{{ chart.lowerName }}</b>
            <i>{{ TRIG_DESC[chart.lowerName] }}</i>
            <em>{{ TRIG_WUXING[chart.lowerName] }}</em>
            <u v-if="chart.movingLine <= 3">动</u>
          </div>
        </div>

        <div class="verdict" :data-level="chart.verdict.level" :style="{ '--i': 2 }">
          {{ chart.verdict.level }} —— {{ chart.verdict.text }}
        </div>

        <ul class="explain">
          <li v-for="(t, i) in texts" :key="i" :style="{ '--i': i }">{{ t }}</li>
        </ul>

        <div class="related">
          <span class="tag teal">互卦 {{ chart.huUpper }}{{ chart.huLower }}</span>
          <span class="tag gold">变卦 {{ chart.changedUpper }}{{ chart.changedLower }}</span>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.tabs button { font-size: 0.88rem; }
.tabs button.active { background: var(--btn-a); color: var(--btn-ink); }
.tabs button:not(.active) { background: var(--card-2); color: var(--fg); border-color: var(--line); }

.time-info { margin-bottom: 6px; }

.num-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 220px)); gap: 12px; margin-bottom: 6px; }

.go-btn { margin-top: 16px; width: 100%; padding: 13px; font-size: 1.05rem; }

.result { animation: card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes card-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

.trig-row { display: flex; align-items: stretch; justify-content: center; gap: 26px; margin-bottom: 18px; }
.vs { display: flex; align-items: center; color: var(--dim); font-size: 0.72rem; text-align: center; line-height: 2; }
.trig {
  position: relative;
  min-width: 130px;
  text-align: center;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, var(--card-2), var(--card));
  animation: trig-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 0.15s);
  transition: transform 0.25s ease;
}
.trig:hover { transform: translateY(-4px) rotate(-1deg); }
@keyframes trig-pop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: none; } }
.trig .sym { display: block; font-size: 2.6rem; color: var(--gold-bright); line-height: 1.2; animation: sym-spin 0.9s ease both; }
@keyframes sym-spin { from { opacity: 0; transform: rotate(-180deg) scale(0.4); } to { opacity: 1; transform: none; } }
.trig b { display: block; font-family: var(--cute); font-size: 1.15rem; margin-top: 4px; }
.trig i { display: block; font-style: normal; font-size: 0.76rem; color: var(--dim); margin-top: 3px; }
.trig em { display: inline-block; font-style: normal; font-size: 0.72rem; margin-top: 6px; padding: 1px 9px; border-radius: 999px; border: 1px solid var(--line); }
.trig u {
  position: absolute; top: 8px; right: 8px;
  text-decoration: none;
  font-family: var(--cute);
  font-size: 0.68rem;
  color: #fff;
  background: var(--red);
  padding: 2px 8px;
  border-radius: 999px;
  animation: move-glow 1.4s ease-in-out infinite;
}
@keyframes move-glow { 0%, 100% { box-shadow: 0 0 0 rgba(248, 113, 113, 0); } 50% { box-shadow: 0 0 14px rgba(248, 113, 113, 0.75); } }

.verdict {
  padding: 13px 16px;
  border-radius: 11px;
  border-left: 4px solid var(--gold);
  background: rgba(232, 196, 115, 0.07);
  line-height: 1.95;
  font-size: 0.96rem;
  animation: trig-pop 0.5s ease both;
  animation-delay: calc(var(--i) * 0.15s);
}
.verdict[data-level='凶'] { border-left-color: var(--red); background: rgba(248, 113, 113, 0.08); }
.verdict[data-level='小凶'] { border-left-color: var(--amber); background: rgba(251, 191, 36, 0.08); }
.verdict[data-level='吉'] { border-left-color: var(--teal); background: rgba(94, 234, 212, 0.07); }

.explain { list-style: none; margin-top: 14px; }
.explain li {
  position: relative;
  padding: 8px 0 8px 18px;
  line-height: 1.95;
  font-size: 0.9rem;
  color: var(--fg);
  animation: phrase-in 0.5s ease both;
  animation-delay: calc(var(--i) * 0.12s + 0.35s);
}
.explain li::before { content: '·'; position: absolute; left: 4px; color: var(--gold); font-weight: bold; }
@keyframes phrase-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }

.related { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }

@media (max-width: 560px) {
  .trig-row { gap: 10px; }
  .trig { min-width: 108px; padding: 14px 10px; }
}
</style>
