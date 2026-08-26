<script setup lang="ts">
/**
 * 小六壬 · 掐指一算：诸葛马前课。
 * 心里想着要问的事，随口报一个数（或用今天的农历月日时），
 * 从「大安」起正月／起点数，依次点过六宫，落定之宫即为答案。
 * 三种起课方式：报一个数 / 报三个数 / 今日时辰自动起课。
 */
import { computed, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

type Gong = '大安' | '留连' | '速喜' | '赤口' | '小吉' | '空亡'

const GONGS: Array<{ name: Gong; judge: '吉' | '凶' | '小吉'; tip: string }> = [
  { name: '大安', judge: '吉', tip: '心安事顺，不动为宜。所问之事已有根基，按原计划慢慢来，别折腾。' },
  { name: '留连', judge: '凶', tip: '事情拖泥带水，暗中有反复。防小人拖延、口舌纠缠，凡事多留书面凭证。' },
  { name: '速喜', judge: '吉', tip: '喜信将至，快而有果。所问之事三五日内见分晓，是好事，抓紧时机别犹豫。' },
  { name: '赤口', judge: '凶', tip: '口舌是非之象。这两天少争执、少签字、少说狠话，冷静三天自解。' },
  { name: '小吉', judge: '小吉', tip: '小事可成，财帛有小进项。虽不是大局面，但稳妥顺手，值得去做。' },
  { name: '空亡', judge: '凶', tip: '落空之象。此事眼下条件不足，强求无益，过些日子换个思路再问。' },
]

const mode = ref<'one' | 'three' | 'auto'>('one')
const oneNum = ref('')
const threeNums = ref<{ a: string; b: string; c: string }>({ a: '', b: '', c: '' })
const question = ref('')
const result = ref<number | null>(null)
const walking = ref(false)
const walkIdx = ref(0)

/** 点任意宫位：起课前先听道长讲讲这宫是啥意思 */
function peekGong(g: { name: Gong; judge: string; tip: string }): void {
  if (walking.value) return
  sfx.blip()
  window.dispatchEvent(new CustomEvent('sage-say', { detail: `${g.name}（${g.judge}）：${g.tip}` }))
}

/** 点数路径：每一步经过的宫序号 */
function stepsFor(a: number, b: number, c: number): number[] {
  const path: number[] = []
  let cur = 0 // 大安起
  for (let i = 0; i < a - 1; i++) { cur = (cur + 1) % 6; path.push(cur) }
  const afterM = cur
  cur = afterM
  for (let i = 0; i < b - 1; i++) { cur = (cur + 1) % 6; path.push(cur) }
  const afterD = cur
  cur = afterD
  for (let i = 0; i < c - 1; i++) { cur = (cur + 1) % 6; path.push(cur) }
  return path
}

function parseNum(s: string): number {
  const n = Math.floor(Math.abs(Number(s)))
  return Number.isFinite(n) && n > 0 ? n : 1
}

async function cast(e?: MouseEvent): Promise<void> {
  if (walking.value) return
  let nums: [number, number, number]
  const lunar = Solar.fromDate(new Date()).getLunar()
  if (mode.value === 'auto') {
    nums = [Math.abs(lunar.getMonth()), lunar.getDay(), (((new Date().getHours() + 1) % 24) >> 1) + 1]
  } else if (mode.value === 'one') {
    const n = parseNum(oneNum.value)
    nums = [n, n, n]
  } else {
    nums = [parseNum(threeNums.value.a), parseNum(threeNums.value.b), parseNum(threeNums.value.c)]
  }

  const path = stepsFor(...nums)
  walking.value = true
  result.value = null
  for (let i = 0; i < path.length; i++) {
    walkIdx.value = path[i]!
    sfx.tick()
    await new Promise((r) => setTimeout(r, Math.max(60, 220 - i * 4)))
  }
  result.value = path[path.length - 1] ?? 0
  walking.value = false
  sfx.gong()
  if (e) sparkle(e.clientX, e.clientY, 10)
}

const gongInfo = computed(() => (result.value === null ? null : GONGS[result.value]!))

const todayText = computed(() => {
  const l = Solar.fromDate(new Date()).getLunar()
  return `今日参照：${l.getMonthInChinese()}月${l.getDayInChinese()} ${l.getTimeZhi()}时`
})
</script>

<template>
  <div class="xlr-wrap">
    <div class="card head-card">
      <h2>小六壬 · 掐指一算</h2>
      <p class="sub">
        诸葛马前课，六宫定吉凶：心里想好要问的事，随口报个数就能起课。
        它是传统速占里最快的一种——梅花易数讲体用互变，小六壬只看落宫，适合问眼前一件具体的小事。
      </p>
      <div class="mode-row">
        <button class="ghost m-btn" :class="{ on: mode === 'one' }" @click="mode = 'one'; sfx.blip()">报一个数</button>
        <button class="ghost m-btn" :class="{ on: mode === 'three' }" @click="mode = 'three'; sfx.blip()">报三个数</button>
        <button class="ghost m-btn" :class="{ on: mode === 'auto' }" @click="mode = 'auto'; sfx.blip()">用时辰自动起课</button>
      </div>

      <div v-if="mode === 'one'" class="in-row">
        <input v-model="oneNum" type="number" min="1" placeholder="随口报一个数，如 108" />
      </div>
      <div v-else-if="mode === 'three'" class="in-row three">
        <input v-model="threeNums.a" type="number" min="1" placeholder="天数" />
        <input v-model="threeNums.b" type="number" min="1" placeholder="人数" />
        <input v-model="threeNums.c" type="number" min="1" placeholder="地数" />
      </div>
      <div v-if="mode !== 'auto'" class="in-row">
        <input v-model="question" type="text" placeholder="想问的事（可不填，心里想着也行）" />
      </div>

      <div class="go-row">
        <button :disabled="walking" @click="cast($event)">🪙 {{ walking ? '指上飞走…' : '起课' }}</button>
        <span class="note">{{ todayText }}</span>
      </div>
    </div>

    <div class="card palm-card">
      <div class="palm">
        <button
          v-for="(g, i) in GONGS" :key="g.name"
          class="gong" :class="{ hot: walking && walkIdx === i, done: !walking && result === i }"
          :style="{ '--i': i }"
          @click="peekGong(g)"
        >
          <b>{{ g.name }}</b>
          <span class="judge" :class="{ good: g.judge === '吉', mid: g.judge === '小吉' }">{{ g.judge }}</span>
        </button>
        <div class="palm-core">掐<span>指</span>一<span>算</span></div>
      </div>
      <transition name="popv">
        <div v-if="gongInfo && !walking" class="verdict">
          <span class="tag gold">{{ gongInfo.name }}</span>
          <span class="tag" :class="gongInfo.judge === '凶' ? '' : 'teal'">{{ gongInfo.judge === '小吉' ? '半吉' : gongInfo.judge }}</span>
          <span v-if="question.trim()" class="tag">所问：{{ question.trim().slice(0, 14) }}</span>
          <p class="sub v-text">{{ gongInfo.tip }}</p>
          <p class="note">小六壬答的是「眼前一件事的势」。大事婚姻事业投资，请回八字排盘细看，莫拿速占当终身判决。</p>
        </div>
      </transition>
      <p v-if="walking" class="note center-note">从大安起，指尖正点到第 {{ GONGS[walkIdx]?.name }} 宫…</p>
    </div>
  </div>
</template>

<style scoped>
.xlr-wrap { display: grid; gap: 16px; }
.head-card .sub { line-height: 2; }
.mode-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
.m-btn { padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; }
.m-btn.on { border-color: var(--gold); color: var(--gold-bright); background: rgba(var(--acc-rgb), 0.1); }

.in-row { display: flex; gap: 10px; margin-bottom: 10px; }
.in-row.three { max-width: 420px; }
.in-row input { flex: 1; }
.go-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

.palm-card { text-align: center; }
.palm { position: relative; width: 320px; height: 320px; margin: 6px auto 10px; }
.gong {
  position: absolute;
  width: 84px; height: 84px;
  left: calc(50% + 118px * cos(var(--i) * 60deg - 90deg) - 42px);
  top: calc(50% + 118px * sin(var(--i) * 60deg - 90deg) - 42px);
  border-radius: 50%;
  border: 1px solid rgba(var(--acc-rgb), 0.35);
  background: radial-gradient(closest-side, var(--card-2), var(--card));
  color: var(--fg);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, border-color 0.25s ease;
}
.gong b { font-family: var(--cute); font-size: 1.05rem; color: var(--gold-bright); }
.judge { font-size: 0.68rem; color: #f87171; }
.judge.good { color: var(--teal); }
.judge.mid { color: var(--amber); }
.gong.hot {
  transform: scale(1.22);
  border-color: var(--gold);
  box-shadow: 0 0 26px rgba(var(--acc-rgb), 0.55);
  z-index: 2;
}
.gong.done { border-color: var(--gold); animation: gong-glow 1.8s ease-in-out infinite; }
@keyframes gong-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(var(--acc-rgb), 0.35); }
  50% { box-shadow: 0 0 30px rgba(var(--acc-rgb), 0.75); }
}
.palm-core {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 96px; height: 96px;
  border-radius: 50%;
  border: 1px dashed rgba(var(--acc-rgb), 0.4);
  display: flex; align-items: center; justify-content: center; gap: 3px;
  font-family: var(--cute); font-size: 1.02rem; color: var(--dim);
  animation: core-spin 26s linear infinite;
}
@keyframes core-spin { to { rotate: 360deg; } }

.verdict { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: baseline; }
.v-text { flex-basis: 100%; max-width: 480px; margin: 6px auto 0; line-height: 2; }
.verdict .note { flex-basis: 100%; }
.center-note { letter-spacing: 0.2em; padding-left: 0.2em; }

.popv-enter-active { transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.popv-enter-from { opacity: 0; transform: translateY(10px); }
.popv-leave-active { display: none; }

@media (max-width: 560px) {
  .palm { transform: scale(0.86); margin: -14px auto; }
}
</style>
