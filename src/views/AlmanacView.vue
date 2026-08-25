<script setup lang="ts">
import { computed, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { sfx } from '../lib/sfx'

const offset = ref(0)

const info = computed(() => {
  const solar = Solar.fromDate(new Date(Date.now() + offset.value * 86400000))
  const lunar = solar.getLunar()
  const yi = lunar.getDayYi() as string[]
  const ji = lunar.getDayJi() as string[]
  return {
    solarText: `${solar.getMonth()}月${solar.getDay()}日`,
    week: ['日', '一', '二', '三', '四', '五', '六'][solar.getWeek()],
    lunarText: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearGz: lunar.getYearInGanZhi(),
    dayGz: lunar.getDayInGanZhi(),
    monthGz: lunar.getMonthInGanZhi(),
    jieQi: lunar.getJieQi(),
    yueXiang: lunar.getYueXiang(),
    pengZu: `${lunar.getPengZuGan()}　${lunar.getPengZuZhi()}`,
    chong: lunar.getDayChongDesc(),
    xi: lunar.getDayPositionXiDesc(),
    cai: lunar.getDayPositionCaiDesc(),
    fu: lunar.getDayPositionFuDesc(),
    xun: lunar.getDayXun(),
    lunarDay: lunar.getDay(),
    yi,
    ji,
  }
})

/** 用农历日在月中的位置画一个示意月相：阴影圆的偏移 */
const shadowCx = computed(() => 50 + Math.cos(Math.min(info.value.lunarDay / 30, 1) * Math.PI * 2) * 34)

function step(n: number): void {
  sfx.blip()
  offset.value += n
}
function backToday(): void {
  sfx.toggle()
  offset.value = 0
}
</script>

<template>
  <main class="page">
    <h1>今日黄历</h1>
    <p class="sub">宜忌、冲煞、方位都按《协纪辨方书》一路的老历法算，数据来自开源历法库。信则参考之，不信就当看个节气。</p>

    <section class="card head-card">
      <button class="ghost nav" @click="step(-1)">← 前一天</button>
      <div class="date-block">
        <svg class="moon" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" fill="#20263a" stroke="var(--line)" />
          <clipPath id="mclip"><circle cx="50" cy="50" r="40" /></clipPath>
          <g clip-path="url(#mclip)">
            <circle cx="50" cy="50" r="40" fill="var(--gold-bright)" />
            <circle :cx="shadowCx" cy="50" r="40" fill="#0d1017" opacity="0.92" />
          </g>
        </svg>
        <div class="date-main">
          <span class="solar">{{ info.solarText }} <i>周{{ info.week }}</i></span>
          <b class="lunar">农历 {{ info.lunarText }}</b>
          <span class="gz">{{ info.yearGz }}年 · {{ info.monthGz }}月 · {{ info.dayGz }}日</span>
          <span v-if="info.jieQi" class="tag red jq">{{ info.jieQi }}</span>
        </div>
        <div class="moon-name">
          <span>{{ info.yueXiang }}</span>
          <small>月相</small>
        </div>
      </div>
      <button class="ghost nav" @click="backToday">回到今天</button>
      <button class="ghost nav" @click="step(1)">后一天 →</button>
    </section>

    <section class="cols">
      <div class="card col-card">
        <h2>宜</h2>
        <transition-group name="yi-in" tag="ul" class="items do-list">
          <li v-for="(y, i) in info.yi" :key="y" :style="{ '--i': i }">{{ y }}</li>
        </transition-group>
      </div>
      <div class="card col-card">
        <h2>忌</h2>
        <transition-group name="ji-in" tag="ul" class="items dont-list">
          <li v-for="(j, i) in info.ji" :key="j" :style="{ '--i': i }">{{ j }}</li>
        </transition-group>
      </div>
    </section>

    <section class="card meta-card">
      <h2>杂项参考</h2>
      <div class="meta-grid">
        <div><label>喜神方位</label><b class="dir">{{ info.xi }}</b></div>
        <div><label>财神方位</label><b class="dir">{{ info.cai }}</b></div>
        <div><label>福神方位</label><b class="dir">{{ info.fu }}</b></div>
        <div><label>日冲</label><b>{{ info.chong || '—' }}</b></div>
        <div><label>旬空</label><b>{{ info.xun }}旬</b></div>
        <div><label>彭祖百忌</label><b class="pz">{{ info.pengZu }}</b></div>
      </div>
      <p class="note">「彭祖百忌」是旧时每天一句的顺口溜，比如「辛不合酱」就是说这天别酿东西——听听就好。</p>
    </section>
  </main>
</template>

<style scoped>
.head-card { padding: 20px 24px; }
.date-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.moon { width: 92px; height: 92px; filter: drop-shadow(0 0 16px rgba(232, 196, 115, 0.35)); animation: moon-breathe 5s ease-in-out infinite; }
@keyframes moon-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.date-main { display: flex; flex-direction: column; gap: 4px; min-width: 190px; }
.solar { color: var(--dim); font-size: 0.95rem; }
.solar i { font-style: normal; font-size: 0.78rem; margin-left: 6px; }
.lunar { font-family: var(--cute); font-size: 1.7rem; color: var(--gold-bright); line-height: 1.3; }
.gz { color: var(--dim); font-size: 0.82rem; letter-spacing: 0.06em; }
.jq { align-self: flex-start; animation: jq-pop 2.6s ease-in-out infinite; }
@keyframes jq-pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.moon-name { text-align: center; }
.moon-name span { display: block; font-family: var(--cute); color: var(--gold); }
.moon-name small { color: var(--dim); }

.nav { align-self: center; }

.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.col-card h2 { text-align: center; }
.items { list-style: none; display: flex; flex-wrap: wrap; gap: 9px; padding: 8px 2px; }
.items li {
  padding: 7px 15px;
  border-radius: 999px;
  font-family: var(--cute);
  font-size: 0.95rem;
  animation: item-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 0.05s);
}
@keyframes item-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: none; } }
.do-list li { background: rgba(94, 234, 212, 0.09); border: 1px solid rgba(94, 234, 212, 0.3); color: var(--teal); }
.dont-list li { background: rgba(248, 113, 113, 0.09); border: 1px solid rgba(248, 113, 113, 0.3); color: var(--red); }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
}
.meta-grid label { margin-top: 0; }
.meta-grid b { font-size: 1rem; color: var(--fg); display: block; margin-top: 3px; }
.dir { font-family: var(--cute); color: var(--gold) !important; font-size: 1.15rem !important; }
.pz { font-size: 0.85rem !important; line-height: 1.7; }

.yi-in-enter-active, .ji-in-enter-active { transition: all 0.4s ease; transition-delay: calc(var(--i) * 0.04s); }
.yi-in-enter-from { opacity: 0; transform: translateX(-14px); }
.ji-in-enter-from { opacity: 0; transform: translateX(14px); }
</style>
