<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sfx } from '../lib/sfx'

const show = ref(false)

function onScroll(): void {
  show.value = window.scrollY > 640
}
function top(): void {
  sfx.toggle()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <transition name="fab-pop">
    <button v-if="show" class="to-top" title="回到顶部" aria-label="回到顶部" @click="top()">☝</button>
  </transition>
</template>

<style scoped>
/* 常驻道长吉祥物占了右下角，回顶按钮放左下角互不打架 */
.to-top {
  position: fixed;
  left: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 1100;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  padding: 0;
  font-size: 1.1rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
}
.fab-pop-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fab-pop-leave-active { transition: all 0.2s ease; }
.fab-pop-enter-from, .fab-pop-leave-to { opacity: 0; transform: translateY(14px) scale(0.8); }
@media (max-width: 600px) {
  .to-top { left: 10px; bottom: calc(14px + env(safe-area-inset-bottom)); }
}
</style>
