<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PillarsBoard from '../components/PillarsBoard.vue'
import DecryptTitle from '../components/DecryptTitle.vue'
import RadarChart from '../components/RadarChart.vue'
import ScoreRing from '../components/ScoreRing.vue'
import DayunTimeline from '../components/DayunTimeline.vue'
import DayunRiver from '../components/DayunRiver.vue'
import DayunVoyage3D from '../components/DayunVoyage3D.vue'
import ShareButton from '../components/ShareButton.vue'
import RichText from '../components/RichText.vue'
import BranchWheel from '../components/BranchWheel.vue'
import { ELE_S } from '../lib/constants'
import type { ChartResult } from '../lib/engine'
import { interpret } from '../lib/interpret'
import { clearHistory, HistoryItem, loadHistory, saveHistory } from '../lib/history'
import { loadPool, percentile, poolReady, runChart } from '../lib/runtime'
import { sfx } from '../lib/sfx'
import { Solar } from 'lunar-javascript'

const dt = ref('2002-10-26')
const tm = ref('10:15')
const gender = ref(1)
const result = ref<ChartResult | null>(null)
const openBlock = ref<number | null>(0)
const poolN = ref(0)
const selftesting = ref(false)
const selftestOut = ref<string>('')
const historyList = ref<HistoryItem[]>(loadHistory())

onMounted(async () => {
  try {
    const j = await loadPool()
    poolN.value = j.n
  } catch {
    poolN.value = -1 // 装载失败：评分仍可算，只是百分位对比不可用
  }
})

function calc(): void {
  const dtp = dt.value.split('-').map(Number)
  const tmp = tm.value.split(':').map(Number)
  if (dtp.length < 3 || tmp.length < 2) return alert('请填写完整日期与时间')
  if (tmp[0] === 23) return alert('晚子时(23:00后)因换日流派争议暂不支持')
  if (gender.value === 0) return alert('女命百分位池建设中，暂只支持男命')
  sfx.gong()
  result.value = runChart(dtp[0]!, dtp[1]!, dtp[2]!, tmp[0]!, tmp[1]!, gender.value)
  openBlock.value = 0
  window.dispatchEvent(new CustomEvent('sage-say', { detail: `盘面出来了。日主${result.value.dmg}，先看七维雷达再听我细说。` }))

  const p = percentile(result.value.tot)
  saveHistory({
    y: dtp[0]!, m: dtp[1]!, d: dtp[2]!, hh: tmp[0]!, mm: tmp[1]!,
    gender: gender.value,
    tot: result.value.tot,
    pctl: isFinite(p) ? p : null,
    pillars: result.value.ps as unknown as string[],
    ts: Date.now(),
  })
  historyList.value = loadHistory()
}

function preset(d: string, t: string): void {
  dt.value = d
  tm.value = t
  gender.value = 1
  sfx.toggle()
  calc()
}

async function selftest(): Promise<void> {
  if (!poolReady()) await new Promise((res) => setTimeout(res, 800))
  selftesting.value = true
  selftestOut.value = ''
  try {
    const V = await fetch('./data/test_vectors.json').then((r) => r.json())
    const lines: string[] = []
    let pass = 0
    for (const v of V) {
      const r = runChart(v.y, v.m, v.d, v.h, 30, 1)
      const rawTot = 22 * r.s + 20 * r.g + 10 * r.c + 16 * r.t + 14 * r.lk + 10 * r.zs + 8 * r.sh
      const okTot = Math.abs(rawTot - v.tot) < 1.5
      const okLk = Math.abs(r.lk - v.lk) < 1.8
      const okZs = Math.abs(r.zs - v.zs) < 0.15
      const okCore = r.s === v.s && r.c === v.c && Math.abs(r.g - v.g) < 0.05 && r.t === v.t
      const gzOk = r.ps.join(' ') === v.gz
      const ok = okTot && okLk && okZs && okCore && gzOk
      if (ok) pass++
      lines.push(
        `${v.label}: ${gzOk ? '✔' : '✘'}盘面 tot=${rawTot.toFixed(1)}(期${v.tot}) lk=${r.lk.toFixed(3)}(期${v.lk}) zs=${r.zs.toFixed(2)}(期${v.zs}) ${ok ? '✔' : '✘'}`,
      )
    }
    selftestOut.value = `自检结果 ${pass}/${V.length}\n` + lines.join('\n') + '\n\n容差：tot ±1.5 · 大运 ±1.8 · 紫微 ±0.15（JS 与 Python 历法库起运漂移，natal/yinshi 实际全对齐）'
    if (pass === V.length) { sfx.ding(); window.dispatchEvent(new CustomEvent('sage-say', { detail: `自检 ${pass}/${V.length} 全过，引擎没偷懒。` })) }
  } catch (e) {
    selftestOut.value = '自检失败：' + String(e)
  }
  selftesting.value = false
}

const blocks = computed(() => {
  const r = result.value
  if (!r) return []
  return [
    { name: '结构', score: r.s, max: 22, detail: `五行齐缺/六冲×${r.chong}/自刑×${r.zx}/禄刃根/强弱系数 ${r.r.toFixed(2)}${r.cong ? (r.pure ? '(纯从格)' : '(假从格)') : ''}` },
    { name: '格局', score: r.g, max: 20, detail: `根气信用: ${r.gdet.join(', ')}` + (r.byao ? ' +病药相济7' : '') },
    { name: '层次', score: r.c, max: 10, detail: '成势吉神(≥2字+强根)' },
    { name: '调候', score: r.t, max: 16, detail: `寒燥平衡(月令:${r.ps[1][1]})` },
    { name: '大运联动', score: r.lk, max: 14, detail: '平滑亲和度+九类合冲刑会交互' },
    { name: '紫微三方', score: r.zs, max: 10, detail: '命宫三方四正吉煞与四化' },
    { name: '神煞', score: r.sh, max: 8, detail: r.got.length ? r.got.join('/') : '—' },
  ]
})

const radarItems = computed(() =>
  blocks.value.map((b) => ({ name: b.name, score: b.score, max: b.max })),
)

const pctlText = computed(() => {
  if (!result.value) return ''
  const p = percentile(result.value.tot)
  return isFinite(p) ? `超过 ${(100 - p).toFixed(1)}% 的同龄男命（第 ${p.toFixed(1)} 百分位 / ${poolN.value.toLocaleString()} 盘）` : poolN.value === -1 ? '百分位池暂时不可用，评分本身不受影响' : '百分位池加载中…'
})

const interpretations = computed(() => (result.value ? interpret(result.value) : []))

const shareSpec = computed(() => {
  const r = result.value
  if (!r) return null
  return {
    title: `${r.ps.join(' ')} 命盘`,
    subtitle: `日主 ${r.dmg} · 综合评分与七维明细 · 天机阁量化引擎 v5`,
    pillars: [...r.ps],
    total: r.tot.toFixed(1) + ' 分',
    scores: blocks.value.map((b) => [b.name, Math.max(0, b.score)] as [string, number]),
    notes: [pctlText.value || '', '规则全公开可审计 · 仅供传统文化研究与娱乐参考'],
  }
})

function ganEle(p: string): string {
  return ELE_S[p[0]]!
}

function restore(h: HistoryItem): void {
  dt.value = `${h.y}-${String(h.m).padStart(2, '0')}-${String(h.d).padStart(2, '0')}`
  tm.value = `${String(h.hh).padStart(2, '0')}:${String(h.mm).padStart(2, '0')}`
  gender.value = h.gender
  sfx.toggle()
  calc()
}

function lunarInfo(): string {
  const dtp = dt.value.split('-').map(Number)
  const solar = Solar.fromYmdHms(dtp[0]!, dtp[1]!, dtp[2]!, 12, 0, 0)
  const lunar = solar.getLunar()
  return `农历 ${lunar.toString()} ${lunar.getYearInGanZhiExact()}年 · 生肖${lunar.getYearShengXiao()}`
}
</script>

<template>
  <main class="page">
    <div class="card">
      <h2><DecryptTitle text="四柱排盘 · v5 公开规则引擎" /></h2>
      <p class="sub" style="margin-bottom: 6px">
        权重：结构22 / 格局20 / 层次10 / 调候16 / 大运联动14 / 紫微10 / 神煞8 —— 全部公开可审计
      </p>
      <div class="form-row">
        <div><label>公历出生日期</label><input v-model="dt" type="date" /></div>
        <div><label>出生时间(24小时制)</label><input v-model="tm" type="time" /></div>
        <div><label>性别</label><select v-model="gender"><option :value="1">男</option><option :value="0">女</option></select></div>
        <div class="btn-cell"><button @click="calc()">☯ 开始评分</button><button class="ghost" @click="selftest()">⚙ 引擎自检</button></div>
      </div>
      <div class="presets">
        预设：
        <span class="tag teal pointer" @click="preset('2002-10-26', '10:30')">A·2002巳时盘</span>
        <span class="tag teal pointer" @click="preset('1997-10-22', '03:30')">B·1997寅时盘</span>
        <span class="tag teal pointer" @click="preset('1997-10-22', '11:30')">C·1997午时盘</span>
        <span class="tag">{{ lunarInfo() }}</span>
      </div>
      <div class="note">⚠️ 晚子时暂不支持｜女命百分位池建设中｜真太阳时未自动校正｜仅供传统文化研究与娱乐参考。</div>

      <transition name="pop">
        <pre v-if="selftestOut" class="selftest">{{ selftestOut }}</pre>
      </transition>
      <span v-if="selftesting" class="sub">⚙ 自检运行中…</span>
    </div>

    <template v-if="result">
      <div class="card">
        <h2>四柱八字 · 点击卡片听翻牌声</h2>
        <PillarsBoard :ps="result.ps" :hide="result.hide" />
        <p v-if="result.kong" class="note" style="margin-top: 8px; text-align: center">
          日柱旬空：<b class="tag red">{{ result.kong }}</b> —— 旬空之支力量打折，吉神空亡减福、凶煞空亡减凶
        </p>
        <p class="sub" style="margin-top: 10px">
          日主 <b class="ele" :class="`ele-${ganEle(result.ps[2])}`">{{ result.ps[2][0] }}</b>，
          同党占比 r={{ result.r.toFixed(2) }}，喜用参考：
          <b v-for="f in result.fav" :key="f" class="ele" :class="`ele-${f}`" style="margin-right: 8px">{{ f }}</b>
        </p>
      </div>

      <div class="grid-2">
        <div class="card center-card">
          <h2>总分与百分位</h2>
          <ScoreRing :value="result.tot" :max="100" label="综合评分" />
          <p class="pctl-line">{{ pctlText }}</p>
          <svg width="240" height="130" viewBox="0 0 240 130" class="gauge">
            <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="var(--bar)" stroke-width="13" stroke-linecap="round" />
            <path
              d="M 20 120 A 100 100 0 0 1 220 120" fill="none"
              stroke="url(#gaugeGrad)" stroke-width="13" stroke-linecap="round"
              :stroke-dasharray="`${(percentile(result.tot) / 100) * Math.PI * 100} ${Math.PI * 200}`"
            />
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#f87171" /><stop offset="50%" stop-color="#fbbf24" /><stop offset="100%" stop-color="#5eead4" />
              </linearGradient>
            </defs>
            <text x="120" y="112" text-anchor="middle" class="gauge-txt">百分位 {{ isFinite(percentile(result.tot)) ? percentile(result.tot).toFixed(1) + '%' : '…' }}</text>
          </svg>
          <div class="note">弧线越长 = 排名越靠前（左低右高）</div>
          <ShareButton v-if="shareSpec" :spec="shareSpec" filename="tianji-chart.png" style="margin-top: 12px" />
        </div>
        <div class="card center-card">
          <h2>七维能力雷达</h2>
          <RadarChart :items="radarItems" />
        </div>
      </div>

      <div class="card">
        <h2>分项明细 · 点击展开说明</h2>
        <div v-for="(b, i) in blocks" :key="b.name" class="block-row" @click="openBlock = openBlock === i ? null : i; sfx.blip()">
          <div class="block-head">
            <span class="b-name">{{ b.name }}</span>
            <span class="bar"><i :style="{ width: `${Math.max(0, Math.min(100, b.score / b.max * 100))}%` }"></i></span>
            <span class="b-score">{{ b.score.toFixed(1) }} / {{ b.max }}</span>
            <span class="caret-t">{{ openBlock === i ? '▾' : '▸' }}</span>
          </div>
          <div v-if="openBlock === i" class="block-detail sub">{{ b.detail }}</div>
        </div>
      </div>

      <div class="card">
        <h2>大运时间轴 · 未来 25 年评估窗口</h2>
        <DayunTimeline :items="result.dlist" />
      </div>

      <div class="card" v-reveal>
        <h2>地支关系盘 · 刑冲合害一图看全</h2>
        <BranchWheel :present="result.ps.map((p) => p[1]!)" />
      </div>

      <div v-if="result.dlist.length" class="card" v-reveal>
        <h2>命运长河 · 顺逆一望便知</h2>
        <DayunRiver :stops="result.dlist.map((d) => ({ gz: d.gz, window: d.window, fin: d.fin }))" />
      </div>

      <div v-if="result.dlist.length" class="card" v-reveal>
        <h2>大运山河 · 三维巡游</h2>
        <p class="sub" style="margin: -4px 0 10px">
          十年一步化作连绵山峦：山势越高这步运越顺，金色光点正沿你的运途巡回。
          点击任意山峰，下方时间轴会同步定位到那十年。
        </p>
        <DayunVoyage3D :stops="result.dlist.map((d) => ({ gz: d.gz, window: d.window, fin: d.fin }))" />
      </div>

      <div class="card">
        <h2>白话解读 · 悬浮金色词条可看术语通典</h2>
        <div v-for="sec in interpretations" :key="sec.title" class="interp">
          <div class="i-title">◆ {{ sec.title }}</div>
          <p class="i-text"><RichText :text="sec.text" /></p>
        </div>
      </div>

      <div class="card">
        <h2>最近排盘记录（本地保存）</h2>
        <div v-if="historyList.length === 0" class="sub">暂无记录——每次排盘会自动保存到浏览器。</div>
        <table v-else>
          <tr><th>四柱</th><th>出生</th><th>总分</th><th>百分位</th><th></th></tr>
          <tr v-for="h in historyList.slice(0, 8)" :key="h.ts">
            <td>{{ h.pillars.join(' ') }}</td>
            <td>{{ h.y }}-{{ String(h.m).padStart(2, '0') }}-{{ String(h.d).padStart(2, '0') }} {{ String(h.hh).padStart(2, '0') }}时</td>
            <td>{{ h.tot.toFixed(2) }}</td>
            <td>{{ h.pctl !== null ? h.pctl.toFixed(1) + '%' : '—' }}</td>
            <td><span class="tag teal pointer" @click="restore(h)">复算</span></td>
          </tr>
        </table>
        <div style="margin-top: 10px"><button class="ghost" @click="clearHistory(); historyList = []">清空记录</button></div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.form-row { display: grid; grid-template-columns: 1.4fr 1fr 0.7fr auto; gap: 12px; align-items: end; }
.btn-cell { display: flex; gap: 8px; padding-bottom: 1px; }
.presets { margin: 12px 0 8px; font-size: 0.82rem; color: var(--dim); }
.pointer { cursor: pointer; }
.pointer:hover { border-color: var(--teal); color: var(--teal); }

.selftest {
  margin-top: 14px;
  background: var(--inset);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 0.78rem;
  line-height: 1.9;
  color: var(--teal);
  white-space: pre-wrap;
  overflow-x: auto;
}

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.center-card { text-align: center; }
.pctl-line { color: var(--amber); font-size: 0.92rem; margin: 8px 0; }
.gauge-txt { fill: var(--dim); font-size: 13px; }

.block-row { padding: 7px 4px; border-bottom: 1px dashed var(--line); cursor: pointer; transition: background 0.2s ease; }
.block-row:hover { background: rgba(255, 255, 255, 0.03); }
.block-head { display: flex; align-items: center; gap: 14px; }
.b-name { min-width: 74px; color: var(--fg); font-size: 0.88rem; }
.b-score { min-width: 86px; text-align: right; color: var(--gold-bright); font-family: var(--cute); }
.bar { flex: 1; margin: 0 !important; }
.caret-t { color: var(--dim); width: 14px; }
.block-detail { padding: 8px 6px 2px 90px; }

.interp { margin-bottom: 14px; }
.i-title { color: var(--gold); font-family: var(--cute); margin-bottom: 5px; }
.i-text { color: var(--fg); font-size: 0.88rem; line-height: 2; white-space: pre-line; }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-enter-from { opacity: 0; transform: translateY(-8px); }
.pop-leave-active { display: none; }

@media (max-width: 800px) {
  .form-row { grid-template-columns: 1fr 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
  .block-detail { padding-left: 8px; }
}
</style>
