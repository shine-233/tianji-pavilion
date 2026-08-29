<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { analyzeYongshen, buildChart, summarize, tossText, YONGSHEN_MAP, type LiuYaoChart } from '../lib/liuyao'
import { guaCatalog, GUA_TIP, install, TRI_NATURE } from '../lib/liuyaoExtra'
import { Lunar } from 'lunar-javascript'
import { addRecord } from '../lib/records'
import { ELE_B } from '../lib/constants'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

type Phase = 'ready' | 'casting' | 'done'

const phase = ref<Phase>('ready')
const tosses = ref<number[]>([])
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
let doneTimer: number | null = null

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
  const step = (): void => {
    castOnce()
    if (tosses.value.length >= 6) {
      if (timer !== null) window.clearInterval(timer)
      timer = null
      doneTimer = window.setTimeout(() => {
        doneTimer = null
        // 中途重置或已离开页面就不再落定，避免把空卦强设成 done 造成按钮死锁
        if (tosses.value.length !== 6) return
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
  if (tosses.value.length >= 6) {
    phase.value = 'done'
    sfx.gong()
    if (chart.value) {
      addRecord({
        kind: 'liuyao',
        title: `六爻 · ${chart.value.name}${chart.value.changedName ? ' 之 ' + chart.value.changedName : ''}`,
        detail: YONGSHEN_MAP.find((x) => x.key === question.value)!.label,
      })
    }
  }
}

function reset(): void {
  if (timer !== null) window.clearInterval(timer)
  timer = null
  if (doneTimer !== null) window.clearTimeout(doneTimer)
  doneTimer = null
  phase.value = 'ready'
  tosses.value = []
}

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
  timer = null
  if (doneTimer !== null) window.clearTimeout(doneTimer)
  doneTimer = null
})

/* ===== 六十四卦卦库速览 ===== */
const CATALOG = guaCatalog()
const libOpen = ref(false)
const libSel = ref<string | null>(null)
const libEntry = computed(() => (libSel.value ? CATALOG.find((g) => g.bits === libSel.value) ?? null : null))

function pickLib(bits: string): void {
  libSel.value = libSel.value === bits ? null : bits
  sfx.blip()
}

const libRows = computed(() => {
  if (!libEntry.value) return []
  const g = install(libEntry.value.bits, '甲')
  return g.yaos
    .slice()
    .reverse()
    .map((y) => ({
      label: `${y.liuqin}·${y.najia}`,
      wx: ELE_B[y.najia[1]!]!,
      mark: y.shi ? '世' : y.ying ? '应' : '',
      yang: y.yang,
    }))
})
</script>

<template>
  <main class="page">
    <h1>六爻纳甲</h1>
    <p class="sub">
      心里存一件事，摇六次铜钱。三枚铜钱落下，几个背就记几——这是流传最广的一套起卦法。
      装卦、世应、六亲、断语都按京房老规矩来，解出来的话仅供参考，主意还得你自己拿。
    </p>

    <section v-reveal="0" class="card">
      <div class="form-row">
        <div class="q-wrap">
          <label>这一卦问什么</label>
          <select v-model="question" :disabled="phase === 'casting' || tosses.length > 0">
            <option v-for="y in YONGSHEN_MAP" :key="y.key" :value="y.key">{{ y.label }}</option>
          </select>
        </div>
        <div class="mode-toggle">
          <label>起卦方式（当前：{{ autoMode ? '自动摇币' : '手动记录' }}）</label>
          <button
            class="ghost small"
            :disabled="phase === 'casting'"
            :title="phase === 'casting' ? '摇卦进行中，等这一卦落定再切换' : undefined"
            @click="autoMode = !autoMode; sfx.toggle()"
          >{{ autoMode ? '切换为手动记录' : '切换为自动摇币' }}</button>
        </div>
        <button class="cast-btn" :disabled="phase === 'casting' || phase === 'done' || !autoMode" @click="startCast">
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
      <section v-reveal="0" class="card">
        <h2>装卦盘</h2>
        <div class="board-head">
          <span class="tag gold">本卦 {{ chart.name }}</span>
          <span v-if="chart.changedName" class="tag red">变卦 {{ chart.changedName }}</span>
          <span class="tag">{{ chart.palace }} · {{ chart.seqRole }}</span>
          <span class="tag">旬空 {{ chart.xunkong.join('、') }}</span>
        </div>
        <transition-group name="row-in" tag="div" class="gua-board">
          <div
            v-for="l in [...chart.lines].reverse()"
            :key="l.pos"
            class="gua-row"
            :class="{ hit: l.liuqin === verdict.v.liuqin }"
            :style="{ '--i': 6 - l.pos }"
          >
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

    <section class="card lib-card-wrap">
      <div class="board-head2">
        <h2 style="margin-bottom: 0">六十四卦卦库 · 不摇卦也能预习</h2>
        <button class="ghost small" @click="libOpen = !libOpen; sfx.toggle()">{{ libOpen ? '收起卦库 ▴' : '展开卦库 ▾' }}</button>
      </div>
      <p class="sub">按京房八宫次序排列。点任意一卦，立刻看它的纳甲、六亲、世应与白话点睛。</p>
      <div v-if="libOpen" class="lib-grid">
        <button
          v-for="(g, gi) in CATALOG" :key="g.bits"
          v-reveal="(gi % 8) * 25"
          class="lib-cell"
          :class="{ on: libSel === g.bits }"
          @click="pickLib(g.bits)"
        >
          <span class="lib-lines"><i v-for="k in 6" :key="k" :class="{ yang: g.bits[k - 1] === '1' }"></i></span>
          <span class="lib-name">{{ g.name }}</span>
        </button>
      </div>
      <div v-if="libEntry" class="lib-detail">
        <h3>{{ libEntry.name }}<small>（{{ TRI_NATURE[libEntry.upper] }}上{{ TRI_NATURE[libEntry.lower] }}下 · {{ libEntry.gong }}宫）</small></h3>
        <p class="lib-tip">「{{ GUA_TIP[libEntry.name] ?? '卦象自明，细品则悟' }}」</p>
        <div class="lib-yaos">
          <span v-for="(r, i) in libRows" :key="i" class="lib-yao">
            <em class="lib-mark">{{ r.mark }}</em>
            <b :class="`ele-${r.wx}`">{{ r.label }}</b>
            <span class="lib-glyphs"><i :class="{ yang: r.yang }"></i><i v-if="!r.yang"></i></span>
          </span>
        </div>
        <p class="note">速览以甲日装卦示意；实际问卦时六兽随日干而定，动爻另有说法。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.form-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.q-wrap { flex: 1; min-width: 180px; }
.mode-toggle { min-width: 130px; }
.mode-toggle button:disabled { opacity: 0.45; cursor: not-allowed; }
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
.gua-row.hit {
  background: var(--glow);
  border-left: 3px solid var(--gold-bright);
  animation: hit-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: 0.5s;
}
@keyframes hit-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: none; }
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

.lib-card-wrap { margin-top: 4px; }
.board-head2 { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.lib-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px 9px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: linear-gradient(160deg, var(--card-2), transparent);
  color: var(--fg);
  font-family: inherit;
  font-weight: normal;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.22s ease;
}
.lib-cell:hover { transform: translateY(-4px); border-color: rgba(var(--acc-rgb), 0.5); }
.lib-cell.on { border-color: var(--gold); box-shadow: 0 0 14px rgba(var(--acc-rgb), 0.25); }
.lib-lines { display: flex; flex-direction: column-reverse; gap: 3px; width: 46px; }
.lib-lines i { display: block; height: 4px; border-radius: 2px; background: var(--dim); opacity: 0.55; }
.lib-lines i.yang { background: var(--gold-bright); opacity: 1; box-shadow: 0 0 6px rgba(var(--acc-rgb), 0.5); }
.lib-lines i:not(.yang) { max-width: 60%; }
.lib-name { font-size: 0.72rem; color: var(--dim); }
.lib-cell.on .lib-name { color: var(--gold-bright); }

.lib-detail {
  margin-top: 16px;
  border: 1px dashed rgba(var(--acc-rgb), 0.4);
  border-radius: 12px;
  padding: 14px 16px;
}
.lib-detail h3 { color: var(--fg); }
.lib-detail h3 small { font-size: 0.72rem; color: var(--dim); margin-left: 6px; font-weight: normal; }
.lib-tip { font-family: var(--cute); color: var(--gold-bright); margin: 6px 0 12px; letter-spacing: 0.08em; }
.lib-yaos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px 18px; margin-bottom: 10px; }
.lib-yao { display: inline-flex; align-items: center; gap: 8px; font-size: 0.84rem; }
.lib-mark {
  font-style: normal;
  width: 18px;
  text-align: center;
  color: var(--gold-bright);
  font-family: var(--cute);
}
.lib-glyphs { display: inline-flex; gap: 4px; margin-left: auto; }
.lib-glyphs i { width: 20px; height: 5px; border-radius: 2px; background: var(--teal); opacity: 0.85; }
.lib-glyphs i + i { max-width: 17px; }
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

@media (max-width: 720px) {
  .gua-row { grid-template-columns: 3em 3em 4em 1fr 2em; gap: 6px; font-size: 0.8rem; }
  .coin { width: 54px; height: 54px; }
  .lib-yaos { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}
</style>
