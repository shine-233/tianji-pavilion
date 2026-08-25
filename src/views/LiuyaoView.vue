<script setup lang="ts">
import { computed, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import {
  assembleReading, bitsFromCast, changedBits, COIN_LABEL, guaCatalog, GUA_TIP, install, tossCoins,
  TRI_NATURE, yongshenLiuqin,
} from '../lib/liuyao'
import type { InstalledGua, LiuyaoResult } from '../lib/liuyao'
import { ELE_B } from '../lib/constants'
import { sfx } from '../lib/sfx'

const question = ref('')
const category = ref('财运')
const CATEGORIES = ['财运', '事业', '婚姻', '健康', '学业', '寻物', '行人', '其他']

type Phase = 'idle' | 'tossing' | 'done'
const phase = ref<Phase>('idle')
const cast = ref<number[]>([])
const round = ref(-1)
const coinFaces = ref<[boolean, boolean, boolean]>([false, false, false])
const spinning = ref(false)
const result = ref<LiuyaoResult | null>(null)
const manualMode = ref(false)
const manual = ref<number[]>([7, 7, 7, 7, 7, 7])
const copied = ref(false)

const sleep = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms))

function nowContext(): { dayGZ: string; monthGZ: string } {
  const lunar = Solar.fromDate(new Date()).getLunar()
  return { dayGZ: lunar.getDayInGanZhi(), monthGZ: lunar.getMonthInGanZhi() }
}

function kongOf(dayGZ: string): string {
  const GAN = '甲乙丙丁戊己庚辛壬癸'
  const ZHI = '子丑寅卯辰巳午未申酉戌亥'
  const gi = GAN.indexOf(dayGZ[0]!)
  let zi = ZHI.indexOf(dayGZ[1]!)
  while (((zi % 10) + 10) % 10 !== ((gi % 10) + 10) % 10) zi += 12
  const start = Math.floor(zi / 10) * 10
  return ZHI[(start + 10) % 12]! + ZHI[(start + 11) % 12]!
}

interface HistoryEntry {
  ts: number
  q: string
  cat: string
  cast: number[]
  benName: string
  bianName: string | null
  dayGZ: string
  monthGZ: string
}

const HKEY = 'bs-liuyao-history'
function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HKEY) ?? '[]') as HistoryEntry[]
  } catch {
    return []
  }
}
const history = ref<HistoryEntry[]>(loadHistory())

function pushHistory(ctx: { dayGZ: string; monthGZ: string }): void {
  const ben = install(bitsFromCast(cast.value), ctx.dayGZ)
  const movers = cast.value.some((v) => v === 6 || v === 9)
  const bian = movers ? install(changedBits(bitsFromCast(cast.value), cast.value), ctx.dayGZ) : null
  history.value = [
    { ts: Date.now(), q: question.value.trim(), cat: category.value, cast: [...cast.value], benName: ben.name, bianName: bian?.name ?? null, dayGZ: ctx.dayGZ, monthGZ: ctx.monthGZ },
    ...history.value,
  ].slice(0, 12)
  try {
    localStorage.setItem(HKEY, JSON.stringify(history.value))
  } catch { /* noop */ }
}

async function shake(): Promise<void> {
  if (phase.value === 'tossing') return
  phase.value = 'tossing'
  cast.value = []
  result.value = null
  round.value = -1
  sfx.gong()
  const ctx = nowContext()
  for (let r = 0; r < 6; r++) {
    round.value = r
    spinning.value = true
    const spinTimer = window.setInterval(() => {
      coinFaces.value = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5]
      sfx.tick()
    }, 110)
    await sleep(950)
    window.clearInterval(spinTimer)
    const v = tossCoins()
    coinFaces.value = [v >= 7, v >= 8, v >= 9]
    spinning.value = false
    cast.value.push(v)
    sfx.flip()
    await sleep(420)
  }
  const ben = install(bitsFromCast(cast.value), ctx.dayGZ)
  const movers = cast.value.some((v) => v === 6 || v === 9)
  const bian = movers ? install(changedBits(bitsFromCast(cast.value), cast.value), ctx.dayGZ) : null
  result.value = assembleReading(ben, bian, cast.value, {
    dayGZ: ctx.dayGZ, monthGZ: ctx.monthGZ, kong: kongOf(ctx.dayGZ),
  }, category.value, question.value)
  phase.value = 'done'
  pushHistory(ctx)
  sfx.ding()
}

function manualAssemble(): void {
  const ctx = nowContext()
  const bits = bitsFromCast(manual.value)
  const ben = install(bits, ctx.dayGZ)
  const movers = manual.value.some((v) => v === 6 || v === 9)
  const bian = movers ? install(changedBits(bits, manual.value), ctx.dayGZ) : null
  result.value = assembleReading(ben, bian, [...manual.value], {
    dayGZ: ctx.dayGZ, monthGZ: ctx.monthGZ, kong: kongOf(ctx.dayGZ),
  }, category.value, question.value)
  phase.value = 'done'
  cast.value = [...manual.value]
  pushHistory(ctx)
  sfx.gong()
}

function replay(h: HistoryEntry): void {
  question.value = h.q
  category.value = h.cat
  cast.value = [...h.cast]
  const ben = install(bitsFromCast(cast.value), h.dayGZ)
  const movers = cast.value.some((v) => v === 6 || v === 9)
  const bian = movers ? install(changedBits(bitsFromCast(cast.value), cast.value), h.dayGZ) : null
  result.value = assembleReading(ben, bian, [...h.cast], {
    dayGZ: h.dayGZ, monthGZ: h.monthGZ, kong: kongOf(h.dayGZ),
  }, h.cat, h.q)
  phase.value = 'done'
  sfx.pop()
}

function clearHistory(): void {
  history.value = []
  try {
    localStorage.removeItem(HKEY)
  } catch { /* noop */ }
  sfx.toggle()
}

async function copyReading(): Promise<void> {
  if (!result.value) return
  const text = `【六爻问卦】${question.value.trim() || '(未记所问)'} · ${category.value}\n`
    + `${result.value.ctx.dayGZ}日 ${result.value.ctx.monthGZ}月 旬空${result.value.ctx.kong}\n`
    + `本卦 ${result.value.ben.name}` + (result.value.bian ? ` → 变卦 ${result.value.bian.name}` : '') + '\n'
    + result.value.reading.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1600)
    sfx.blip()
  } catch { /* noop */ }
}

function reset(): void {
  phase.value = 'idle'
  cast.value = []
  result.value = null
  round.value = -1
  sfx.toggle()
}

const MANUAL_OPTS = [
  { v: 6, label: '老阴 ⚋ 动' },
  { v: 7, label: '少阳 ⚊ 静' },
  { v: 8, label: '少阴 ⚋ 静' },
  { v: 9, label: '老阳 ⚊ 动' },
]

interface Row {
  pos: number
  liushou: string
  liuqin: string
  najia: string
  wx: string
  yang: boolean
  moving: boolean
  mark: string
  isYs: boolean
}

function toRows(g: InstalledGua): Row[] {
  const ys = yongshenLiuqin(category.value)
  return g.yaos.map((y) => ({
    pos: y.pos,
    liushou: y.liushou,
    liuqin: y.liuqin,
    najia: y.najia,
    wx: ELE_B[y.najia[1]!]!,
    yang: y.yang,
    moving: y.moving,
    mark: y.shi ? '世' : y.ying ? '应' : '',
    isYs: ys !== null && y.liuqin === ys,
  }))
}

const benRows = computed(() => (result.value ? toRows(result.value.ben) : []))
const bianRows = computed(() => (result.value?.bian ? toRows(result.value.bian) : []))
const ysLabel = computed(() => yongshenLiuqin(category.value))

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

function lineClass(yang: boolean, moving: boolean): string {
  if (yang && moving) return 'yao lao-yang'
  if (!yang && moving) return 'yao lao-yin'
  if (yang) return 'yao shao-yang'
  return 'yao shao-yin'
}
</script>

<template>
  <main class="page">
    <div class="card">
      <h2>六爻问卦 · 火珠林纳甲法</h2>
      <p class="sub" style="margin-bottom: 4px">
        三枚铜钱摇六次，从下往上积成一卦。装卦、六亲、六兽、世应、旬空全部自动排好，
        附一条白话提示。心静、事专、一卦一问。
      </p>
      <div class="ask-row">
        <div class="q-col">
          <label>所问何事（可不填）</label>
          <input v-model="question" maxlength="30" placeholder="例：这季度项目能不能顺利结项" @keyup.enter="shake()" />
        </div>
        <div>
          <label>事类（决定取用神）</label>
          <select v-model="category">
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="cast-zone">
        <div class="coins-block">
          <div class="coins-row">
            <div v-for="(f, ci) in coinFaces" :key="ci" class="coin-tilt">
              <div class="coin" :class="{ back: f, spin: spinning }">
                <span>{{ f ? '背' : '字' }}</span>
              </div>
            </div>
          </div>
          <div class="cast-btns">
            <button v-if="phase !== 'done'" :disabled="phase === 'tossing'" @click="shake()">
              {{ phase === 'tossing' ? `第 ${round + 1} 爻摇制中…` : '⚱ 焚香摇卦' }}
            </button>
            <button v-else class="ghost" @click="reset()">↺ 再问一卦</button>
            <span class="note">已得 {{ cast.length }} / 6 爻</span>
          </div>
        </div>

        <div class="stack" aria-label="卦象">
          <div v-for="i in 6" :key="i" class="slot">
            <template v-if="cast[6 - i] !== undefined">
              <div class="yline" :class="lineClass(cast[6 - i] === 7 || cast[6 - i] === 9, cast[6 - i] === 6 || cast[6 - i] === 9)">
                <template v-if="cast[6 - i] === 7 || cast[6 - i] === 9"><i></i></template>
                <template v-else><i></i><i></i></template>
                <em v-if="cast[6 - i] === 6 || cast[6 - i] === 9" class="mdot">●</em>
              </div>
              <span class="ylab">{{ COIN_LABEL[cast[6 - i] as 6 | 7 | 8 | 9] }}</span>
            </template>
            <span v-else class="empty-hint">第 {{ 7 - i }} 爻待摇</span>
          </div>
        </div>
      </div>

      <div class="manual-toggle">
        <button class="ghost sm" @click="manualMode = !manualMode; sfx.toggle()">
          {{ manualMode ? '收起手动报卦' : '线下自己摇好了？手动报卦 →' }}
        </button>
        <div v-if="manualMode" class="manual-grid">
          <div v-for="i in 6" :key="i">
            <label>{{ 7 - i }}爻</label>
            <select v-model.number="manual[6 - i]">
              <option v-for="o in MANUAL_OPTS" :key="o.v" :value="o.v">{{ o.label }}</option>
            </select>
          </div>
          <button class="sm go" @click="manualAssemble()">直接装卦</button>
        </div>
      </div>
    </div>

    <template v-if="result && phase === 'done'">
      <div class="card">
        <div class="board-head2">
          <h2 style="margin-bottom: 0">卦盘 · {{ result.ben.name }}<template v-if="result.bian"> → {{ result.bian.name }}</template></h2>
          <button class="ghost sm" @click="copyReading()">{{ copied ? '✔ 已复制' : '⧉ 复制解读' }}</button>
        </div>
        <p v-if="ysLabel" class="note ys-hint">高亮行为本类事的用神——<b>{{ ysLabel }}</b>爻，先看它旺不旺。</p>
        <div class="board" :class="{ two: !!result.bian }">
          <table class="gua-table">
            <thead>
              <tr><th>六兽</th><th>本卦 {{ result.ben.name }}</th><th></th><th>位</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in benRows" :key="r.pos" :class="{ mv: r.moving, ys: r.isYs }">
                <td class="ls">{{ r.liushou }}</td>
                <td>
                  <b :class="`ele-${r.wx}`">{{ r.liuqin }}</b> <span class="gz">{{ r.najia }}</span><i class="wx-dot" :class="`ele-${r.wx}`">{{ r.wx }}</i>
                  <em v-if="r.isYs" class="ys-tag">用神</em>
                </td>
                <td class="glyph-cell"><span :class="lineClass(r.yang, r.moving)" class="inline"><i></i></span><em v-if="r.moving" class="mv-em">动</em></td>
                <td class="mark"><b v-if="r.mark">{{ r.mark }}</b></td>
              </tr>
            </tbody>
          </table>
          <table v-if="result.bian && bianRows.length" class="gua-table bian">
            <thead>
              <tr><th colspan="2">变卦 {{ result.bian.name }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in bianRows" :key="r.pos" :class="{ mv: benRows[i]?.moving }">
                <td class="glyph-cell"><span :class="lineClass(r.yang, false)" class="inline"><i></i></span></td>
                <td>
                  <template v-if="benRows[i]?.moving">
                    <b :class="`ele-${r.wx}`">{{ r.liuqin }}</b> <span class="gz">{{ r.najia }}</span>
                  </template>
                  <span v-else class="dim-note">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="note" style="margin-top: 10px">
          日辰 {{ result.ctx.dayGZ }} · 月建 {{ result.ctx.monthGZ }} · 旬空 {{ result.ctx.kong }} · 卦身属{{ result.ben.gongWuxing }}（{{ result.ben.gong }}宫）
        </p>
      </div>

      <div class="card">
        <h2>白话提示</h2>
        <p v-for="(t, i) in result.reading" :key="i" class="reading-line" :style="{ animationDelay: `${i * 0.08}s` }">{{ t }}</p>
      </div>
    </template>

    <div v-if="history.length" class="card">
      <div class="board-head2">
        <h2 style="margin-bottom: 0">最近问过的卦（本地保存）</h2>
        <button class="ghost sm" @click="clearHistory()">清空</button>
      </div>
      <table>
        <tbody>
          <tr v-for="h in history.slice(0, 6)" :key="h.ts" class="his-row" @click="replay(h)">
            <td class="his-name">{{ h.benName }}<template v-if="h.bianName"> → {{ h.bianName }}</template></td>
            <td class="note">{{ h.cat }}{{ h.q ? ' · ' + h.q : '' }}</td>
            <td class="note his-ts">{{ new Date(h.ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</td>
            <td><span class="tag teal pointer">复盘</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="board-head2">
        <h2 style="margin-bottom: 0">六十四卦卦库 · 不摇卦也能预习</h2>
        <button class="ghost sm" @click="libOpen = !libOpen; sfx.toggle()">{{ libOpen ? '收起卦库 ▴' : '展开卦库 ▾' }}</button>
      </div>
      <p class="sub">按京房八宫次序排列。点任意一卦，立刻看它的纳甲、六亲、世应与白话点睛。</p>
      <transition name="pop">
        <div v-if="libOpen" class="lib-grid">
          <button
            v-for="(g, gi) in CATALOG" :key="g.bits"
            v-reveal="(gi % 8) * 25"
            class="lib-card"
            :class="{ on: libSel === g.bits }"
            @click="pickLib(g.bits)"
          >
            <span class="lib-lines"><i v-for="k in 6" :key="k" :class="{ yang: g.bits[6 - k] === '1' }"></i></span>
            <span class="lib-name">{{ g.name }}</span>
          </button>
        </div>
      </transition>
      <transition name="pop">
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
      </transition>
    </div>
  </main>
</template>

<style scoped>
.ask-row { display: grid; grid-template-columns: 1fr 180px; gap: 12px; margin-bottom: 14px; }

.cast-zone {
  display: grid;
  grid-template-columns: auto 150px;
  gap: 22px;
  align-items: center;
  border-top: 1px dashed var(--line);
  padding-top: 16px;
}
.coins-block { display: flex; flex-direction: column; gap: 14px; }
.coins-row { display: flex; gap: 16px; perspective: 500px; }
.coin-tilt { transform: rotateX(14deg); }
.coin {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--cute);
  font-size: 1.18rem;
  background: radial-gradient(circle at 34% 30%, #ffe9a8, #d8a94e 62%, #a87c2c);
  color: #5c3d08;
  border: 3px solid #8a6420;
  box-shadow: inset 0 0 0 4px rgba(255, 244, 200, 0.55), inset 0 -5px 9px rgba(90, 60, 10, 0.45), 0 7px 15px rgba(0, 0, 0, 0.35);
  transition: background 0.25s ease;
}
.coin.back { background: radial-gradient(circle at 34% 30%, #f2ede0, #cfc4ab 60%, #a2967a); color: #4a4436; }
.coin.spin { animation: coin-flip 0.22s linear infinite; }
@keyframes coin-flip {
  0% { transform: rotateX(0deg) translateY(0); }
  50% { transform: rotateX(180deg) translateY(-13px); }
  100% { transform: rotateX(360deg) translateY(0); }
}
.cast-btns { display: flex; align-items: center; gap: 12px; }
.cast-btns button:disabled { opacity: 0.65; cursor: wait; }

.stack { display: flex; flex-direction: column-reverse; gap: 9px; justify-content: center; min-height: 240px; }
.slot { display: flex; align-items: center; gap: 10px; min-height: 26px; animation: yao-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes yao-in {
  from { opacity: 0; transform: translateX(-26px); filter: blur(3px); }
  to { opacity: 1; transform: none; filter: none; }
}
.empty-hint { color: var(--dim); font-size: 0.74rem; opacity: 0.55; letter-spacing: 0.2em; }
.yline { position: relative; display: flex; gap: 10px; width: 132px; }
.yline i { display: block; height: 11px; flex: 1; border-radius: 3px; background: linear-gradient(140deg, var(--gold), color-mix(in srgb, var(--gold) 70%, #000)); box-shadow: 0 0 10px rgba(var(--acc-rgb), 0.35); }
.yline.shao-yin i { max-width: 57px; }
.yline.lao-yin i { max-width: 57px; background: linear-gradient(140deg, var(--teal), color-mix(in srgb, var(--teal) 70%, #000)); }
.yline.lao-yang i { background: linear-gradient(140deg, var(--teal), color-mix(in srgb, var(--teal) 70%, #000)); }
.mdot { position: absolute; right: -18px; top: -3px; color: var(--teal); font-size: 0.72rem; animation: mdot-pulse 1.6s ease-in-out infinite; }
@keyframes mdot-pulse { 50% { opacity: 0.35; } }
.ylab { font-size: 0.68rem; color: var(--dim); }

.manual-toggle { margin-top: 16px; }
.manual-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; align-items: end; margin-top: 10px; }
.manual-grid label { margin-top: 0; }
button.sm { padding: 7px 13px; font-size: 0.85rem; }
.go { grid-column: 7; }

.board-head2 { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.ys-hint b { color: var(--gold-bright); }
.board { display: grid; grid-template-columns: 1fr; gap: 14px; }
.board.two { grid-template-columns: 1.6fr 1fr; }
.gua-table td, .gua-table th { padding: 7px 8px; }
.gua-table tbody tr { transition: background 0.2s ease; }
.gua-table tbody tr:hover { background: rgba(var(--acc-rgb), 0.05); }
.gua-table tr.mv { background: rgba(var(--acc2-rgb), 0.06); }
.gua-table tr.ys { box-shadow: inset 3px 0 0 var(--gold); background: rgba(var(--acc-rgb), 0.07); }
.ls { color: var(--teal); font-size: 0.78rem; white-space: nowrap; }
.gz { color: var(--fg); font-family: var(--cute); letter-spacing: 0.08em; }
.wx-dot { font-style: normal; font-size: 0.66rem; margin-left: 6px; opacity: 0.85; }
.ys-tag {
  font-style: normal;
  margin-left: 7px;
  font-size: 0.6rem;
  color: var(--on-accent);
  background: var(--gold);
  border-radius: 999px;
  padding: 1px 7px;
  vertical-align: 1px;
}
.mark b { color: var(--gold-bright); font-family: var(--cute); }
.inline { display: inline-flex; gap: 5px; width: 64px; vertical-align: middle; }
.inline i { height: 8px; flex: 1; border-radius: 2px; background: linear-gradient(140deg, var(--gold), color-mix(in srgb, var(--gold) 70%, #000)); }
.inline.shao-yin i, .inline.lao-yin i { max-width: 27px; }
.inline.lao-yang i, .inline.lao-yin i { background: linear-gradient(140deg, var(--teal), color-mix(in srgb, var(--teal) 70%, #000)); }
.mv-em { font-style: normal; color: var(--teal); font-size: 0.7rem; margin-left: 6px; }
.dim-note { color: var(--dim); opacity: 0.5; }
.reading-line { margin-bottom: 10px; line-height: 1.95; font-size: 0.9rem; animation: yao-in 0.5s ease both; }

.his-row { cursor: pointer; }
.his-row:hover td { color: var(--gold-bright); }
.his-name { font-family: var(--cute); white-space: nowrap; }
.his-ts { white-space: nowrap; }
.pointer { cursor: pointer; }

.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.lib-card {
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
.lib-card:hover { transform: translateY(-4px); border-color: rgba(var(--acc-rgb), 0.5); }
.lib-card.on { border-color: var(--gold); box-shadow: 0 0 14px rgba(var(--acc-rgb), 0.25); }
.lib-lines { display: flex; flex-direction: column-reverse; gap: 3px; width: 46px; }
.lib-lines i { display: block; height: 4px; border-radius: 2px; background: var(--dim); opacity: 0.55; }
.lib-lines i.yang { background: var(--gold-bright); opacity: 1; box-shadow: 0 0 6px rgba(var(--acc-rgb), 0.5); }
.lib-lines i:not(.yang) { max-width: 60%; }
.lib-lines i:nth-child(2):not(:only-child) { margin-left: auto; }
.lib-name { font-size: 0.72rem; color: var(--dim); }
.lib-card.on .lib-name { color: var(--gold-bright); }

.lib-detail {
  margin-top: 16px;
  border: 1px dashed rgba(var(--acc-rgb), 0.4);
  border-radius: 12px;
  padding: 14px 16px;
  animation: yao-in 0.4s ease both;
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

@media (max-width: 800px) {
  .ask-row { grid-template-columns: 1fr; }
  .cast-zone { grid-template-columns: 1fr; }
  .board.two { grid-template-columns: 1fr; }
  .manual-grid { grid-template-columns: repeat(3, 1fr); }
  .go { grid-column: auto; }
}
</style>
