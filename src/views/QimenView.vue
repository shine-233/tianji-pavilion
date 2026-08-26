<script setup lang="ts">
/** 奇门遁甲 · 入门盘 v1：阴阳遁定局、三元、地盘三奇六仪、旬空、驿马 */
import { ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { xunKong } from '../lib/liuyaoExtra'
import { sfx } from '../lib/sfx'

const GAN = '甲乙丙丁戊己庚辛壬癸'
const ZHI = '子丑寅卯辰巳午未申酉戌亥'

function dayIndex(gz: string): number {
  const gi = GAN.indexOf(gz[0]!)
  let n = ZHI.indexOf(gz[1]!)
  while (n % 10 !== gi) n += 12
  return n % 60
}

/* 二十四节气定局表：[上元, 中元, 下元] */
const JU_TABLE: Record<string, [number, number, number]> = {
  冬至: [1, 7, 4], 惊蛰: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6], 春分: [3, 9, 6],
  雨水: [9, 6, 3], 立春: [8, 5, 2], 清明: [4, 1, 7], 立夏: [4, 1, 7],
  谷雨: [5, 2, 8], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 白露: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 秋分: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 寒露: [6, 9, 3], 立冬: [6, 9, 3],
  霜降: [5, 8, 2], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
}

interface Pan {
  yangDun: boolean
  ju: number
  yuan: '上元' | '中元' | '下元'
  jieqi: string
  fuTou: string
  diPan: string[]
  kong: string
  ma: string
  timeGZ: string
  dayGZ: string
}

function qiMenPan(d: Date): Pan {
  const solar = Solar.fromDate(d)
  const lunar = solar.getLunar()
  const jq = lunar.getPrevJieQi()
  const jieqi = jq.getName()
  const yangDun = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'].includes(jieqi)
  const dayGZ = lunar.getDayInGanZhi()
  const N = dayIndex(dayGZ)
  const off = N % 5
  const ftN = N - off
  const ftGz = GAN[ftN % 10]! + ZHI[ftN % 12]!
  const ftZhi = ftGz[1]!
  const yuan = ('子午卯酉'.includes(ftZhi) ? '上元' : '寅申巳亥'.includes(ftZhi) ? '中元' : '下元') as Pan['yuan']
  const trio = JU_TABLE[jieqi] ?? [1, 1, 1]
  const ju = yangDun ? trio[['上元', '中元', '下元'].indexOf(yuan)]! : trio[['上元', '中元', '下元'].indexOf(yuan)]!
  const seq = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']
  const diPan: string[] = new Array(10).fill('')
  for (let k = 0; k < 9; k++) {
    const palace = yangDun ? ((ju - 1 + k) % 9) + 1 : ((ju - 1 - k + 18) % 9) + 1
    diPan[palace] = seq[k]!
  }
  const timeGZ = lunar.getTimeInGanZhi()
  const kong = xunKong(lunar.getDayInGanZhi())
  const grp: Record<string, string> = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' }
  const ma = grp[lunar.getDayInGanZhi()[1]!] ?? '申'
  return { yangDun, ju, yuan, jieqi, fuTou: ftGz, diPan, kong, ma, timeGZ, dayGZ }
}

const pan = ref<Pan | null>(null)

function calc(): void {
  pan.value = qiMenPan(new Date())
  sfx.gong()
}

const GRID: number[][] = [[4, 9, 2], [3, 5, 7], [8, 1, 6]]
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h2>奇门遁甲 · 入门盘</h2>
      <p class="sub">
        第一步只做最要紧的事：<b class="gold-t">定阴阳遁、取局数、布地盘三奇六仪</b>，
        再标出旬空与驿马。值符天盘与八门九星属于下一步，先把地基打准——
        排错一宫，全盘皆废。
      </p>
      <button @click="calc()">☯ 以当前时辰起局</button>
    </div>

    <template v-if="pan">
      <div class="card" v-reveal="60">
        <div class="head-row">
          <span class="tag gold">{{ pan.yangDun ? '阳遁' : '阴遁' }}{{ pan.ju }}局</span>
          <span class="tag">{{ pan.yuan }}</span>
          <span class="tag teal">节气 · {{ pan.jieqi }}</span>
          <span class="tag">符头 {{ pan.fuTou }}</span>
        </div>
        <p class="sub" style="margin-top: 8px">
          今日 {{ pan.dayGZ }} · 此时 {{ pan.timeGZ }} · 旬空 <b>{{ pan.kong }}</b> · 驿马在 <b>{{ pan.ma }}</b>
        </p>
      </div>

      <div class="card" v-reveal="120">
        <h2>地盘九宫 · 三奇六仪</h2>
        <div class="palaces">
          <div v-for="row in GRID" :key="row.join()" class="prow">
            <div v-for="n in row" :key="n" class="pcell">
              <span class="no">{{ n }}</span>
              <span class="yi">{{ pan.diPan[n] || '中五' }}</span>
            </div>
          </div>
        </div>
        <p class="note" style="margin-top: 10px">
          {{ pan.yangDun ? '阳遁顺布六仪，阴遁逆布' : '' }}戊己庚辛壬癸为六仪，乙丙丁为三奇；
          中五宫寄坤二宫。此盘为静态地盘，值符随时干的转动留待进阶篇。
        </p>
      </div>
    </template>
  </main>
</template>

<style scoped>
.head-row { display: flex; gap: 8px; flex-wrap: wrap; }
.palaces { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; max-width: 420px; }
.prow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.pcell {
  position: relative;
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 16px 10px 14px;
  text-align: center;
  background: linear-gradient(160deg, var(--card-2), transparent);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.pcell:hover { transform: translateY(-3px); border-color: rgba(var(--acc-rgb), 0.45); }
.no { position: absolute; top: 5px; left: 9px; font-size: 0.62rem; color: var(--dim); }
.yi { font-family: var(--cute); font-size: 1.55rem; color: var(--gold-bright); text-shadow: 0 0 14px rgba(var(--acc-rgb), 0.35); }
</style>
