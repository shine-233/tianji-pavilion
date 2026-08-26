<script setup lang="ts">
/** 数字能量 · 梅花心易：号码分组求和起卦，复用梅花装卦（体用/互卦/变卦齐全） */
import { computed, ref } from 'vue'
import { TRI_BITS, TRI_NATURE, type Trigram } from '../lib/liuyaoExtra'
import { chartText, fromNumbers, TRIG_DESC, TRIG_SYMBOL, type MeihuaChart } from '../lib/meihua'
import { loadRecords, addRecord } from '../lib/records'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'
import { sparkle } from '../lib/sparkle'

const digits = ref('')
const result = ref<null | { chart: MeihuaChart; upper: Trigram; lower: Trigram; mv: number }>(null)

/** 六爻自下而上的阴阳（1=阳）。bits 串自下而上：下卦在前 */
const lineBits = computed<number[]>(() => {
  if (!result.value) return []
  return (TRI_BITS[result.value.lower]! + TRI_BITS[result.value.upper]!).split('').map(Number)
})

/** 爻位古称：初二三四五上 */
function lineLabel(i: number): string {
  const pos = ['初', '二', '三', '四', '五', '上'][i]!
  return i === 0 || i === 5 ? `${pos}爻` : `第${pos}爻`
}

/** 六爻名（备用）：初、二、三、四、五、上 */
const YAO_NAMES = ['初', '二', '三', '四', '五', '上'] as const
void YAO_NAMES

/** 点一根爻：报爻位与动静 */
function tapLine(i: number, e: MouseEvent): void {
  const isMoving = result.value ? i === result.value.mv - 1 : false
  const yinyang = lineBits.value[i] === 1 ? '阳爻' : '阴爻'
  toast(`${lineLabel(i)}·${yinyang}${isMoving ? '——正是动爻，物从此处变' : ''}`)
  sfx.tick()
  sparkle(e.clientX, e.clientY, 4)
}

/** 历史流水：只看数字卦这一类 */
const history = computed(() => loadRecords().filter((r) => r.kind === 'meihua').slice(0, 6))

/** 从历史回填：detail 里存了原始号码 */
function refill(detail: string): void {
  const m = detail.match(/# (\S+)/)
  if (!m) return
  digits.value = m[1]!
  calc()
}

function calc(e?: MouseEvent): void {
  const ds = digits.value.replace(/\D/g, '')
  digits.value = ds
  if (ds.length < 4) {
    toast('至少给我 4 位数字才起得来卦呀')
    return
  }
  const half = Math.floor(ds.length / 2)
  const sum = (arr: string[]) => arr.reduce((a, c) => a + Number(c), 0)
  const up = sum(ds.slice(0, half).split('')) % 8 || 8
  const low = sum(ds.slice(half).split('')) % 8 || 8
  const mv = sum(ds.split('')) % 6 || 6
  // 先天数：乾一兑二离三震四巽五坎六艮七坤八
  const NAMES: Trigram[] = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
  const upper = NAMES[up - 1]!
  const lower = NAMES[low - 1]!
  result.value = { chart: fromNumbers(up, low, mv), upper, lower, mv }
  sfx.ding()
  if (e) sparkle(e.clientX, e.clientY, 10)
  addRecord({
    kind: 'meihua',
    title: `数字卦 · ${result.value.chart.upperName}${result.value.chart.lowerName}`,
    detail: `# ${ds} 动爻${mv}`,
  })
}
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h2>数字能量 · 梅花心易</h2>
      <p class="sub">手机号、QQ号、生日都行。前半求上卦，后半求下卦，总数除六取动爻——梅花旧法，号码新用。</p>
      <input v-model="digits" inputmode="numeric" maxlength="20" placeholder="输入一串数字" @keyup.enter="calc()" />
      <div style="margin-top: 12px"><button @click="calc($event)">☯ 起卦</button></div>
    </div>

    <div v-if="result" class="card" v-reveal="80">
      <h2>{{ result.chart.upperName }}{{ result.chart.lowerName }}<small>（{{
        TRI_NATURE[result.upper]
      }}{{ result.upper }} 上 {{ TRI_NATURE[result.lower] }}{{ result.lower }} 下 · 动爻{{ result.mv }}）</small></h2>

      <!-- 卦画：点爻听爻位 -->
      <div class="gua" role="img" :aria-label="`${result.chart.upperName}${result.chart.lowerName}卦象`">
        <button
          v-for="(b, i) in [...lineBits].reverse()" :key="i"
          class="yao" :class="{ yang: b === 1, moving: result && i === 5 - (result.mv - 1) }"
          :title="lineLabel(5 - i)"
          @click="tapLine(5 - i, $event)"
        >
          <template v-if="b === 1"><i></i></template>
          <template v-else><i></i><i></i></template>
        </button>
      </div>
      <p class="note">动爻会发亮——点它听听这一爻的说法。</p>

      <!-- 本 · 互 · 变 三卦链 -->
      <div class="chain">
        <div class="link">
          <span class="sym">{{ TRIG_SYMBOL[result.chart.upperName] }}{{ TRIG_SYMBOL[result.chart.lowerName] }}</span>
          <b>本卦 {{ result.chart.upperName }}{{ result.chart.lowerName }}</b>
          <i>{{ TRIG_DESC[result.chart.upperName] }}</i>
        </div>
        <span class="arrow">→</span>
        <div class="link">
          <span class="sym">{{ TRIG_SYMBOL[result.chart.huUpper] }}{{ TRIG_SYMBOL[result.chart.huLower] }}</span>
          <b>互卦 {{ result.chart.huUpper }}{{ result.chart.huLower }}</b>
          <i>事情的中间过程</i>
        </div>
        <span class="arrow">→</span>
        <div class="link">
          <span class="sym">{{ TRIG_SYMBOL[result.chart.changedUpper!] }}{{ TRIG_SYMBOL[result.chart.changedLower!] }}</span>
          <b>变卦 {{ result.chart.changedUpper }}{{ result.chart.changedLower }}</b>
          <i>最终的走向</i>
        </div>
      </div>

      <p class="verdict" :data-level="result.chart.verdict.level">{{ result.chart.verdict.level }} · {{ result.chart.verdict.text }}</p>

      <ul class="explain">
        <li v-for="(t, i) in chartText(result.chart)" :key="i">{{ t }}</li>
      </ul>

      <p class="note" style="margin-top: 8px">数字能量属娱乐参考；号码与命运并无科学关联。</p>
    </div>

    <div v-if="history.length" class="card" v-reveal="120">
      <h2>最近起的数字卦</h2>
      <ul class="hist">
        <li v-for="r in history" :key="r.ts">
          <button class="hist-item" :title="r.detail" @click="refill(r.detail)">
            <b>{{ r.title }}</b>
            <time>{{ new Date(r.ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</time>
          </button>
        </li>
      </ul>
      <p class="note">点一条把号码填回去重算。记录只存在你自己的浏览器里。</p>
    </div>
  </main>
</template>

<style scoped>
.gua { display: flex; flex-direction: column-reverse; gap: 7px; width: min(220px, 70%); margin: 14px auto 6px; }
.yao {
  display: flex; gap: 8px; justify-content: center;
  background: none; border: none; cursor: pointer; padding: 2px;
}
.yao i {
  display: block; height: 9px; border-radius: 3px; flex: 1;
  background: linear-gradient(90deg, var(--btn-a), var(--btn-b));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.yao:not(.yang) i { flex: 0 0 38%; }
.yao:hover i { transform: scaleY(1.45); }
.yao.moving i {
  box-shadow: 0 0 12px 2px rgba(255, 215, 110, 0.75);
  animation: yao-pulse 1.6s ease-in-out infinite;
}
@keyframes yao-pulse {
  50% { box-shadow: 0 0 18px 4px rgba(255, 215, 110, 0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .yao.moving i { animation: none; }
}

.chain { display: flex; align-items: stretch; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.link {
  flex: 1; min-width: 128px;
  border: 1px solid var(--line); border-radius: 12px;
  padding: 10px 12px; text-align: center;
  background: var(--panel-2);
}
.link .sym { font-size: 1.7rem; color: var(--gold-bright); display: block; letter-spacing: 0.15em; }
.link b { display: block; font-family: var(--cute); font-size: 0.9rem; margin-top: 3px; }
.link i { display: block; font-style: normal; font-size: 0.68rem; color: var(--dim); margin-top: 2px; }
.arrow { align-self: center; color: var(--dim); font-size: 1.1rem; }

.verdict {
  margin-top: 14px; padding: 10px 14px; border-radius: 12px;
  background: rgba(var(--acc-rgb), 0.08);
  border-left: 3px solid var(--gold);
  font-family: var(--cute); line-height: 1.9;
}
.verdict[data-level='吉'] { border-left-color: #74b09c; }
.verdict[data-level='凶'] { border-left-color: #c96a5a; }

.explain { margin: 10px 0 0; padding-left: 1.2em; }
.explain li { font-size: 0.82rem; line-height: 2; color: var(--fg); }

.hist { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.hist-item {
  width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px;
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px;
  padding: 8px 12px; cursor: pointer; transition: border-color 0.2s ease;
}
.hist-item:hover { border-color: var(--gold); }
.hist-item time { font-size: 0.68rem; color: var(--dim); white-space: nowrap; }

@media (max-width: 560px) {
  .chain { flex-direction: column; }
  .arrow { transform: rotate(90deg); align-self: center; }
}
</style>
