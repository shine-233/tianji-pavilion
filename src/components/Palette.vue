<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GLOSSARY } from '../lib/glossary'
import { sfx } from '../lib/sfx'

interface Item {
  kind: '页面' | '术语'
  key: string
  sub: string
  go?: string
  term?: string
}

const PAGES: Item[] = [
  { kind: '页面', key: '首页', sub: '罗盘 · 今日一签 · 时辰钟', go: '/' },
  { kind: '页面', key: '排盘评分', sub: '四柱翻牌 · 七维雷达 · 大运河流', go: '/chart' },
  { kind: '页面', key: '紫微命盘', sub: '十二宫 · 三方四正连线', go: '/ziwei' },
  { kind: '页面', key: '五行天穹', sub: '体素建模 · 生克爆裂粒子', go: '/wuxing' },
  { kind: '页面', key: '六爻问卦', sub: '摇铜钱 · 纳甲装卦 · 卦库预习', go: '/liuyao' },
  { kind: '页面', key: '梅花易数', sub: '数字起卦 · 体用生克', go: '/meihua' },
  { kind: '页面', key: '每日一签', sub: '云鹤灵签 · 集签册 · 黄黑道', go: '/daily' },
  { kind: '页面', key: '今日黄历', sub: '宜忌 · 节气 · 月历', go: '/almanac' },
  { kind: '页面', key: '小六壬', sub: '掐指速断 · 三数起课', go: '/xiaoliuren' },
  { kind: '页面', key: '杯筊问事', sub: '掷筊问杯 · 三筊定吉凶', go: '/jiaobei' },
  { kind: '页面', key: '数字能量', sub: '号码起卦 · 梅花心易', go: '/shuzi' },
  { kind: '页面', key: '卦象记忆', sub: '八卦翻牌配对小游戏', go: '/memory' },
  { kind: '页面', key: '奇门入门', sub: '阴阳遁 · 九宫排盘 · 用神细断', go: '/qimen' },
  { kind: '页面', key: '演易', sub: '大衍之数 · 滚动叙事', go: '/yanyi' },
  { kind: '页面', key: '易道长卷', sub: 'WebGL 长卷 · 七幕推演', go: '/story' },
  { kind: '页面', key: '道观地图', sub: '十八进殿宇 · 全站导览', go: '/map' },
  { kind: '页面', key: '典籍语料', sub: '七书主题密度矩阵', go: '/classics' },
  { kind: '页面', key: '格局辞典', sub: '49 格局五书互证', go: '/geju' },
  { kind: '页面', key: '规则库', sub: '条件→结论解剖 · 调候速查', go: '/rules' },
  { kind: '页面', key: '案例库', sub: '古籍命例 · 千里命稿', go: '/cases' },
  { kind: '页面', key: '道长图鉴', sub: '十位值守道长 · 3D 体素', go: '/sages' },
  { kind: '页面', key: '设置', sub: '皮肤 · 音效 · 手账管理', go: '/settings' },
]

const TERMS: Item[] = Object.entries(GLOSSARY).map(([name, e]) => ({
  kind: '术语',
  key: name,
  sub: e.text.slice(0, 26) + '…',
  term: name,
}))

const open = ref(false)
const query = ref('')
const cursor = ref(0)
const activeTerm = ref<Item | null>(null)
const router = useRouter()

const items = computed<Item[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return [...PAGES, ...TERMS.slice(0, 14)]
  return [...PAGES, ...TERMS].filter((it) =>
    it.key.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q) || it.kind.includes(q),
  )
})

function show(): void {
  open.value = true
  query.value = ''
  cursor.value = 0
  sfx.pop()
}
function hide(): void {
  open.value = false
  activeTerm.value = null
}

function onKey(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value ? hide() : show()
    return
  }
  if (e.key === 'Escape' && open.value) {
    activeTerm.value ? (activeTerm.value = null) : hide()
    return
  }
  if (!open.value || activeTerm.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cursor.value = Math.min(cursor.value + 1, items.value.length - 1)
    sfx.tick()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cursor.value = Math.max(cursor.value - 1, 0)
    sfx.tick()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    pick(items.value[cursor.value])
  }
}

watch(query, () => (cursor.value = 0))

function pick(it: Item | undefined): void {
  if (!it) return
  if (it.go) {
    hide()
    sfx.ding()
    void router.push(it.go)
  } else {
    sfx.blip()
    activeTerm.value = it
  }
}

function hover(i: number): void {
  cursor.value = i
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <button class="palette-btn" title="Ctrl+K 快速跳转" @click="show()">
    <span class="pk-glyph">⌘</span>
    <span class="pk-label">跳转</span>
    <kbd>Ctrl K</kbd>
  </button>

  <teleport to="body">
    <transition name="pal-pop">
      <div v-if="open" class="pal-mask" @click.self="hide()">
        <div class="pal-panel card">
          <div class="pal-head">
            <span class="pal-logo">☯</span>
            <input
              v-model="query"
              class="pal-input"
              placeholder="搜页面或术语：雷达、用神、六爻…"
              autofocus
            />
            <kbd>Esc</kbd>
          </div>

          <!-- 术语卡 -->
          <div v-if="activeTerm" class="term-card">
            <b>{{ activeTerm.key }} <i class="cat">{{ activeTerm.sub.split('…')[0] }}</i></b>
            <p>{{ GLOSSARY[activeTerm.term!]!.text }}</p>
            <em>—— {{ GLOSSARY[activeTerm.term!]!.src }}</em>
          </div>

          <div v-else class="pal-list">
            <button
              v-for="(it, i) in items" :key="it.kind + it.key"
              class="pal-item" :class="{ on: i === cursor }"
              @mouseenter="hover(i)"
              @click="pick(it)"
            >
              <span class="kind" :class="it.kind === '页面' ? 'k-page' : 'k-term'">{{ it.kind }}</span>
              <b>{{ it.key }}</b>
              <span class="sub-line">{{ it.sub }}</span>
            </button>
            <p v-if="!items.length" class="note" style="padding: 14px">没有匹配项，换个词试试。</p>
          </div>

          <div class="pal-foot note">
            ↑↓ 选择 · Enter 进入 · Esc 关闭
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.palette-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 9px;
}
.palette-btn kbd {
  font-size: 0.6rem;
  opacity: 0.65;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0 4px;
}
.pk-label { font-size: 0.8rem; }

.pal-mask {
  position: fixed;
  inset: 0;
  z-index: 2500;
  background: rgba(5, 6, 10, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 16px 0;
}
.pal-panel {
  width: min(560px, 100%);
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-color: rgba(var(--acc-rgb), 0.45);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
}
.pal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}
.pal-logo { color: var(--gold-bright); filter: drop-shadow(0 0 8px rgba(var(--acc-rgb), 0.7)); }
.pal-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 1rem;
  box-shadow: none !important;
}
.pal-input:focus { outline: none; }

.pal-list { max-height: 46vh; overflow-y: auto; padding: 6px; }
.pal-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 9px;
  padding: 8px 11px;
  color: var(--fg);
  font-weight: normal;
  font-family: inherit;
  font-size: 0.9rem;
}
.pal-item.on { background: rgba(var(--acc-rgb), 0.1); }
.pal-item b { font-family: var(--cute); color: var(--gold-bright); }
.kind {
  font-size: 0.62rem;
  border-radius: 999px;
  padding: 1px 7px;
  border: 1px solid var(--line);
  color: var(--dim);
}
.k-page { color: var(--teal); border-color: rgba(var(--acc2-rgb), 0.4); }
.k-term { color: var(--amber); border-color: rgba(var(--acc-rgb), 0.4); }
.sub-line { color: var(--dim); font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.term-card { padding: 16px 18px 12px; border-bottom: 1px solid var(--line); }
.term-card b { font-family: var(--cute); color: var(--gold-bright); font-size: 1.05rem; display: block; margin-bottom: 6px; }
.term-card .cat { font-style: normal; font-size: 0.66rem; color: var(--teal); margin-left: 8px; letter-spacing: 0.2em; }
.term-card p { font-size: 0.86rem; line-height: 2; color: var(--fg); }
.term-card em { display: block; text-align: right; font-size: 0.68rem; color: var(--dim); margin-top: 6px; }

.pal-foot { padding: 8px 14px; border-top: 1px solid var(--line); text-align: right; }

.pal-pop-enter-active { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
.pal-pop-leave-active { transition: all 0.15s ease; }
.pal-pop-enter-from, .pal-pop-leave-to { opacity: 0; }
.pal-pop-enter-from .pal-panel { transform: translateY(-14px) scale(0.98); }
</style>
