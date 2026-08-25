<script setup lang="ts">
import { computed, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { hourGods, randomSign, signOfDay, type Sign } from '../data/oracleData'
import { sfx } from '../lib/sfx'

const d = new Date()
const daily = signOfDay(d.getFullYear(), d.getMonth() + 1, d.getDate())

const lunar = Solar.fromDate(d).getLunar()
const hours = hourGods(lunar.getDayInGanZhi().slice(1))
const curZhi = lunar.getTimeZhi()

const LEVEL_CLASS: Record<Sign['level'], string> = {
  上上: 'g-best',
  上吉: 'g-good',
  中平: 'g-mid',
  先难后易: 'g-turn',
  守成: 'g-mid',
}

const shaking = ref(false)
const drawn = ref<Sign | null>(null)
const flipping = ref(false)
const history = ref<Array<{ sign: Sign; q: string; ts: number }>>([])
const question = ref('')

async function draw(): Promise<void> {
  if (shaking.value) return
  shaking.value = true
  drawn.value = null
  sfx.toggle()
  await new Promise((r) => window.setTimeout(r, 1150))
  const pick = randomSign()
  sfx.pop()
  await new Promise((r) => window.setTimeout(r, 260))
  shaking.value = false
  flipping.value = true
  drawn.value = pick
  sfx.ding()
  history.value.unshift({ sign: pick, q: question.value.trim(), ts: Date.now() })
  if (history.value.length > 6) history.value.pop()
  window.setTimeout(() => (flipping.value = false), 700)
  window.dispatchEvent(new CustomEvent('sage-say', {
    detail: pick.level === '守成'
      ? '守成之签不是坏签——稳住基本盘，也是一种赢。'
      : `这支「${pick.poem[0]}」开头的签，细看解语。`,
  }))
}

const gradeClass = computed(() => (drawn.value ? LEVEL_CLASS[drawn.value.level] : ''))
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2>轻卜 · 一支签的小仪式</h2>
      <p class="sub">
        不用排盘不用装卦：心里存一件事，摇一摇签筒，掉出来的那支就是当下给你的批注。
        二十四支签各配一首五绝与解语；今日首签全天不换，摇签则随缘。
      </p>
      <div class="q-row">
        <label>心里想问的事（可不填，签只管当下）</label>
        <input v-model="question" type="text" maxlength="30" placeholder="如：要不要答应那次调动" />
      </div>
    </div>

    <div class="grid-top">
      <!-- 今日首签 -->
      <div class="sign-card" :class="LEVEL_CLASS[daily.level]">
        <span class="daily-badge">今日首签 · {{ daily.level }}</span>
        <div class="poem">
          <span v-for="(l, i) in daily.poem" :key="i" :style="{ '--d': `${i * 0.14}s` }">{{ l }}</span>
        </div>
        <p class="jie">{{ daily.jie }}</p>
      </div>

      <!-- 黄黑道时辰 -->
      <div class="card hours-card">
        <h2>今日时辰 · 黄黑道</h2>
        <div class="hours">
          <span
            v-for="h in hours" :key="h.zhi"
            class="hour-chip"
            :class="{ yellow: h.lucky, now: h.zhi === curZhi }"
            :title="`${h.god} · ${h.note}`"
          >
            <b>{{ h.zhi }}时</b>
            <em>{{ h.god }}</em>
          </span>
        </div>
        <p class="note">悬停看十二神提示；金字为黄道吉时，描边是当前时辰。</p>
      </div>
    </div>

    <div class="stage card center-card">
      <div class="tube-wrap" :class="{ shaking }">
        <div class="tube">
          <span v-for="n in 7" :key="n" class="stick" :style="{ '--n': n }"></span>
        </div>
      </div>
      <button class="draw-btn" :disabled="shaking" @click="draw()">
        {{ shaking ? '签筒摇晃中…' : drawn ? '再摇一支' : '❀ 摇签筒' }}
      </button>
    </div>

    <transition name="sign-pop">
      <div v-if="drawn" class="sign-card draw-result" :class="[gradeClass, { flipping }]">
        <div class="grade">{{ drawn.level }}</div>
        <div class="poem big">
          <span v-for="(l, i) in drawn.poem" :key="i" :style="{ '--d': `${i * 0.16}s` }">{{ l }}</span>
        </div>
        <p class="jie">{{ drawn.jie }}</p>
        <p v-if="question.trim()" class="asked sub">所问：「{{ question.trim() }}」</p>
      </div>
    </transition>

    <div v-if="history.length > 1" class="card">
      <h2>本次所抽</h2>
      <table>
        <tbody>
          <tr v-for="h in history" :key="h.ts">
            <td><span class="tag">{{ h.sign.level }}</span></td>
            <td>{{ h.sign.poem.join('') }}</td>
            <td class="note">{{ h.q || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.q-row { margin-top: 8px; }

.grid-top { display: grid; grid-template-columns: 1fr 1.25fr; gap: 16px; align-items: start; }

.sign-card {
  text-align: center;
  border-radius: 16px;
  padding: 24px 26px 20px;
  background:
    radial-gradient(300px 140px at 50% 0%, rgba(var(--acc-rgb), 0.09), transparent),
    linear-gradient(160deg, var(--card-2), var(--panel));
  border: 1px solid rgba(var(--acc-rgb), 0.4);
  box-shadow: var(--shadow);
}
.daily-badge { display: block; font-size: 0.74rem; color: var(--teal); letter-spacing: 0.16em; margin-bottom: 12px; }

.grade {
  display: inline-block;
  font-family: var(--cute);
  font-size: 1.05rem;
  letter-spacing: 0.3em;
  padding: 3px 16px 3px calc(16px + 0.3em);
  border-radius: 999px;
  margin-bottom: 12px;
}
.g-best .grade { background: rgba(var(--acc-rgb), 0.16); color: var(--gold-bright); }
.g-good .grade { background: rgba(var(--acc2-rgb), 0.13); color: var(--teal); }
.g-turn .grade { background: rgba(var(--amber-rgb, 251, 191, 36), 0.13); color: var(--amber); }
.g-turn .poem span { color: var(--fg); }
.g-mid .grade { background: rgba(127, 127, 127, 0.12); color: var(--dim); }

.poem { display: flex; flex-direction: column; gap: 6px; margin: 10px 0 12px; }
.poem span {
  font-family: var(--cute);
  font-size: 1.22rem;
  line-height: 1.8;
  letter-spacing: 0.28em;
  padding-left: 0.28em;
  color: var(--gold-bright);
  text-shadow: 0 0 18px rgba(var(--acc-rgb), 0.35);
  opacity: 0;
  animation: verse-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d);
}
.poem.big span { font-size: 1.42rem; }
@keyframes verse-in {
  from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: none; }
}
.jie { font-size: 0.86rem; color: var(--dim); line-height: 2; }
.asked { margin-top: 10px; }

.hours-card { padding-bottom: 14px; }
.hours { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 8px; }
.hour-chip {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  min-width: 62px;
  padding: 6px 8px 5px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(127, 127, 127, 0.06);
  cursor: help;
  transition: transform 0.2s ease;
}
.hour-chip:hover { transform: translateY(-2px); border-color: rgba(var(--acc-rgb), 0.45); }
.hour-chip b { font-family: var(--cute); font-size: 0.92rem; color: var(--fg); }
.hour-chip em { font-style: normal; font-size: 0.66rem; margin-top: 2px; color: var(--dim); }
.hour-chip.yellow em { color: var(--gold-bright); }
.hour-chip.now::after {
  content: '现在';
  position: absolute;
  top: -9px; right: -6px;
  font-size: 0.58rem;
  background: var(--teal);
  color: var(--on-accent);
  border-radius: 999px;
  padding: 1px 6px;
}

.stage { padding-bottom: 22px; }
.tube-wrap { height: 150px; display: flex; align-items: flex-end; justify-content: center; }
.tube {
  position: relative;
  width: 92px; height: 118px;
  border-radius: 12px 12px 18px 18px;
  background: linear-gradient(165deg, #4a3626, #2c1f14);
  border: 2px solid #6e5433;
  box-shadow: inset 0 6px 14px rgba(0, 0, 0, 0.5), 0 10px 24px rgba(0, 0, 0, 0.4);
}
.stick {
  position: absolute;
  bottom: 62%;
  left: calc(50% + (var(--n) - 4) * 9px);
  width: 7px; height: 64px;
  border-radius: 4px;
  background: linear-gradient(180deg, #d9b877, #b08a48);
  transform-origin: bottom center;
  transform: rotate(calc((var(--n) - 4) * 4deg));
}
.shaking .tube { animation: tube-shake 0.16s ease-in-out infinite; }
.shaking .stick { animation: stick-rattle 0.14s ease-in-out infinite; }
@keyframes tube-shake {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(6deg); }
}
@keyframes stick-rattle {
  0%, 100% { transform: rotate(calc((var(--n) - 4) * 7deg)); }
  50% { transform: rotate(calc((var(--n) - 4) * 1deg)) translateY(-3px); }
}

.draw-btn { margin-top: 14px; }
.draw-btn:disabled { opacity: 0.65; cursor: wait; }

.sign-card.flipping { animation: sign-flip 0.68s cubic-bezier(0.34, 1.2, 0.5, 1); }
@keyframes sign-flip {
  from { transform: rotateX(88deg) translateY(-14px); opacity: 0.2; }
  to { transform: none; opacity: 1; }
}

.sign-pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sign-pop-enter-from { opacity: 0; transform: translateY(16px) scale(0.94); }
.sign-pop-leave-active { display: none; }

@media (max-width: 800px) {
  .grid-top { grid-template-columns: 1fr; }
  .tube-wrap { height: 128px; }
  .tube { width: 78px; height: 100px; }
  .poem.big span { font-size: 1.2rem; }
}
</style>
