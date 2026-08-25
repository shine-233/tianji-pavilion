<script setup lang="ts">
import { ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { sfx } from '../lib/sfx'

interface Sign {
  grade: '上上' | '上吉' | '中平' | '下下'
  verse: string
  note: string
}

const SIGNS: Sign[] = [
  { grade: '上上', verse: '春木得水，枝叶自荣', note: '该来的正在路上。这阵子做的事像春天浇水，看不见动静，根已经在长。' },
  { grade: '上上', verse: '云开月出，正大光明', note: '憋了很久的一口气要顺了。趁势把搁置的正事推一把，别浪费这束光。' },
  { grade: '上吉', verse: '舟行顺风，帆不必满', note: '事情会成，但别贪快。留三分余地，反而比全速更早到岸。' },
  { grade: '上吉', verse: '枯井生泉，旧物逢新', note: '以为没戏的事会回春——翻出老计划、老交情再看看，转机藏在那里。' },
  { grade: '上吉', verse: '宝剑出匣，锋芒当试', note: '能力到了该亮出来的时候。考试、面试、竞标，尽管去，这一支利你出手。' },
  { grade: '中平', verse: '静水流深，不显山色', note: '眼下没什么可炫耀的进展，但积累没有白费。沉住气，水面下的功夫最值钱。' },
  { grade: '中平', verse: '耕云种月，收成在后', note: '付出和回报暂时对不上账。不是算错了，是季节没到。继续浇灌，少翻土。' },
  { grade: '中平', verse: '歧路遇灯，且问初心', note: '面前不止一条路，选哪条都不致命。回到最初想要什么，答案自己会浮上来。' },
  { grade: '中平', verse: '细雨湿衣，防微杜渐', note: '有件小事在悄悄变大。合同、体检、那句没说开的误会——早点处理，省后面的力气。' },
  { grade: '下下', verse: '逆水撑船，莫强求渡', note: '这一阵硬碰硬不合算。能绕就绕，能等就等，退一步不是输，是省船桨。' },
]

/** 今日首签：按日期固定，全天同一支 */
function todaySign(): Sign {
  const d = new Date()
  return SIGNS[(d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) % SIGNS.length]!
}
const daily = todaySign()

/** 黄黑道时辰：青龙起位口诀 + 十二神轮排 */
const ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const GODS12 = ['青龙', '明堂', '天刑', '朱雀', '金匮', '宝光', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈']
const YELLOW_GODS = new Set(['青龙', '明堂', '金匮', '宝光', '玉堂', '司命'])
const QINGLONG_START: Record<string, number> = {
  子: 8, 午: 8, 寅: 0, 申: 0, 卯: 2, 酉: 2,
  辰: 4, 戌: 4, 巳: 6, 亥: 6, 丑: 10, 未: 10,
}
const SHICHEN_NAME = ['子 23-1', '丑 1-3', '寅 3-5', '卯 5-7', '辰 7-9', '巳 9-11', '午 11-13', '未 13-15', '申 15-17', '酉 17-19', '戌 19-21', '亥 21-23']

function hourSlots(): Array<{ label: string; god: string; yellow: boolean; now: boolean }> {
  const lunar = Solar.fromDate(new Date()).getLunar()
  const dayZhi = lunar.getDayInGanZhi().slice(1)
  const start = QINGLONG_START[dayZhi] ?? 0
  const curIdx = ZHI12.indexOf(lunar.getTimeZhi())
  return ZHI12.map((_, i) => {
    const god = GODS12[(start + i) % 12]!
    return {
      label: SHICHEN_NAME[i]!,
      god,
      yellow: YELLOW_GODS.has(god),
      now: i === curIdx,
    }
  })
}
const hours = hourSlots()

function gradeClassOf(grade: Sign['grade']): string {
  return {
    上上: 'g-best',
    上吉: 'g-good',
    中平: 'g-mid',
    下下: 'g-low',
  }[grade]!
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
  const pick = SIGNS[Math.floor(Math.random() * SIGNS.length)]!
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
    detail: pick.grade === '下下'
      ? '抽到下签先别皱眉——签是提醒，不是判决。'
      : `这支「${pick.verse}」不错，拿稳了。`,
  }))
}
</script>

<template>
  <main class="page">
    <div class="card hoverable">
      <h2>轻卜 · 一支签的小仪式</h2>
      <p class="sub">
        不用排盘不用装卦：心里存一件事，摇一摇签筒，掉出来的那支就是当下给你的批注。
        签文短，解语也不长——轻问轻答，适合不值得起大卦的小犹疑。
      </p>
      <div class="q-row">
        <label>心里想问的事（可不填，签只管当下）</label>
        <input v-model="question" type="text" maxlength="30" placeholder="如：要不要答应那次调动" />
      </div>
    </div>

    <div class="grid-top">
      <div class="sign-card daily">
        <span class="daily-badge">今日首签 · 全天同一支</span>
        <div class="grade">{{ daily.grade }}</div>
        <p class="verse">「{{ daily.verse }}」</p>
        <p class="note-line">{{ daily.note }}</p>
      </div>

      <div class="card hours-card">
        <h2>今日时辰 · 黄黑道</h2>
        <div class="hours">
          <span
            v-for="h in hours" :key="h.label"
            class="hour-chip"
            :class="{ yellow: h.yellow, now: h.now }"
            :title="`${h.god}${h.yellow ? '·黄道' : '·黑道'}`"
          >
            <b>{{ h.label.split(' ')[0] }}</b>
            <i>{{ h.label.split(' ')[1] }}</i>
            <em>{{ h.god }}</em>
          </span>
        </div>
        <p class="note">金字为黄道吉时，灰字为黑道；描边是你现在所在的时辰。</p>
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
      <div v-if="drawn" class="sign-card draw-result" :class="[gradeClassOf(drawn.grade), { flipping }]">
        <div class="grade">{{ drawn.grade }}</div>
        <p class="verse">「{{ drawn.verse }}」</p>
        <p class="note-line">{{ drawn.note }}</p>
        <p v-if="question.trim()" class="asked sub">所问：「{{ question.trim() }}」</p>
      </div>
    </transition>

    <div v-if="history.length > 1" class="card">
      <h2>本次所抽</h2>
      <table>
        <tbody>
          <tr v-for="h in history" :key="h.ts">
            <td><span class="tag" :class="h.sign.grade === '下下' ? 'red' : h.sign.grade === '中平' ? '' : 'teal'">{{ h.sign.grade }}</span></td>
            <td>{{ h.sign.verse }}</td>
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
.daily { margin-bottom: 16px; }
.daily-badge { display: block; font-size: 0.72rem; color: var(--teal); letter-spacing: 0.14em; margin-bottom: 12px; }

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
.g-mid .grade { background: rgba(127, 127, 127, 0.12); color: var(--dim); }
.g-low .grade { background: rgba(var(--red-rgb), 0.12); color: var(--red); }

.verse { font-family: var(--cute); font-size: 1.4rem; line-height: 1.9; color: var(--fg); margin-bottom: 10px; }
.note-line { font-size: 0.86rem; color: var(--dim); line-height: 2; }
.asked { margin-top: 10px; }

.hours-card { padding-bottom: 14px; }
.hours { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 8px; }
.hour-chip {
  display: flex; flex-direction: column; align-items: center;
  min-width: 64px;
  padding: 6px 8px 5px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(127, 127, 127, 0.06);
  transition: transform 0.2s ease;
}
.hour-chip:hover { transform: translateY(-2px); }
.hour-chip b { font-family: var(--cute); font-size: 0.92rem; color: var(--fg); }
.hour-chip i { font-style: normal; font-size: 0.62rem; color: var(--dim); }
.hour-chip em { font-style: normal; font-size: 0.62rem; margin-top: 2px; color: var(--dim); }
.hour-chip.yellow em { color: var(--gold-bright); }
.hour-chip.now { outline: 2px solid var(--teal); outline-offset: 1px; }

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
  .verse { font-size: 1.2rem; }
}
</style>
