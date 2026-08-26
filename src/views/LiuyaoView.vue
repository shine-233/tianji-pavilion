<script setup lang="ts">
import { computed, ref } from 'vue'
import { analyzeYongshen, buildChart, summarize, tossText, YONGSHEN_MAP, type LiuYaoChart } from '../lib/liuyao'
import { Lunar } from 'lunar-javascript'
import { addRecord } from '../lib/records'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

type Phase = 'ready' | 'casting' | 'done'

const phase = ref<Phase>('ready')
const tosses = ref<number[]>([])
const currentToss = ref(-1)
const question = ref(YONGSHEN_MAP[0].key)
const autoMode = ref(true)

const chart = computed<LiuYaoChart | null>(() => {
  if (tosses.value.length !== 6) return null
  const l = Lunar.fromDate(new Date())
  return buildChart({
    tosses: [...tosses.value],
    dayGan: l.getDayInGanZhi()[0],
    dayZhi: l.getDayInGanZhi()[1],
    monthZhi: l.getMonthInGanZhi()[1],
  })
})
const verdict = computed(() => {
  if (!chart.value) return null
  const y = YONGSHEN_MAP.find((x) => x.key === question.value)!
  const v = analyzeYongshen(chart.value, y.liuqin, Lunar.fromDate(new Date()).getMonthInGanZhi()[1], Lunar.fromDate(new Date()).getDayInGanZhi()[1])
  return { label: y.label, v, text: summarize(v, chart.value, y.label) }
})

let timer: number | null = null

function castOnce(): void {
  // 每枚铜钱独立掷正反，背面数即爻的结果
  let backs = 0
  for (let i = 0; i < 3; i++) if (Math.random() < 0.5) backs++
  tosses.value.push(backs)
  sfx.pop()
  sparkle(window.innerWidth / 2 + (Math.random() - 0.5) * 200, window.innerHeight * 0.4, 5)
}

function startCast(): void {
  if (phase.value === 'done') {
    tosses.value = []
  }
  phase.value = 'casting'
  currentToss.value = 0
  const step = (): void => {
    castOnce()
    currentToss.value = tosses.value.length
    if (tosses.value.length >= 6) {
      if (timer !== null) window.clearInterval(timer)
      timer = null
      window.setTimeout(() => {
        phase.value = 'done'
        sfx.gong()
        if (chart.value) {
          addRecord({
            kind: 'liuyao',
            title: `六爻 · ${chart.value.name}${chart.value.changedName ? ' 之 ' + chart.value.changedName : ''}`,
            detail: YONGSHEN_MAP.find((x) => x.key === question.value)!.label,
          })
        }
      }, 450)
    }
  }
  step()
  timer = window.setInterval(step, 950)
}

function pickManual(n: number): void {
  sfx.blip()
  tosses.value.push(n)
  currentToss.value = tosses.value.length
  if (tosses.value.length >= 6) {
    phase.value = 'done'
    sfx.gong()
  }
}

function reset(): void {
  if (timer !== null) window.clearInterval(timer)
  timer = null
  phase.value = 'ready'
  tosses.value = []
  currentToss.value = -1
}
</script>

<template>
  <main class="page">
    <h1>六爻纳甲</h1>
    <p class="sub">
      心里存一件事，摇六次铜钱。三枚铜钱落下，几个背就记几——这是流传最广的一套起卦法。
      装卦、世应、六亲、断语都按京房老规矩来，解出来的话仅供参考，主意还得你自己拿。
    </p>

    <section class="card">
      <div class="form-row">
        <div class="q-wrap">
          <label>这一卦问什么</label>
          <select v-model="question" :disabled="phase === 'casting' || tosses.length > 0">
            <option v-for="y in YONGSHEN_MAP" :key="y.key" :value="y.key">{{ y.label }}</option>
          </select>
        </div>
        <div class="mode-toggle">
          <label>起卦方式</label>
          <button class="ghost small" @click="autoMode = !autoMode; sfx.toggle()">{{ autoMode ? '自动摇币' : '手动记录' }}</button>
        </div>
        <button class="cast-btn" :disabled="phase === 'casting' || (phase === 'done')" @click="startCast">
          {{ phase === 'ready' ? '☯ 心诚则灵，开始摇卦' : phase === 'casting' ? '卦成中…' : '已成一卦' }}
        </button>
        <button class="ghost small" :disabled="tosses.length === 0" @click="reset">重新来</button>
      </div>

      <!-- 铜钱台 -->
      <div class="coin-stage" :class="{ shaking: phase === 'casting' }">
        <div v-for="i in 3" :key="i" class="coin" :class="{ spin: phase === 'casting' }" :style="{ '--d': i * 0.12 + 's' }">
          <span class="hole"></span>
          <span class="glyph">{{ ['乾', '坤', '元'][i - 1] }}</span>
        </div>
      </div>

      <!-- 手动记录 -->
      <div v-if="!autoMode && phase !== 'done'" class="manual">
        <label>第 {{ tosses.length + 1 }} 爻 · 手头有真铜钱的话，照落下的样子点：</label>
        <div class="pick-row">
          <button v-for="n in [3, 2, 1, 0]" :key="n" class="ghost small" @click="pickManual(n)">
            {{ tossText(n).label }}
          </button>
        </div>
      </div>

      <!-- 已落的爻 -->
      <transition-group name="line-in" tag="ol" class="lines">
        <li v-for="(t, i) in tosses" :key="i" class="line-item" :style="{ '--i': i }">
          <span class="pos">第{{ i + 1 }}爻</span>
          <span class="yao" :class="{ yang: t === 1 || t === 3 }">
            <template v-if="t === 1 || t === 3"><i></i></template>
            <template v-else><i></i><i></i></template>
          </span>
          <span class="tt">{{ tossText(t).detail }}</span>
          <span v-if="t === 3" class="mark move">○ 动</span>
          <span v-else-if="t === 0" class="mark move dark">× 动</span>
        </li>
      </transition-group>
    </section>

    <template v-if="phase === 'done' && chart && verdict">
      <section class="card">
        <h2>装卦盘</h2>
        <div class="board-head">
          <span class="tag gold">本卦 {{ chart.name }}</span>
          <span v-if="chart.changedName" class="tag red">变卦 {{ chart.changedName }}</span>
          <span class="tag">{{ chart.palace }} · {{ chart.seqRole }}</span>
          <span class="tag">旬空 {{ chart.xunkong.join('、') }}</span>
        </div>
        <transition-group name="row-in" tag="div" class="gua-board">
          <div v-for="l in [...chart.lines].reverse()" :key="l.pos" class="gua-row" :style="{ '--i': 6 - l.pos }">
            <span class="beast">{{ l.beast }}</span>
            <span class="lq">{{ l.liuqin }}</span>
            <span class="gz ele-text" :data-e="l.element">{{ l.najia }}</span>
            <span class="yao-cell" :class="{ moving: l.moving }">
              <span class="yao" :class="{ yang: l.bit === 1 }"><i></i><i v-if="l.bit === 0"></i></span>
              <sup v-if="l.moving" class="mk">{{ l.mark }}</sup>
            </span>
            <span class="sy" :class="{ on: l.shiYing }">{{ l.shiYing ?? '' }}</span>
          </div>
        </transition-group>
        <p class="note">上为第六爻、下为初爻。○ 为老阳动、× 为老阴动；「世」是你，「应」是对方或所问之事的另一端。</p>
      </section>

      <section class="card verdict-card">
        <h2>白话断语 · 问「{{ verdict.label }}」取「{{ verdict.v.liuqin }}」为用神</h2>
        <p class="verdict-text">{{ verdict.text }}</p>
        <ul class="phrases">
          <li v-for="(p, i) in verdict.v.phrases" :key="i" :style="{ '--i': i }">{{ p }}</li>
        </ul>
        <div class="meter">
          <span class="meter-label">用神旺衰（传统口径的粗估）</span>
          <div class="bar"><i :style="{ width: ((verdict.v.strengthScore + 100) / 2) + '%' }"></i></div>
          <b class="meter-val" :data-c="verdict.v.conclusion">{{ verdict.v.conclusion }}</b>
        </div>
        <p class="note">以上是把传统断卦的路数翻译成白话，图个参考。真要决断大事，请多问几个人、多想几天。</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.form-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.q-wrap { flex: 1; min-width: 180px; }
.mode-toggle { min-width: 130px; }
.small { padding: 8px 12px; font-size: 0.82rem; }

.cast-btn { font-size: 1rem; }
.coin-stage {
  display: flex; justify-content: center; gap: 26px;
  padding: 30px 0 10px;
}
.coin {
  position: relative;
  width: 64px; height: 64px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.35), transparent 42%),
    linear-gradient(145deg, var(--gold-bright), var(--gold) 55%, #a87f35);
  border: 3px solid #8a6524;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4), inset 0 0 0 4px rgba(138, 101, 36, 0.35);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s ease;
}
.coin .hole {
  position: absolute;
  width: 16px; height: 16px;
  background: var(--bg);
  border: 2px solid #8a6524;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
}
.coin .glyph {
  position: absolute;
  bottom: -22px;
  font-size: 0.72rem;
  color: var(--dim);
  letter-spacing: 0.2em;
  opacity: 0;
}
.coin.spin { animation: coin-toss 0.85s ease-in-out infinite; animation-delay: var(--d); }
@keyframes coin-toss {
  0% { transform: translateY(0) rotateX(0); }
  40% { transform: translateY(-46px) rotateX(360deg); }
  70% { transform: translateY(-10px) rotateX(560deg); }
  85% { transform: translateY(4px) rotateX(700deg); }
  100% { transform: translateY(0) rotateX(720deg); }
}
.coin-stage.shaking .coin { box-shadow: 0 14px 24px rgba(0, 0, 0, 0.5), inset 0 0 0 4px rgba(138, 101, 36, 0.35); }

.manual { margin-top: 14px; }
.pick-row { display: flex; gap: 8px; flex-wrap: wrap; }

.lines { list-style: none; margin-top: 18px; display: flex; flex-direction: column-reverse; gap: 7px; }
.line-item {
  display: flex; align-items: center; gap: 14px;
  padding: 6px 10px;
  border-bottom: 1px dashed var(--line);
  font-size: 0.86rem;
}
.line-in-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); transition-delay: calc(var(--i) * 0.04s); }
.line-in-enter-from { opacity: 0; transform: translateX(-24px); }
.pos { color: var(--dim); white-space: nowrap; }
.tt { color: var(--dim); font-size: 0.78rem; }
.mark.move { color: var(--red); font-size: 0.76rem; }
.mark.move.dark { color: var(--amber); }

.yao { display: inline-flex; gap: 7px; align-items: center; height: 14px; }
.yao i { display: block; width: 52px; height: 8px; border-radius: 4px; background: var(--dim); opacity: 0.75; }
.yao.yang i { background: var(--gold); opacity: 1; box-shadow: 0 0 8px rgba(232, 196, 115, 0.5); }

.board-head { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.gua-board { display: flex; flex-direction: column; gap: 4px; }
.gua-row {
  display: grid;
  grid-template-columns: 3.2em 3.2em 4.6em 1fr 2.4em;
  align-items: center; gap: 10px;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  font-size: 0.88rem;
}
.row-in-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); transition-delay: calc(var(--i) * 0.09s); }
.row-in-enter-from { opacity: 0; transform: translateY(-14px); }
.beast, .lq { color: var(--dim); }
.gz { font-weight: bold; letter-spacing: 0.08em; }
.gz[data-e='木'] { color: var(--wood); }
.gz[data-e='火'] { color: var(--fire); }
.gz[data-e='土'] { color: var(--earth); }
.gz[data-e='金'] { color: var(--metal); }
.gz[data-e='水'] { color: var(--water); }
.yao-cell { position: relative; display: inline-flex; align-items: center; gap: 6px; justify-content: center; }
.yao-cell.moving .yao i { animation: move-pulse 1.6s ease-in-out infinite; }
@keyframes move-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
.mk { color: var(--red); font-size: 0.72rem; }
.sy { text-align: center; color: transparent; font-family: var(--cute); }
.sy.on { color: var(--gold-bright); text-shadow: 0 0 8px rgba(232, 196, 115, 0.6); }

.verdict-card { border-color: var(--card-glow); }
.verdict-text { font-size: 1rem; line-height: 2; margin-bottom: 12px; }
.phrases { list-style: none; }
.phrases li {
  padding: 7px 0 7px 18px;
  position: relative;
  color: var(--fg);
  font-size: 0.9rem;
  line-height: 1.9;
  animation: phrase-in 0.5s ease both;
  animation-delay: calc(var(--i) * 0.12s + 0.3s);
}
.phrases li::before { content: '❖'; position: absolute; left: 0; color: var(--gold); font-size: 0.7rem; top: 11px; }
@keyframes phrase-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.meter { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.meter-label { font-size: 0.78rem; color: var(--dim); white-space: nowrap; }
.meter { flex-wrap: wrap; }
.bar { flex: 1; min-width: 160px; }
.meter-val[data-c='旺'] { color: var(--teal); }
.meter-val[data-c='平'] { color: var(--amber); }
.meter-val[data-c='弱'] { color: var(--red); }

@media (max-width: 640px) {
  .gua-row { grid-template-columns: 3em 3em 4em 1fr 2em; gap: 6px; font-size: 0.8rem; }
  .coin { width: 54px; height: 54px; }
}
</style>
