<script setup lang="ts">
/**
 * 推演长卷：太极生两仪、两仪生四象……直到四柱成盘。
 * 粘性视口 + 单一滚动进度驱动全部七幕（无 GSAP，纯 rAF 读滚动）。
 * 系统减少动效时退化为普通纵向排版。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'

const wrap = ref<HTMLElement | null>(null)
const progress = ref(0)

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let ticking = false
function onScroll(): void {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    const el = wrap.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const total = el.offsetHeight - window.innerHeight
    progress.value = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)))
  })
}

onMounted(() => {
  if (!reducedMotion) window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

/** 某幕的局部进度 0..1 */
function sp(start: number, end: number): number {
  return Math.min(1, Math.max(0, (progress.value - start) / (end - start)))
}
/** 入场透明度：前段淡入，末段保持（最后一幕不退出） */
function vis(start: number, end: number, hold = 0.08): number {
  const a = sp(start, end)
  const out = progress.value > end + hold ? 1 - sp(end + hold, end + hold + 0.05) : 1
  return Math.min(a, out)
}
const ease = (k: number): number => 1 - Math.pow(1 - k, 3)

// 七幕区间
const S = [
  { start: 0.0, end: 0.12, title: '混沌', text: '天地未分，是一团没有名字的气。' },
  { start: 0.12, end: 0.26, title: '两仪', text: '一动一静，剖出阴阳——清气上升为天，浊气下沉为地。' },
  { start: 0.26, end: 0.4, title: '四象', text: '阳再分太阳少阳，阴再分太阴少阴，四象各踞一方。' },
  { start: 0.4, end: 0.55, title: '八卦', text: '三爻成卦，天地风雷水火山泽，万物有了八个抽屉。' },
  { start: 0.55, end: 0.7, title: '干支', text: '十干十二支如齿轮咬合，时间从此有了刻度与循环。' },
  { start: 0.7, end: 0.85, title: '四柱', text: '年月日时各立一柱，八个字把一个人出生的时刻钉进宇宙坐标。' },
  { start: 0.85, end: 1.0, title: '解盘', text: '规则公开、权重公开——把玄学摊开成看得见的样子。' },
]

const stageVis = computed(() => S.map((s) => vis(s.start, s.end)))

const TRIGRAMS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
const ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const GAN10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const PILLARS = [
  { gan: '甲', zhi: '子', label: '年柱' },
  { gan: '丙', zhi: '寅', label: '月柱' },
  { gan: '戊', zhi: '午', label: '日柱' },
  { gan: '庚', zhi: '申', label: '时柱' },
]

const pFinal = computed(() => sp(0.85, 1))
</script>

<template>
  <main class="page">
    <div class="card" style="padding-bottom: 10px">
      <h2>推演长卷 · 从混沌到八字</h2>
      <p class="sub">
        太极生两仪，两仪生四象，四象生八卦——往下慢慢滚，看八字是怎么一步步从一团气里长出来的。
      </p>
    </div>

    <!-- 减少动效：退化为纵向章节 -->
    <div v-if="reducedMotion" class="fallback">
      <div v-for="s in S" :key="s.title" class="card fb-card">
        <h3 class="gold-t">{{ s.title }}</h3>
        <p class="sub">{{ s.text }}</p>
      </div>
    </div>

    <div v-else ref="wrap" class="scroll-stage">
      <div class="sticky">
        <svg viewBox="0 0 640 420" class="scene" role="img" aria-label="八字推演过程动画">
          <!-- 0 混沌：一团呼吸的墨云 -->
          <g :style="{ opacity: stageVis[0] }">
            <circle cx="320" cy="210" :r="70 + Math.sin(Date.now() / 900) * 4" fill="url(#chaos)" />
            <text x="320" y="330" class="cap" :style="{ opacity: stageVis[0] }">混沌 · 无名之气</text>
          </g>

          <!-- 1 两仪：太极分黑白 -->
          <g :style="{ opacity: stageVis[1] }">
            <g :style="{ transform: `rotate(${sp(0.12, 0.26) * 180}deg)`, transformOrigin: '320px 210px' }">
              <circle cx="320" cy="210" r="86" fill="none" stroke="rgba(232,196,115,0.5)" stroke-width="1.5" />
              <path d="M320 124 A86 86 0 0 1 320 296 A43 43 0 0 1 320 210 A43 43 0 0 0 320 124" fill="#e9e4d5" />
              <path d="M320 124 A86 86 0 0 0 320 296 A43 43 0 0 0 320 210 A43 43 0 0 1 320 124" fill="#232a3a" />
              <circle cx="320" cy="167" r="9" fill="#232a3a" />
              <circle cx="320" cy="253" r="9" fill="#e9e4d5" />
            </g>
            <text x="320" y="330" class="cap" :style="{ opacity: stageVis[1] }">两仪 · 一动一静</text>
          </g>

          <!-- 2 四象：四个两爻符号 -->
          <g :style="{ opacity: stageVis[2] }">
            <g
              v-for="(sym, i) in [
                { x: 320, y: 128, lines: [1, 1], name: '太阳' },
                { x: 428, y: 210, lines: [1, 0], name: '少阳' },
                { x: 320, y: 292, lines: [0, 1], name: '少阴' },
                { x: 212, y: 210, lines: [0, 0], name: '太阴' },
              ]"
              :key="sym.name"
              :style="{
                opacity: Math.max(0, sp(0.26, 0.4) * 1.6 - i * 0.18),
                transform: `scale(${0.4 + ease(sp(0.26, 0.4)) * 0.6})`,
                transformOrigin: `${sym.x}px ${sym.y}px`,
              }"
            >
              <rect
                v-for="(ln, li) in sym.lines"
                :key="li"
                :x="sym.x - 26" :y="sym.y - 14 + li * 16"
                :width="ln ? 52 : 22" height="10" rx="3"
                :fill="ln ? '#e8c473' : '#3a4258'"
              />
              <text :x="sym.x" :y="sym.y + 44" class="cap small">{{ sym.name }}</text>
            </g>
            <text x="320" y="366" class="cap" :style="{ opacity: stageVis[2] }">四象 · 太阳少阳太阴少阴</text>
          </g>

          <!-- 3 八卦 -->
          <g :style="{ opacity: stageVis[3] }">
            <g
              v-for="(t, i) in TRIGRAMS"
              :key="t"
              :style="{
                opacity: Math.max(0, sp(0.4, 0.55) * 1.8 - i * 0.12),
                transform: `rotate(${(1 - ease(sp(0.4, 0.55))) * -220 + i * 45}deg) translate(0, -128px)`,
                transformOrigin: '320px 210px',
              }"
            >
              <text x="320" y="210" class="trig">{{ t }}</text>
            </g>
            <circle cx="320" cy="210" r="30" fill="rgba(232,196,115,0.1)" />
            <text x="320" y="216" text-anchor="middle" class="trig" style="font-size: 26px">☯</text>
            <text x="320" y="366" class="cap" :style="{ opacity: stageVis[3] }">八卦 · 万物的八个抽屉</text>
          </g>

          <!-- 4 干支双环 -->
          <g :style="{ opacity: stageVis[4] }">
            <g
              v-for="(z, i) in ZHI12"
              :key="'z' + z"
              :style="{
                opacity: Math.max(0, sp(0.55, 0.7) * 2 - i * 0.1),
                transform: `rotate(${i * 30 + (1 - ease(sp(0.55, 0.7))) * -160}deg) translate(0, -140px)`,
                transformOrigin: '320px 210px',
              }"
            >
              <text x="320" y="216" class="zhi-t">{{ z }}</text>
            </g>
            <g
              v-for="(g, i) in GAN10"
              :key="'g' + g"
              :style="{
                opacity: Math.max(0, sp(0.55, 0.7) * 2 - i * 0.12),
                transform: `rotate(${-i * 36 + (1 - ease(sp(0.55, 0.7))) * 200}deg) translate(0, -92px)`,
                transformOrigin: '320px 210px',
              }"
            >
              <text x="320" y="214" class="gan-t">{{ g }}</text>
            </g>
            <text x="320" y="366" class="cap" :style="{ opacity: stageVis[4] }">天干地支 · 时间的齿轮</text>
          </g>

          <!-- 5 四柱 -->
          <g :style="{ opacity: stageVis[5] }">
            <g
              v-for="(pl, i) in PILLARS"
              :key="pl.label"
              :style="{
                opacity: Math.max(0, sp(0.7, 0.85) * 2.2 - i * 0.28),
                transform: `translateY(${(1 - ease(sp(0.7, 0.85))) * 60}px)`,
              }"
            >
              <rect :x="196 + i * 66" :y="118" width="46" height="150" rx="10"
                fill="rgba(232,196,115,0.06)" stroke="rgba(232,196,115,0.45)" stroke-width="1.2" />
              <text :x="219 + i * 66" y="168" class="pillar-gan">{{ pl.gan }}</text>
              <text :x="219 + i * 66" y="228" class="pillar-zhi">{{ pl.zhi }}</text>
              <text :x="219 + i * 66" y="292" class="cap small">{{ pl.label }}</text>
            </g>
            <text x="320" y="352" class="cap" :style="{ opacity: stageVis[5] }">四柱八字 · 出生时刻的宇宙坐标</text>
          </g>

          <!-- 6 解盘 -->
          <g :style="{ opacity: stageVis[6] }">
            <circle cx="320" cy="196" r="86" fill="none" stroke="rgba(139,147,167,0.3)" stroke-width="7" />
            <circle
              cx="320" cy="196" r="86" fill="none"
              stroke="#5eead4" stroke-width="7" stroke-linecap="round"
              stroke-dasharray="264" :stroke-dashoffset="264 - ease(pFinal) * 232"
              transform="rotate(-90 320 196)"
            />
            <text x="320" y="206" text-anchor="middle" class="score-t">{{ Math.round(ease(pFinal) * 88) }}</text>
            <text x="320" y="330" class="cap" :style="{ opacity: stageVis[6] }">规则公开 · 每一分都能复核</text>
          </g>

          <defs>
            <radialGradient id="chaos">
              <stop offset="0%" stop-color="rgba(94,234,212,0.16)" />
              <stop offset="60%" stop-color="rgba(148,116,74,0.12)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
          </defs>
        </svg>

        <a href="#/chart" class="go-btn" :style="{ opacity: sp(0.95, 1) }" @click="sfx.ding()">去排你的盘 →</a>

        <!-- 幕间字幕 -->
        <div class="caption">
          <transition name="capfade" mode="out-in">
            <div :key="Math.min(6, Math.floor(progress * 7.2) || 0)" class="cap-inner">
              <b class="gold-t">{{ S[Math.min(6, Math.floor(progress * 7.2))]!.title }}</b>
              <span class="sub">{{ S[Math.min(6, Math.floor(progress * 7.2))]!.text }}</span>
            </div>
          </transition>
        </div>

        <!-- 进度轴 -->
        <div class="rail">
          <div class="rail-fill" :style="{ height: `${progress * 100}%` }"></div>
          <div
            v-for="(s, i) in S"
            :key="s.title"
            class="rail-dot"
            :class="{ on: progress >= s.start - 0.02 }"
            :style="{ top: `${(s.start + 0.04) * 100}%` }"
          >{{ i + 1 }}</div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.scroll-stage { height: 520vh; position: relative; }
.sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.scene { width: min(92vw, 760px); max-height: 86vh; }

.cap {
  font-family: var(--cute);
  font-size: 19px;
  fill: var(--dim);
  text-anchor: middle;
  letter-spacing: 0.2em;
}
.cap.small { font-size: 12px; letter-spacing: 0.12em; }
.trig { font-size: 30px; fill: var(--gold-bright); text-anchor: middle; dominant-baseline: central; }
.zhi-t { font-size: 17px; fill: var(--fg); text-anchor: middle; dominant-baseline: central; font-family: var(--cute); }
.gan-t { font-size: 13px; fill: var(--dim); text-anchor: middle; dominant-baseline: central; }
.pillar-gan { font-size: 24px; fill: var(--gold-bright); text-anchor: middle; font-family: var(--cute); }
.pillar-zhi { font-size: 24px; fill: var(--teal); text-anchor: middle; font-family: var(--cute); }
.score-t { font-size: 44px; fill: var(--gold-bright); text-anchor: middle; font-family: var(--cute); dominant-baseline: central; }

.go-btn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 6%;
  padding: 9px 22px;
  border-radius: 999px;
  background: linear-gradient(140deg, var(--btn-a), var(--btn-b));
  color: var(--btn-ink);
  font-family: var(--cute);
  font-size: 1.05rem;
  text-decoration: none;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
}
.go-btn:hover { text-decoration: none; filter: brightness(1.1); }

.caption {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 13%;
  text-align: center;
  width: min(86vw, 560px);
  pointer-events: none;
}
.cap-inner { display: flex; flex-direction: column; gap: 4px; }
.capfade-enter-active { transition: all 0.45s ease; }
.capfade-leave-active { transition: all 0.25s ease; }
.capfade-enter-from { opacity: 0; transform: translateY(10px); }
.capfade-leave-to { opacity: 0; transform: translateY(-8px); }

.rail {
  position: absolute;
  right: max(18px, env(safe-area-inset-right));
  top: 50%;
  transform: translateY(-50%);
  height: 46vh;
  width: 26px;
}
.rail::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0; bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: rgba(139, 147, 167, 0.25);
  border-radius: 2px;
}
.rail-fill {
  position: absolute;
  left: 50%;
  top: 0;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(var(--teal), var(--gold));
  border-radius: 2px;
  transition: height 0.1s linear;
}
.rail-dot {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--card-2);
  border: 1px solid rgba(139, 147, 167, 0.4);
  color: var(--dim);
  font-size: 0.62rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.rail-dot.on { border-color: var(--gold-bright); color: var(--gold-bright); box-shadow: 0 0 10px rgba(232, 196, 115, 0.3); }

.fallback { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
.fb-card { padding: 18px 20px; }

@media (max-width: 640px) {
  .rail { display: none; }
  .cap { font-size: 14px; }
}
</style>
