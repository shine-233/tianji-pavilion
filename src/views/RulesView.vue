<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
interface TiaohouRow { yongshen: string; verb: string; dm_hint: string; month_hint: string; ctx: string }
interface SixRelRow { book: string; rule: string }

const rules = ref<RuleRow[]>([])
const nv = ref<NvRule[]>([])
const tiaohou = ref<TiaohouRow[]>([])
const sixrel = ref<SixRelRow[]>([])
const loading = ref(true)
const entered = ref(false)

const selTopic = ref<string | null>(null)
const selBook = ref<string | null>(null)
const query = ref('')
const openIdx = ref<number | null>(null)
const luckyIdx = ref<number | null>(null)
const rolling = ref(false)

/** 调候速查 */
const thDm = ref('甲')
const thOpen = ref<number | null>(null)

/** 六亲断语 */
const srBook = ref<string | null>(null)
const srQuery = ref('')
const srLimit = ref(12)

const DM_ORDER = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

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

const loadErr = ref(false)

onMounted(async () => {
  try {
    const [r, n, t, s] = await Promise.all([
      fetch('./data/rules_clean_v2.json').then((x) => x.json()),
      fetch('./data/nvming_rules.json').then((x) => x.json()),
      fetch('./data/qiongtong_tiaohou_table.json').then((x) => x.json()),
      fetch('./data/six_relations_rules.json').then((x) => x.json()),
    ])
    rules.value = r
    nv.value = n
    tiaohou.value = t
    sixrel.value = Object.values(s)[0] as SixRelRow[]
  } catch (e) {
    console.warn('规则库数据装载失败:', e)
    loadErr.value = true
  } finally {
    loading.value = false
    requestAnimationFrame(() => (entered.value = true))
  }
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

/** 主列表一次渲染的条数上限；抽签也从这里取，保证中奖条目一定可见 */
const RENDER_N = 80

let rollTimer: number | null = null

function lucky(): void {
  const poolN = Math.min(filtered.value.length, RENDER_N)
  if (rolling.value || poolN === 0) return
  rolling.value = true
  sfx.toggle()
  let ticks = 9 + Math.floor(Math.random() * 4)
  rollTimer = window.setInterval(() => {
    luckyIdx.value = Math.floor(Math.random() * poolN)
    sfx.blip()
    ticks--
    if (ticks <= 0) {
      if (rollTimer !== null) window.clearInterval(rollTimer)
      rollTimer = null
      rolling.value = false
      sfx.ding()
      openIdx.value = luckyIdx.value
      const picked = filtered.value[luckyIdx.value]
      if (picked) window.dispatchEvent(new CustomEvent('sage-say', { detail: `抽中《${picked.book}》一条${picked.topic}条文，细读比多读有用。` }))
      document.getElementById('lucky-rule')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 90)
}

onBeforeUnmount(() => {
  if (rollTimer !== null) window.clearInterval(rollTimer)
  rollTimer = null
})

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

/** 调候：当前日主的条目，按月序排 */
const thRows = computed(() => {
  const list = tiaohou.value.filter((t) => t.dm_hint === thDm.value)
  const num = (s: string): number => {
    const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
    const i = cn.indexOf(s)
    return i >= 0 ? i : 99
  }
  return [...list].sort((a, b) => num(a.month_hint) - num(b.month_hint))
})

const thDmAvail = computed(() => {
  const set = new Set(tiaohou.value.map((t) => t.dm_hint))
  return DM_ORDER.filter((d) => set.has(d))
})

function pickThDm(d: string): void {
  sfx.blip()
  thDm.value = d
  thOpen.value = null
}

/** 六亲断语：书目筛选 + 搜索 */
const srBooks = computed(() => [...new Set(sixrel.value.map((r) => r.book))])
const srFiltered = computed(() => {
  const q = srQuery.value.trim()
  return sixrel.value.filter((r) => {
    if (srBook.value && r.book !== srBook.value) return false
    return !q || r.rule.includes(q)
  })
})
function pickSrBook(b: string): void {
  sfx.blip()
  srBook.value = srBook.value === b ? null : b
}
function moreSr(): void {
  sfx.pop()
  srLimit.value += 16
}
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2><DecryptTitle text="规则库 · 古法条文结构化" /></h2>
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
    <div v-else-if="loadErr" class="card"><p class="sub">⚠️ 规则库装载失败，请检查网络后刷新重试。</p></div>

    <template v-if="!loading && !loadErr">
      <!-- 筛选 -->
      <div class="card">
        <h2>主题筛选 <small class="sub">点击主题 / 书名过滤下方条文</small></h2>
        <div class="filter-row">
          <span
            v-for="t in topics" :key="t.name"
            class="tag cat-tag" :class="{ on: selTopic === t.name }"
            :style="selTopic === t.name ? { background: topicColor(t.name), borderColor: 'transparent', color: 'var(--panel-2)' } : {}"
            @click="pickTopic(t.name)"
          >{{ t.name }} <b>{{ t.n }}</b></span>
        </div>
        <div class="filter-row">
          <span
            v-for="b in books" :key="b"
            class="tag cat-tag book-tag" :class="{ on: selBook === b }"
            :style="{ color: selBook === b ? 'var(--panel-2)' : bookColor(b), borderColor: bookColor(b) + '55' }"
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
          v-for="(r, i) in filtered.slice(0, RENDER_N)" :key="i"
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
      <!-- 调候速查表 -->
      <div v-if="tiaohou.length" class="card hoverable">
        <h2>调候速查表 <small class="sub">穷通宝鉴 · {{ tiaohou.length }} 条调候用神</small></h2>
        <p class="sub" style="margin-bottom: 10px">
          选日主，看每个月该用什么字来「调气候」。先取为第一用神，次用为辅助——寒者暖之，燥者润之，全书宗旨不过此一句。
        </p>
        <div class="filter-row">
          <button
            v-for="d in thDmAvail" :key="d"
            class="ghost dm-btn" :class="{ on: thDm === d }"
            @click="pickThDm(d)"
          >{{ d }}</button>
        </div>
        <div class="th-list">
          <div
            v-for="(t, i) in thRows" :key="i"
            class="th-item" :class="{ open: thOpen === i }"
            @click="thOpen = thOpen === i ? null : i; sfx.pop()"
          >
            <span class="tag teal th-month">{{ t.month_hint }}月</span>
            <span class="th-core">
              <b class="gold-t">{{ t.verb === '先' ? '先取' : '次用' }}</b>
              <b class="th-yongshen ele" :class="{ 'ele-水': '壬癸'.includes(t.yongshen), 'ele-木': '甲乙'.includes(t.yongshen), 'ele-火': '丙丁'.includes(t.yongshen), 'ele-金': '庚辛'.includes(t.yongshen), 'ele-土': '戊己'.includes(t.yongshen) }">{{ t.yongshen }}</b>
            </span>
            <span class="caret-t">{{ thOpen === i ? '▾' : '▸' }}</span>
            <transition name="pop">
              <p v-if="thOpen === i" class="note th-ctx">{{ t.ctx.replace(/▸/g, '') }}</p>
            </transition>
          </div>
          <p v-if="!thRows.length" class="note">该日主暂无条目。</p>
        </div>
      </div>

      <!-- 六亲断语 -->
      <div v-if="sixrel.length" class="card hoverable">
        <h2>六亲断语 · 妻 <small class="sub">五书互证 · {{ sixrel.length }} 条</small></h2>
        <p class="sub" style="margin-bottom: 10px">
          古人论妻妾、论婚姻的原始条文，按书目分栏。断语带着时代的滤镜，读它是为了懂古人的推理，不是照搬结论。
        </p>
        <div class="filter-row">
          <span
            v-for="b in srBooks" :key="b"
            class="tag cat-tag book-tag" :class="{ on: srBook === b }"
            :style="{ color: srBook === b ? 'var(--panel-2)' : bookColor(b), borderColor: bookColor(b) + '55' }"
            @click="pickSrBook(b)"
          >{{ b }}</span>
        </div>
        <div class="search-row">
          <input v-model="srQuery" type="text" placeholder="搜索断语关键词，如：妻星、财、宫…" />
        </div>
        <p class="note">当前 {{ srFiltered.length }} 条{{ srBook ? ` · 《${srBook}》` : '' }}</p>
        <div class="nv-list">
          <div v-for="(r, i) in srFiltered.slice(0, srLimit)" :key="i" class="nv-item">
            <span class="tag gold">{{ r.book }}</span>
            <p class="rule-text">{{ r.rule.trim() }}</p>
          </div>
        </div>
        <div v-if="srFiltered.length > srLimit" style="text-align: center; margin-top: 12px">
          <button class="ghost" @click="moreSr()">再看 {{ Math.min(16, srFiltered.length - srLimit) }} 条 ↓</button>
        </div>
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
  background: linear-gradient(165deg, var(--panel-3), var(--panel));
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
.nv-item { border: 1px solid var(--line); border-radius: 10px; background: var(--panel); padding: 9px 13px; }
.nv-item .rule-text { margin-top: 6px; }

.dm-btn { padding: 6px 16px; font-size: 0.95rem; border-radius: 9px; transition: all 0.2s ease; }
.dm-btn.on { border-color: var(--gold); color: var(--gold-bright); background: rgba(232, 196, 115, 0.1); }
.th-list { display: flex; flex-direction: column; gap: 6px; }
.th-item {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  border: 1px solid var(--line); border-radius: 10px;
  background: linear-gradient(165deg, var(--panel-3), var(--panel));
  padding: 9px 13px; cursor: pointer;
  transition: border-color 0.25s ease, transform 0.25s ease;
}
.th-item:hover { border-color: rgba(94, 234, 212, 0.45); transform: translateX(3px); }
.th-item.open { border-color: var(--gold); }
.th-month { white-space: nowrap; }
.th-core { display: flex; align-items: baseline; gap: 6px; font-size: 1.02rem; }
.th-yongshen { font-family: var(--cute); font-size: 1.35rem; text-shadow: 0 0 14px currentColor; }
.th-item .caret-t { margin-left: auto; color: var(--dim); }
.th-ctx { flex-basis: 100%; margin: 2px 4px 0; line-height: 2; }

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
