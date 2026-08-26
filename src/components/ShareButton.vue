<script setup lang="ts">
import { ref } from 'vue'
import { downloadShareCard } from '../lib/share'
import type { ShareSpec } from '../lib/share'
import { sfx } from '../lib/sfx'
import { sparkle } from '../lib/sparkle'

const props = defineProps<{ spec: ShareSpec; filename?: string }>()
const busy = ref(false)
const failed = ref(false)

function share(e: MouseEvent): void {
  if (busy.value) return
  busy.value = true
  failed.value = false
  sfx.ding()
  sparkle(e.clientX, e.clientY, 12)
  window.setTimeout(() => {
    try {
      downloadShareCard(props.spec, props.filename)
    } catch {
      failed.value = true
      sfx.knock()
      window.setTimeout(() => (failed.value = false), 2600)
    } finally {
      busy.value = false
    }
  }, 240)
}
</script>

<template>
  <button class="ghost share-btn" :disabled="busy" @click="share">🖼 {{ busy ? '绘制中…' : failed ? '绘制失败，再试一次' : '生成分享图' }}</button>
</template>

<style scoped>
.share-btn { transition: transform 0.2s ease; }
.share-btn:hover { border-color: var(--teal); color: var(--teal); }
.share-btn:active { transform: scale(0.96); }
</style>
