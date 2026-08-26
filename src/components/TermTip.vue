<script setup lang="ts">
import { ref } from 'vue'
import { GLOSSARY, lookup } from '../lib/glossary'
import { sfx } from '../lib/sfx'

const props = defineProps<{ k: string }>()
const open = ref(false)
let hideTimer = 0
/** 触屏上 mouseenter 会先于 click 合成触发，用指针类型拦一下防"闪现即关" */
let lastPointerType = 'mouse'

const termEl = ref<HTMLSpanElement | null>(null)
/** 气泡 left（相对词条容器、配合 translateX(-50%) 居中锚点）；null 时回落 CSS 默认居中 */
const tipLeft = ref<number | null>(null)

/** JS 智能定位：气泡默认对准触发词居中，再 clamp 进视口 8px 内边距——靠左的词不再把气泡顶出屏幕 */
function placeTip(): void {
  const el = termEl.value
  const wrap = el?.parentElement
  if (!el || !wrap) {
    tipLeft.value = null
    return
  }
  const vw = document.documentElement.clientWidth
  const w = vw <= 720 ? 224 : 264
  const r = el.getBoundingClientRect()
  const wr = wrap.getBoundingClientRect()
  const clampedLeft = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2))
  tipLeft.value = clampedLeft + w / 2 - wr.left
}

function enter(): void {
  // 触屏的合成 mouseenter 先于 click 到达，这里若开箱，click 的收合逻辑会立刻关掉——闪现即灭
  if (lastPointerType === 'touch') return
  window.clearTimeout(hideTimer)
  if (!open.value) sfx.tick()
  placeTip()
  open.value = true
}
function leave(): void {
  hideTimer = window.setTimeout(() => (open.value = false), 120)
}
function tap(): void {
  if (lastPointerType === 'touch' && open.value) {
    open.value = false
    return
  }
  if (!open.value) sfx.blip()
  placeTip()
  open.value = !open.value
}
function onPointDown(e: PointerEvent): void {
  lastPointerType = e.pointerType
}
</script>

<template>
  <span class="term-wrap">
    <span
      ref="termEl"
      class="term" role="button" tabindex="0"
      :aria-expanded="open"
      @pointerdown="onPointDown"
      @mouseenter="enter" @mouseleave="leave"
      @click="tap"
      @keydown.enter.prevent="tap"
      @keydown.space.prevent="tap"
      @keydown.esc="open = false"
    >{{ props.k }}</span>
    <transition name="term-pop">
      <span v-if="open && lookup(props.k)" class="tip" :style="tipLeft !== null ? { left: `${tipLeft}px` } : undefined" @mouseenter="enter" @mouseleave="leave">
        <i class="cat">{{ { 基础: '基础', 十神: '十神', 格局: '格局', 神煞: '神煞', 紫微: '紫微' }[lookup(props.k)!.cat] }}</i>
        <b class="t-name">{{ Object.keys(GLOSSARY).find((x) => GLOSSARY[x] === lookup(props.k)) ?? props.k }}</b>
        <p>{{ lookup(props.k)!.text }}</p>
        <em class="src">—— {{ lookup(props.k)!.src }}</em>
      </span>
    </transition>
  </span>
</template>

<style scoped>
.term-wrap { position: relative; display: inline-block; }
.term {
  color: var(--gold-bright);
  border-bottom: 1px dashed rgba(232, 196, 115, 0.55);
  cursor: help;
  transition: color 0.2s ease, text-shadow 0.2s ease;
}
.term:hover { text-shadow: 0 0 12px rgba(232, 196, 115, 0.6); }
.term:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; border-radius: 3px; }

.tip {
  position: absolute;
  left: 50%; bottom: calc(100% + 9px);
  transform: translateX(-50%);
  width: 264px;
  background: linear-gradient(160deg, #20263a, #161a28);
  border: 1px solid rgba(232, 196, 115, 0.45);
  border-radius: 12px;
  padding: 11px 14px 9px;
  /* 高于顶栏(900)、低于彩蛋层(2600)，悬浮词不再被顶栏盖住 */
  z-index: 1200;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  display: block;
}
.tip::after {
  content: '';
  position: absolute;
  left: 50%; top: 100%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-top-color: rgba(232, 196, 115, 0.45);
}
.tip .cat {
  position: absolute;
  right: 10px; top: 10px;
  font-style: normal;
  font-size: 0.6rem;
  color: var(--teal);
  border: 1px solid rgba(94, 234, 212, 0.35);
  border-radius: 999px;
  padding: 0 6px;
}
.t-name { display: block; font-family: var(--cute); color: var(--gold-bright); font-size: 0.95rem; margin-bottom: 5px; }
.tip p { font-size: 0.78rem; line-height: 1.95; color: var(--fg); }
.src { display: block; text-align: right; font-size: 0.66rem; color: var(--dim); margin-top: 4px; }

@media (max-width: 720px) {
  .tip { width: 224px; }
}

.term-pop-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.term-pop-enter-from { transform: translateX(-50%) translateY(6px) scale(0.94); }
.term-pop-leave-active { transition: all 0.15s ease; }
.term-pop-leave-to { opacity: 0; }
</style>
