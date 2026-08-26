<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import { computed, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'

interface CorpusMap {
  topics: string[]
  density_per_wanzi: Record<string, number[]>
}

interface Chapter {
  book: string
  chapter: string
  chars: number
  top_topic: string
  [topic: string]: string | number
}

const TOPIC_COLORS: Record<string, string> = {
  旺衰强弱: '#5eead4',
  格局成败: '#e8c473',
  六亲: '#ef7d57',
  女命: '#f0a6ca',
  岁运: '#64a7e8',
  神煞: '#c9a15f',
  调候寒暖: '#f87171',
  十神: '#7bc47f',
}
// corpus_chapters.json 的键是两字/四字混合主题名，映射到八大主题
const KEY_ALIAS: Record<string, string> = {
  旺衰: '旺衰强弱',
  格局: '格局成败',
  六亲: '六亲',
  女命: '女命',
  岁运: '岁运',
  神煞: '神煞',
  调候: '调候寒暖',
  十神: '十神',
}
const TOPIC_KEYS = ['旺衰', '格局', '六亲', '女命', '岁运', '神煞', '调候', '十神']

const map = ref<CorpusMap | null>(null)
const chapters = ref<Chapter[]>([])
const loading = ref(true)
const selBook = ref<string | null>(null)
const query = ref('')
const openChapter = ref<number | null>(null)
const entered = ref(false)
const hovCol = ref<number | null>(null)

const loadErr = ref(false)

onMounted(async () => {
  try {
    const [m, ch] = await Promise.all([
      fetch('./data/corpus_map.json').then((r) => r.json()),
      fetch('./data/corpus_chapters.json').then((r) => r.json()),
    ])
    map.value = m
    chapters.value = ch
  } catch (e) {
    console.warn('语料数据装载失败:', e)
    loadErr.value = true
  } finally {
    loading.value = false
    requestAnimationFrame(() => (entered.value = true))
  }
})

const books = computed(() => (map.value ? Object.keys(map.value.density_per_wanzi) : []))

function topicColor(t: string): string {
  return TOPIC_COLORS[t] ?? '#8b93a7'
}

/** 某书在某主题的密度（万字频次），用于总览条形图 */
function density(book: string, ti: number): number {
  if (!map.value) return 0
  return map.value.density_per_wanzi[book]?.[ti] ?? 0
}
function maxDensity(ti: number): number {
  return books.value.reduce((mx, b) => Math.max(mx, density(b, ti)), 0.0001)
}

const totalChars = computed(() =>
  chapters.value.reduce((s, c) => s + Number(c.chars || 0), 0),
)

const filtered = computed<Chapter[]>(() => {
  const q = query.value.trim().toLowerCase()
  let rows = chapters.value
  if (selBook.value) rows = rows.filter((c) => c.book === selBook.value)
  if (!q) return rows
  return rows.filter((c) => `${c.book} ${c.chapter} ${c.top_topic}`.toLowerCase().includes(q))
})

function pickBook(b: string): void {
  sfx.blip()
  selBook.value = selBook.value === b ? null : b
}

/** 书档：选中书目后的档案卡数据 */
const bookProfile = computed(() => {
  const b = selBook.value
  if (!b) return null
  const rows = chapters.value.filter((c) => c.book === b)
  const chars = rows.reduce((s, c) => s + Number(c.chars || 0), 0)
  const topicSum = TOPIC_KEYS.map((k) => ({
    name: k,
    alias: KEY_ALIAS[k]!,
    v: rows.reduce((s, c) => s + Number(c[k] ?? 0), 0),
  })).sort((x, y) => y.v - x.v)
  const longest = [...rows].sort((x, y) => Number(y.chars) - Number(x.chars)).slice(0, 3)
  return { book: b, n: rows.length, chars, top: topicSum.slice(0, 3), maxV: Math.max(1, topicSum[0]?.v ?? 1), longest }
})

function toggleChapter(i: number): void {
  sfx.pop()
  openChapter.value = openChapter.value === i ? null : i
}

function chapterTopics(c: Chapter): { name: string; v: number; alias: string }[] {
  return TOPIC_KEYS.map((k) => ({
    name: k,
    alias: KEY_ALIAS[k],
    v: Number(c[k] ?? 0),
  })).sort((a, b) => b.v - a.v)
}

function barW(v: number, mx: number, enteredOn: boolean): string {
  return enteredOn ? `${Math.max(2, (v / mx) * 100)}%` : '0%'
}
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2><DecryptTitle text="典籍语料 · 七书数字化" /></h2>
      <p class="sub">
        《滴天髓阐微》《三命通会》《穷通宝鉴》《子平真诠评注》《渊海子平》《神峰通考》《千里命稿》
        全文入库，按章节切分后以八个主题词族的密度刻画每部书的"性格"。数据全部可复算。
      </p>
      <div class="stats">
        <div class="stat"><span class="big-num">7</span><span class="note">部典籍</span></div>
        <div class="stat"><span class="big-num">{{ chapters.length }}</span><span class="note">个章节</span></div>
        <div class="stat"><span class="big-num">{{ (totalChars / 10000).toFixed(0) }}万</span><span class="note">校对字数</span></div>
        <div class="stat"><span class="big-num">8</span><span class="note">大主题词族</span></div>
      </div>
    </div>

    <div v-if="loading" class="card"><p class="sub">📜 语料装载中…</p></div>
    <div v-else-if="loadErr" class="card"><p class="sub">⚠️ 语料装载失败，请检查网络后刷新重试。</p></div>

    <template v-if="map && !loading && !loadErr">
      <!-- 八大主题 × 七书 密度矩阵 -->
      <div class="card hoverable">
        <h2>八大主题密度矩阵 <small class="sub">单位：每万字命中次数 · 点击书名筛选下方章节</small></h2>
        <table class="matrix" @mouseleave="hovCol = null">
          <thead>
            <tr>
              <th>典籍 \ 主题</th>
              <th v-for="(t, ti) in map.topics" :key="t" :class="{ 'col-on': hovCol === ti }">
                <span :style="{ color: topicColor(t) }">{{ t.replace(/强弱|成败|寒暖/, '') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(b, bi) in books" :key="b"
              :class="{ on: selBook === b }"
              @click="pickBook(b)"
            >
              <th>{{ b }}</th>
              <td
                v-for="(t, ti) in map.topics" :key="t"
                :class="{ 'col-on': hovCol === ti }"
                @mouseenter="hovCol = ti"
              >
                <div class="cellbar" :title="`${b} · ${t}：${density(b, ti).toFixed(1)}/万字`">
                  <i
                    :style="{
                      width: barW(density(b, ti), maxDensity(ti), entered),
                      background: topicColor(t),
                      transitionDelay: `${bi * 60 + ti * 30}ms`,
                    }"
                  ></i>
                  <em v-if="density(b, ti) >= maxDensity(ti) * 0.999">{{ density(b, ti).toFixed(0) }}</em>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="note" style="margin-top: 10px">
          读法示例：《滴天髓阐微》旺衰密度 103.5 次/万字，是典型"讲原理"的书；
          《千里命稿》十神密度 94.9，因为它几乎每段都在用十神语言写实例。
        </p>
      </div>

      <transition name="pop">
        <div v-if="bookProfile" class="card book-profile">
          <h2>书档 · {{ bookProfile.book }}</h2>
          <p class="bp-line">
            <span class="tag gold">{{ bookProfile.n }} 章</span>
            <span class="tag teal">{{ (bookProfile.chars / 10000).toFixed(1) }} 万字</span>
            <span
              v-for="tp in bookProfile.top" :key="tp.name"
              class="bp-topic"
              :style="{ color: topicColor(tp.name) }"
            >{{ tp.name }}·{{ tp.v.toFixed(0) }}</span>
          </p>
          <div class="bp-bars">
            <div v-for="tp in bookProfile.top" :key="'b' + tp.name" class="bp-bar-row">
              <span class="bp-name">{{ tp.name }}</span>
              <span class="bar"><i :style="{ width: `${(tp.v / bookProfile.maxV) * 100}%`, background: topicColor(tp.name) }"></i></span>
            </div>
          </div>
          <p class="note">最长三章：{{ bookProfile.longest.map((c) => `${c.chapter}（${Number(c.chars).toLocaleString()}字）`).join(' · ') }}</p>
        </div>
      </transition>

      <!-- 章节检索 -->
      <div class="card hoverable">
        <h2>章节检索 <small class="sub">共 {{ filtered.length }} / {{ chapters.length }} 节{{ selBook ? ` · 已限定「${selBook}」` : '' }}</small></h2>
        <div class="search-row">
          <input v-model="query" type="text" placeholder="搜索书名 / 章节名 / 主题，如：天道、女命、调候…" />
          <button v-if="selBook" class="ghost" @click="selBook = null; sfx.toggle()">清除书筛</button>
        </div>

        <transition-group name="rowfade" tag="div" class="ch-list">
          <div
            v-for="(c, i) in filtered.slice(0, 60)" :key="c.book + c.chapter"
            class="ch-item" :class="{ open: openChapter === i }"
            @click="toggleChapter(i)"
          >
            <div class="ch-head">
              <span class="tag gold">{{ c.book }}</span>
              <span class="ch-name">{{ c.chapter }}</span>
              <span class="ch-meta">
                <span class="tag teal">{{ c.top_topic }}</span>
                <span class="note">{{ Number(c.chars).toLocaleString() }} 字</span>
              </span>
            </div>
            <transition name="pop">
              <div v-if="openChapter === i" class="ch-detail">
                <div v-for="tp in chapterTopics(c)" :key="tp.name" class="mini-row">
                  <span class="mini-name" :style="{ color: TOPIC_COLORS[tp.alias] }">{{ tp.name }}</span>
                  <span class="bar mini"><i
                    :style="{ width: `${Math.min(100, tp.v * 12.5)}%`, background: TOPIC_COLORS[tp.alias] }"
                  ></i></span>
                  <span class="note mini-v">{{ tp.v.toFixed(1) }}%</span>
                </div>
                <p class="note">占比为该章内各主题词族的相对密度，最高者即章节标签「{{ c.top_topic }}」。</p>
              </div>
            </transition>
          </div>
        </transition-group>
        <p v-if="filtered.length > 60" class="note" style="margin-top: 8px">
          仅展示前 60 条，请继续缩小关键词。
        </p>
      </div>
    </template>
  </main>
</template>

<style scoped>
.stats { display: flex; gap: 26px; margin-top: 14px; flex-wrap: wrap; }
.stat { display: flex; align-items: baseline; gap: 7px; }
.stat .big-num { font-size: 1.9rem; }

.matrix th, .matrix td { padding: 7px 8px; transition: background 0.2s ease; }

.book-profile { border-color: rgba(var(--acc-rgb), 0.4); }
.bp-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.bp-topic { font-family: var(--cute); font-size: 0.86rem; }
.bp-bars { max-width: 460px; display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
.bp-bar-row { display: flex; align-items: center; gap: 12px; }
.bp-name { width: 56px; text-align: right; font-size: 0.78rem; }
.bp-bar-row .bar { flex: 1; margin: 0; }
.matrix tbody tr { cursor: pointer; transition: background 0.2s ease; }
.matrix tbody tr:hover { background: rgba(232, 196, 115, 0.05); }
.matrix tbody tr.on { background: rgba(232, 196, 115, 0.09); outline: 1px solid rgba(232, 196, 115, 0.35); }
.matrix .col-on { background: rgba(94, 234, 212, 0.06); }
.cellbar { position: relative; height: 14px; min-width: 74px; background: var(--card-2); border-radius: 4px; overflow: hidden; }
.cellbar i { display: block; height: 100%; border-radius: 4px; opacity: 0.85; transition: width 0.85s cubic-bezier(0.22, 1, 0.36, 1); }
.cellbar em { position: absolute; right: 4px; top: -1px; font-style: normal; font-size: 0.62rem; color: var(--panel-2); font-weight: bold; line-height: 15px; }

.search-row { display: flex; gap: 10px; margin-bottom: 12px; }
.search-row input { flex: 1; }

.ch-list { display: flex; flex-direction: column; gap: 6px; max-height: 560px; overflow-y: auto; padding-right: 4px; }
.ch-item { border: 1px solid var(--line); border-radius: 10px; background: var(--panel); cursor: pointer; transition: border-color 0.2s ease, transform 0.2s ease; }
.ch-item:hover { transform: translateX(3px); border-color: rgba(94, 234, 212, 0.4); }
.ch-item.open { border-color: var(--gold); }
.ch-head { display: flex; align-items: center; gap: 10px; padding: 9px 12px; flex-wrap: wrap; }
.ch-name { flex: 1; font-size: 0.92rem; color: var(--fg); }
.ch-meta { display: flex; align-items: center; gap: 8px; }
.ch-detail { padding: 4px 14px 12px; border-top: 1px dashed var(--line); }
.mini-row { display: flex; align-items: center; gap: 10px; margin-top: 7px; }
.mini-name { width: 34px; font-size: 0.78rem; text-align: right; }
.bar.mini { flex: 1; margin: 0; height: 7px; }
.mini-v { width: 46px; }

.rowfade-enter-active { transition: all 0.35s ease; }
.rowfade-enter-from { opacity: 0; transform: translateY(-6px); }
.rowfade-leave-active { display: none; }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-enter-from { opacity: 0; transform: translateY(-8px); }
.pop-leave-active { display: none; }
</style>
