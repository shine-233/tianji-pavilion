<script setup lang="ts">
/** 道观地图：把全站功能串成一座观，点哪进哪殿 */
import { useRouter } from 'vue-router'
import { sfx } from '../lib/sfx'
import { vReveal } from '../lib/reveal'

const router = useRouter()

interface Hall { to: string; label: string; glyph: string; line: string }
const GROUPS: Array<{ name: string; halls: Hall[] }> = [
  {
    name: '前殿 · 算命问事',
    halls: [
      { to: '/chart', label: '八字排盘', glyph: '🀄', line: '四柱翻牌，七维评分' },
      { to: '/ziwei', label: '紫微命盘', glyph: '✷', line: '十二宫与星空盘' },
      { to: '/liuyao', label: '六爻纳甲', glyph: '🪙', line: '摇铜钱装卦，附卦库' },
      { to: '/meihua', label: '梅花易数', glyph: '❄', line: '时间起卦，体用生克' },
    ],
  },
  {
    name: '偏殿 · 每日速占',
    halls: [
      { to: '/daily', label: '每日一签', glyph: '🎋', line: '签筒摇签，六十支池' },
      { to: '/jiaobei', label: '杯筊问事', glyph: '🥢', line: '掷筊问允否，三圣为凭' },
      { to: '/xiaoliuren', label: '小六壬', glyph: '🖐', line: '掐指一算，速断小事' },
      { to: '/almanac', label: '今日黄历', glyph: '📅', line: '十二时辰黄黑道' },
      { to: '/oracle', label: '轻卜抽签', glyph: '❀', line: '旧版抽签，情怀常驻' },
    ],
  },
  {
    name: '后山 · 观星演道',
    halls: [
      { to: '/wuxing', label: '五行天穹', glyph: '🌌', line: '体素五行，拖拽环游' },
      { to: '/qimen', label: '奇门入门盘', glyph: '🧭', line: '定局布仪，旬空驿马' },
      { to: '/yanyi', label: '演易长卷', glyph: '䷀', line: '从无极到六十四卦' },
      { to: '/sages', label: '道长图鉴', glyph: '⛩', line: '十位当值道长在此' },
    ],
  },
  {
    name: '藏经阁 · 资料库',
    halls: [
      { to: '/classics', label: '典籍语料', glyph: '📜', line: '七部古书主题密度' },
      { to: '/geju', label: '格局辞典', glyph: '⚔', line: '49 格局五书互证' },
      { to: '/rules', label: '规则库', glyph: '⚖', line: '799 条规则可审计' },
      { to: '/cases', label: '案例库', glyph: '🗂', line: '两千余例按信度筛' },
      { to: '/settings', label: '客舍', glyph: '👘', line: '皮肤偏好与记录管理' },
    ],
  },
]

function go(to: string): void {
  sfx.ding()
  router.push(to)
}
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h2>道观地图 · 一图通全观</h2>
      <p class="sub">十七进殿宇按功能分了四路。初来客官从前殿走起；老香客直接奔后山。</p>
    </div>
    <section v-for="(g, gi) in GROUPS" :key="g.name" v-reveal="gi * 60" class="zone">
      <h2>{{ g.name }}</h2>
      <div class="hall-grid">
        <button v-for="h in g.halls" :key="h.to" class="hall" @click="go(h.to)">
          <span class="h-glyph">{{ h.glyph }}</span>
          <span class="h-label">{{ h.label }}</span>
          <span class="h-line">{{ h.line }}</span>
          <i class="h-arrow">→</i>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.zone { margin-bottom: 20px; }
.hall-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.hall {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: linear-gradient(160deg, var(--card-2), var(--card));
  color: var(--fg);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.22s ease;
}
.hall:hover { transform: translateY(-4px); border-color: rgba(var(--acc-rgb), 0.5); }
.h-glyph { font-size: 1.45rem; transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.hall:hover .h-glyph { transform: scale(1.2) rotate(-8deg); }
.h-label { font-family: var(--cute); font-size: 1rem; color: var(--gold-bright); }
.h-line { font-size: 0.7rem; color: var(--dim); }
.h-arrow {
  position: absolute;
  right: 14px;
  bottom: 12px;
  font-style: normal;
  color: var(--teal);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hall:hover .h-arrow { opacity: 1; transform: translateX(3px); }
</style>
