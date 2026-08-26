<script setup lang="ts">
/** 卦象记忆 · 八卦翻牌配对：玩两轮，把八卦的脸记熟 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { TRI_NATURE, type Trigram } from '../lib/liuyaoExtra'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

interface TriCard {
  key: number
  name: Trigram
  sym: string
}

const TRIS: Array<{ name: Trigram; sym: string }> = [
  { name: '乾', sym: '☰' },
  { name: '兑', sym: '☱' },
  { name: '离', sym: '☲' },
  { name: '震', sym: '☳' },
  { name: '巽', sym: '☴' },
  { name: '坎', sym: '☵' },
  { name: '艮', sym: '☶' },
  { name: '坤', sym: '☷' },
]

function shuffle(): TriCard[] {
  const deck: TriCard[] = []
  TRIS.forEach((t, i) => {
    deck.push({ key: i * 2, ...t }, { key: i * 2 + 1, ...t })
  })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  return deck
}

const deck = ref<TriCard[]>(shuffle())
const flipped = ref<number[]>([])
const matched = ref<number[]>([])
const moves = ref(0)
const secs = ref(0)
const locked = ref(false)
let timer: number | null = null

const won = computed(() => matched.value.length === deck.value.length)

const BEST_KEY = 'bs-memory-best'
const best = ref<{ moves: number; secs: number } | null>(loadBest())
function loadBest(): { moves: number; secs: number } | null {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    return raw ? (JSON.parse(raw) as { moves: number; secs: number }) : null
  } catch {
    return null
  }
}

function startTimer(): void {
  if (timer !== null) return
  timer = window.setInterval(() => (secs.value += 1), 1000)
}
function stopTimer(): void {
  if (timer !== null) window.clearInterval(timer)
  timer = null
}

function flip(c: TriCard): void {
  if (locked.value || flipped.value.includes(c.key) || matched.value.includes(c.key)) return
  startTimer()
  sfx.blip()
  flipped.value.push(c.key)
  if (flipped.value.length < 2) return
  moves.value += 1
  const [a, b] = flipped.value
  const ca = deck.value.find((x) => x.key === a)!
  const cb = deck.value.find((x) => x.key === b)!
  if (ca.name === cb.name) {
    matched.value.push(a!, b!)
    flipped.value = []
    sfx.ding()
    if (matched.value.length === deck.value.length) win()
  } else {
    locked.value = true
    window.setTimeout(() => {
      flipped.value = []
      locked.value = false
    }, 720)
  }
}

function win(): void {
  stopTimer()
  sfx.gong()
  sparkle(window.innerWidth / 2, window.innerHeight / 2, 14)
  const cur = { moves: moves.value, secs: secs.value }
  if (!best.value || cur.moves < best.value.moves || (cur.moves === best.value.moves && cur.secs < best.value.secs)) {
    best.value = cur
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(cur))
    } catch {
      /* 隐私模式就算了 */
    }
  }
}

function restart(): void {
  stopTimer()
  deck.value = shuffle()
  flipped.value = []
  matched.value = []
  moves.value = 0
  secs.value = 0
  locked.value = false
  sfx.toggle()
}

onBeforeUnmount(stopTimer)
</script>

<template>
  <main class="page">
    <h1>卦象记忆</h1>
    <p class="sub">
      十六张牌、八对卦。翻两张，一样的就配成一对——几步之内全翻开，八卦长什么样也就刻进脑子里了。
      纯练记性，不玄。
    </p>

    <section class="card">
      <div class="hud">
        <span class="tag gold">步数 {{ moves }}</span>
        <span class="tag">用时 {{ secs }} 秒</span>
        <span v-if="best" class="tag teal">最佳 {{ best.moves }} 步 / {{ best.secs }} 秒</span>
        <button class="ghost small" @click="restart">↺ 重洗一局</button>
      </div>

      <div class="m-grid">
        <button
          v-for="c in deck"
          :key="c.key"
          class="m-card"
          :class="{ open: flipped.includes(c.key) || matched.includes(c.key), done: matched.includes(c.key) }"
          :aria-label="flipped.includes(c.key) || matched.includes(c.key) ? c.name : '未翻开的牌'"
          @click="flip(c)"
        >
          <span class="face back"><i>☯</i></span>
          <span class="face front">
            <b>{{ c.sym }}</b>
            <em>{{ c.name }}·{{ TRI_NATURE[c.name] }}</em>
          </span>
        </button>
      </div>
    </section>

    <section class="card" v-reveal>
      <h2>翻完顺便记一遍 · 八卦家底</h2>
      <div class="cheat">
        <div v-for="t in TRIS" :key="t.sym" class="cheat-row">
          <span class="cs">{{ t.sym }}</span>
          <b>{{ t.name }}</b>
          <span class="cn">{{ TRI_NATURE[t.name] }}</span>
        </div>
      </div>
      <p class="note">先天数：乾一、兑二、离三、震四、巽五、坎六、艮七、坤八。梅花起卦用的就是这套编号。</p>
    </section>

    <transition name="pop">
      <div v-if="won" class="win-mask" @click="won = false">
        <div class="card win-card" @click.stop>
          <h2>☰ 全配对了 ☱</h2>
          <p class="sub">{{ moves }} 步 · {{ secs }} 秒{{ best && moves <= best.moves ? ' · 新纪录！' : '' }}</p>
          <p class="note">乾天坤地，离火坎水，震雷艮山，巽风兑泽——这八个字现在归你了。</p>
          <button @click="restart">再来一局</button>
        </div>
      </div>
    </transition>
  </main>
</template>

<style scoped>
.hud { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.hud .ghost { margin-left: auto; }

.m-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
  max-width: 560px;
  margin: 0 auto;
}
.m-card {
  position: relative;
  aspect-ratio: 3 / 4;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  perspective: 600px;
  font-family: inherit;
}
.face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 12px;
  backface-visibility: hidden;
  transition: transform 0.45s cubic-bezier(0.34, 1.2, 0.5, 1), box-shadow 0.3s ease;
}
.face.back {
  background: linear-gradient(155deg, var(--card-2), var(--card));
  border: 1px solid var(--line);
  color: var(--gold-bright);
  font-size: 1.5rem;
}
.face.back i { font-style: normal; opacity: 0.75; text-shadow: 0 0 14px rgba(var(--acc-rgb), 0.6); animation: bob 3s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-3px); } }
.face.front {
  background: linear-gradient(160deg, rgba(var(--acc-rgb), 0.16), var(--card-2));
  border: 1px solid rgba(var(--acc-rgb), 0.45);
  transform: rotateY(180deg);
}
.m-card.open .face.back, .m-card.done .face.back { transform: rotateY(180deg); }
.m-card.open .face.front, .m-card.done .face.front { transform: rotateY(0); }
.m-card.done .face.front { border-color: var(--gold); box-shadow: 0 0 12px rgba(var(--acc-rgb), 0.28); opacity: 0.85; }
.face.front b { font-size: 2rem; color: var(--fg); line-height: 1.1; }
.face.front em { font-style: normal; font-size: 0.7rem; color: var(--dim); white-space: nowrap; }

.cheat { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 10px; }
.cheat-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}
.cheat-row .cs { font-size: 1.25rem; color: var(--gold-bright); }
.cheat-row .cn { color: var(--dim); font-size: 0.78rem; margin-left: auto; }

.win-mask {
  position: fixed; inset: 0; z-index: 1500;
  background: rgba(5, 6, 10, 0.62);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.win-card { max-width: 380px; text-align: center; }
.win-card h2 { color: var(--gold-bright); }

@media (max-width: 480px) {
  .m-grid { gap: 7px; }
  .face.front b { font-size: 1.55rem; }
  .face.front em { font-size: 0.6rem; }
}
</style>
