<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { buildTaoess, TAOESSES, TAOESS_IDS } from '../data/sageSprite'
import type { TaoessDef } from '../data/sageSprite'
import { motionOf } from '../data/motionPersonas'
import { sfx } from '../lib/sfx'
import SageVoxel3D from '../components/SageVoxel3D.vue'

const router = useRouter()

const selected3d = ref('qingxuan')
const sit = ref(false)
const stance = ref<'stand' | 'sit' | 'sword'>('stand')
const STANCE_LABEL = { stand: '🚶 站姿', sit: '🧘 打坐', sword: '⚔️ 持剑' } as const
function cycleStance(): void {
  const order: Array<'stand' | 'sit' | 'sword'> = ['stand', 'sit', 'sword']
  stance.value = order[(order.indexOf(stance.value) + 1) % 3]!
  sfx.toggle()
}

function pick3d(id: string): void {
  selected3d.value = id
  sfx.blip()
}

interface Entry {
  def: TaoessDef
  pixels: ReturnType<typeof buildTaoess>
}

const ENTRIES: Entry[] = TAOESS_IDS.map((id) => ({ def: TAOESSES[id]!, pixels: buildTaoess(id) }))

const PAGE_OF: Record<string, string> = {
  qingxuan: '/',
  danxia: '/chart',
  xinglan: '/ziwei',
  suwen: '/wuxing',
  lingshi: '/liuyao',
  meixue: '/oracle',
  yunji: '/classics',
  shuanghua: '/geju',
  shouzhuo: '/rules',
  shiyi: '/cases',
}
const PAGE_NAME: Record<string, string> = {
  '/': '首页', '/chart': '排盘评分', '/ziwei': '紫微命盘', '/wuxing': '五行天穹',
  '/liuyao': '六爻问卦', '/oracle': '轻卜抽签', '/classics': '典籍语料',
  '/geju': '格局辞典', '/rules': '规则库', '/cases': '案例库',
}

const talking = ref<string | null>(null)
const bubbleTimer = ref<number | null>(null)

function talk(id: string, e: MouseEvent): void {
  talking.value = id
  if (bubbleTimer.value !== null) window.clearTimeout(bubbleTimer.value)
  bubbleTimer.value = window.setTimeout(() => (talking.value = null), 3600)
  sfx.pop()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  sparkAt(rect.left + rect.width / 2, rect.top)
}

function sparkAt(x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('span')
    el.className = 'fx-spark'
    el.textContent = ['✦', '✧', '⋆'][i % 3]!
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`)
    el.style.setProperty('--dy', `${-40 - Math.random() * 70}px`)
    el.style.setProperty('--rot', `${(Math.random() - 0.5) * 260}deg`)
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 850)
  }
}

const spotlight = ref<string | null>(null)
const spotDef = computed(() => (spotlight.value ? TAOESSES[spotlight.value] : null))

function randomPick(): void {
  spotlight.value = TAOESS_IDS[Math.floor(Math.random() * TAOESS_IDS.length)]!
  sfx.gong()
}

function goPage(id: string): void {
  sfx.ding()
  router.push(PAGE_OF[id] ?? '/')
}

/** 画廊卡片的动作人格变量：十个人十种动法，相位错开免得齐步走 */
function gMotion(id: string): Record<string, string> {
  const m = motionOf(id)
  return {
    '--bd': `${m.dur}s`,
    '--ba': m.mode === 'tilt' ? `${m.amp}deg` : `${m.amp}px`,
    '--bdel': `${m.delay}s`,
  }
}

/** 点立体道长：她本尊弹一下，下方小卡片冒气泡，角标那位也跟着捎话 */
function talkStage(): void {
  const id = selected3d.value
  const def = TAOESSES[id]
  talking.value = id
  if (bubbleTimer.value !== null) window.clearTimeout(bubbleTimer.value)
  bubbleTimer.value = window.setTimeout(() => (talking.value = null), 3600)
  sfx.pop()
  if (def) window.dispatchEvent(new CustomEvent('sage-say', { detail: `${def.nameCn}：「${def.hello}」` }))
}
</script>

<template>
  <main class="page">
    <div class="card">
      <h2>道长图鉴 · 观里的十位女道士</h2>
      <p class="sub" style="margin-bottom: 6px">
        命理天工的每个功能间，都有一位当值的道长。点她一下，她会跟你搭话；
        卡片下方的去处，就是她的值房。
      </p>
      <button @click="randomPick()">🎲 随缘指派一位</button>
      <button class="ghost sm" style="margin-left: 10px" @click="cycleStance()">{{ STANCE_LABEL[stance] }}</button>
    </div>

    <div class="card stage-card">
      <div class="stage-left">
        <SageVoxel3D :char="selected3d" @pick="talkStage" />
      </div>
      <div class="stage-right">
        <h3 class="gold-t2">立体道长 · 体素建模</h3>
        <p class="sub">像素画抬进了三维空间。拖一拖会转身，滚轮能拉近，点一下还会弹。</p>
<svg
viewBox="0 0 26 29" style="width:90px;margin:6px 0"
:class="`g-svg motion-${motionOf(selected3d).mode}`" :style="gMotion(selected3d)"
>
<rect v-for="(p, i) in buildTaoess(selected3d, undefined, stance)" :key="'s' + i + String(sit)" :x="p.x + 0.06" :y="p.y + 0.06" width="0.88" height="0.88" rx="0.22" :fill="p.fill" :opacity="(p.op ?? 1) * (0.93 + ((p.x * 7 + p.y * 13) % 5) * 0.0175)" />
        </svg>
        <div class="chip-row">
          <button
            v-for="id in TAOESS_IDS" :key="id"
            class="chip" :class="{ on: selected3d === id }"
            @click="pick3d(id)"
          >{{ TAOESSES[id]!.nameCn }}</button>
        </div>
        <p v-if="TAOESSES[selected3d]" class="sub spot-line">
          <b>{{ TAOESSES[selected3d]!.nameCn }} · {{ TAOESSES[selected3d]!.title }}</b><br />{{ TAOESSES[selected3d]!.hello }}
        </p>
      </div>
    </div>

    <transition name="pop">
      <div v-if="spotDef" class="card spot-card">
        <div class="spot-inner">
<svg viewBox="0 0 26 29" class="spot-svg">
<rect v-for="(p, i) in buildTaoess(spotDef.id)" :key="i" :x="p.x + 0.06" :y="p.y + 0.06" width="0.88" height="0.88" rx="0.22" :fill="p.fill" :opacity="(p.op ?? 1) * (0.93 + ((p.x * 7 + p.y * 13) % 5) * 0.0175)" />
          </svg>
          <div>
            <h3 class="gold-t2">{{ spotDef.nameCn }}<small>· {{ spotDef.title }}</small></h3>
            <p class="sub">{{ spotDef.hello }}</p>
          </div>
        </div>
      </div>
    </transition>

    <section class="gallery">
      <button
        v-for="(en, i) in ENTRIES" :key="en.def.id"
        v-reveal="(i % 4) * 60"
        class="g-card"
        :class="{ talking: talking === en.def.id }"
        @click="talk(en.def.id, $event)"
      >
        <transition name="bubble">
          <span v-if="talking === en.def.id" class="mini-bubble">{{ en.def.hello }}</span>
        </transition>
        <svg
          viewBox="0 0 26 29" class="g-svg"
          :class="`motion-${motionOf(en.def.id).mode}`" :style="gMotion(en.def.id)"
        >
          <rect v-for="(p, pi) in en.pixels" :key="pi" :x="p.x + 0.06" :y="p.y + 0.06" width="0.88" height="0.88" rx="0.22" :fill="p.fill" :opacity="(p.op ?? 1) * (0.93 + ((p.x * 7 + p.y * 13) % 5) * 0.0175)" />
        </svg>
        <span class="orbit">{{ en.def.orbit }}</span>
        <span class="g-name">{{ en.def.nameCn }}<i>·</i>{{ en.def.title }}</span>
        <span class="g-page" @click.stop="goPage(en.def.id)">值房：{{ PAGE_NAME[PAGE_OF[en.def.id]] }} →</span>
      </button>
    </section>
  </main>
</template>

<style scoped>
.stage-card { display: grid; grid-template-columns: 1.25fr 1fr; gap: 20px; align-items: stretch; }
@media (max-width: 720px) {
  .stage-card { grid-template-columns: 1fr; }
}
.stage-left { min-width: 0; }
.stage-right { display: flex; flex-direction: column; gap: 10px; justify-content: center; }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.chip {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--dim);
  font-family: var(--cute);
  font-size: 0.82rem;
}
.chip:hover { border-color: rgba(var(--acc-rgb), 0.5); color: var(--gold-bright); transform: none; filter: none; }
.chip.on { background: rgba(var(--acc-rgb), 0.14); border-color: var(--gold); color: var(--gold-bright); }
.spot-line { line-height: 1.9; }
.spot-line b { color: var(--fg); }

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}
.g-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: linear-gradient(160deg, var(--card-2), var(--card));
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 12px 14px;
  cursor: pointer;
  color: var(--fg);
  font-family: inherit;
  font-weight: normal;
  box-shadow: var(--shadow);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s ease;
}
.g-card:hover { transform: translateY(-5px); border-color: rgba(var(--acc-rgb), 0.45); }
.g-card.talking { border-color: var(--teal); }
.g-svg {
  width: 104px;
  image-rendering: pixelated;
  animation: g-bob var(--bd, 3.6s) ease-in-out var(--bdel, 0s) infinite;
  filter: drop-shadow(0 7px 13px rgba(0, 0, 0, 0.42));
}
@keyframes g-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 calc(var(--ba, 6px) * -1); }
}
/* 动作人格：与 PixelSage 同一套骨架，画廊里十个人各动各的 */
.g-svg.motion-sway { animation-name: g-sway; }
.g-svg.motion-tilt { animation-name: g-tilt; }
.g-svg.motion-bounce { animation-name: g-bounce; animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
.g-svg.motion-glow { animation-name: g-bob, glow-pulse; }
@keyframes g-sway {
  0%, 100% { translate: calc(var(--ba, 4px) * -0.8) 0; rotate: -1.5deg; }
  50% { translate: var(--ba, 4px) calc(var(--ba, 4px) * -0.7); rotate: 1.5deg; }
}
@keyframes g-tilt {
  0%, 100% { rotate: calc(var(--ba, 3deg) * 0.45); translate: 0 0; }
  50% { rotate: calc(var(--ba, 3deg) * -0.45); translate: 0 calc(var(--ba, 4px) * -0.5); }
}
@keyframes g-bounce {
  0%, 100% { translate: 0 0; }
  38% { translate: 0 calc(var(--ba, 8px) * -1); }
  55% { translate: 0 0; }
  70% { translate: 0 calc(var(--ba, 8px) * -0.32); }
  82% { translate: 0 0; }
}
@keyframes glow-pulse {
  0%, 100% { filter: drop-shadow(0 7px 13px rgba(0, 0, 0, 0.42)) drop-shadow(0 0 4px rgba(255, 214, 130, 0.15)); }
  50% { filter: drop-shadow(0 7px 13px rgba(0, 0, 0, 0.42)) drop-shadow(0 0 14px rgba(255, 214, 130, 0.55)); }
}
.g-card:hover .g-svg { animation-duration: 1.6s, 0.9s; }
.orbit {
  position: absolute;
  top: 10px;
  right: 12px;
  color: var(--gold-bright);
  text-shadow: 0 0 9px rgba(var(--acc-rgb), 0.8);
  animation: orbit-tw 2.2s ease-in-out infinite;
}
@keyframes orbit-tw {
  0%, 100% { opacity: 0.3; transform: scale(0.75) rotate(-12deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(16deg); }
}
.g-name { font-family: var(--cute); font-size: 0.98rem; }
.g-name i { font-style: normal; opacity: 0.5; margin: 0 3px; }
.g-page { font-size: 0.68rem; color: var(--teal); opacity: 0.55; transition: opacity 0.22s ease; }
.g-card:hover .g-page { opacity: 1; }

.mini-bubble {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 170px;
  background: #f6f1e3;
  color: #33404d;
  font-family: var(--cute);
  font-size: 0.74rem;
  line-height: 1.6;
  padding: 8px 11px;
  border-radius: 12px 12px 12px 3px;
  box-shadow: 0 7px 19px rgba(0, 0, 0, 0.35);
  z-index: 5;
  text-align: left;
}
.bubble-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-leave-active { transition: all 0.15s ease; }
.bubble-enter-from, .bubble-leave-to { opacity: 0; transform: translateX(-50%) translateY(7px) scale(0.9); }
.bubble-enter-to, .bubble-leave-from { transform: translateX(-50%); }

.spot-card { border-color: rgba(var(--acc-rgb), 0.4); }
.spot-inner { display: flex; gap: 20px; align-items: center; }
.spot-svg { width: 110px; flex-shrink: 0; image-rendering: pixelated; filter: drop-shadow(0 8px 15px rgba(0, 0, 0, 0.45)); }
.gold-t2 { color: var(--gold-bright); margin-bottom: 6px; }
.spot-card h3 small { font-size: 0.72rem; color: var(--dim); margin-left: 7px; }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(14px); }
.pop-leave-active { display: none; }
</style>
