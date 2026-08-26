<script setup lang="ts">
/** 奇门遁甲 · 入门盘 v1：阴阳遁定局、三元、地盘三奇六仪、旬空、驿马 */
import { computed, ref } from 'vue'
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
  zhiFuXing: string
  zhiShiMen: string
  tian: Record<number, { xing: string; men: string; shen: string }>
  geju: string[]
}

const XING: Record<number, string> = { 1: '天蓬', 8: '天任', 3: '天冲', 4: '天辅', 5: '天禽', 6: '天心', 7: '天柱', 2: '天芮', 9: '天英' }
const MEN0: Record<number, string> = { 1: '休', 8: '生', 3: '伤', 4: '杜', 6: '开', 7: '惊', 2: '死', 9: '景' }
const RING = [1, 8, 3, 4, 9, 2, 7, 6]
const SHEN_SEQ = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']
const XUN_YI: Record<string, string> = { 子: '戊', 戌: '己', 申: '庚', 午: '辛', 辰: '壬', 寅: '癸' }

function timeIndex(gz: string): number {
  const gi = GAN.indexOf(gz[0]!)
  let n = ZHI.indexOf(gz[1]!)
  while (n % 10 !== gi) n += 12
  return n % 60
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
  const ju = (JU_TABLE[jieqi] ?? [1, 1, 1])[['上元', '中元', '下元'].indexOf(yuan)]!
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

  /* v2：天盘转动 */
  const tn = timeIndex(timeGZ)
  const xunStartN = tn - (tn % 10)
  const xunZhi = ZHI[xunStartN % 12]!
  const fuYi = XUN_YI[xunZhi] ?? '戊'
  const fuIdx = diPan.indexOf(fuYi)
  const fuPal = fuIdx === -1 ? 5 : fuIdx
  const zhiFuXing = XING[fuPal === 5 ? 2 : fuPal]!
  // 值使门：中五宫寄坤二宫
  const zhiShiMen = (MEN0[fuPal === 5 ? 2 : fuPal] ?? '死') + '门'
  const tGan = timeGZ[0]!
  // 时干为甲时不在六仪之列，用旬首遁干定直符
  let p0raw = diPan.indexOf(tGan)
  if (p0raw === -1) p0raw = diPan.indexOf(fuYi)
  let p0 = Math.max(1, p0raw)
  if (p0 === 5) p0 = 2
  const deltaS = ((RING.indexOf(p0) - RING.indexOf(fuPal)) % 8 + 8) % 8
  const offset = tn - xunStartN
  let gatePal = pan2(yangDun ? ((fuPal - 1 + offset) % 9) + 1 : (((fuPal - 1 - offset) % 9) + 18) % 9 + 1)
  const deltaG = ((RING.indexOf(gatePal) - RING.indexOf(fuPal)) % 8 + 8) % 8
  function pan2(n: number): number { return n === 5 ? 2 : n }
  const tian: Record<number, { xing: string; men: string; shen: string }> = {}
  for (let i = 0; i < 8; i++) {
    const pal = RING[i]!
    const starOrig = RING[((i - deltaS) % 8 + 8) % 8]!
    const gateOrig = RING[((i - deltaG) % 8 + 8) % 8]!
    const shenIdx = ((RING.indexOf(p0) + (yangDun ? i : -i)) % 8 + 8) % 8
    tian[pal] = { xing: XING[starOrig]!, men: (MEN0[gateOrig] ?? '禽') + '门', shen: SHEN_SEQ[shenIdx]! }
  }

  /* 格局断语 */
  const geju: string[] = []
  if (deltaS === 0) geju.push('伏吟 · 天地盘相同，万事迟滞难动，宜守不宜进')
  if (deltaS === 4) geju.push('反吟 · 星门对冲，事多反复，静待时机再动')
  const xingPal: Record<string, number[]> = { 戊: [3], 己: [2], 庚: [8], 辛: [9], 壬: [4], 癸: [4] }
  for (let p = 1; p <= 9; p++) {
    const yi = diPan[p]!
    if (xingPal[yi]?.includes(p)) geju.push(`六仪击刑 · ${yi} 落 ${p} 宫，自刑带伤，防口舌与暗损`)
  }
  const gateEle: Record<string, string> = { 休: '水', 生: '土', 伤: '木', 杜: '木', 景: '火', 死: '土', 惊: '金', 开: '金' }
  const palEle: Record<number, string> = { 1: '水', 8: '土', 3: '木', 4: '木', 6: '金', 7: '金', 2: '土', 9: '火' }
  const ke: Record<string, string> = { 水: '火', 火: '金', 金: '木', 木: '土', 土: '水' }
  for (let i = 0; i < 8; i++) {
    const pal = RING[i]!
    const g0 = tian[pal]!.men.replace('门', '')
    if (ke[gateEle[g0]!] === palEle[pal]) geju.push(`门迫 · ${g0}门（${gateEle[g0]}）迫${pal}宫（${palEle[pal]}），其事受阻`)
  }
  return { yangDun, ju, yuan, jieqi, fuTou: ftGz, diPan, kong, ma, timeGZ, dayGZ, zhiFuXing, zhiShiMen, tian, geju }
}

const pan = ref<Pan | null>(null)

function calc(): void {
  pan.value = qiMenPan(new Date())
  sfx.gong()
}

const GRID: number[][] = [[4, 9, 2], [3, 5, 7], [8, 1, 6]]

/* 用神细断：问事类型 → 取门/星/干 */
const YS: Record<string, { men?: string; xing?: string; gan?: string; ma?: boolean; label: string }> = {
  求财: { men: '生', gan: '戊', label: '生门为财源，戊为资本' },
  官事: { men: '开', xing: '值符', label: '开门主官途，值符为权贵' },
  婚姻: { men: '六合作合', gan: '乙', label: '六合主婚媒，乙奇为女方' },
  疾病: { xing: '天芮', gan: '乙', label: '天芮为病星，乙奇为医药' },
  出行: { men: '开', ma: true, label: '开门宜行，驿马主动' },
  考试: { men: '景', gan: '丁', label: '景门主文书，丁奇为文章' },
}
const yscat = ref<keyof typeof YS>('求财')

const ysVerdict = computed(() => {
  if (!pan.value) return ''
  const cfg = YS[yscat.value]!
  const hits: string[] = []
  const findMenPal = (m: string): number | null => {
    for (let i = 0; i < 8; i++) if (pan.value!.tian[RING[i]!]!.men.startsWith(m)) return RING[i]!
    return null
  }
  let pal: number | null = null
  if (cfg.men && !cfg.men.includes('合')) pal = findMenPal(cfg.men)
  if (pal === null && cfg.gan) {
    const gi2 = pan.value.diPan.indexOf(cfg.gan)
    pal = gi2 === -1 ? null : gi2
  }
  if (pal === null && cfg.xing && cfg.xing !== '值符') {
    for (let i = 1; i <= 9; i++) if (pan.value.tian[i]?.xing === cfg.xing) pal = i
  }
  if (pal === null || pal === undefined) return `${cfg.label}——盘面暂未锁定其落宫，细断从略。`
  const info = pan.value.tian[pal]
  const bad = pan.value.geju.filter((gj) => gj.includes(`${pal} 宫`) || gj.startsWith('伏吟') || gj.startsWith('反吟'))
  if (info?.shen === '值符') hits.push('临值符，得尊贵之气')
  if (bad.length) hits.push(...bad.map((b) => '但' + b.split(' · ')[0]))
  else hits.push('未见击刑门迫等破格')
  hits.push(info?.men ? `落${info.men}门、${info.xing}` : '')
  return `${cfg.label}：用神落在 ${pal} 宫（${pan.value.diPan[pal]}）。${hits.filter(Boolean).join(';')}。`
})
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h2>奇门遁甲 · 入门盘</h2>
      <p class="sub">
        以当前时辰起局：<b class="gold-t">定阴阳遁、取局数、布地盘三奇六仪</b>，
        再转动天盘，安上九星八门与八神，标出旬空、驿马，顺手点几处显性格局。
        时干逢甲的时辰会自动改用旬首遁干定直符——排错一宫，全盘皆废，所以这里每步都按古法来。
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
              <span class="shen" :class="{ zf: pan.tian[n]?.shen === '值符' }">{{ pan.tian[n]?.shen }}</span>
              <span class="yi">{{ pan.diPan[n] || '中五' }}</span>
              <span class="xm"><b>{{ pan.tian[n]?.xing }}</b>{{ pan.tian[n]?.men }}</span>
            </div>
          </div>
        </div>
        <p class="note" style="margin-top: 10px">
          {{ pan.yangDun ? '阳遁顺布六仪，阴遁逆布' : '' }}戊己庚辛壬癸为六仪，乙丙丁为三奇；
          中五宫寄坤二宫。
        </p>
      </div>

      <div class="card" v-reveal="180">
        <h2>格局提示</h2>
        <p v-for="(gj, gi) in pan.geju" :key="gi" class="note gj-line">{{ gj }}</p>
        <p v-if="!pan.geju.length" class="note">未见伏吟、反吟、击刑、门迫，盘面平和。</p>
        <div style="margin-top: 14px">
          <h2 style="margin-bottom: 6px">用神细断</h2>
          <select v-model="yscat" style="max-width: 200px" @change="sfx.blip()">
            <option v-for="(_, k) in YS" :key="k" :value="k">{{ k }}</option>
          </select>
          <p class="sub" style="margin-top: 10px">{{ ysVerdict }}</p>
        </div>
        <p class="note" style="margin-top: 8px">
          值符星：{{ pan.zhiFuXing }} · 值使门：{{ pan.zhiShiMen }}。格局仅列最显性的四类，
          三奇得使、玉女守门等吉格需结合用神宫细断。
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
.shen { display: block; font-size: 0.62rem; color: var(--teal); margin-bottom: 2px; }
.shen.zf { color: var(--gold-bright); font-family: var(--cute); }
.xm { display: block; margin-top: 3px; font-size: 0.72rem; color: var(--fg); }
.xm b { color: var(--gold-bright); margin-right: 4px; font-weight: normal; }
</style>
