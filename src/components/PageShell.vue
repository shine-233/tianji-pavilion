<script setup lang="ts">
/** 页面外壳：统一 <main class="page"> 开场（标题 + 导语），22 个视图共用。 */
defineProps<{
  /** 页首大标题（h1），可省略让位给纯内容页 */
  title?: string
  /** 标题下的一句导语 */
  lead?: string
}>()
</script>

<template>
  <main class="page">
    <header v-if="title || lead" class="shell-head">
      <h1 v-if="title">{{ title }}</h1>
      <p v-if="lead" class="sub">{{ lead }}</p>
    </header>
    <slot />
  </main>
</template>

<style scoped>
.shell-head { margin-bottom: 6px; }
.shell-head h1 { font-size: var(--fs-display); line-height: var(--lh-tight); }
</style>
