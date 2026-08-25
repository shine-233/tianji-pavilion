<script setup lang="ts">
import { ref } from 'vue'
import { GLOSSARY, lookup } from '../lib/glossary'
import { sfx } from '../lib/sfx'

const props = defineProps<{ k: string }>()
const open = ref(false)
let hideTimer = 0

function enter(): void {
  window.clearTimeout(hideTimer)
  if (!open.value) sfx.tick()
  open.value = true
}
function leave(): void {
  hideTimer = window.setTimeout(() => (open.value = false), 120)
}
function tap(e: Event): void {
  e.preventDefault()
  e.stopPropagation()
  if (!open.value) sfx.blip()
  open.value = !open.value
}
</script>

<template>
  <span class="term-wrap">
    <span class="term" @mouseenter="enter" @mouseleave="leave" @click="tap">{{ props.k }}</span>
    <transition name="term-pop">
      <span v-if="open && lookup(props.k)" class="tip" @mouseenter="enter" @mouseleave="leave">
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

.tip {
  position: absolute;
  left: 50%; bottom: calc(100% + 9px);
  transform: translateX(-50%);
  width: 264px;
  background: linear-gradient(160deg, #20263a, #161a28);
  border: 1px solid rgba(232, 196, 115, 0.45);
  border-radius: 12px;
  padding: 11px 14px 9px;
  z-index: 60;
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

@media (max-width: 640px) {
  .tip { width: 224px; left: auto; right: -40px; transform: none; }
}

.term-pop-enter-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.term-pop-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.94); }
@media (max-width: 640px) {
  .term-pop-enter-from { transform: translateY(6px) scale(0.94); }
}
.term-pop-leave-active { transition: all 0.15s ease; }
.term-pop-leave-to { opacity: 0; }
</style>
