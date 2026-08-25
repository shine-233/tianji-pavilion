<script setup lang="ts">
/**
 * 十二时辰活钟：SVG 环形罗盘，指针实时指向当前时辰。
 * 拖拽可拨动指针查看任意时辰的宜忌与口诀，松手弹回「现在」。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'

interface ShichenInfo {
  name: string
  hours: string
  ele: string
  tip: string
}

const SHICHEN: ShichenInfo[] = [
  { name: '子', hours: '23–01', ele: '水', tip: '夜半阳气始生，宜深眠养胆。旧说此时勿喧哗。' },
  { name: '丑', hours: '01–03', ele: '土', tip: '鸡鸣之刻，肝血归位。熟睡的人此刻最难被吵醒。' },
  { name: '寅', hours: '03–05', ele: '木', tip: '平旦将明，肺经当令。练气的人喜欢在这个点起床。' },
  { name: '卯', hours: '05–07', ele: '木', tip: '日出而作。旧时官署在此时报卯点名，故得此名。' },
  { name: '辰', hours: '07–09', ele: '土', tip: '食时，古人吃第一顿饭。胃经当令，早餐要热要饱。' },
  { name: '巳', hours: '09–11', ele: '火', tip: '日近中午，脑子最清楚。要紧的决定放在巳时办。' },
  { name: '午', hours: '11–13', ele: '火', tip: '日中而盈，阳极阴生。午休一刻钟，胜过晚上睡一时。' },
  { name: '未', hours: '13–15', ele: '土', tip: '日昳，太阳偏西。小肠经当令，午后茶点就别太油腻了。' },
  { name: '申', hours: '15–17', ele: '金', tip: '晡时，膀胱经当令。多喝水多走动，古人此时上第二顿饭。' },
  { name: '酉', hours: '17–19', ele: '金', tip: '日落酉门关。肾经当令，晚餐宜清淡，收工回家吃饭。' },
  { name: '戌', hours: '19–21', ele: '土', tip: '黄昏，天地昏黄。心包经当令，适合散步谈心不谈钱。' },
  { name: '亥', hours: '21–23', ele: '水', tip: '人定，该睡了。三焦通百脉，亥时入睡是老祖宗的美容方。' },
]

function nowIdx(): number {
  const h = new Date().getHours()
  return Math.floor(((h + 1) % 24) / 2)
}

const manual = ref<number | null>(null)
const dragging = ref(false)
const angle = ref(0)
let raf = 0

const idx = computed(() => manual.value ?? nowIdx())
const info = computed(() => SHICHEN[idx.value]!)

/** 当前时辰扇区的角度：每辰 30°，子时在正上方 */
function sectorAngle(i: number): number {
  return i * 30
}

function setFromEvent(e: PointerEvent | MouseEvent): void {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90
  const norm = ((deg % 360) + 360) % 360
  manual.value = Math.floor(norm / 15) % 12 === idx.value ? idx.value : Math.round(norm / 30) % 12
}

function onDown(e: PointerEvent): void {
  dragging.value = true
  ;(e.target as Element).setPointerCapture?.(e.pointerId)
  setFromEvent(e)
  sfx.tick()
}
function onMove(e: PointerEvent): void {
  if (!dragging.value) return
  const prev = idx.value
  setFromEvent(e)
  if (idx.value !== prev) sfx.blip()
}
function onUp(): void {
  if (!dragging.value) return
  dragging.value = false
  sfx.pop()
}

function backToNow(): void {
  manual.value = null
  sfx.ding()
}

function tickLoop(): void {
  // 每分钟刷新一次「现在」
  angle.value = sectorAngle(nowIdx())
  raf = window.setTimeout(tickLoop, 30000)
}
onMounted(() => tickLoop())
onBeforeUnmount(() => window.clearTimeout(raf))
</script>

<template>
  <div class="clock-wrap">
    <div class="hint note">拨动圆盘看十二时辰 · 点击中心回到现在</div>
    <div class="dial-outer" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp">
      <svg viewBox="0 0 320 320">
        <circle cx="160" cy="160" r="150" fill="none" stroke="rgba(232,196,115,0.18)" stroke-width="1.5" />
        <circle cx="160" cy="160" r="112" fill="none" stroke="rgba(139,147,167,0.25)" stroke-dasharray="2 6" />
        <g v-for="(sc, i) in SHICHEN" :key="sc.name">
          <!-- 扇区高亮 -->
          <path
            v-if="i === idx"
            :d="`M 160 160 L ${160 + 148 * Math.cos((sectorAngle(i) - 90 - 15 + 3) * Math.PI / 180)} ${160 + 148 * Math.sin((sectorAngle(i) - 90 - 15 + 3) * Math.PI / 180)} A 148 148 0 0 1 ${160 + 148 * Math.cos((sectorAngle(i) - 90 + 15 - 3) * Math.PI / 180)} ${160 + 148 * Math.sin((sectorAngle(i) - 90 + 15 - 3) * Math.PI / 180)} Z`"
            fill="rgba(232,196,115,0.14)"
            class="sec-glow"
          />
          <text
            :x="160 + 128 * Math.cos((sectorAngle(i) - 90) * Math.PI / 180)"
            :y="160 + 128 * Math.sin((sectorAngle(i) - 90) * Math.PI / 180)"
            text-anchor="middle"
            dominant-baseline="central"
            class="zhi-text"
            :class="{ on: i === idx }"
          >{{ sc.name }}</text>
        </g>
        <!-- 指针 -->
        <g class="needle" :style="{ transform: `rotate(${sectorAngle(idx)}deg)` }">
          <line x1="160" y1="160" x2="160" y2="52" stroke="#e8c473" stroke-width="2.5" />
          <circle cx="160" cy="52" r="5" fill="#ffe3a8" />
        </g>
      </svg>
      <button class="core" title="回到当前时辰" @click.stop="backToNow()">☯</button>
    </div>

    <transition name="popi" mode="out-in">
      <div :key="idx" class="info card">
        <span class="tag gold">{{ info.name }}时</span>
        <span class="tag teal">{{ info.hours }} 点</span>
        <span class="tag">五行·{{ info.ele }}</span>
        <p class="sub i-tip">{{ info.tip }}</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.clock-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; user-select: none; }
.dial-outer { position: relative; width: 280px; height: 280px; cursor: grab; touch-action: none; }
.dial-outer:active { cursor: grabbing; }

.zhi-text { font-family: var(--cute); font-size: 26px; fill: #8b93a7; transition: fill 0.25s ease, font-size 0.25s ease; }
.zhi-text.on { fill: var(--gold-bright); font-size: 34px; filter: drop-shadow(0 0 8px rgba(232,196,115,0.7)); }

.sec-glow { animation: sec-pulse 2.6s ease-in-out infinite; transform-origin: 160px 160px; }
@keyframes sec-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

.needle { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1); transform-origin: 160px 160px; filter: drop-shadow(0 0 6px rgba(232,196,115,0.6)); }

.core {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 74px; height: 74px;
  border-radius: 50%;
  border: 1px solid rgba(232,196,115,0.4);
  background: radial-gradient(closest-side, rgba(232,196,115,0.16), transparent);
  color: var(--gold-bright);
  font-size: 2rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}
.core:hover { box-shadow: 0 0 24px rgba(232,196,115,0.45); transform: translate(-50%, -50%) scale(1.06); }

.info { max-width: 340px; text-align: left; padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.i-tip { flex-basis: 100%; margin-top: 4px; line-height: 1.9; }

.popi-enter-active { transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
.popi-enter-from { opacity: 0; transform: translateY(8px); }
.popi-leave-active { display: none; }
</style>
