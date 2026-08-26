<script setup lang="ts">
import { computed, ref } from 'vue'
import { drawSign, hashStr, SIGNS, todayKey, TIER_STYLE } from '../data/dailySigns'
import { addRecord } from '../lib/records'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

const dateKey = todayKey()
const todaySign = drawSign(dateKey)
const shown = ref(todaySign)
const flipped = ref(false)
const shaking = ref(false)
const stickFly = ref(false)
const isRandomPick = ref(false)


const tierStyle = computed(() => TIER_STYLE[shown.value.tier])

function shakeTube(random: boolean): void {
  if (shaking.value || flipped.value) return
  shaking.value = true
  sfx.tick()
  window.setTimeout(() => {
    stickFly.value = true
    sfx.pop()
    window.setTimeout(() => {
      shaking.value = false
      stickFly.value = false
      shown.value = random ? SIGNS[hashStr(String(Date.now())) % SIGNS.length] : todaySign
      isRandomPick.value = random
      flipped.value = true
      sfx.ding()
      sparkle(window.innerWidth / 2, window.innerHeight * 0.42, 14)
      addRecord({
        kind: 'sign',
        title: `${random ? '随手签' : '今日签'} · 第${shown.value.no}签 ${shown.value.tier}`,
        detail: shown.value.poem.join('，'),
      })
    }, 620)
  }, 900)
}

function backToTube(): void {
  sfx.flip()
  flipped.value = false
}
</script>

<template>
  <main class="page">
    <h1>云鹤观灵签</h1>
    <p class="sub">
      观里有一只老签筒，三十六支签。每日一签是定好的——同一天来抽，人人都是那一支；
      心里有具体的事想问，就自己动手摇一支「随手签」。签文是本观自拟的，图个会心一笑。
    </p>

    <section class="card stage-card">
      <!-- 签筒 -->
      <div v-if="!flipped" class="stage">
        <div class="tube" :class="{ shake: shaking }">
          <i v-for="n in 12" :key="n" class="stick" :style="{ '--r': (n - 6) * 4 + 'deg', '--h': 54 + ((n * 37) % 22) + 'px' }"></i>
          <div class="band">雲鶴</div>
        </div>
        <div v-if="stickFly" class="flying-stick"></div>

        <div class="actions">
          <button class="big-btn" :disabled="shaking" @click="shakeTube(false)">
            {{ shaking ? '摇簽中…' : '☯ 求今日一签' }}
          </button>
          <button class="ghost" :disabled="shaking" @click="shakeTube(true)">心里有事 · 摇支随手签</button>
        </div>
        <p v-if="!isRandomPick && !flipped" class="note hint">今日签按日期定死，同一支签陪你一天；有具体要决的事，摇随手签。</p>
        <p v-else-if="isRandomPick && !flipped" class="note hint">随手签是即摇即得，仅供把玩。</p>
      </div>

      <!-- 签卡 -->
      <div v-else class="sign-wrap">
        <transition name="flip-in">
          <article class="sign-card">
            <header class="head">
              <span class="no">第 {{ shown.no }} 签</span>
              <b class="tier" :style="{ color: tierStyle.color }">{{ tierStyle.label }}</b>
            </header>
            <div class="poem">
              <p v-for="(line, i) in shown.poem" :key="i" :style="{ '--i': i }">{{ line }}</p>
            </div>
            <p class="note-text">{{ shown.note }}</p>
            <footer class="do-dont">
              <span class="do"><b>宜</b>{{ shown.doText }}</span>
              <span class="dont"><b>忌</b>{{ shown.dontText }}</span>
            </footer>
          </article>
        </transition>

        <div class="actions">
          <button class="ghost" @click="backToTube">← 收起签文</button>
          <button class="ghost" @click="flipped = false; shaking = false">再摇一支</button>
        </div>
        <p class="note hint">共 {{ SIGNS.length }} 支签，全部原创。签是好签，事在人为。</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.stage-card { min-height: 420px; display: flex; align-items: center; justify-content: center; }
.stage { text-align: center; width: 100%; }

.tube {
  position: relative;
  width: 120px;
  height: 150px;
  margin: 10px auto 26px;
  border-radius: 16px 16px 22px 22px;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.25), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.3)),
    linear-gradient(180deg, #7a5c38, #5f4628);
  border: 2px solid #46351f;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45), inset 0 4px 10px rgba(255, 255, 255, 0.12);
}
.tube .stick {
  position: absolute;
  top: -18px;
  left: calc(50% + (var(--r) * 1.6));
  width: 7px;
  height: var(--h);
  background: linear-gradient(180deg, #d9b57c, #a87f45);
  border-radius: 3px;
  transform: rotate(var(--r));
  transform-origin: bottom center;
  box-shadow: inset -1px 0 2px rgba(0, 0, 0, 0.35);
}
.tube .band {
  position: absolute;
  left: 50%; top: 58%;
  transform: translate(-50%, -50%) rotate(-4deg);
  writing-mode: vertical-rl;
  font-family: var(--serif);
  color: #f2e2b8;
  letter-spacing: 0.35em;
  font-size: 0.95rem;
  padding: 10px 4px;
  border: 1px solid rgba(242, 226, 184, 0.55);
  border-radius: 4px;
}
.tube.shake { animation: tube-shake 0.28s ease-in-out infinite; }
@keyframes tube-shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-7deg) translateY(-3px); }
  75% { transform: rotate(7deg) translateY(-3px); }
}

.flying-stick {
  position: absolute;
  left: 50%; top: 26%;
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
.hint { margin-top: 14px; }

.sign-wrap { width: 100%; max-width: 480px; }

.sign-card {
  position: relative;
  background:
    radial-gradient(circle at 88% 6%, rgba(232, 196, 115, 0.12), transparent 40%),
    linear-gradient(165deg, var(--card-2), var(--card));
  border: 1px solid var(--card-glow);
  border-radius: 16px;
  padding: 26px 28px 22px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.4);
}
.flip-in-enter-active { transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.flip-in-enter-from { opacity: 0; transform: rotateY(80deg) translateY(-20px); }

.head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed var(--line); padding-bottom: 10px; }
.no { font-family: var(--cute); color: var(--dim); letter-spacing: 0.15em; }
.tier { font-family: var(--cute); font-size: 1.05rem; }

.poem {
  margin: 22px 0 18px;
  display: flex;
  justify-content: center;
  gap: 26px;
}
.poem p {
  writing-mode: vertical-rl;
  font-family: var(--serif);
  font-size: 1.32rem;
  letter-spacing: 0.42em;
  color: var(--fg);
  animation: drop-line 0.7s ease both;
  animation-delay: calc(var(--i) * 0.25s + 0.2s);
}
@keyframes drop-line { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: none; } }

.note-text { line-height: 2.05; color: var(--fg); font-size: 0.92rem; animation: drop-line 0.6s ease both 0.75s; }

.do-dont { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; animation: drop-line 0.6s ease both 0.95s; }
.do-dont span {
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 0.82rem;
  line-height: 1.7;
}
.do-dont b {
  display: inline-block;
  margin-right: 8px;
  font-family: var(--cute);
  font-size: 0.9rem;
}
.do { background: rgba(94, 234, 212, 0.08); border: 1px solid rgba(94, 234, 212, 0.25); }
.do b { color: var(--teal); }
.dont { background: rgba(248, 113, 113, 0.08); border: 1px solid rgba(248, 113, 113, 0.25); }
.dont b { color: var(--red); }

@media (max-width: 520px) {
  .poem p { font-size: 1.12rem; letter-spacing: 0.3em; }
}
</style>
