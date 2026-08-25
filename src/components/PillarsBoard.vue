<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ELE_B, ELE_S } from '../lib/constants'
import { Pillar, shiShen } from '../lib/engine'
import { sfx } from '../lib/sfx'

const props = defineProps<{ ps: Pillar }>()
const flipped = ref(false)
onMounted(() => window.setTimeout(() => (flipped.value = true), 80))

const HEADS = ['年柱', '月柱', '日柱', '时柱']
const BRANCH_ANIMAL = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function click(): void {
  sfx.flip()
}
</script>

<template>
  <div class="pillars" :class="{ flipped }" @click="click">
    <div v-for="(p, i) in props.ps" :key="i" class="pillar-card" :style="{ transitionDelay: `${i * 120}ms` }">
      <div class="head">{{ HEADS[i] }}<span v-if="i === 2" class="dm-badge">日主</span></div>
      <div class="gan ele" :class="`ele-${ELE_S[p[0]]}`">{{ p[0] }}</div>
      <div class="ten-god">{{ i === 2 ? '元神' : shiShen(props.ps[2]!, p[0]) }}</div>
      <div class="divider"></div>
      <div class="zhi ele" :class="`ele-${ELE_B[p[1]]}`">{{ p[1] }}</div>
      <div class="ten-god dim">{{ ELE_B[p[1]] }} · {{ BRANCH_ANIMAL[ZHI_ORDER.indexOf(p[1])] }}</div>
    </div>
  </div>
</template>

<style scoped>
.pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; perspective: 900px; }
.pillar-card {
  background: linear-gradient(165deg, #202636, #161a24);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 10px 12px;
  text-align: center;
  opacity: 0;
  transform: rotateY(88deg) translateY(18px);
  transition: opacity 0.55s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.pillars.flipped .pillar-card { opacity: 1; transform: none; }
.pillar-card:hover { border-color: rgba(232, 196, 115, 0.45); }
.pillar-card::after {
  content: '';
  position: absolute;
  inset: -60% -20%;
  background: radial-gradient(closest-side, rgba(232, 196, 115, 0.08), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.pillar-card:hover::after { opacity: 1; }

.head { font-size: 0.78rem; color: var(--dim); margin-bottom: 8px; letter-spacing: 0.3em; padding-left: 0.3em; }
.dm-badge {
  display: inline-block;
  background: rgba(232, 196, 115, 0.15);
  color: var(--gold-bright);
  font-size: 0.62rem;
  border-radius: 999px;
  padding: 1px 7px;
  margin-left: 5px;
  letter-spacing: 0;
  vertical-align: 1px;
}
.ele { font-size: 2.15rem; font-family: var(--cute); line-height: 1.25; text-shadow: 0 0 22px currentColor; }
.ten-god { font-size: 0.72rem; color: var(--gold); min-height: 1.1em; }
.divider { height: 1px; background: var(--line); margin: 9px 14px; }
.dim { color: var(--dim); }

@media (max-width: 640px) {
  .pillars { gap: 7px; }
  .ele { font-size: 1.6rem; }
  .pillar-card { padding: 10px 4px 8px; }
}
</style>
