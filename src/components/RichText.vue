<script setup lang="ts">
import { computed } from 'vue'
import { segmentTerms } from '../lib/glossary'
import TermTip from './TermTip.vue'

const props = defineProps<{ text: string }>()
const segs = computed(() => segmentTerms(props.text))
</script>

<template>
  <span class="rich">
    <template v-for="(s, i) in segs" :key="i">
      <TermTip v-if="s.term" :k="s.term" />
      <template v-else>{{ s.text }}</template>
    </template>
  </span>
</template>
