<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Solar } from 'lunar-javascript'
import { sfx } from '../lib/sfx'

const offset = ref(0)

/** ===== 月历总览 ===== */
const calBase = ref(new Date())
interface DayCell {
  date: Date
  day: number
  inMonth: boolean
  isToday: boolean
  isPicked: boolean
  level: 'good' | 'bad' | 'flat'
}
const calCells = computed<DayCell[]>(() => {
  const base = calBase.value
  const y = base.getFullYear()
  const m = base.getMonth()
  const firstDow = new Date(y, m, 1).getDay()
  const start = new Date(y, m, 1 - firstDow)
  const todayMid = new Date(new Date().toDateString()).getTime()
  const pickedMid = new Date(new Date(Date.now() + offset.value * 86400000).toDateString()).getTime()
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const l = Solar.fromDate(d).getLunar()
    const yi = l.getDayYi() as string[]
    const ji = l.getDayJi() as string[]
    let level: DayCell['level'] = 'flat'
    if (ji.includes('诸事不宜')) level = 'bad'
    else if (yi.includes('诸事可行')) level = 'good'
    else if (yi.length >= 9) level = 'good'
    else if (ji.length >= 6) level = 'bad'
    cells.push({
      date: d,
      day: d.getDate(),
      inMonth: d.getMonth() === m,
      isToday: d.getTime() === todayMid,
      isPicked: d.getTime() === pickedMid,
      level,
    })
  }
  return cells
})
function calShift(n: number): void {
  sfx.blip()
  calBase.value = new Date(calBase.value.getFullYear(), calBase.value.getMonth() + n, 1)
  activeZhi.value = null
  pickedItem.value = null
}
function pickDay(c: DayCell): void {
  sfx.blip()
  const mid = new Date(new Date().toDateString()).getTime()
  offset.value = Math.round((c.date.getTime() - mid) / 86400000)
  activeZhi.value = null
  pickedItem.value = null
}

/** lunar-javascript 无官方类型，这里按用到的 API 手写最小接口 */
interface LunarTimeLike {
  getGanZhi(): string
  getTianShenLuck(): string
  getTianShen(): string
  getMinHm(): string
  getMaxHm(): string
  getYi(): string[]
  getJi(): string[]
  getZhiIndex(): number
}
interface HourCell {
  gz: string
  luck: string
  shen: string
  range: string
  yi: string[]
  ji: string[]
  zhiIndex: number
}

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
    /** 十二时辰全套（吉凶 / 天神 / 干支 / 时辰宜忌） */
    times: (lunar.getTimes() as LunarTimeLike[]).map((tm): HourCell => ({
      gz: tm.getGanZhi(),
      luck: tm.getTianShenLuck(),
      shen: tm.getTianShen(),
      range: `${tm.getMinHm()} – ${tm.getMaxHm()}`,
      yi: tm.getYi().slice(0, 6),
      ji: tm.getJi().slice(0, 6),
      zhiIndex: tm.getZhiIndex(),
    })),
  }
})

/** 用农历日在月中的位置画一个示意月相：阴影圆的偏移 */
const shadowCx = computed(() => 50 + Math.cos(Math.min(info.value.lunarDay / 30, 1) * Math.PI * 2) * 34)

/* ---------- 十二时辰互动 ---------- */
const ZHI_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const activeZhi = ref<number | null>(null)
/**
 * getTimes() 实际返回 13 段：首段是早子（0~1 点）、末段是晚子（23~24 点），
 * 中间 12 段依次对应十二支。支名按每段的 zhiIndex 取，避免第 13 枚芯片显示 undefined；
 * 早晚子分别标注以免混淆。
 */
function zhiName(i: number): string {
  const t = info.value.times[i]
  if (!t) return ''
  if (i === 0) return ZHI_NAMES[t.zhiIndex] ?? '子'
  return i === info.value.times.length - 1 ? `晚${ZHI_NAMES[t.zhiIndex] ?? '子'}` : ZHI_NAMES[t.zhiIndex] ?? '子'
}
function pickZhi(i: number): void {
  activeZhi.value = activeZhi.value === i ? null : i
  sfx.blip()
}
/** 当前真实时辰（仅看今天时高亮）；23 点要落到第 13 段晚子而不是第 0 段早子。
 *  每分钟自增一次驱动重算，跨时辰瞬间高亮会自己跳过去。 */
const nowTick = ref(0)
let tickTimer: number | null = null
onMounted(() => {
  tickTimer = window.setInterval(() => {
    nowTick.value++
  }, 60000)
})
onBeforeUnmount(() => {
  if (tickTimer !== null) window.clearInterval(tickTimer)
})
const liveZhi = computed(() => {
  void nowTick.value
  if (offset.value !== 0) return -1
  const h = new Date().getHours()
  if (h === 23) return info.value.times.length - 1
  return Math.floor(((h + 1) % 24) / 2)
})

/* ---------- 宜忌点读小词典 ---------- */
const YIJI_DICT: Record<string, string> = {
  祭祀: '敬神祭祖。旧时大事前都要先问过祖宗。',
  祈福: '向神明求好运，适合许愿。',
  求嗣: '求子嗣、求后福，也可理解为「求个结果」。',
  开光: '给神像法物开眼点睛，引申为「启用新物件」。',
  出行: '出门远行、出差旅行都算。',
  嫁娶: '男娶女嫁的正式仪式。',
  纳采: '提亲送聘，古六礼的第一步。',
  订盟: '订婚、签婚约，也泛指订立约定。',
  动土: '开工挖地基、破土兴建。',
  破土: '专指开挖墓穴、动坟地。',
  安葬: '下葬立碑事宜。',
  入殓: '将逝者移入棺木。',
  修造: '修缮房屋、改建工程。',
  盖屋: '加盖屋顶、搭建棚舍。',
  上梁: '安放房梁，旧时建房的大日子。',
  开市: '店铺开门营业、公司挂牌。',
  开业: '生意正式开张。',
  交易: '买卖签约、谈钱的事。',
  纳财: '收账进货、置办财物。',
  栽种: '种树播种，也可以是「开始养个长期项目」。',
  纳畜: '买进牲口宠物——领养猫狗的好日子。',
  牧养: '饲养动物。',
  扫舍: '大扫除、除旧布新。',
  沐浴: '洗澡斋戒，引申为「净化一下」。',
  理发: '剃头剪发。旧时正月不剃头就靠黄历找日子。',
  求医: '看病问药、调理身体。',
  治病: '针对已确诊的病症施治。',
  解除: '化解灾厄、解除契约恩怨。',
  入宅: '搬进新家、乔迁。',
  移徙: '搬家挪窝，远近都算。',
  安床: '安置床铺，婚嫁搬家的配套动作。',
  拆卸: '拆旧房子、拆设备。',
  出火: '移灶点火，入伙迁居的仪式环节。',
  作灶: '砌炉灶——厨房动工的日子。',
  立券: '签合同立字据，交易落纸的日子。',
  会亲友: '走亲访友、聚会宴请。',
  赴任: '上任就职，第一天上班的老讲究。',
  裁衣: '裁剪制衣，也适合定做重要场合的衣服。',
  造仓: '修建仓库，引申为「整理收纳」。',
  平治道涂: '修路平整地面。',
  修坟: '修缮坟墓。',
  启钻: '迁坟开穴的前期工序。',
  谢土: '工程完成后答谢土地的仪式。',
  斋醮: '道教设坛祈福法事。',
  酬神: '还愿谢神。',
  塑绘: '雕塑绘画神像，引申为艺术创作。',
}
function dictOf(item: string): string {
  return YIJI_DICT[item] ?? '老黄历里的传统事项，具体做法各处风俗不同。'
}

/* ---------- 月相知识卡 ---------- */
const MOON_KNOWLEDGE: Array<{ match: RegExp; name: string; text: string }> = [
  { match: /朔|新月/, name: '朔 · 新月', text: '月亮躲在地球和太阳中间，整夜看不见。旧历以朔为每月初一——万事「重新开始」的日子。' },
  { match: /既朔/, name: '既朔', text: '朔日刚过的两三天，月亮只露一条细边，古人叫它「蛾眉未成」。' },
  { match: /蛾眉|娥眉|眉月/, name: '蛾眉月', text: '弯弯一道细钩。日落后的西天能看到它，是「许个小愿」的时候。' },
  { match: /上弦/, name: '上弦月', text: '农历初七前后，半轮明月挂在傍晚的南天。上弦到满月这几天，月亮一天比一天圆。' },
  { match: /盈凸|渐盈/, name: '盈凸月', text: '比半圆胖、比满圆瘦。涨潮最猛的日子，古人认为做事的势头也在涨。' },
  { match: /望|满月/, name: '望 · 满月', text: '日月相对，整夜通明。农历十五是潮汐最强、也是传说里最容易「心事上头」的一夜。' },
  { match: /亏凸|渐亏/, name: '亏凸月', text: '满月开始收窄。该收尾的事在这几天收尾，顺势而为。' },
  { match: /下弦/, name: '下弦月', text: '农历廿二前后，半夜才升起的半轮月。古人拿它提醒自己：事情过了顶峰要懂得收。' },
  { match: /残月|晓月|晦/, name: '残月 · 晦', text: '黎明前的最后一线月光。晦日是农历最后一天，「辞旧」的日子。' },
]
const showMoonCard = ref(false)
const moonKnowledge = computed(() => {
  const yx = info.value.yueXiang
  return MOON_KNOWLEDGE.find((k) => k.match.test(yx)) ?? MOON_KNOWLEDGE[0]!
})
function toggleMoon(): void {
  showMoonCard.value = !showMoonCard.value
  sfx.ding()
}

/* ---------- 宜忌点读 ---------- */
const pickedItem = ref<{ text: string; kind: 'yi' | 'ji' } | null>(null)
function pickItem(text: string, kind: 'yi' | 'ji'): void {
  pickedItem.value = pickedItem.value?.text === text && pickedItem.value.kind === kind ? null : { text, kind }
  sfx.blip()
}

function step(n: number): void {
  sfx.blip()
  offset.value += n
  activeZhi.value = null
  pickedItem.value = null
}
function backToday(): void {
  sfx.toggle()
  offset.value = 0
  activeZhi.value = null
  pickedItem.value = null
}
</script>

<template>
  <main class="page">
    <h1>今日黄历</h1>
    <p class="sub">宜忌、冲煞、方位都按《协纪辨方书》一路的老历法算，数据来自开源历法库。信则参考之，不信就当看个节气。</p>

    <section v-reveal="0" class="card head-card">
      <button class="ghost nav" @click="step(-1)">← 前一天</button>
      <div class="date-block">
        <div class="moon-wrap">
          <svg class="moon" viewBox="0 0 100 100" aria-hidden="true" @click="toggleMoon">
            <circle cx="50" cy="50" r="40" fill="#20263a" stroke="var(--line)" />
            <clipPath id="mclip"><circle cx="50" cy="50" r="40" /></clipPath>
            <g clip-path="url(#mclip)">
              <circle cx="50" cy="50" r="40" fill="var(--gold-bright)" />
              <circle :cx="shadowCx" cy="50" r="40" fill="#0d1017" opacity="0.92" />
            </g>
          </svg>
          <!-- 点击涟漪 -->
          <span v-if="showMoonCard" class="moon-ring" aria-hidden="true" />
        </div>
        <div class="date-main">
          <span class="solar">{{ info.solarText }} <i>周{{ info.week }}</i></span>
          <b class="lunar">农历 {{ info.lunarText }}</b>
          <span class="gz">{{ info.yearGz }}年 · {{ info.monthGz }}月 · {{ info.dayGz }}日</span>
          <span v-if="info.jieQi" class="tag red jq">{{ info.jieQi }}</span>
        </div>
        <button class="moon-name moon-btn" @click="toggleMoon">
          <span>{{ info.yueXiang }}</span>
          <small>月相 · 点我</small>
        </button>
      </div>
      <Transition name="moon-card">
        <p v-if="showMoonCard" class="moon-knowledge">
          <b>🌙 {{ moonKnowledge.name }}</b>
          {{ moonKnowledge.text }}
        </p>
      </Transition>
      <button class="ghost nav" @click="backToday">回到今天</button>
      <button class="ghost nav" @click="step(1)">后一天 →</button>
    </section>

    <!-- 月历总览：整月吉凶速览，点选任意一天 -->
    <section v-reveal="60" class="card cal-card">
      <div class="cal-head">
        <h2>{{ calBase.getFullYear() }} 年 {{ calBase.getMonth() + 1 }} 月</h2>
        <div class="cal-nav">
          <button class="ghost" @click="calShift(-1)">‹ 上月</button>
          <button class="ghost" @click="calShift(1)">下月 ›</button>
        </div>
      </div>
      <div class="cal-grid">
        <span v-for="w in ['日', '一', '二', '三', '四', '五', '六']" :key="'w' + w" class="cal-week">{{ w }}</span>
        <button
          v-for="(c, i) in calCells"
          :key="i"
          class="cal-cell"
          :class="[c.level, { out: !c.inMonth, today: c.isToday, picked: c.isPicked }]"
          @click="pickDay(c)"
        >
          <b>{{ c.day }}</b>
          <i class="dot" />
        </button>
      </div>
      <p class="note">绿点宜事多、红点忌事多、灰点平常——老黄历的粗略气象，图个参考。点任意一天看详情。</p>
    </section>

    <section v-reveal="120" class="cols">
      <div class="card col-card">
        <h2>宜</h2>
        <transition-group name="yi-in" tag="ul" class="items do-list">
          <li v-for="(y, i) in info.yi" :key="y" :class="{ picked: pickedItem?.text === y && pickedItem.kind === 'yi' }" :style="{ '--i': i }" @click="pickItem(y, 'yi')">{{ y }}</li>
        </transition-group>
      </div>
      <div class="card col-card">
        <h2>忌</h2>
        <transition-group name="ji-in" tag="ul" class="items dont-list">
          <li v-for="(j, i) in info.ji" :key="j" :class="{ picked: pickedItem?.text === j && pickedItem.kind === 'ji' }" :style="{ '--i': i }" @click="pickItem(j, 'ji')">{{ j }}</li>
        </transition-group>
      </div>
    </section>
    <Transition name="dict-pop">
      <p v-if="pickedItem" class="card dict-card">
        <b :class="pickedItem.kind === 'yi' ? 'd-do' : 'd-dont'">「{{ pickedItem.text }}」</b>
        {{ dictOf(pickedItem.text) }}
      </p>
    </Transition>

    <section v-reveal="200" class="card hour-card">
      <h2>十二时辰吉凶</h2>
      <p class="hour-hint">按日支起十二天神推得，黄道为吉、黑道为凶。点一个时辰看它的专属宜忌。</p>
      <div class="hour-chips">
        <button
          v-for="(tm, i) in info.times"
          :key="i"
          class="hour-chip"
          :class="[tm.luck === '吉' ? 'luck-good' : 'luck-bad', { active: activeZhi === i, live: i === liveZhi }]"
          :style="{ '--i': i }"
          @click="pickZhi(i)"
        >
          <b>{{ zhiName(i) }}{{ i === liveZhi ? ' · 现在' : '' }}</b>
          <small>{{ tm.range.split(' – ')[0] }}~{{ tm.range.split(' – ')[1].slice(0, 2) }}</small>
          <em>{{ tm.shen }}</em>
        </button>
      </div>
      <Transition name="dict-pop">
        <div v-if="activeZhi !== null" class="hour-detail">
          <header>
            <b class="hd-title">{{ zhiName(activeZhi) }}时 · {{ info.times[activeZhi]!.gz }}</b>
            <span class="hd-luck" :class="info.times[activeZhi]!.luck === '吉' ? 'g' : 'b'">
              {{ info.times[activeZhi]!.shen }}（{{ info.times[activeZhi]!.luck }}）
            </span>
            <span class="hd-range">{{ info.times[activeZhi]!.range }}</span>
          </header>
          <div class="hd-cols">
            <p><label>时辰宜</label>{{ info.times[activeZhi]!.yi.join('、') || '—' }}</p>
            <p><label>时辰忌</label>{{ info.times[activeZhi]!.ji.join('、') || '—' }}</p>
          </div>
        </div>
      </Transition>
    </section>

    <section v-reveal="240" class="card meta-card">
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
.moon-wrap { position: relative; display: inline-block; }
.moon {
  width: 92px;
  height: 92px;
  cursor: pointer;
  filter: drop-shadow(0 0 16px rgba(232, 196, 115, 0.35));
  animation: moon-breathe 5s ease-in-out infinite;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.moon:hover { transform: scale(1.08); }
@keyframes moon-breathe { 0%, 100% { filter: drop-shadow(0 0 12px rgba(232, 196, 115, 0.28)); } 50% { transform: scale(1.04); filter: drop-shadow(0 0 18px rgba(232, 196, 115, 0.5)); } }
.moon-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid var(--gold);
  opacity: 0;
  animation: ring-out 0.7s ease-out forwards;
  pointer-events: none;
}
@keyframes ring-out { from { transform: scale(0.8); opacity: 0.9; } to { transform: scale(1.35); opacity: 0; } }

.date-main { display: flex; flex-direction: column; gap: 4px; min-width: 190px; }
.solar { color: var(--dim); font-size: 0.95rem; }
.solar i { font-style: normal; font-size: 0.78rem; margin-left: 6px; }
.lunar { font-family: var(--cute); font-size: 1.7rem; color: var(--gold-bright); line-height: 1.3; }
.gz { color: var(--dim); font-size: 0.82rem; letter-spacing: 0.06em; }
.jq { align-self: flex-start; animation: jq-pop 2.6s ease-in-out infinite; }
@keyframes jq-pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.moon-name { text-align: center; }
.moon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.2s, transform 0.2s;
}
.moon-btn:hover { background: rgba(232, 196, 115, 0.08); transform: translateY(-2px); }
.moon-btn span { display: block; font-family: var(--cute); color: var(--gold); font-size: 1.05rem; }
.moon-btn small { color: var(--dim); font-size: 0.68rem; letter-spacing: 0.08em; }

.moon-knowledge {
  margin: 14px auto 0;
  max-width: 520px;
  padding: 11px 15px;
  border-radius: 10px;
  border: 1.5px dashed rgba(232, 196, 115, 0.4);
  background: rgba(232, 196, 115, 0.05);
  color: var(--fg);
  line-height: 1.9;
  font-size: 0.88rem;
  text-align: left;
}
.moon-knowledge b { display: block; margin-bottom: 3px; color: var(--gold-bright); font-family: var(--cute); font-weight: 400; }
.moon-card-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.moon-card-enter-from { opacity: 0; transform: translateY(-8px); }
.moon-card-leave-active { transition: all 0.15s ease; }
.moon-card-leave-to { opacity: 0; }

.nav { align-self: center; }

.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.col-card h2 { text-align: center; }
.items { list-style: none; display: flex; flex-wrap: wrap; gap: 9px; padding: 8px 2px; }
.items li {
  padding: 7px 15px;
  border-radius: 999px;
  font-family: var(--cute);
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
  animation: item-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 0.05s);
}
.items li:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 5px 14px rgba(0, 0, 0, 0.18); }
.items li.picked { outline: 2px dashed currentColor; outline-offset: 2px; }
@keyframes item-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: none; } }
.do-list li { background: rgba(94, 234, 212, 0.09); border: 1px solid rgba(94, 234, 212, 0.3); color: var(--teal); }
.dont-list li { background: rgba(248, 113, 113, 0.09); border: 1px solid rgba(248, 113, 113, 0.3); color: var(--red); }

.dict-card { margin-top: 14px; line-height: 2; animation: none; }
.dict-card b { margin-right: 8px; }
.dict-card .d-do { color: var(--teal); }
.dict-card .d-dont { color: var(--red); }
.dict-pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
.dict-pop-enter-from { opacity: 0; transform: translateY(10px); }
.dict-pop-leave-active { transition: all 0.15s ease; }
.dict-pop-leave-to { opacity: 0; }

/* 十二时辰 */
.hour-card h2 { margin-bottom: 4px; }
.hour-hint { color: var(--dim); font-size: 0.82rem; margin: 0 0 14px; }
.hour-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 9px; }
.hour-chip {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px 8px;
  border-radius: 12px;
  border: 1.5px solid rgba(125, 125, 140, 0.25);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: item-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 0.03s);
}
.hour-chip b { font-family: var(--cute); font-weight: 400; font-size: 1rem; }
.hour-chip small { color: var(--dim); font-size: 0.66rem; letter-spacing: 0.05em; }
.hour-chip em { font-style: normal; font-size: 0.68rem; }
.hour-chip.luck-good em { color: var(--teal); }
.hour-chip.luck-bad em { color: var(--red); }
.hour-chip.luck-good { border-color: rgba(94, 234, 212, 0.35); }
.hour-chip.luck-bad { border-color: rgba(248, 113, 113, 0.3); }
.hour-chip:hover { transform: translateY(-3px); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.16); }
.hour-chip.active {
  border-color: var(--gold);
  background: rgba(232, 196, 115, 0.08);
  box-shadow: 0 0 0 1.5px var(--gold), 0 6px 16px rgba(232, 196, 115, 0.2);
  transform: translateY(-3px);
}
.hour-chip.live::after {
  content: '';
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold-bright);
  animation: live-pulse 1.6s ease-in-out infinite;
}
@keyframes live-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }

.hour-detail {
  margin-top: 14px;
  padding: 13px 16px;
  border-radius: 10px;
  border: 1.5px dashed rgba(232, 196, 115, 0.4);
  background: rgba(232, 196, 115, 0.05);
}
.hour-detail header { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.hd-title { font-family: var(--cute); font-weight: 400; color: var(--gold-bright); font-size: 1.05rem; }
.hd-luck.g { color: var(--teal); font-size: 0.85rem; }
.hd-luck.b { color: var(--red); font-size: 0.85rem; }
.hd-range { color: var(--dim); font-size: 0.8rem; margin-left: auto; }
.hd-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 6px 20px; margin-top: 8px; }
.hd-cols p { margin: 0; line-height: 1.9; font-size: 0.88rem; }
.hd-cols label { display: block; color: var(--dim); font-size: 0.72rem; letter-spacing: 0.1em; }

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

@media (max-width: 560px) {
  .date-block { gap: 14px; }
  .hour-chips { grid-template-columns: repeat(3, 1fr); }
  /* 窄屏芯片缩小后仍要可读：辅助文字不低于 0.72rem */
  .hour-chip small, .hour-chip em { font-size: 0.72rem; }
}

@media (prefers-reduced-motion: reduce) {
  .moon, .jq, .hour-chip.live::after { animation: none; }
}

.cal-card { overflow: hidden; }
.cal-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.cal-nav { display: flex; gap: 6px; }
.cal-nav button { padding: 6px 12px; font-size: 0.8rem; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-top: 12px; }
.cal-week { text-align: center; font-size: 0.7rem; color: var(--dim); padding: 4px 0; }
.cal-cell {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(127, 127, 127, 0.05);
  color: var(--fg);
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, background 0.2s ease;
}
.cal-cell b { font-size: 0.86rem; }
.cal-cell .dot { width: 5px; height: 5px; border-radius: 50%; margin-top: 3px; background: var(--dim); opacity: 0.45; }
.cal-cell.good .dot { background: var(--teal); opacity: 1; box-shadow: 0 0 6px var(--teal); }
.cal-cell.bad .dot { background: var(--red); opacity: 1; }
.cal-cell:hover { transform: translateY(-3px) scale(1.04); border-color: var(--card-glow); z-index: 2; }
.cal-cell.out { opacity: 0.32; }
.cal-cell.today { border-color: var(--gold); }
.cal-cell.picked { background: var(--glow); border-color: var(--gold); transform: scale(1.06); }
@media (max-width: 560px) {
  .cal-cell { min-height: 42px; border-radius: 8px; }
  .cal-cell b { font-size: 0.78rem; }
}

</style>
