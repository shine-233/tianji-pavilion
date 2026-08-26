<script setup lang="ts">
/** 古籍原文阅读器：按需拉取 txt，客户端切章，字号可调，术语高亮+点词看释义 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sfx } from '../lib/sfx'
import { GLOSSARY, lookup } from '../lib/glossary'

const BOOKS = [
  { id: 'ziping', name: '子平真诠评注', file: './classics/ziping.txt', size: '81K' },
  { id: 'qiongtong', name: '穷通宝鉴', file: './classics/qiongtong.txt', size: '94K' },
  { id: 'yuanhai', name: '渊海子平', file: './classics/yuanhai.txt', size: '175K' },
]

const bookId = ref('ziping')
const raw = ref('')
const loading = ref(false)
const chapter = ref(0)
const fontSize = ref(17)
const highlight = ref(true)

async function loadBook(id: string): Promise<void> {
  const b = BOOKS.find((x) => x.id === id)!
  loading.value = true
  raw.value = ''
  chapter.value = 0
  try {
    raw.value = await fetch(b.file).then((r) => r.text())
  } catch {
    raw.value = ''
  }
  loading.value = false
}

onMounted(() => void loadBook(bookId.value))
watch(bookId, (id) => {
  sfx.blip()
  void loadBook(id)
})

/** 切章：优先按 第X卷/章/节 标题行；无标题则按 ~1400 字切片 */
interface Chapter { title: string; body: string }
const chapters = computed<Chapter[]>(() => {
  const text = raw.value.replace(/\r\n/g, '\n').trim()
  if (!text) return []
  const lines = text.split('\n')
  const headRe = /^(第[一二三四五六七八九十百千〇零0-9]+[卷章节回篇部])\s*(.*)$/
  const marks: number[] = []
  lines.forEach((l, i) => {
    if (marks.length >= 400) return
    if (headRe.test(l.trim()) && l.trim().length <= 40) marks.push(i)
  })
  if (marks.length >= 3) {
    const out: Chapter[] = []
    if (marks[0]! > 0) {
      const intro = lines.slice(0, marks[0]!).join('\n').trim()
      if (intro) out.push({ title: '卷首', body: intro })
    }
    marks.forEach((m, i) => {
      const end = i + 1 < marks.length ? marks[i + 1]! : lines.length
      out.push({ title: lines[m]!.trim(), body: lines.slice(m + 1, end).join('\n').trim() })
    })
    return out.filter((c) => c.body.length > 0 || c.title !== '卷首')
  }
  // 兜底：等长切片
  const paras = text.split(/\n{2,}/)
  const out: Chapter[] = []
  let buf: string[] = []
  let len = 0
  for (const p of paras) {
    buf.push(p)
    len += p.length
    if (len > 1400) {
      out.push({ title: `选段 ${out.length + 1}`, body: buf.join('\n\n') })
      buf = []
      len = 0
    }
  }
  if (buf.length) out.push({ title: `选段 ${out.length + 1}`, body: buf.join('\n\n') })
  return out
})

const cur = computed(() => chapters.value[chapter.value] ?? null)

function go(delta: number): void {
  const next = chapter.value + delta
  if (next < 0 || next >= chapters.value.length) return
  chapter.value = next
  sfx.tick()
}

/** 术语高亮：把命理关键词描金（全量词库，长词优先避免截断匹配） */
const TERM_RE = new RegExp(
  `(${Object.keys(GLOSSARY).sort((a, b) => b.length - a.length).join('|')})`,
  'g',
)
const highlighted = computed(() => {
  if (!cur.value) return []
  const parts = cur.value.body.split(TERM_RE)
  return parts.map((p) => ({ text: p, term: GLOSSARY[p] ? p : null }))
})

/** 点词释义：全阅读器共用一枚浮层，fixed 定位 + 视口夹取，避免被滚动容器裁掉 */
interface TipState { name: string; left: number; top: number }
const tip = ref<TipState | null>(null)
let lastPointerType = 'mouse'
const TIP_W = () => (document.documentElement.clientWidth <= 720 ? 224 : 264)

function openTip(el: HTMLElement, name: string): void {
  const entry = lookup(name)
  if (!entry) return
  const r = el.getBoundingClientRect()
  const w = TIP_W()
  const vw = document.documentElement.clientWidth
  const left = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2))
  // 词在屏幕上部时气泡朝下弹，其余朝上
  const top = r.top < 190 ? r.bottom + 10 : Math.max(10, r.top - 168)
  if (!tip.value) sfx.tick()
  tip.value = { name, left, top }
}
function closeTip(): void {
  tip.value = null
}
function onMarkEnter(e: MouseEvent): void {
  if (lastPointerType === 'touch') return
  const el = e.currentTarget as HTMLElement
  const name = (el.dataset.term ?? '').trim()
  if (name) openTip(el, name)
}
function onMarkTap(e: Event): void {
  const el = e.currentTarget as HTMLElement
  const name = (el.dataset.term ?? '').trim()
  if (!name) return
  if (tip.value?.name === name) { closeTip(); return }
  openTip(el, name)
}
function onBodyScroll(): void {
  if (tip.value) closeTip()
}
function onDocPointerDown(e: PointerEvent): void {
  lastPointerType = e.pointerType
  const t = e.target as HTMLElement | null
  if (tip.value && !t?.closest('.term-hit') && !t?.closest('.term-pop')) closeTip()
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  document.addEventListener('scroll', onBodyScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  document.removeEventListener('scroll', onBodyScroll, true)
})
</script>

<template>
  <div class="reader">
    <div class="toolbar">
      <select v-model="bookId" class="book-sel">
        <option v-for="b in BOOKS" :key="b.id" :value="b.id">{{ b.name }}（{{ b.size }}）</option>
      </select>
      <span v-if="chapters.length" class="note">共 {{ chapters.length }} 段</span>
      <span class="spacer"></span>
      <button class="ghost mini" :class="{ off: !highlight }" @click="highlight = !highlight; sfx.blip()">
        {{ highlight ? '✨ 高亮开' : '高亮关' }}
      </button>
      <button class="ghost mini" :disabled="fontSize <= 13" @click="fontSize = Math.max(13, fontSize - 1); sfx.tick()">A-</button>
      <button class="ghost mini" :disabled="fontSize >= 26" @click="fontSize = Math.min(26, fontSize + 1); sfx.tick()">A+</button>
    </div>

    <p v-if="loading" class="sub">📜 从藏经阁搬书…</p>
    <p v-else-if="!cur" class="sub">这本书暂时打不开。</p>

    <template v-else>
      <h3 class="ch-title">{{ cur.title }}</h3>
      <article class="body" tabindex="0" :style="{ fontSize: fontSize + 'px' }">
        <template v-for="(seg, i) in (highlight ? highlighted : cur.body.split(TERM_RE).map((t) => ({ text: t, term: null })))" :key="i">
          <mark
            v-if="seg.term" class="term-hit" role="button" tabindex="0"
            :data-term="seg.text"
            aria-haspopup="dialog"
            @mouseenter="onMarkEnter" @mouseleave="closeTip"
            @click.stop="onMarkTap"
            @keydown.enter.prevent="onMarkTap($event)"
            @keydown.esc="closeTip"
          >{{ seg.text }}</mark>
          <template v-else>{{ seg.text }}</template>
        </template>
      </article>

      <transition name="tipfade">
        <div
          v-if="tip && lookup(tip.name)" class="reader-tip" role="dialog"
          :style="{ left: `${tip.left}px`, top: `${tip.top}px`, width: `${TIP_W()}px` }"
          @mouseleave="closeTip"
        >
          <b class="t-name">{{ tip.name }}</b>
          <p>{{ lookup(tip.name)!.text }}</p>
          <em class="src">—— {{ lookup(tip.name)!.src }}</em>
        </div>
      </transition>

      <div class="pager">
        <button class="ghost" :disabled="chapter === 0" @click="go(-1)">← 上一段</button>
        <span class="note">{{ chapter + 1 }} / {{ chapters.length }}</span>
        <button class="ghost" :disabled="chapter >= chapters.length - 1" @click="go(1)">下一段 →</button>
      </div>
      <p class="note">金色词都收在术语通典里——悬停或点一下，释义就弹出来。</p>
    </template>
  </div>
</template>

<style scoped>
.reader { margin-top: 4px; }
.toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.book-sel { max-width: 240px; }
.spacer { flex: 1; }
.mini { padding: 5px 10px; font-size: 0.78rem; }

.ch-title {
  font-family: var(--cute);
  color: var(--gold-bright);
  font-size: 1.05rem;
  margin: 6px 0 10px;
}
.body {
  max-height: 380px;
  overflow-y: auto;
  line-height: 2.15;
  color: var(--fg);
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 18px;
  white-space: pre-wrap;
}
.body:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
.mini.off { color: var(--dim); }
.term-hit {
  background: rgba(var(--acc-rgb), 0.16);
  color: var(--gold-bright);
  border-radius: 4px;
  padding: 0 2px;
  cursor: help;
  transition: background 0.2s ease, text-shadow 0.2s ease;
}
.term-hit:hover, .term-hit:focus-visible { background: rgba(var(--acc-rgb), 0.3); text-shadow: 0 0 12px rgba(232, 196, 115, 0.6); outline: none; }
.term-hit:focus-visible { outline: 2px solid var(--teal); outline-offset: 1px; }

/* 共用释义浮层：fixed 定位，不随滚动容器裁切 */
.reader-tip {
  position: fixed;
  z-index: 1200;
  background: linear-gradient(160deg, #20263a, #161a28);
  border: 1px solid rgba(232, 196, 115, 0.45);
  border-radius: 12px;
  padding: 11px 14px 9px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}
.reader-tip .t-name { display: block; font-family: var(--cute); color: var(--gold-bright); font-size: 0.95rem; margin-bottom: 5px; }
.reader-tip p { font-size: 0.78rem; line-height: 1.95; color: var(--fg); margin: 0; }
.reader-tip .src { display: block; text-align: right; font-size: 0.66rem; color: var(--dim); margin-top: 4px; }
.tipfade-enter-active { transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.tipfade-leave-active { transition: all 0.12s ease; }
.tipfade-enter-from { opacity: 0; transform: translateY(6px) scale(0.96); }
.tipfade-leave-to { opacity: 0; }

.pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 10px; }
</style>
