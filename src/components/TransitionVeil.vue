<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(false)
let timer: number | null = null

watch(() => route.path, () => {
  active.value = true
  if (timer !== null) window.clearTimeout(timer)
  timer = window.setTimeout(() => (active.value = false), 420)
})

onBeforeUnmount(() => {
  if (timer !== null) window.clearTimeout(timer)
})
</script>

<template>
  <transition name="veil">
    <div v-if="active" class="veil-layer" aria-hidden="true">
      <div class="veil-ring"></div>
      <span class="veil-glyph">☯</span>
    </div>
  </transition>
</template>

<style scoped>
.veil-layer {
  position: fixed;
  inset: 0;
  z-index: 1500;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.veil-ring {
  position: absolute;
  width: 46vmax;
  height: 46vmax;
  border-radius: 50%;
  border: 2px solid rgba(var(--acc-rgb), 0.35);
  box-shadow: inset 0 0 90px rgba(var(--acc-rgb), 0.14);
}
.veil-glyph {
  font-size: 2.6rem;
  color: var(--gold-bright);
  filter: drop-shadow(0 0 22px rgba(var(--acc-rgb), 0.85));
}

.veil-enter-active { transition: opacity 0.18s ease; }
.veil-leave-active { transition: opacity 0.42s ease; }
.veil-enter-from { opacity: 0; }
.veil-leave-to { opacity: 0; }
.veil-enter-active .veil-glyph { animation: veil-spin 0.42s linear; }
.veil-enter-active .veil-ring { animation: veil-bloom 0.42s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes veil-spin {
  from { transform: rotate(-160deg) scale(0.4); opacity: 0; }
  60% { opacity: 1; }
  to { transform: rotate(0deg) scale(1); opacity: 0.95; }
}
@keyframes veil-bloom {
  from { transform: scale(0.25); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
