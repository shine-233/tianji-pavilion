<script setup lang="ts">
import DecryptTitle from '../components/DecryptTitle.vue'
import XiaoLiuren from '../components/XiaoLiuren.vue'
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h1><DecryptTitle text="小六壬 · 马前速课" /></h1>
      <p class="sub">
        六宫轮转，落宫断事：大安、留连、速喜、赤口、小吉、空亡。
        传说是诸葛亮行军时马上掐算的法子，不用工具，报个数就成——适合问眼前一件具体的小事。
      </p>
    </div>
    <XiaoLiuren />
  </main>
</template>
