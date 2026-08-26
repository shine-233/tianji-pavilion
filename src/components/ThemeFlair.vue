<script setup lang="ts">
/** 主题招牌层：每套皮肤一件专属背景装置，让换肤不只是换色 */
import { computed, onMounted, ref } from 'vue'
import { themeId } from '../data/themes'

const mounted = ref(false)
onMounted(() => (mounted.value = true))

const t = computed(() => (mounted.value ? themeId.value : 'xuan'))

/** 梅花瓣落点（青梅烟雨专属） */
const PETALS = Array.from({ length: 9 }, (_, i) => ({
  left: `${6 + i * 11 + (i % 3) * 3}%`,
  delay: `${i * 2.3}s`,
  dur: `${11 + (i % 4) * 2.4}s`,
  size: 9 + (i % 3) * 4,
}))
</script>

<template>
  <teleport to="body">
    <div class="flair" aria-hidden="true">
      <!-- 玄夜鎏金：缓转八卦环水印 -->
      <svg v-if="t === 'xuan'" class="fx bagua-ring" viewBox="0 0 200 200">
        <g class="slow-spin">
          <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 7" />
          <text v-for="(g, i) in ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑']" :key="g"
            :x="100 + 74 * Math.cos((i * 45 - 90) * Math.PI / 180) - 7"
            :y="100 + 74 * Math.sin((i * 45 - 90) * Math.PI / 180) + 7"
            class="ring-glyph">{{ g }}</text>
        </g>
      </svg>

      <!-- 月白道袍：远山与淡墨圆 -->
      <template v-else-if="t === 'yue'">
        <div class="ink-blob b1"></div>
        <div class="ink-blob b2"></div>
        <svg class="hills" viewBox="0 0 800 120" preserveAspectRatio="none">
          <path d="M0 96 Q120 40 240 84 T480 70 T800 92 L800 120 L0 120Z" fill="currentColor" opacity="0.10" />
          <path d="M0 108 Q180 66 360 98 T720 90 L800 96 L800 120 L0 120Z" fill="currentColor" opacity="0.16" />
        </svg>
      </template>

      <!-- 朱砂符箓：钤印 -->
      <div v-else-if="t === 'zhu'" class="seal">天機<br />之印</div>

      <!-- 松烟水墨：月轮 -->
      <div v-else-if="t === 'shui'" class="moon"></div>

      <!-- 紫霄星穹：星云双涡 -->
      <template v-else-if="t === 'zi'">
        <div class="nebula n1"></div>
        <div class="nebula n2"></div>
      </template>

      <!-- 青梅烟雨：梅瓣飘落 -->
      <template v-else-if="t === 'qing'">
        <span
          v-for="(p, i) in PETALS" :key="i" class="petal"
          :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, '--s': p.size + 'px' }"
        >✿</span>
      </template>
    </div>
  </teleport>
</template>

<style scoped>
.flair {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 玄夜 */
.bagua-ring {
  position: absolute;
  right: -70px;
  bottom: -70px;
  width: 320px;
  height: 320px;
  color: rgba(var(--acc-rgb), 0.14);
}
.slow-spin { transform-origin: 100px 100px; animation: flair-spin 90s linear infinite; }
.ring-glyph { fill: currentColor; font-size: 13px; text-anchor: middle; font-family: var(--cute); }
@keyframes flair-spin { to { transform: rotate(360deg); } }

/* 月白 */
.ink-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  background: radial-gradient(closest-side, currentColor, transparent 72%);
}
.b1 { background: radial-gradient(closest-side, rgba(var(--acc-rgb), 0.10), transparent 70%); width: 340px; height: 300px; top: -80px; right: -60px; }
.b2 { background: radial-gradient(closest-side, rgba(var(--acc2-rgb), 0.08), transparent 70%); width: 260px; height: 230px; top: 30px; right: 160px; }
.hills { position: absolute; bottom: 0; left: 0; width: 100%; height: 110px; color: rgb(var(--acc-rgb)); }

/* 朱砂 */
.seal {
  position: absolute;
  right: 5vw;
  bottom: 12vh;
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: var(--cute);
  font-size: 1.35rem;
  line-height: 1.5;
  letter-spacing: 0.1em;
  color: rgba(var(--acc-rgb), 0.34);
  border: 3px solid rgba(var(--acc-rgb), 0.30);
  border-radius: 10px;
  transform: rotate(-7deg);
  box-shadow: inset 0 0 18px rgba(var(--acc-rgb), 0.12);
}

/* 水墨 */
.moon {
  position: absolute;
  top: 9vh;
  right: 8vw;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, rgba(var(--acc-rgb), 0.16), rgba(var(--acc2-rgb), 0.05) 62%, transparent 74%);
}

/* 紫霄 */
.nebula { position: absolute; border-radius: 50%; filter: blur(46px); }
.n1 { width: 380px; height: 300px; top: -90px; left: -80px; background: rgba(var(--acc-rgb), 0.13); animation: neb-drift 26s ease-in-out infinite alternate; }
.n2 { width: 300px; height: 260px; bottom: -70px; right: -50px; background: rgba(var(--acc2-rgb), 0.10); animation: neb-drift 32s ease-in-out infinite alternate-reverse; }
@keyframes neb-drift { to { transform: translate(46px, 30px) scale(1.12); } }

/* 青梅 */
.petal {
  position: absolute;
  top: -30px;
  font-size: var(--s);
  color: rgba(var(--acc-rgb), 0.4);
  text-shadow: 0 0 8px rgba(var(--acc-rgb), 0.25);
  animation: petal-fall linear infinite;
}
@keyframes petal-fall {
  0% { transform: translateY(-4vh) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.85; }
  50% { transform: translateY(52vh) translateX(6vw) rotate(190deg); }
  100% { transform: translateY(106vh) translateX(-3vw) rotate(400deg); opacity: 0.1; }
}

@media (prefers-reduced-motion: reduce) {
  .slow-spin, .nebula, .petal { animation: none !important; }
}
</style>
