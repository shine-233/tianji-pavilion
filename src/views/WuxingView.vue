<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VoxelWuxing from '../components/VoxelWuxing.vue'
import RichText from '../components/RichText.vue'
import { Element, ELE_S, ELE_B, ELEMENT_DESC, SHENG_ORDER } from '../lib/constants'
import { elementAdvice } from '../lib/interpret'
import type { ChartResult } from '../lib/engine'
import { loadHistory, HistoryItem } from '../lib/history'
import { runChart } from '../lib/runtime'
import { sfx } from '../lib/sfx'

const router = useRouter()
const selected = ref<Element>('木')
const chart = ref<ChartResult | null>(null)
const lastHistory = ref<HistoryItem | null>(loadHistory()[0] ?? null)

const voxel = ref<InstanceType<typeof VoxelWuxing> | null>(null)

function onSelect(e: Element): void {
  selected.value = e
}

function pick(e: Element): void {
  selected.value = e
  sfx.blip()
  // 页签与 3D 双向联动：点档案聚焦天穹同款元素，再赏一朵粒子花
  voxel.value?.selectExternal(e)
  voxel.value?.triggerBurst(e)
}

function recount(): void {
  const h = lastHistory.value
  if (!h) return
  sfx.gong()
  chart.value = runChart(h.y, h.m, h.d, h.hh, h.mm, h.gender)
}

function clearChart(): void {
  chart.value = null
  sfx.toggle()
}
</script>

<template>
  <main class="page">
    <div class="card" style="padding-bottom: 8px">
      <h2><DecryptTitle text="五行天穹 · 体素建模" /></h2>
      <p class="sub">
        木火土金水五个体素模型环绕太极台徐徐公转，金色弧线为相生循环，赤色虚线为相克对角。
        点击任意元素聚焦查看它的生克关系；排盘后各元素会按命局字数改变体量。
      </p>
    </div>

    <div class="sky-stage">
      <VoxelWuxing ref="voxel" :counts="chart ? chart.cnt : null" @select="onSelect" />
      <div class="cine-overlay" aria-hidden="true"></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>元素档案</h2>
        <div class="ele-tabs">
          <button
            v-for="e in SHENG_ORDER" :key="e"
            class="ghost tab-btn" :class="{ on: selected === e }"
            @click="pick(e)"
          >
            <span :class="`ele-${e}`">{{ e }}</span>
          </button>
        </div>
        <div class="profile" :style="{ borderColor: ELEMENT_DESC[selected].color + '55' }">
          <div class="p-head" :style="{ color: ELEMENT_DESC[selected].color }">
            <span class="p-char">{{ selected }}</span>
            <span class="p-kw">{{ ELEMENT_DESC[selected].keyword }}</span>
          </div>
        <div class="table-scroll">
          <table class="p-table">
              <tbody>
            <tr><th>方位季节</th><td>{{ ELEMENT_DESC[selected].season }}</td></tr>
            <tr><th>对应身体</th><td>{{ ELEMENT_DESC[selected].body }}</td></tr>
            <tr><th>我生</th><td><b :class="`ele-${SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 1) % 5]}`">{{ SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 1) % 5] }}</b>（食伤·输出表达）</td></tr>
            <tr><th>我克</th><td><b :class="`ele-${SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 2) % 5]}`">{{ SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 2) % 5] }}</b>（财星·掌控对象）</td></tr>
            <tr><th>克我</th><td><b :class="`ele-${SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 3) % 5]}`">{{ SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 3) % 5] }}</b>（官杀·压力约束）</td></tr>
            <tr><th>生我</th><td><b :class="`ele-${SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 4) % 5]}`">{{ SHENG_ORDER[(SHENG_ORDER.indexOf(selected) + 4) % 5] }}</b>（印星·资源庇护）</td></tr>
                    </tbody>
          </table>
        </div>
          <p v-if="chart" class="sub advice"><RichText :text="elementAdvice(selected, chart.cnt) + '（本盘日主：' + chart.dmg + '）'" /></p>
        </div>
      </div>

      <div class="card">
        <h2>联动你的命盘</h2>
        <p v-if="!chart" class="sub">
          排盘后，天穹中五个元素的体量会按你八字里各五行的字数自动缩放——
          缺失的五行会明显“矮一截”。
        </p>
        <template v-if="chart">
          <div class="cnt-row">
            <div v-for="e in SHENG_ORDER" :key="e" class="cnt-item">
              <div class="cnt-num ele" :class="`ele-${e}`">{{ chart.cnt[e] }}</div>
              <div class="note">{{ e }}</div>
              <div class="cnt-bar"><i :class="`bg-${e}`" :style="{ width: `${Math.min(100, (chart.cnt[e] / 8) * 100)}%`, background: ELEMENT_DESC[e].color }"></i></div>
            </div>
          </div>
          <p class="sub">四柱 {{ chart.ps.join(' ') }} · 日主 {{ chart.dmg }} · 喜用 {{ chart.fav.join('、') || '中和' }}</p>
        </template>
        <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap">
          <button v-if="!chart && lastHistory" @click="recount()">☯ 用最近一次排盘联动</button>
          <button v-if="chart" class="ghost" @click="clearChart()">还原默认体量</button>
            <button v-if="!chart && !lastHistory" @click="router.push('/chart')">去排盘 →</button>
        </div>

        <h2 style="margin-top: 20px">干支速查五行</h2>
        <div class="gz-map">
          <span v-for="(e, g) in ELE_S" :key="'g' + g" class="tag" :class="`ele-${e}`">{{ g }}·{{ e }}</span>
        </div>
        <div class="gz-map" style="margin-top: 6px">
          <span v-for="(e, b) in ELE_B" :key="'b' + b" class="tag" :class="`ele-${e}`">{{ b }}·{{ e }}</span>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 电影感叠加：暗角 + 轻胶片颗粒，压在 3D 画布上（不挡交互） */
.sky-stage { position: relative; }
.cine-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 16px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
}
.cine-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(120% 90% at 50% 42%, transparent 58%, rgba(4, 6, 12, 0.4) 100%);
  mix-blend-mode: multiply;
}
@media (prefers-reduced-motion: reduce) {
  .cine-overlay { display: none; }
}

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.ele-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.tab-btn { flex: 1; font-size: 1.05rem; padding: 8px; }
.tab-btn.on { border-color: var(--gold); background: rgba(232, 196, 115, 0.08); }

.profile { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; transition: border-color 0.3s ease; }
.p-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
.p-char { font-family: var(--cute); font-size: 2rem; text-shadow: 0 0 18px currentColor; }
.p-kw { color: var(--dim); font-size: 0.85rem; }
.p-table td, .p-table th { padding: 6px 8px; }

.cnt-row { display: flex; gap: 14px; justify-content: space-between; margin: 12px 0; }
.cnt-item { text-align: center; flex: 1; }
.cnt-num { font-family: var(--cute); font-size: 1.7rem; }
.cnt-bar { height: 8px; background: var(--bar); border-radius: 4px; overflow: hidden; margin-top: 5px; }
.cnt-bar > i { display: block; height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1); }

.gz-map { display: flex; flex-wrap: wrap; gap: 3px; }
.advice { margin-top: 10px; line-height: 1.9; }

@media (max-width: 720px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
