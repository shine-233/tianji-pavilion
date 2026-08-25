<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import { computed, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'
import { vTilt } from '../lib/tilt'

interface Lineage {
  name: string
  cat: string
  sources: string[]
  era_span: string
  ancient_lineage: boolean
  snips_n: number
}
interface Snip { book: string; text: string }
interface Definition { sources: Record<string, number>; snips: Snip[] }

const lineage = ref<Lineage[]>([])
const catalog = ref<Record<string, { total: number }>>({})
const defs = ref<Record<string, Definition>>({})
const loading = ref(true)
const entered = ref(false)

const selCat = ref<string | null>(null)
const query = ref('')
const openName = ref<string | null>(null)
const expandSnip = ref<number | null>(null)

const loadErr = ref(false)

onMounted(async () => {
  try {
    const [l, c, d] = await Promise.all([
      fetch('./data/geju_lineage.json').then((r) => r.json()),
      fetch('./data/geju_catalog.json').then((r) => r.json()),
      fetch('./data/geju_definitions.json').then((r) => r.json()),
    ])
    lineage.value = l
    catalog.value = c
    defs.value = d
  } catch (e) {
    console.warn('格局数据装载失败:', e)
    loadErr.value = true
  } finally {
    loading.value = false
    requestAnimationFrame(() => (entered.value = true))
  }
})

function lookupDef(name: string): Definition | null {
  return defs.value[name] ?? defs.value[name.replace(/格$/, '')] ?? null
}

const BOOK_COLORS: Record<string, string> = {
  滴天髓阐微: '#5eead4',
  三命通会: '#e8c473',
  渊海子平: '#64a7e8',
  神峰通考: '#ef7d57',
  子平真诠评注: '#7bc47f',
  穷通宝鉴: '#f0a6ca',
  千里命稿: '#c9a15f',
}
function bookColor(b: string): string {
  return BOOK_COLORS[b] ?? '#8b93a7'
}

const cats = computed(() => [...new Set(lineage.value.map((l) => l.cat))])

const maxTotal = computed(() =>
  Math.max(1, ...lineage.value.map((l) => catalog.value[l.name]?.total ?? 0)),
)

const totalSnips = computed(() =>
  lineage.value.reduce((s, l) => s + l.snips_n, 0),
)

const ancientN = computed(() => lineage.value.filter((l) => l.ancient_lineage).length)

const filtered = computed(() => {
  const q = query.value.trim()
  return lineage.value.filter((l) => {
    if (selCat.value && l.cat !== selCat.value) return false
    if (!q) return true
    return l.name.includes(q) || l.sources.some((s) => s.includes(q)) || l.era_span.includes(q)
  })
})

function pickCat(c: string): void {
  sfx.blip()
  selCat.value = selCat.value === c ? null : c
}

function open(l: Lineage): void {
  sfx.pop()
  expandSnip.value = null
  openName.value = openName.value === l.name ? null : l.name
}

function snipsOf(name: string): Snip[] {
  return lookupDef(name)?.snips ?? []
}

function srcBars(l: Lineage): { book: string; n: number }[] {
  const s = lookupDef(l.name)?.sources ?? {}
  return Object.entries(s)
    .map(([book, n]) => ({ book, n }))
    .sort((a, b) => b.n - a.n)
}
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2><DecryptTitle text="格局辞典 · 五书互证谱系" /></h2>
      <p class="sub">
        49 个特殊与常用格局，逐个统计七书中的出现次数并摘录原文。凡两书以上独立记载且可追溯源流者，
        标记为「古典互证」。点击任意格局卡查看书证分布与原文节选。
      </p>
      <div class="stats">
        <div class="stat"><span class="big-num">{{ lineage.length }}</span><span class="note">个格局</span></div>
        <div class="stat"><span class="big-num">{{ totalSnips }}</span><span class="note">条原文摘录</span></div>
        <div class="stat"><span class="big-num">{{ ancientN }}</span><span class="note">个古典互证</span></div>
        <div class="stat"><span class="big-num">{{ cats.length }}</span><span class="note">大类别</span></div>
      </div>
    </div>

    <div v-if="loading" class="card"><p class="sub">⚔ 格局谱系装载中…</p></div>
    <div v-else-if="loadErr" class="card"><p class="sub">⚠️ 格局谱系装载失败，请检查网络后刷新重试。</p></div>

    <template v-if="!loading && !loadErr">
      <div class="card">
        <div class="filter-row">
          <span
            v-for="c in cats" :key="c"
            class="tag cat-tag" :class="{ on: selCat === c }"
            @click="pickCat(c)"
          >{{ c }}</span>
          <input v-model="query" type="text" class="q" placeholder="搜索格局名 / 书名 / 年代…" />
        </div>
        <p class="note">当前 {{ filtered.length }} 个格局{{ selCat ? ` · 类别「${selCat}」` : '' }}</p>
      </div>

      <!-- 格局卡网格 -->
      <div class="g-grid" :class="{ loaded: entered }">
        <button
          v-for="(l, i) in filtered" :key="l.name"
          v-tilt="7" class="g-card" :class="{ on: openName === l.name }"
          :style="{ transitionDelay: entered ? `${Math.min(i * 22, 400)}ms` : '0ms' }"
          @click="open(l)"
        >
          <span class="g-head">
            <b class="g-name">{{ l.name }}</b>
            <i v-if="l.ancient_lineage" class="ancient">互证</i>
          </span>
          <span class="tag">{{ l.cat }}</span>
          <span class="g-era note">{{ l.era_span }}</span>
          <span class="bar g-bar"><i
            :style="{ width: entered ? `${Math.max(6, ((catalog[l.name]?.total ?? 0) / maxTotal) * 100)}%` : '0%', transitionDelay: `${Math.min(i * 22, 400)}ms` }"
          ></i></span>
          <span class="g-count">{{ catalog[l.name]?.total ?? 0 }} 处书证 · {{ l.snips_n }} 摘录</span>
        </button>
      </div>

      <!-- 详情 -->
      <transition name="pop">
        <div v-if="openName" class="card detail-card">
          <template v-for="l in lineage.filter((x) => x.name === openName)" :key="l.name">
            <h2>{{ l.name }} <span class="tag gold" style="margin-left: 8px">{{ l.cat }}</span>
              <i v-if="l.ancient_lineage" class="ancient big">古典互证</i>
            </h2>
            <p class="sub">源流年代：{{ l.era_span }}　·　记载书目：{{ l.sources.join('、') }}</p>

            <h2 style="margin-top: 16px">五书互证分布</h2>
            <div class="src-list">
              <div v-for="(s, si) in srcBars(l)" :key="s.book" class="src-row">
                <span class="src-book" :style="{ color: bookColor(s.book) }">{{ s.book }}</span>
                <span class="bar"><i
                  :style="{
                    width: `${(s.n / Math.max(...srcBars(l).map((x) => x.n))) * 100}%`,
                    background: bookColor(s.book),
                    transitionDelay: `${si * 70}ms`,
                  }"
                ></i></span>
                <span class="src-n">{{ s.n }}</span>
              </div>
            </div>

            <h2 style="margin-top: 18px">原文节选（{{ snipsOf(l.name).length }} 条）</h2>
            <div class="snips">
              <div
                v-for="(sn, si) in snipsOf(l.name).slice(0, 4)" :key="si"
                class="snip" :class="{ open: expandSnip === si }"
                @click="expandSnip = expandSnip === si ? null : si; sfx.blip()"
              >
                <span class="tag" :style="{ color: bookColor(sn.book), borderColor: bookColor(sn.book) + '55' }">{{ sn.book }}</span>
                <p class="snip-text">{{ sn.text.replace(/⏎/g, '\n') }}</p>
                <span v-if="sn.text.length > 120" class="more-hint">{{ expandSnip === si ? '收起 ▴' : '展开全文 ▾' }}</span>
              </div>
            </div>
          </template>
        </div>
      </transition>
    </template>
  </main>
</template>

<style scoped>
.stats { display: flex; gap: 26px; margin-top: 14px; flex-wrap: wrap; }
.stat { display: flex; align-items: baseline; gap: 7px; }
.stat .big-num { font-size: 1.9rem; }

.filter-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; }
.cat-tag { cursor: pointer; transition: all 0.2s ease; padding: 4px 12px; }
.cat-tag:hover { border-color: var(--gold); color: var(--gold-bright); transform: translateY(-1px); }
.cat-tag.on { background: linear-gradient(140deg, var(--gold), #caa14f); color: #201804; border-color: transparent; font-weight: bold; }
.q { max-width: 240px; margin-left: auto; }

.g-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); gap: 10px; }
.g-card {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; gap: 5px;
  text-align: left;
  background: linear-gradient(165deg, var(--card-2), var(--panel));
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 13px;
  color: var(--fg);
  font-family: inherit; font-weight: normal; font-size: 0.82rem;
  opacity: 0; transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease;
}
.g-grid.loaded .g-card { opacity: 1; transform: translateY(0); }
.g-card:hover { border-color: rgba(232, 196, 115, 0.55); transform: translateY(-3px); box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4); }
.g-card.on { outline: 2px solid var(--teal); }
.g-head { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.g-name { font-family: var(--cute); font-size: 1.08rem; color: var(--gold-bright); text-shadow: 0 0 12px rgba(232, 196, 115, 0.3); }
.ancient { font-style: normal; font-size: 0.6rem; color: var(--teal); border: 1px solid rgba(94, 234, 212, 0.45); border-radius: 999px; padding: 1px 6px; }
.ancient.big { font-size: 0.72rem; margin-left: 8px; vertical-align: middle; }
.g-era { font-size: 0.68rem; }
.g-bar { width: 100%; margin: 2px 0; height: 7px; }
.g-count { color: var(--dim); font-size: 0.68rem; }

.detail-card { border-color: rgba(232, 196, 115, 0.4); }
.src-list { display: flex; flex-direction: column; gap: 7px; max-width: 520px; }
.src-row { display: flex; align-items: center; gap: 12px; }
.src-book { width: 108px; font-size: 0.8rem; text-align: right; white-space: nowrap; }
.src-row .bar { flex: 1; margin: 0; }
.src-n { width: 34px; text-align: right; font-family: var(--cute); color: var(--gold-bright); }

.snips { display: flex; flex-direction: column; gap: 8px; }
.snip { position: relative; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); padding: 10px 13px; cursor: pointer; transition: border-color 0.2s ease; }
.snip:hover { border-color: rgba(94, 234, 212, 0.4); }
.snip-text { margin-top: 7px; color: var(--fg); font-size: 0.84rem; line-height: 2; white-space: pre-line; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.snip.open .snip-text { display: block; -webkit-line-clamp: unset; }
.more-hint { position: absolute; right: 12px; bottom: 8px; font-size: 0.68rem; color: var(--teal); }

.pop-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-enter-from { opacity: 0; transform: translateY(-10px); }
.pop-leave-active { display: none; }

@media (max-width: 720px) {
  .g-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .q { margin-left: 0; width: 100%; }
}
</style>
