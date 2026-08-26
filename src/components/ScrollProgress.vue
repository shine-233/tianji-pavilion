<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { watchScrollProgress } from '../lib/motion'

const pct = ref(0)
let stop: (() => void) | null = null

onMounted(() => {
  stop = watchScrollProgress((p) => {
    pct.value = p
  })
})
onBeforeUnmount(() => stop?.())
</script>

<template>
  <div class="scroll-progress" aria-hidden="true">
    <i :style="{ width: pct + '%' }" />
  </div>
</template>

<style scoped>
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  z-index: 1500;
  pointer-events: none;
  background: transparent;
}
.scroll-progress i {
  display: block;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--teal), var(--gold), var(--gold-bright));
  box-shadow: 0 0 8px var(--glow);
  transition: width 0.08s linear;
}
</style>
