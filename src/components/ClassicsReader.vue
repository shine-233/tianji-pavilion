<script setup lang="ts">
/** 古籍原文阅读器：按需拉取 txt，客户端切章，字号可调，术语高亮 */
import { computed, onMounted, ref, watch } from 'vue'
import { sfx } from '../lib/sfx'
import { GLOSSARY } from '../lib/glossary'

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

/** 术语高亮：把命理关键词描金 */
const TERM_RE = new RegExp(
  `(${Object.keys(GLOSSARY).sort((a, b) => b.length - a.length).slice(0, 60).join('|')})`,
  'g',
)
const highlighted = computed(() => {
  if (!cur.value) return []
  const parts = cur.value.body.split(TERM_RE)
  return parts.map((p) => ({ text: p, term: GLOSSARY[p] ? p : null }))
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
      <button class="ghost mini" :disabled="highlight === false" @click="highlight = !highlight; sfx.blip()">
        {{ highlight ? '✨ 高亮开' : '高亮关' }}
      </button>
      <button class="ghost mini" @click="fontSize = Math.max(13, fontSize - 1); sfx.tick()">A-</button>
      <button class="ghost mini" @click="fontSize = Math.min(26, fontSize + 1); sfx.tick()">A+</button>
    </div>

    <p v-if="loading" class="sub">📜 从藏经阁搬书…</p>
    <p v-else-if="!cur" class="sub">这本书暂时打不开。</p>

    <template v-else>
      <h3 class="ch-title">{{ cur.title }}</h3>
      <article class="body" :style="{ fontSize: fontSize + 'px' }">
        <template v-for="(seg, i) in (highlight ? highlighted : cur.body.split(TERM_RE).map((t) => ({ text: t, term: null })))" :key="i">
          <mark v-if="seg.term" class="term-hit">{{ seg.text }}</mark>
          <template v-else>{{ seg.text }}</template>
        </template>
      </article>

      <div class="pager">
        <button class="ghost" :disabled="chapter === 0" @click="go(-1)">← 上一段</button>
        <span class="note">{{ chapter + 1 }} / {{ chapters.length }}</span>
        <button class="ghost" :disabled="chapter >= chapters.length - 1" @click="go(1)">下一段 →</button>
      </div>
      <p class="note">金色词为术语通典收录词条——点右上角 ⌘ 跳转可查释义。</p>
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
.term-hit {
  background: rgba(var(--acc-rgb), 0.16);
  color: var(--gold-bright);
  border-radius: 4px;
  padding: 0 2px;
}

.pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 10px; }
</style>
