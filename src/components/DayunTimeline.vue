<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DayunItem } from '../lib/engine'
import { sfx } from '../lib/sfx'

const props = defineProps<{ items: DayunItem[]; activeIndex?: number | null }>()
const emit = defineEmits<{ pick: [i: number | null] }>()
const shown = ref(false)
const active = ref<number | null>(null)
let showTimer = 0
onMounted(() => {
  showTimer = window.setTimeout(() => (shown.value = true), 200)
})
onBeforeUnmount(() => window.clearTimeout(showTimer))

/** 与三维山河图双向联动：点山峰定位到那十年；三维侧取消（null）也同步清掉高亮，防两处选中态漂移 */
watch(() => props.activeIndex, (i) => {
  active.value = typeof i === 'number' && i >= 0 ? i : null
})

function colorOf(fin: number): string {
  return fin >= 0.6 ? 'var(--teal)' : fin >= 0.3 ? 'var(--amber)' : '#f87171'
}
function pick(i: number): void {
  active.value = active.value === i ? null : i
  // 点时间轴也要回传父级，让三维山河图的光环同步亮起
  emit('pick', active.value)
  sfx.blip()
}
</script>

<template>
  <div class="tl-wrap">
    <div class="tl-line"></div>
    <div class="tl-scroll">
      <div
        v-for="(dy, i) in props.items" :key="i"
        class="tl-node" :class="{ on: shown, sel: active === i }"
        :style="{ transitionDelay: `${i * 90}ms` }"
        role="button" tabindex="0"
        @click="pick(i)"
        @keydown.enter.prevent="pick(i)"
        @keydown.space.prevent="pick(i)"
      >
        <div class="gz" :style="{ color: colorOf(dy.fin) }">{{ dy.gz }}</div>
        <div class="win">{{ dy.window }}</div>
        <div class="dot" :style="{ borderColor: colorOf(dy.fin) }"><i :style="{ background: colorOf(dy.fin), height: `${Math.round(dy.fin * 100)}%` }"></i></div>
        <div class="fin">{{ dy.fin.toFixed(2) }}</div>
      </div>
    </div>
    <transition name="pop">
      <div v-if="active !== null && props.items[active]" class="detail">
        {{ props.items[active]!.gz }} 大运 · {{ props.items[active]!.window }} ·
        亲和度 {{ props.items[active]!.fin.toFixed(2)}}，
        {{ props.items[active]!.fin >= 0.6 ? '顺风行舟，宜进取开拓' : props.items[active]!.fin >= 0.3 ? '平缓守成，稳中求进' : '逆水寒滩，宜守不宜攻' }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.tl-wrap { position: relative; }
.tl-scroll { display: flex; gap: 4px; overflow-x: auto; padding: 6px 2px 10px; scrollbar-width: thin; }
.tl-node {
  min-width: 74px;
  text-align: center;
  opacity: 0;
  transform: translateY(14px);
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
  border-radius: 10px;
  padding: 8px 4px;
}
.tl-node:hover { background: rgba(255, 255, 255, 0.04); }
.tl-node:focus-visible { outline: 2px solid var(--teal); outline-offset: -2px; }
.tl-node.sel { background: rgba(232, 196, 115, 0.08); outline: 1px solid rgba(232, 196, 115, 0.35); }
.tl-node.on { opacity: 1; transform: none; }
.tl-line { position: absolute; left: 0; right: 0; top: 58px; height: 1px; background: linear-gradient(90deg, transparent, var(--line) 8%, var(--line) 92%, transparent); }
.gz { font-family: var(--cute); font-size: 1.05rem; }
.win { font-size: 0.66rem; color: var(--dim); margin: 3px 0 7px; }
.dot {
  width: 14px; height: 40px;
  border: 1px solid #333;
  border-radius: 8px;
  margin: 0 auto 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}
.dot > i { display: block; width: 100%; transition: height 1s cubic-bezier(0.22, 1, 0.36, 1); }
.fin { font-size: 0.72rem; color: var(--dim); }

.detail {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(94, 234, 212, 0.06);
  border: 1px solid rgba(94, 234, 212, 0.18);
  font-size: 0.85rem;
  color: var(--teal);
}
.pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(6px); }
</style>
