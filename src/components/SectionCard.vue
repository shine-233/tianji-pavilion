<script setup lang="ts">
/** 内容卡片：统一全站 `.card > h2` 的区块骨架，自带入场 reveal（延迟可调）。 */
withDefaults(
  defineProps<{
    /** 卡片标题（h2），无标题内容卡可省 */
    title?: string
    /** 入场浮现延迟毫秒，用于相邻卡片的错落节奏 */
    delay?: number
    /** 作为 <section> 还是 <div> 渲染（默认 section，语义化内容块） */
    tag?: 'section' | 'div'
  }>(),
  { delay: 0, tag: 'section' },
)
</script>

<template>
  <component :is="tag" v-reveal="delay" class="card">
    <h2 v-if="title">{{ title }}</h2>
    <slot />
  </component>
</template>
