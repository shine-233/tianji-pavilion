<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'

interface RuleRow {
  book: string
  chapter: string
  topic: string
  rule: string
  condition: string
  conclusion: string
  type: string
  quality: string
}
interface NvRule { book: string; kw: string[]; rule: string }

const rules = ref<RuleRow[]>([])
const nv = ref<NvRule[]>([])
const loading = ref(true)
const entered = ref(false)

const selTopic = ref<string | null>(null)
const selBook = ref<string | null>(null)
const query = ref('')
const openIdx = ref<number | null>(null)
const luckyIdx = ref<number | null>(null)
const rolling = ref(false)

const TOPIC_COLORS: Record<string, string> = {
  旺衰: '#5eead4',
  格局: '#e8c473',
  十神: '#7bc47f',
  六亲: '#ef7d57',
  女命: '#f0a6ca',
  岁运: '#64a7e8',
  神煞: '#c9a15f',
  调候: '#f87171',
}

onMounted(async () => {
  const [r, n] = await Promise.all([
    fetch('./data/rules_clean_v2.json').then((x) => x.json()),
    fetch('./data/nvming_rules.json').then((x) => x.json()),
  ])
  rules.value = r
  nv.value = n
  loading.value = false
  requestAnimationFrame(() => (entered.value = true))
})

const topics = computed(() => {
  const m = new Map<string, number>()
  rules.value.forEach((r) => m.set(r.topic, (m.get(r.topic) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, n: v }))
})

const books = computed(() => [...new Set(rules.value.map((r) => r.book))])

const condN = computed(() => rules.value.filter((r) => r.type === '条件结论').length)

const filtered = computed(() => {
  const q = query.value.trim()
  return rules.value.filter((r) => {
    if (selTopic.value && r.topic !== selTopic.value) return false
    if (selBook.value && r.book !== selBook.value) return false
    if (!q) return true
    return r.rule.includes(q) || r.chapter.includes(q) || r.book.includes(q)
  })
})

function topicColor(t: string): string {
  const k = Object.keys(TOPIC_COLORS).find((key) => t.includes(key))
  return k ? TOPIC_COLORS[k]! : '#8b93a7'
}

function pickTopic(t: string): void {
  sfx.blip()
  selTopic.value = selTopic.value === t ? null : t
}

function pickBook(b: string): void {
  sfx.blip()
  selBook.value = selBook.value === b ? null : b
}

function toggle(i: number): void {
  sfx.pop()
  openIdx.value = openIdx.value === i ? null : i
}

function lucky(): void {
  if (rolling.value || filtered.value.length === 0) return
  rolling.value = true
  sfx.toggle()
  let ticks = 9 + Math.floor(Math.random() * 4)
  const iv = window.setInterval(() => {
    luckyIdx.value = Math.floor(Math.random() * filtered.value.length)
    sfx.blip()
    ticks--
    if (ticks <= 0) {
      window.clearInterval(iv)
      rolling.value = false
      sfx.ding()
      openIdx.value = luckyIdx.value
      document.getElementById('lucky-rule')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 90)
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

/** 女命关键词统计 */
const nvKw = computed(() => {
  const m = new Map<string, number>()
  nv.value.forEach((n) => n.kw.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
})
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2>规则库 · 古法条文结构化</h2>
      <p class="sub">
        从七部典籍中抽取论命条文，逐条拆解为「条件 → 结论」结构并按主题归类。
        点击任意条文可展开解剖视图；也可摇一支「古法签」随机抽条文研读。
      </p>
      <div class="stats">
        <div class="stat"><span class="big-num">{{ rules.length }}</span><span class="note">条规则</span></div>
        <div class="stat"><span class="big-num">{{ books.length }}</span><span class="note">部典籍</span></div>
        <div class="stat"><span class="big-num">{{ topics.length }}</span><span class="note">大主题</span></div>
        <div class="stat"><span class="big-num">{{ rules.length ? Math.round(condN / rules.length * 100) : 0 }}%</span><span class="note">含条件结论</span></div>
      </div>
    </div>

    <div v-if="loading" class="card"><p class="sub">📜 规则库装载中…</p></div>

    <template v-if="!loading">
      <!-- 筛选 -->
      <div class="card">
        <h2>主题筛选 <small class="sub">点击主题 / 书名过滤下方条文</small></h2>
        <div class="filter-row">
          <span
            v-for="t in topics" :key="t.name"
            class="tag cat-tag" :class="{ on: selTopic === t.name }"
            :style="selTopic === t.name ? { background: topicColor(t.name), borderColor: 'transparent', color: '#10131c' } : {}"
            @click="pickTopic(t.name)"
          >{{ t.name }} <b>{{ t.n }}</b></span>
        </div>
        <div class="filter-row">
          <span
            v-for="b in books" :key="b"
            class="tag cat-tag book-tag" :class="{ on: selBook === b }"
            :style="{ color: selBook === b ? '#10131c' : bookColor(b), borderColor: bookColor(b) + '55' }"
            @click="pickBook(b)"
          >{{ b }}</span>
        </div>
        <div class="search-row">
          <input v-model="query" type="text" placeholder="搜索条文关键词，如：中和、用神、妻、子…" />
          <button class="ghost luck-btn" :class="{ rolling }" @click="lucky()">🎲 抽古法签</button>
        </div>
        <p class="note">当前 {{ filtered.length }} 条{{ selTopic ? ` · 「${selTopic}」` : '' }}{{ selBook ? ` · 《${selBook}》` : '' }}</p>
      </div>

      <!-- 规则列表 -->
      <transition-group name="rowfade" tag="div" class="r-list" :class="{ loaded: entered }">
        <div
          v-for="(r, i) in filtered.slice(0, 80)" :key="i"
          :id="luckyIdx === i ? 'lucky-rule' : undefined"
          class="r-item" :class="{ open: openIdx === i, lucky: luckyIdx === i }"
          :style="{ transitionDelay: entered ? `${Math.min(i * 18, 360)}ms` : '0ms' }"
          @click="toggle(i)"
        >
          <div class="r-head">
            <span class="tag gold r-book">{{ r.book }}</span>
            <span class="tag" :style="{ color: topicColor(r.topic), borderColor: topicColor(r.topic) + '66' }">{{ r.topic }}</span>
            <span class="note">{{ r.chapter }}</span>
            <span class="caret-t">{{ openIdx === i ? '▾' : '▸' }}</span>
          </div>
          <p class="rule-text">{{ r.rule }}</p>
          <transition name="pop">
            <div v-if="openIdx === i" class="dissect">
              <template v-if="r.type === '条件结论' && r.condition && r.conclusion">
                <div class="d-block cond">
                  <span class="d-label">条件 IF</span>
                  <p>{{ r.condition }}</p>
                </div>
                <div class="d-arrow">⇓ 推出 ⇓</div>
                <div class="d-block conc">
                  <span class="d-label">结论 THEN</span>
                  <p>{{ r.conclusion }}</p>
                </div>
              </template>
              <template v-else>
                <div class="d-block plain">
                  <span class="d-label">{{ r.type || '原则' }}</span>
                  <p>{{ r.rule }}</p>
                </div>
              </template>
              <div class="d-meta">
                <span class="tag">类型：{{ r.type || '—' }}</span>
                <span class="tag">质量：{{ r.quality || '—' }}</span>
              </div>
            </div>
          </transition>
        </div>
      </transition-group>
      <p v-if="filtered.length > 80" class="note" style="margin-top: 8px">
        仅展示前 80 条——共 {{ filtered.length }} 条，请用主题/书名/关键词缩小范围。
      </p>

      <!-- 女命专题 -->
      <div v-if="nv.length" class="card hoverable">
        <h2>女命专题 <small class="sub">nvming_rules · 关键词标注 {{ nvKw.length }} 类</small></h2>
        <div class="filter-row" style="margin-bottom: 10px">
          <span v-for="[k, n] in nvKw.slice(0, 12)" :key="k" class="tag teal">{{ k }}·{{ n }}</span>
        </div>
        <div class="nv-list">
          <div v-for="(n2, i2) in nv.slice(0, 8)" :key="i2" class="nv-item">
            <span class="tag gold">{{ n2.book }}</span>
            <p class="rule-text">{{ n2.rule }}</p>
          </div>
        </div>
        <p class="note">共 {{ nv.length }} 条女命相关条文，此处展示前 8 条。</p>
      </div>
    </template>
  </main>
</template>

<style scoped>
.stats { display: flex; gap: 26px; margin-top: 14px; flex-wrap: wrap; }
.stat { display: flex; align-items: baseline; gap: 7px; }
.stat .big-num { font-size: 1.9rem; }

.filter-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
.cat-tag { cursor: pointer; transition: all 0.2s ease; padding: 4px 12px; }
.cat-tag:hover { border-color: var(--gold); color: var(--gold-bright); transform: translateY(-1px); }
.cat-tag.on { font-weight: bold; }
.cat-tag b { opacity: 0.65; font-size: 0.85em; margin-left: 3px; }

.search-row { display: flex; gap: 10px; margin: 10px 0 8px; }
.search-row input { flex: 1; }
.luck-btn { white-space: nowrap; }
.luck-btn.rolling { animation: shake 0.25s linear infinite; }
@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-4deg) translateY(-1px); }
  75% { transform: rotate(4deg) translateY(1px); }
}

.r-list { display: flex; flex-direction: column; gap: 7px; }
.r-item {
  border: 1px solid var(--line); border-radius: 11px;
  background: linear-gradient(165deg, #171c29, #131722);
  padding: 11px 14px; cursor: pointer;
  opacity: 0; transform: translateY(12px);
  transition:
    opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.25s ease, box-shadow 0.25s ease;
}
.r-list.loaded .r-item { opacity: 1; transform: none; }
.r-list.loaded .rowfade-enter-from { opacity: 0 !important; transform: translateY(-6px) !important; }
.r-item:hover { border-color: rgba(94, 234, 212, 0.45); transform: translateX(3px); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); }
.r-item.open { border-color: var(--gold); }
.r-item.lucky { outline: 2px solid var(--amber); animation: lucky-glow 1.4s ease infinite alternate; }
@keyframes lucky-glow {
  from { box-shadow: 0 0 6px rgba(251, 191, 36, 0.25); }
  to { box-shadow: 0 0 22px rgba(251, 191, 36, 0.6); }
}

.r-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.r-book { white-space: nowrap; }
.caret-t { margin-left: auto; color: var(--dim); width: 14px; }
.rule-text { color: var(--fg); font-size: 0.88rem; line-height: 2; }

.dissect { margin-top: 10px; border-top: 1px dashed var(--line); padding-top: 10px; }
.d-block { border-radius: 10px; padding: 10px 13px; margin-bottom: 6px; position: relative; }
.d-block.cond { background: rgba(94, 234, 212, 0.07); border: 1px solid rgba(94, 234, 212, 0.35); }
.d-block.conc { background: rgba(232, 196, 115, 0.07); border: 1px solid rgba(232, 196, 115, 0.4); }
.d-block.plain { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--line); }
.d-block p { color: var(--fg); font-size: 0.86rem; line-height: 2; }
.d-label { display: inline-block; font-family: var(--cute); font-size: 0.72rem; margin-bottom: 5px; letter-spacing: 0.08em; }
.cond .d-label { color: var(--teal); }
.conc .d-label { color: var(--gold-bright); }
.plain .d-label { color: var(--dim); }
.d-arrow { text-align: center; color: var(--dim); font-size: 0.72rem; margin: 2px 0 6px; animation: bob 1.6s ease-in-out infinite; }
@keyframes bob {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(3px); opacity: 1; }
}
.d-meta { display: flex; gap: 6px; margin-top: 8px; }

.nv-list { display: flex; flex-direction: column; gap: 8px; }
.nv-item { border: 1px solid var(--line); border-radius: 10px; background: #141824; padding: 9px 13px; }
.nv-item .rule-text { margin-top: 6px; }

.rowfade-enter-active { transition: all 0.35s ease; }
.rowfade-enter-from { opacity: 0 !important; transform: translateY(-6px) !important; }
.rowfade-leave-active { display: none; }
.rowfade-move { transition: transform 0.35s ease; }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.pop-enter-from { opacity: 0; transform: translateY(-8px); }
.pop-leave-active { display: none; }

@media (max-width: 720px) {
  .search-row { flex-direction: column; }
}
</style>
