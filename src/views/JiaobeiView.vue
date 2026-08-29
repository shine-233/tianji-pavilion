<script setup lang="ts">
import { ref } from 'vue'
import { sfx } from '../lib/sfx'
import { addRecord } from '../lib/records'
import SectionCard from '../components/SectionCard.vue'

type Face = 'yang' | 'yin'
interface Toss { a: Face; b: Face; ok: boolean }

const question = ref('')
const tossing = ref(false)
const current = ref<Toss | null>(null)
const history = ref<boolean[]>([])
const spinning = ref(false)

function rand(): Face {
  return Math.random() < 0.5 ? 'yang' : 'yin'
}

function judge(t: Toss): string {
  if (t.ok) return '圣杯 · 允许'
  if (t.a === 'yin' && t.b === 'yin') return '阴杯 · 不宜'
  return '笑杯 · 再问'
}

const verdict = ref('')

async function throwOnce(): Promise<void> {
  spinning.value = true
  sfx.knock()
  await new Promise((r) => setTimeout(r, 650))
  const a = rand()
  const b = rand()
  // 一平一凸即圣杯
  const t: Toss = { a, b, ok: a !== b }
  current.value = t
  spinning.value = false
  sfx.knock()
  return new Promise((r) => setTimeout(r, 500))
}

async function cast(): Promise<void> {
  if (tossing.value) return
  tossing.value = true
  history.value = []
  verdict.value = ''
  await throwOnce()
  history.value.push(current.value!.ok)
  tossing.value = false
  addRecord({ kind: 'sign', title: `杯筊·${judge(current.value!)}`, detail: question.value || '未记所问' })
}

async function castThree(): Promise<void> {
  if (tossing.value) return
  tossing.value = true
  history.value = []
  verdict.value = ''
  sfx.gong()
  for (let i = 0; i < 3; i++) {
    await throwOnce()
    history.value.push(current.value!.ok)
  }
  tossing.value = false
  const n = history.value.filter(Boolean).length
  verdict.value = [
    '三阴，此事眼下不成。换个时机或换个问法。',
    '一圣，念头未定。先静三日再来问。',
    '两圣，大体可行。细节还需自己拿捏。',
    '三圣，允了！放手去做，记得回头还愿。',
  ][n]!
  sfx.ding()
  window.dispatchEvent(new CustomEvent('sage-say', { detail: `杯筊三问得${['零', '一', '两', '三'][n]}圣：${verdict.value}` }))
  addRecord({ kind: 'sign', title: `杯筊三问·${n}圣`, detail: question.value || '未记所问' })
}
</script>

<template>
  <main class="page">
    <SectionCard title="杯筊问事 · 一问一掷见分晓">
      <p class="sub">
        两片半月木筊掷在地上：一片平一面凸即是<b class="gold-t">圣杯</b>（应允），
        两片皆凸是<b>阴杯</b>（不宜），两片皆平是<b>笑杯</b>（一笑置之，再问问看）。
        庙里规矩：一事一问，连得三圣才算数。
      </p>
      <label style="margin-top: 12px">所问何事（可不填）</label>
      <input v-model="question" maxlength="24" placeholder="例：这周末要不要回家看看" />
      <div class="jb-btns">
        <button :disabled="tossing" @click="cast()">🥢 掷一次</button>
        <button class="ghost" :disabled="tossing" @click="castThree()">连掷三次定乾坤</button>
      </div>
    </SectionCard>

    <SectionCard class="center-card" :delay="80">
      <div class="blocks" :class="{ spin: spinning }">
        <div v-for="s in ['a', 'b'] as const" :key="s" class="jiao" :class="[current ? current[s] : 'yang', `pos-${s}`]"></div>
      </div>
      <transition name="pop">
        <p v-if="current && !spinning" class="res-line">{{ judge(current) }}</p>
      </transition>
      <p v-if="!current" class="note" style="margin-top: 10px">
        筊已备好，还没掷。心里默念所问之事，点上面「掷一次」——
        <a href="#/daily">拿不定先抽支签</a> 也行。
      </p>
      <div v-if="history.length" class="beads">
        <span v-for="(ok, i) in history" :key="i" class="bead" :class="{ ok }">{{ ok ? '圣' : '×' }}</span>
      </div>
      <transition name="pop">
        <p v-if="verdict" class="verdict">{{ verdict }}</p>
      </transition>
    </SectionCard>
  </main>
</template>

<style scoped>
.jb-btns { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.center-card { text-align: center; }
.blocks { display: flex; gap: 34px; justify-content: center; margin: 18px 0 8px; min-height: 92px; align-items: center; }
.jiao {
  width: 64px;
  height: 88px;
  border-radius: 32px 32px 14px 14px;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.jiao::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: inherit;
}
.jiao.yang { background: linear-gradient(165deg, #e8d5a8, #b8935c); transform: translateY(-4px) rotate(-3deg); }
.jiao.pos-b.yang { transform: translateY(-4px) rotate(3deg); }
.jiao.yin { background: linear-gradient(165deg, #a2917a, #7c684e); transform: rotateY(180deg) translateY(3px); }
.blocks.spin .jiao { animation: jiao-toss 0.28s linear infinite; }
@keyframes jiao-toss {
  0% { transform: translateY(0) rotateX(0); }
  50% { transform: translateY(-26px) rotateX(200deg); }
  100% { transform: translateY(0) rotateX(360deg); }
}
.res-line { font-family: var(--cute); font-size: 1.3rem; color: var(--gold-bright); text-shadow: 0 0 16px rgba(var(--acc-rgb), 0.45); }
.beads { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
.bead {
  width: 30px; height: 30px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--cute); font-size: 0.82rem;
  border: 1px solid var(--line); color: var(--dim);
}
.bead.ok { border-color: rgba(var(--acc-rgb), 0.55); color: var(--gold-bright); background: rgba(var(--acc-rgb), 0.1); }
.verdict { margin-top: 14px; line-height: 2; font-size: 0.95rem; color: var(--fg); }
.pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
.pop-leave-active { display: none; }
</style>
