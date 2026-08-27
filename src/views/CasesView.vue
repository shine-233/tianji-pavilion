<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import { computed, onMounted, ref } from 'vue'
import { ELE_B, ELE_S } from '../lib/constants'
import { sfx } from '../lib/sfx'
import { vTilt } from '../lib/tilt'

interface MasterCase {
  pillars: string
  sources: string[]
  tier: number | null
  kw: string
  conflict: boolean
  n_sources: number
  ctx: string
  teaching: boolean
}
interface QianliCase {
  pillars: string
  label: string
  ctx: string
}

const master = ref<MasterCase[]>([])
const qianli = ref<QianliCase[]>([])
const loading = ref(true)
const loadErr = ref(false)
const entered = ref(false)

const tab = ref<'master' | 'qianli'>('master')
const selBook = ref<string | null>(null)
const selTier = ref<string>('all')
const query = ref('')
const openIdx = ref<number | null>(null)
const shown = ref(24)

const TIER_LABEL: Record<string, string> = {
  all: '全部',
  t1: '一级标注',
  t2: '二级标注',
  none: '未标注',
}

onMounted(async () => {
  try {
    const [m, q] = await Promise.all([
      fetch('./data/classics_master_final.json').then((x) => x.json()),
      fetch('./data/qianli_cases_v2.json').then((x) => x.json()),
    ])
    master.value = m
    qianli.value = q
  } catch (e) {
    console.warn('案例库数据装载失败:', e)
    loadErr.value = true
  } finally {
    loading.value = false
    requestAnimationFrame(() => (entered.value = true))
  }
})

function gan(c: string): string {
  return c[0] ?? ''
}
function zhi(c: string): string {
  return c[1] ?? ''
}
function ganClass(c: string): string {
  return ELE_S[gan(c)] ? `ele-${ELE_S[gan(c)]}` : ''
}
function zhiBg(c: string): string {
  return ELE_B[zhi(c)] ? `bg-${ELE_B[zhi(c)]}` : ''
}
function parts(pillars: string): string[] {
  return pillars.trim().split(/\s+/).slice(0, 4)
}

const books = computed(() => {
  const m = new Map<string, number>()
  master.value.forEach((c) => c.sources.forEach((s) => m.set(s, (m.get(s) ?? 0) + 1)))
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, n: v }))
})

const labeledN = computed(() => master.value.filter((c) => c.tier !== null).length)
const crossN = computed(() => master.value.filter((c) => c.n_sources > 1).length)

const filteredMaster = computed(() => {
  const q = query.value.trim()
  return master.value.filter((c) => {
    if (selBook.value && !c.sources.includes(selBook.value)) return false
    if (selTier.value === 't1' && c.tier !== 1) return false
    if (selTier.value === 't2' && c.tier !== 2) return false
    if (selTier.value === 'none' && c.tier !== null) return false
    if (!q) return true
    return c.pillars.includes(q) || c.kw.includes(q) || c.ctx.includes(q)
  })
})

const filteredQianli = computed(() => {
  const q = query.value.trim()
  if (!q) return qianli.value
  return qianli.value.filter((c) => c.pillars.includes(q) || c.ctx.includes(q))
})

const totalShown = computed(() =>
  tab.value === 'master' ? filteredMaster.value.length : filteredQianli.value.length,
)

function switchTab(t: 'master' | 'qianli'): void {
  sfx.toggle()
  tab.value = t
  openIdx.value = null
  shown.value = 24
}

function pickBook(b: string): void {
  sfx.blip()
  selBook.value = selBook.value === b ? null : b
  openIdx.value = null
  shown.value = 24
}

function pickTier(t: string): void {
  sfx.blip()
  selTier.value = t
  openIdx.value = null
  shown.value = 24
}

function toggle(i: number): void {
  sfx.pop()
  openIdx.value = openIdx.value === i ? null : i
}

function more(): void {
  sfx.blip()
  shown.value += 24
}

/** 把 ctx 里的 ⏎ 换成真实换行并截断 */
function fmtCtx(ctx: string): string {
  return ctx.replace(/⏎/g, '\n')
}
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2><DecryptTitle text="案例库 · 古籍命例数字化" /></h2>
      <p class="sub">
        从典籍原文中自动抽取四柱命例，人工复核标注吉凶层级，并对多书重复记载做交叉互证。
        点击案例卡展开古籍原文语境。哪条标错了，欢迎来规则页提。
      </p>
      <div class="stats">
        <div class="stat"><span class="big-num">{{ master.length }}</span><span class="note">个典籍命例</span></div>
        <div class="stat"><span class="big-num">{{ labeledN }}</span><span class="note">个已标注</span></div>
        <div class="stat"><span class="big-num">{{ crossN }}</span><span class="note">个多书互证</span></div>
        <div class="stat"><span class="big-num">{{ qianli.length }}</span><span class="note">千里命稿例</span></div>
      </div>
    </div>

    <div v-if="loading" class="card"><p class="sub">📜 案例库装载中…</p></div>
    <div v-else-if="loadErr" class="card"><p class="sub">⚠️ 案例库装载失败，请检查网络后刷新重试。</p></div>

    <template v-if="!loading && !loadErr">
      <!-- 标签页 -->
      <div class="tabs card">
        <button class="tab-btn" :class="{ on: tab === 'master' }" @click="switchTab('master')">典籍互证 · {{ filteredMaster.length }}</button>
        <button class="tab-btn" :class="{ on: tab === 'qianli' }" @click="switchTab('qianli')">千里命稿 · {{ filteredQianli.length }}</button>
        <input v-model="query" type="text" class="q" placeholder="搜索四柱 / 关键词 / 原文…" @input="openIdx = null; shown = 24" />
      </div>

      <!-- 筛选（仅典籍页） -->
      <div v-if="tab === 'master'" class="card">
        <div class="filter-row">
          <span
            v-for="[k, label] in Object.entries(TIER_LABEL)" :key="k"
            class="tag cat-tag" :class="{ on: selTier === k }"
            @click="pickTier(k)"
          >{{ label }}</span>
        </div>
        <div class="filter-row">
          <span
            v-for="b in books" :key="b.name"
            class="tag cat-tag" :class="{ on: selBook === b.name }"
            @click="pickBook(b.name)"
          >{{ b.name }} <b>{{ b.n }}</b></span>
        </div>
      </div>

      <!-- 典籍案例网格 -->
      <div v-if="tab === 'master'" class="c-grid" :class="{ loaded: entered }">
        <button
          v-for="(c, i) in filteredMaster.slice(0, shown)" :key="i"
          v-tilt="8" class="c-card" :class="{ on: openIdx === i }"
          :style="{ transitionDelay: entered ? `${Math.min((i % 24) * 24, 420)}ms` : '0ms' }"
          @click="toggle(i)"
        >
          <span class="pillars">
            <span v-for="(p, pi) in parts(c.pillars)" :key="pi" class="pillar">
              <i class="gan" :class="ganClass(p)">{{ gan(p) }}</i>
              <i class="zhi" :class="zhiBg(p)">{{ zhi(p) }}</i>
            </span>
          </span>
          <span class="badges">
            <span v-if="c.kw && c.tier" class="tag gold">{{ c.tier === 1 ? '★' : '☆' }} {{ c.kw.split('/')[0] }}</span>
            <span v-if="c.n_sources > 1" class="tag teal">互证 ×{{ c.n_sources }}</span>
            <span v-if="c.conflict" class="tag red">冲突</span>
            <span v-if="!c.tier" class="tag">未标注</span>
          </span>
        </button>
      </div>
      <p v-else-if="totalShown === 0" class="card sub">没有匹配的案例，换个关键词试试。</p>

      <!-- 千里命稿列表 -->
      <div v-if="tab === 'qianli'" class="ql-list" :class="{ loaded: entered }">
        <button
          v-for="(c, i) in filteredQianli.slice(0, shown)" :key="i"
          class="r-item" :class="{ on: openIdx === i }"
          :style="{ transitionDelay: entered ? `${Math.min((i % 24) * 20, 400)}ms` : '0ms' }"
          @click="toggle(i)"
        >
          <span class="pillars inline">
            <span v-for="(p, pi) in parts(c.pillars)" :key="pi" class="pillar">
              <i class="gan" :class="ganClass(p)">{{ gan(p) }}</i>
              <i class="zhi" :class="zhiBg(p)">{{ zhi(p) }}</i>
            </span>
          </span>
          <span v-if="c.label" class="tag gold">{{ c.label }}</span>
          <span class="caret-t">{{ openIdx === i ? '▾' : '▸' }}</span>
        </button>
      </div>

      <!-- 加载更多 -->
      <div v-if="totalShown > shown" class="center-row">
        <button class="ghost" @click="more()">再展开 24 例 ↓（余 {{ totalShown - shown }}）</button>
      </div>

      <!-- 详情 -->
      <transition name="pop">
        <div v-if="openIdx !== null && tab === 'master' && filteredMaster[openIdx]" class="card detail-card">
          <h2>
            {{ filteredMaster[openIdx].pillars }}
            <span v-if="filteredMaster[openIdx].tier" class="tag gold" style="margin-left: 8px">
              {{ filteredMaster[openIdx].tier === 1 ? '一级标注' : '二级标注' }} · {{ filteredMaster[openIdx].kw }}
            </span>
            <span v-for="s in filteredMaster[openIdx].sources" :key="s" class="tag teal" style="margin-left: 6px">{{ s }}</span>
          </h2>
          <p class="sub ctx">{{ fmtCtx(filteredMaster[openIdx].ctx) }}</p>
        </div>
      </transition>
      <transition name="pop">
        <div v-if="openIdx !== null && tab === 'qianli' && filteredQianli[openIdx]" class="card detail-card">
          <h2>{{ filteredQianli[openIdx].pillars }} <span v-if="filteredQianli[openIdx].label" class="tag gold" style="margin-left: 8px">{{ filteredQianli[openIdx].label }}</span></h2>
          <p class="sub ctx">{{ fmtCtx(filteredQianli[openIdx].ctx) }}</p>
        </div>
      </transition>
    </template>
  </main>
</template>

<style scoped>
.stats { display: flex; gap: 26px; margin-top: 14px; flex-wrap: wrap; }
.stat { display: flex; align-items: baseline; gap: 7px; }
.stat .big-num { font-size: 1.9rem; }

.tabs { display: flex; gap: 8px; align-items: center; padding: 12px 16px; flex-wrap: wrap; }
.tab-btn {
  background: var(--card-2);
  border: 1px solid var(--line);
  color: var(--dim);
}
.tab-btn.on {
  background: linear-gradient(140deg, var(--gold), #caa14f);
  color: #201804;
  border-color: transparent;
}
.q { flex: 1; min-width: 200px; max-width: 320px; margin-left: auto; }

.filter-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
.cat-tag { cursor: pointer; transition: all 0.2s ease; padding: 4px 12px; }
.cat-tag:hover { border-color: var(--gold); color: var(--gold-bright); transform: translateY(-1px); }
.cat-tag.on { background: linear-gradient(140deg, var(--gold), #caa14f); color: #201804; border-color: transparent; font-weight: bold; }
.cat-tag b { opacity: 0.65; font-size: 0.85em; margin-left: 2px; }

.c-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 10px; }
.c-card {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: linear-gradient(165deg, var(--card-2), var(--panel));
  border: 1px solid var(--line); border-radius: 12px;
  padding: 13px 10px; cursor: pointer; color: var(--fg);
  opacity: 0; transform: translateY(14px);
  transition:
    opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease, box-shadow 0.2s ease;
}
.c-grid.loaded .c-card { opacity: 1; transform: translateY(0); }
.c-card:hover { border-color: rgba(232, 196, 115, 0.55); transform: translateY(-3px); box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4); }
.c-card.on { outline: 2px solid var(--teal); }

.pillars { display: flex; gap: 7px; justify-content: center; }
.pillars.inline { margin-right: 4px; }
.pillar { display: flex; flex-direction: column; align-items: center; width: 30px; border-radius: 7px; overflow: hidden; border: 1px solid var(--line); }
.pillar i { font-style: normal; font-size: 0.92rem; line-height: 1.55; width: 100%; text-align: center; }
.gan { background: rgba(255, 255, 255, 0.04); }
.zhi { background: transparent; }

.badges { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }

.ql-list { display: flex; flex-direction: column; gap: 7px; }
.ql-list .r-item {
  display: flex; align-items: center; gap: 10px; text-align: left; padding: 10px 14px;
  background: linear-gradient(165deg, var(--panel-3), var(--panel));
  border: 1px solid var(--line); border-radius: 11px;
  cursor: pointer; color: var(--fg); font-family: inherit; font-size: 0.86rem;
  opacity: 0; transform: translateY(12px);
  transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease;
}
.ql-list.loaded .r-item { opacity: 1; transform: none; }
.ql-list .r-item:hover { border-color: rgba(94, 234, 212, 0.45); transform: translateX(3px); }
.r-item.on { border-color: var(--gold); }
.caret-t { margin-left: auto; color: var(--dim); }

.center-row { display: flex; justify-content: center; margin: 18px 0; }

.detail-card { border-color: rgba(232, 196, 115, 0.4); }
.ctx {
  white-space: pre-line;
  max-height: 320px; overflow-y: auto;
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px;
  padding: 12px 15px; line-height: 2.05; font-size: 0.84rem; color: var(--fg);
}

.pop-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-enter-from { opacity: 0; transform: translateY(-10px); }
.pop-leave-active { display: none; }

@media (max-width: 720px) {
  .c-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .q { margin-left: 0; width: 100%; }
}
</style>
