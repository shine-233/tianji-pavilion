<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ELE_B, ELE_S, Element } from '../lib/constants'
import { THEME_SPRITE_PALS } from '../data/themes'
import { currentThemeId } from '../lib/themes'
import { Pillar, shiShen } from '../lib/engine'
import { cardBackPixels } from '../data/sageSprite'
import { ELEMENT_SPIRITS, spritePixels, ZODIAC_SPRITES } from '../data/pillarSprites'
import { sfx } from '../lib/sfx'

const props = defineProps<{ ps: Pillar }>()
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
const liveTheme = ref(currentThemeId())
let themeObs: MutationObserver | null = null
onMounted(() => {
  themeObs = new MutationObserver(() => (liveTheme.value = currentThemeId()))
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onBeforeUnmount(() => themeObs?.disconnect())

const backPixels = computed(() => {
  const pal = THEME_SPRITE_PALS[THEME_PAL_MAP[liveTheme.value] ?? liveTheme.value] ?? THEME_SPRITE_PALS.xuan!
  return cardBackPixels({ R: pal.R, D: pal.D, Y: pal.Y })
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
        </div>
        <!-- 背面：道长小像纹样 -->
        <div class="face back-face">
          <svg class="back-sprite" viewBox="0 0 13 18" shape-rendering="crispEdges">
            <rect v-for="(q, qi) in backPixels" :key="qi"
              :x="q.x" :y="q.y" width="1.02" height="1.02" :fill="q.fill" />
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
.back-sprite { width: 58%; height: auto; image-rendering: pixelated; }
.back-word {
  font-family: var(--cute);
  color: var(--gold-bright);
  font-size: 0.85rem;
  letter-spacing: 0.4em;
  padding-left: 0.4em;
  margin-top: 4px;
}

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
