<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ELE_B, ELE_S, Element, nayinOf } from '../lib/constants'
import { THEME_SPRITE_PALS } from '../data/themes'
import { currentTheme } from '../data/themes'
import { Pillar, shiShen } from '../lib/engine'
import { buildTaoess } from '../data/sageSprite'
import { ELEMENT_SPIRITS, spritePixels, ZODIAC_SPRITES } from '../data/pillarSprites'
import { sfx } from '../lib/sfx'

const props = defineProps<{ ps: Pillar; hide?: string[][] }>()
const flipped = ref(false)
const backs = ref<boolean[]>([true, true, true, true])
onMounted(() => window.setTimeout(() => (flipped.value = true), 80))

/** 新主题 id → 牌背小像调色板 key */
const THEME_PAL_MAP: Record<string, string> = {
  zixiao: 'xuan',
  shuimo: 'shui',
  zhusha: 'zhu',
  qingci: 'qing',
  xinghan: 'zi',
  yanzhi: 'zhu',
  liujin: 'xuan',
}

/** 皮肤联动：牌背道长小像随主题换色（监听 html[data-theme] 变化保持响应） */
const liveTheme = ref(currentTheme())
let themeObs: MutationObserver | null = null
onMounted(() => {
  themeObs = new MutationObserver(() => (liveTheme.value = currentTheme()))
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onBeforeUnmount(() => themeObs?.disconnect())

/** 牌背女道士：年月日时四张牌各由一位当值女道士看管，袍色随主题 */
const BACK_MAIDENS = ['qingxuan', 'danxia', 'xinglan', 'suwen']

const backPal = computed(() => {
  const pal = THEME_SPRITE_PALS[THEME_PAL_MAP[liveTheme.value] ?? liveTheme.value] ?? THEME_SPRITE_PALS.xuan!
  return { R: pal.R, D: pal.D, Y: pal.Y }
})

function backPixelsOf(i: number) {
  // 保留每位女道士自己的道袍配色（区分度优先），仅主题为朱砂时统一换赤袍
  const theme = liveTheme.value
  if (theme === 'zhu') return buildTaoess(BACK_MAIDENS[i % BACK_MAIDENS.length]!, backPal.value)
  return buildTaoess(BACK_MAIDENS[i % BACK_MAIDENS.length]!)
}

/** 主题专属牌背纹样：每套皮肤的卡背都是独一份 */
const BACK_PATTERNS: Record<string, string> = {
  xuan: `<svg xmlns='http://www.w3.org/2000/svg' width='46' height='46'><g fill='none' stroke='%23e8c473' stroke-opacity='.28'><circle cx='23' cy='23' r='9'/><path d='M0 23h10M36 23h10M23 0v10M23 36v10'/></g><circle cx='23' cy='23' r='1.6' fill='%23ffe3a8' fill-opacity='.5'/></svg>`,
  yue: `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='40'><g fill='none' stroke='%233a6ea5' stroke-opacity='.26' stroke-width='2' stroke-linecap='round'><path d='M4 30q12-14 24-2t24-2'/><path d='M0 16q10-10 20-3'/></g></svg>`,
  zhu: `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><rect x='8' y='8' width='28' height='28' fill='none' stroke='%23ff7a5c' stroke-opacity='.3'/><circle cx='22' cy='22' r='6.5' fill='none' stroke='%23ff7a5c' stroke-opacity='.38'/><path d='M22 15.5v13M18.8 18.5l6.4 7M25.2 18.5l-6.4 7' stroke='%23ff9c85' stroke-opacity='.34'/></svg>`,
  shui: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='34'><g fill='none' stroke='%23555f66' stroke-opacity='.3' stroke-width='2'><path d='M0 12q14-12 28 0t28 0'/><path d='M-6 24q14-10 28 0t28 0t28 0'/></g></svg>`,
  zi: `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M6 40L20 18l10 12 8-16 6 10' fill='none' stroke='%23c9b0ff' stroke-opacity='.32'/><circle cx='20' cy='18' r='1.8' fill='%23e4d6ff' fill-opacity='.55'/><circle cx='38' cy='14' r='1.4' fill='%237de8c3' fill-opacity='.5'/></svg>`,
  qing: `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><g fill='%23ffd76e' fill-opacity='.24'><circle cx='24' cy='17' r='5'/><circle cx='17' cy='27' r='5'/><circle cx='31' cy='27' r='5'/><circle cx='21' cy='35' r='4.4'/><circle cx='27' cy='35' r='4.4'/></g><circle cx='24' cy='27' r='3.4' fill='%230f1a13' fill-opacity='.55'/></svg>`,
}
const backPattern = computed(() => {
  const svg = BACK_PATTERNS[liveTheme.value] ?? BACK_PATTERNS.xuan!
  return `url("data:image/svg+xml,${svg.replace(/\s+/g, ' ')}")`
})

const HEADS = ['年柱', '月柱', '日柱', '时柱']
const BRANCH_ANIMAL = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function spiritOf(gan: string) {
  const ele = ELE_S[gan]
  if (!ele) return null
  const def = ELEMENT_SPIRITS[ele]
  if (!def) return null
  return { def, pixels: spritePixels(def), ele }
}

function animalOf(zhi: string): string {
  return BRANCH_ANIMAL[ZHI_ORDER.indexOf(zhi)] ?? ''
}

function animalPixels(zhi: string) {
  const def = ZODIAC_SPRITES[animalOf(zhi)]
  if (!def) return []
  return spritePixels(def)
}

function ganEle(p: string): Element | null {
  return ELE_S[p] ?? null
}
function zhiEle(p: string): Element | null {
  return ELE_B[p] ?? null
}

function toggle(i: number): void {
  backs.value[i] = !backs.value[i]
  sfx.flip()
}
</script>

<template>
  <div class="pillars" :class="{ flipped }">
    <button
      v-for="(p, i) in props.ps" :key="i"
      v-tilt="5"
      class="pillar-flip" :style="{ transitionDelay: `${i * 120}ms` }"
      @click="toggle(i)"
    >
      <div class="flip-inner" :class="{ back: backs[i] }">
        <!-- 正面 -->
        <div class="face front" :class="`ele-${ganEle(p[0])}`">
          <div class="head">{{ HEADS[i] }}<span v-if="i === 2" class="dm-badge">日主</span></div>
          <div class="row-top">
            <span class="big-gan">{{ p[0] }}</span>
            <svg v-if="spiritOf(p[0])" class="mini-sprite" viewBox="0 0 8 12" shape-rendering="crispEdges">
              <rect v-for="(q, qi) in spiritOf(p[0])!.pixels" :key="qi"
                :x="q.x" :y="q.y" width="1.05" height="1.05" :fill="q.fill" />
            </svg>
          </div>
          <div class="ten-god">{{ i === 2 ? '元神' : shiShen(props.ps[2]!, p[0]) }}</div>
          <div class="divider"></div>
          <div class="row-bottom">
            <svg class="mini-sprite wide" viewBox="0 0 11 10" shape-rendering="crispEdges">
              <rect v-for="(q, qi) in animalPixels(p[1])" :key="qi"
                :x="q.x" :y="q.y" width="1.05" height="1.05" :fill="q.fill" />
            </svg>
            <span class="big-zhi" :class="zhiEle(p[1]) ? `ele-${zhiEle(p[1])}` : ''">{{ p[1] }}</span>
          </div>
          <div class="ten-god dim">{{ animalOf(p[1]) }} · {{ zhiEle(p[1]) }}</div>
          <div v-if="props.hide?.[i]?.length" class="canggan" :title="'地支藏干：' + props.hide[i]!.join('、')">
            <span class="cg-label">藏</span><span v-for="(h, hi) in props.hide[i]" :key="hi" class="cg-gan">{{ h }}</span>
          </div>
          <div class="nayin" :title="'纳音五行：' + nayinOf(p[0], p[1])">纳音·{{ nayinOf(p[0], p[1]) }}</div>
        </div>
        <!-- 背面：道长小像纹样 + 主题专属底纹 + 回纹边框与旋太极 -->
        <div class="face back-face" :style="{ backgroundImage: backPattern }">
          <svg class="back-orn" viewBox="0 0 60 84">
            <rect x="2.5" y="2.5" width="55" height="79" rx="7" fill="none" stroke="var(--acc, #e8c473)" stroke-width="1.4" opacity="0.8" />
            <rect x="5.5" y="5.5" width="49" height="73" rx="5" fill="none" stroke="var(--acc, #e8c473)" stroke-width="0.6" opacity="0.45" />
            <g stroke="var(--teal, #5eead4)" stroke-width="0.9" fill="none" opacity="0.7">
              <path d="M9 15 v-6 h6 M51 15 v-6 h-6 M9 69 v6 h6 M51 69 v6 h-6" />
            </g>
            <circle cx="30" cy="42" r="17" fill="none" stroke="var(--acc, #e8c473)" stroke-width="0.8" opacity="0.6" stroke-dasharray="2.4 3.4" />
            <g class="back-taiji">
              <circle cx="30" cy="42" r="9.5" fill="#f6f1e3" opacity="0.94" />
              <path d="M30 32.5 a9.5 9.5 0 0 1 0 19 a4.75 4.75 0 0 1 0 -9.5 a4.75 4.75 0 0 0 0 -9.5z" fill="#232a3a" />
              <circle cx="30" cy="37.25" r="1.5" fill="#232a3a" />
              <circle cx="30" cy="46.75" r="1.5" fill="#f6f1e3" />
            </g>
            <text v-for="(g, gi) in ['☰', '☳', '☷', '☵']" :key="g"
              :x="[11, 49, 49, 11][gi]" :y="[14, 14, 78, 78][gi]"
              class="corner-gua">{{ g }}</text>
          </svg>
<svg class="back-sprite maiden" viewBox="0 0 26 29">
<rect v-for="(q, qi) in backPixelsOf(i)" :key="qi"
:x="q.x + 0.06" :y="q.y + 0.06" width="0.88" height="0.88" rx="0.22" :fill="q.fill" :opacity="0.93 + ((q.x * 7 + q.y * 13) % 5) * 0.0175" />
          </svg>
          <span class="back-word">{{ ['天', '机', '阁', '签'][i] }}</span>
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>
.pillars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  perspective: 1100px;
}
.pillar-flip {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0;
  transform: rotateY(88deg) translateY(18px);
  transition: opacity 0.55s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}
.pillars.flipped .pillar-flip { opacity: 1; transform: none; }

.flip-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.34, 1.2, 0.5, 1);
}
.flip-inner.back { transform: rotateY(180deg); }

.face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 14px;
  padding: 13px 8px 11px;
  text-align: center;
  min-height: 208px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.front {
  background: linear-gradient(165deg, var(--card-2), var(--panel));
  border: 1px solid var(--line);
  position: relative;
  overflow: hidden;
}
.front::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(232, 196, 115, 0.14);
  border-radius: 10px;
  pointer-events: none;
}
.front::after {
  content: '';
  position: absolute;
  top: -30%;
  bottom: -30%;
  left: -34%;
  width: 34%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  transform: translateX(-150%) rotate(9deg);
  pointer-events: none;
}
.pillar-flip:hover .front::after { animation: sheen-sweep 0.95s ease; }
@keyframes sheen-sweep { to { transform: translateX(460%) rotate(9deg); } }
.pillar-flip:hover .front { border-color: rgba(232, 196, 115, 0.45); }

.back-face {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  background:
    repeating-linear-gradient(45deg, rgba(232, 196, 115, 0.05) 0 6px, transparent 6px 12px),
    linear-gradient(160deg, var(--card), var(--panel));
  border: 1px solid rgba(232, 196, 115, 0.3);
  align-items: center;
  justify-content: center;
}
.back-orn { position: absolute; inset: 6% 7%; width: 86%; height: 88%; pointer-events: none; }
.back-taiji { transform-origin: 30px 42px; animation: taiji-turn 9s linear infinite; }
@keyframes taiji-turn { to { transform: rotate(360deg); } }
.corner-gua { fill: var(--teal, #5eead4); opacity: 0.55; font-size: 6.4px; font-family: var(--cute); }
.back-sprite { width: 34%; height: auto; image-rendering: pixelated; position: relative; margin-top: 26px; }
.back-word {
  font-family: var(--cute);
  color: var(--gold-bright);
  font-size: 0.85rem;
  letter-spacing: 0.4em;
  padding-left: 0.4em;
  margin-top: 4px;
}
/* 印章角饰：朱砂方章，随主题走色 */
.back-seal {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-family: var(--cute);
  font-size: 0.66rem;
  color: #e05a4a;
  border: 1.5px solid rgba(224, 90, 74, 0.75);
  border-radius: 4px;
  background: rgba(224, 90, 74, 0.08);
  transform: rotate(6deg);
  box-shadow: inset 0 0 5px rgba(224, 90, 74, 0.25);
}
[data-theme='yue'] .back-seal,
[data-theme='shui'] .back-seal {
  color: #b04a3a;
  border-color: rgba(176, 74, 58, 0.7);
}
[data-theme='zi'] .back-seal { color: #ff7a9e; border-color: rgba(255, 122, 158, 0.65); }
[data-theme='qing'] .back-seal { color: var(--amber); border-color: rgba(242, 201, 76, 0.55); }

.head { font-size: 0.78rem; color: var(--dim); letter-spacing: 0.3em; padding-left: 0.3em; }
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
.row-top { display: flex; align-items: center; justify-content: center; gap: 8px; }
.row-bottom { display: flex; align-items: center; justify-content: center; gap: 8px; }
.big-gan { font-size: 2rem; font-family: var(--cute); text-shadow: 0 0 22px currentColor; }
.big-zhi { font-size: 1.9rem; font-family: var(--cute); text-shadow: 0 0 20px currentColor; }
.mini-sprite { width: 26px; height: 39px; }
.mini-sprite.wide { width: 34px; height: 31px; }
.ten-god { font-size: 0.72rem; color: var(--gold); min-height: 1.1em; }
.nayin {
  font-size: 0.62rem;
  color: var(--dim);
  border-top: 1px dashed var(--line);
  margin-top: 6px;
  padding-top: 5px;
  letter-spacing: 0.08em;
  cursor: help;
}
.canggan {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 5px;
}
.cg-label {
  font-size: 0.56rem;
  color: var(--teal);
  border: 1px solid rgba(var(--acc2-rgb), 0.35);
  border-radius: 4px;
  padding: 0 3px;
}
.cg-gan { font-size: 0.74rem; color: var(--dim); font-family: var(--cute); }
.divider { height: 1px; background: var(--line); margin: 7px 12px; }
.dim { color: var(--dim); }

@media (max-width: 640px) {
  .pillars { gap: 7px; }
  .face { min-height: 168px; padding: 9px 4px 8px; }
  .big-gan { font-size: 1.5rem; }
  .big-zhi { font-size: 1.4rem; }
  .mini-sprite { width: 19px; height: 28px; }
  .mini-sprite.wide { width: 25px; height: 23px; }
  .head { letter-spacing: 0.1em; }
}
</style>
