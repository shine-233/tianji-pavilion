<script setup lang="ts">
/** 数字能量 · 梅花心易：号码分组求和起卦，复用京房装卦 */
import { ref } from 'vue'
import { GUA_TIP, install, TRI_NATURE, type Trigram } from '../lib/liuyaoExtra'
import { sfx } from '../lib/sfx'
import { toast } from '../lib/toast'

const digits = ref('')
const result = ref<null | { name: string; tip: string; upper: Trigram; lower: Trigram; mv: number; rows: string[] }>(null)

function calc(): void {
  const ds = digits.value.replace(/\D/g, '')
  if (ds.length < 4) {
    toast('至少给我 4 位数字才起得来卦呀')
    return
  }
  const half = Math.floor(ds.length / 2)
  const sum = (arr: string[]) => arr.reduce((a, c) => a + Number(c), 0)
  const up = sum(ds.slice(0, half).split('')) % 8 || 8
  const low = sum(ds.slice(half).split('')) % 8 || 8
  const mv = sum(ds.split('')) % 6 || 6
  // 先天数：乾一兑二离三震四巽五坎六艮七坤八
  const NAMES: Trigram[] = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
  const lo = NAMES[low - 1]!
  const upN = NAMES[up - 1]!
  const BITS: Record<string, string> = { 乾: '111', 兑: '110', 离: '101', 震: '100', 巽: '011', 坎: '010', 艮: '001', 坤: '000' }
  const g = install(BITS[lo]! + BITS[upN]!, '甲')
  const rows = g.yaos.slice().reverse().map((y) => `${y.liuqin}·${y.najia}${y.shi ? '世' : y.ying ? '应' : ''}`)
  result.value = {
    name: g.name,
    tip: GUA_TIP[g.name] ?? '',
    upper: upN,
    lower: lo,
    mv,
    rows,
  }
  sfx.ding()
}
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h2>数字能量 · 梅花心易</h2>
      <p class="sub">手机号、QQ号、生日都行。前半求上卦，后半求下卦，总数除六取动爻——梅花旧法，号码新用。</p>
      <input v-model="digits" inputmode="numeric" maxlength="20" placeholder="输入一串数字" @keyup.enter="calc()" />
      <div style="margin-top: 12px"><button @click="calc()">☯ 起卦</button></div>
    </div>

    <div v-if="result" class="card" v-reveal="80">
      <h2>{{ result.name }}<small>（{{
        TRI_NATURE[result.upper]
      }}{{ result.upper }} 上 {{ TRI_NATURE[result.lower] }}{{ result.lower }} 下 · 动爻{{ result.mv }}）</small></h2>
      <p class="lib-tip">「{{ result.tip }}」</p>
      <p class="note">{{ result.rows.join('　') }}</p>
      <p class="note" style="margin-top: 8px">数字能量属娱乐参考；号码与命运并无科学关联。</p>
    </div>
  </main>
</template>
