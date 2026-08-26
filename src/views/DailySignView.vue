<script setup lang="ts">
import { computed, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { hourGods } from '../data/oracleData'
import XiaoLiuren from '../components/XiaoLiuren.vue'
import { ALL_SIGNS, drawSign, hashStr, todayKey, TIER_STYLE, type Sign } from '../data/dailySigns'
import { addRecord } from '../lib/records'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

const dateKey = todayKey()
const todaySign = drawSign(dateKey)

// 黄黑道十二时辰
const d = new Date()
const lunar = Solar.fromDate(d).getLunar()
const hours = hourGods(lunar.getDayInGanZhi().slice(1))
const curZhi = lunar.getTimeZhi()

const shown = ref<Sign>(todaySign)
const revealed = ref(false)
const shaking = ref(false)
const stickFly = ref(false)
const isRandomPick = ref(false)
const question = ref('')
const history = ref<Array<{ sign: Sign; q: string; ts: number }>>([])

const tierStyle = computed(() => TIER_STYLE[shown.value.tier])

function shakeTube(): void {
  if (shaking.value || revealed.value) return
  shaking.value = true
  sfx.tick()
  window.setTimeout(() => {
    stickFly.value = true
    sfx.pop()
    window.setTimeout(() => {
      shaking.value = false
      stickFly.value = false
      shown.value = ALL_SIGNS[hashStr(String(Date.now())) % ALL_SIGNS.length]!
      isRandomPick.value = true
      revealed.value = true
      sfx.ding()
      sparkle(window.innerWidth / 2, window.innerHeight * 0.42, 14)
      history.value.unshift({ sign: shown.value, q: question.value.trim(), ts: Date.now() })
      if (history.value.length > 6) history.value.pop()
      addRecord({
        kind: 'sign',
        title: `随手签 · 第${shown.value.no}签 ${shown.value.tier}`,
        detail: question.value.trim() ? `问「${question.value.trim()}」` : shown.value.poem.join('，'),
      })
      window.dispatchEvent(new CustomEvent('sage-say', {
        detail: shown.value.tier === '小警'
          ? '这支签提个醒而已，不是坏兆头。'
          : `第${shown.value.no}签，${shown.value.tier}。解语你自己品品。`,
      }))
    }, 620)
  }, 900)
}

/** 展示今日首签的卡面 */
function showToday(): void {
  if (revealed.value || shaking.value) return
  sfx.flip()
  shown.value = todaySign
  isRandomPick.value = false
  revealed.value = true
}

function backToTube(): void {
  sfx.flip()
  revealed.value = false
  question.value = ''
}
</script>

<template>
  <main class="page">
    <h1>云鹤灵签</h1>
    <p class="sub">
      签筒里六十支签：三十六支七言、二十四支五绝，都是观里自拟的。
      每日首签按日期轮定——同一天来抽，人人同一支；心里有具体的事，就填一句再摇「随手签」，签只管当下。
    </p>

    <div class="grid-top v-reveal">
      <!-- 今日首签 -->
      <div class="card today-card" role="button" tabindex="0" @click="showToday" @keydown.enter="showToday">
        <span class="badge">今日首签 · {{ todaySign.tier }}</span>
        <div class="poem">
          <span v-for="(l, i) in todaySign.poem" :key="i" :style="{ '--d': `${i * 0.14}s` }">{{ l }}</span>
        </div>
        <p class="jie">{{ todaySign.note }}</p>
        <p class="note tap-hint">点卡片看完整签文与宜忌</p>
      </div>

      <!-- 黄黑道时辰 -->
      <div class="card hours-card">
        <h2>今日时辰 · 黄黑道</h2>
        <div class="hours">
          <span
            v-for="h in hours"
            :key="h.zhi"
            class="hour-chip"
            :class="{ yellow: h.lucky, now: h.zhi === curZhi }"
            :title="`${h.god} · ${h.note}`"
          >
            <b>{{ h.zhi }}时</b>
            <em>{{ h.god }}</em>
          </span>
        </div>
        <p class="note">悬停或长按看十二神提示；金字为黄道吉时，描边是当前时辰。</p>
      </div>
    </div>

    <section class="card stage-card v-reveal">
      <div class="q-row">
        <label>心里想问的事（可不填）</label>
        <input v-model="question" type="text" maxlength="30" placeholder="如：要不要答应那次调动" />
      </div>

      <!-- 签筒 -->
      <div v-if="!revealed" class="stage">
        <div class="tube-wrap" :class="{ shaking }">
          <div class="tube">
            <i v-for="n in 12" :key="n" class="stick" :style="{ '--r': (n - 6) * 4 + 'deg', '--h': 54 + ((n * 37) % 22) + 'px', '--n': n }"></i>
            <div class="band">雲鶴</div>
          </div>
        </div>
        <div v-if="stickFly" class="flying-stick"></div>
        <div class="actions">
          <button class="big-btn" :disabled="shaking" @click="shakeTube()">
            {{ shaking ? '摇簽中…' : '☯ 摇一支随手签' }}
          </button>
        </div>
        <p class="note hint">随手签即摇即得；今日首签点上面的卡即可展开。</p>
      </div>

      <!-- 签文卡 -->
      <div v-else class="sign-wrap">
        <article class="sign-card" :class="{ flipping: true }">
          <header class="head">
            <span class="no">{{ isRandomPick ? '随手签' : '今日首签' }} · 第 {{ shown.no }} 签</span>
            <b class="tier" :style="{ color: tierStyle.color }">{{ tierStyle.label }}</b>
          </header>
          <div class="poem big">
            <span v-for="(l, i) in shown.poem" :key="i" :style="{ '--d': `${0.15 + i * 0.16}s` }">{{ l }}</span>
          </div>
          <p class="note-text">{{ shown.note }}</p>
          <p v-if="question.trim()" class="asked sub">所问：「{{ question.trim() }}」</p>
          <div class="dd">
            <span class="do"><b>宜</b>{{ shown.doText }}</span>
            <span class="dont"><b>忌</b>{{ shown.dontText }}</span>
          </div>
        </article>
        <div class="actions">
          <button class="ghost" @click="shakeTube()">再摇一支</button>
          <button class="ghost" @click="backToTube">收起签筒</button>
        </div>
        <p class="note hint">共 {{ ALL_SIGNS.length }} 支签。签是好签，事在人为。</p>
      </div>
    </section>

    <section class="card v-reveal">
      <h2>小六壬 · 掐指速断</h2>
      <XiaoLiuren />
    </section>

    <section v-if="history.length > 1" class="card v-reveal">
      <h2>本次所抽</h2>
      <table>
        <tbody>
          <tr v-for="h in history" :key="h.ts">
            <td><span class="tag g">{{ h.sign.tier }}</span></td>
            <td>第{{ h.sign.no }}签 · {{ h.sign.poem.join('') }}</td>
            <td class="note">{{ h.q || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.grid-top { display: grid; grid-template-columns: 1fr 1.25fr; gap: 14px; align-items: stretch; }

.today-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s ease;
}
.today-card:hover { transform: translateY(-4px); border-color: var(--card-glow); }
.badge { display: block; font-size: 0.74rem; color: var(--teal); letter-spacing: 0.16em; margin-bottom: 10px; }
.tap-hint { opacity: 0.7; margin-top: 10px; }

.poem { display: flex; justify-content: center; gap: clamp(14px, 4vw, 26px); margin: 14px 0; min-height: 120px; }
.poem span {
  writing-mode: vertical-rl;
  font-family: var(--serif);
  font-size: 1.24rem;
  letter-spacing: 0.38em;
  color: var(--gold-bright);
  text-shadow: 0 0 18px var(--glow);
  opacity: 0;
  animation: verse-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d);
}
.poem.big span { font-size: 1.4rem; }
@keyframes verse-in {
  from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: none; }
}
.jie { font-size: 0.84rem; color: var(--dim); line-height: 2; }

.hours { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.hour-chip {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  min-width: 58px;
  padding: 6px 8px 5px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(127, 127, 127, 0.06);
  cursor: help;
  transition: transform 0.2s ease;
}
.hour-chip:hover { transform: translateY(-2px); border-color: var(--card-glow); }
.hour-chip b { font-family: var(--cute); font-size: 0.9rem; color: var(--fg); }
.hour-chip em { font-style: normal; font-size: 0.64rem; margin-top: 2px; color: var(--dim); }
.hour-chip.yellow em { color: var(--gold-bright); }
.hour-chip.now::after {
  content: '现在';
  position: absolute;
  top: -9px; right: -6px;
  font-size: 0.58rem;
  background: var(--teal);
  border-radius: 999px;
  padding: 1px 6px;
}

.q-row { max-width: 420px; }

.stage { text-align: center; position: relative; }
.tube-wrap { height: 150px; display: flex; align-items: flex-end; justify-content: center; margin-top: 12px; }
.tube {
  position: relative;
  width: 112px; height: 132px;
  border-radius: 15px 15px 20px 20px;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.25), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.3)),
    linear-gradient(180deg, #7a5c38, #5f4628);
  border: 2px solid #46351f;
  box-shadow: inset 0 6px 14px rgba(0, 0, 0, 0.5), 0 14px 30px rgba(0, 0, 0, 0.4);
}
.tube .stick {
  position: absolute;
  bottom: 62%;
  left: calc(50% + (var(--n) - 6.5) * 8px);
  width: 7px;
  height: var(--h);
  background: linear-gradient(180deg, #d9b57c, #a87f45);
  border-radius: 3px;
  transform-origin: bottom center;
  transform: rotate(var(--r));
}
.tube .band {
  position: absolute;
  left: 50%; top: 60%;
  transform: translate(-50%, -50%) rotate(-4deg);
  writing-mode: vertical-rl;
  color: #f2e2b8;
  letter-spacing: 0.32em;
  font-size: 0.9rem;
  padding: 9px 4px;
  border: 1px solid rgba(242, 226, 184, 0.5);
  border-radius: 4px;
}
.shaking .tube { animation: tube-shake 0.18s ease-in-out infinite; }
.shaking .stick { animation: stick-rattle 0.15s ease-in-out infinite; }
@keyframes tube-shake {
  0%, 100% { transform: rotate(-5deg) translateY(-2px); }
  50% { transform: rotate(6deg) translateY(-2px); }
}
@keyframes stick-rattle {
  0%, 100% { transform: rotate(calc(var(--r) + 3deg)); }
  50% { transform: rotate(calc(var(--r) - 3deg)) translateY(-3px); }
}

.flying-stick {
  position: absolute;
  left: 50%; top: 30%;
  width: 8px; height: 66px;
  margin-left: -4px;
  background: linear-gradient(180deg, #d9b57c, #a87f45);
  border-radius: 4px;
  animation: fly-up 0.62s cubic-bezier(0.3, 0.9, 0.5, 1) forwards;
}
@keyframes fly-up {
  0% { transform: translateY(60px) rotate(0); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateY(-130px) rotate(24deg); opacity: 0; }
}

.actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
.big-btn { font-size: 1rem; }
.hint { margin-top: 12px; }

.sign-wrap { width: 100%; max-width: 480px; margin: 0 auto; }
.sign-card {
  position: relative;
  background:
    radial-gradient(circle at 88% 6%, rgba(232, 196, 115, 0.12), transparent 40%),
    linear-gradient(165deg, var(--card-2), var(--card));
  border: 1px solid var(--card-glow);
  border-radius: 16px;
  padding: 24px 26px 20px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
  animation: sign-flip 0.68s cubic-bezier(0.34, 1.2, 0.5, 1);
}
@keyframes sign-flip {
  from { transform: rotateX(70deg) translateY(-12px); opacity: 0.2; }
  to { transform: none; opacity: 1; }
}
.head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed var(--line); padding-bottom: 10px; }
.no { font-family: var(--cute); color: var(--dim); letter-spacing: 0.12em; font-size: 0.86rem; }
.tier { font-family: var(--cute); font-size: 1.02rem; }
.note-text { line-height: 2.05; color: var(--fg); font-size: 0.9rem; margin-top: 14px; }
.asked { margin-top: 8px; }

.dd { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 16px; }
.dd span { padding: 9px 12px; border-radius: 9px; font-size: 0.82rem; line-height: 1.7; }
.dd b { display: inline-block; margin-right: 8px; font-family: var(--cute); font-size: 0.9rem; }
.do { background: rgba(94, 234, 212, 0.08); border: 1px solid rgba(94, 234, 212, 0.25); }
.do b { color: var(--teal); }
.dont { background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.25); }
.dont b { color: var(--red); }

@media (max-width: 800px) {
  .grid-top { grid-template-columns: 1fr; }
  .tube-wrap { height: 128px; }
  .tube { width: 88px; height: 108px; }
  .poem span { font-size: 1.05rem; }
  .poem.big span { font-size: 1.18rem; }
  .dd { grid-template-columns: 1fr; }
}
</style>
