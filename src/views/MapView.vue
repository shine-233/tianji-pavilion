<script setup lang="ts">
/** 道观地图：把全站功能串成一座观，点哪进哪殿 */
import { useRouter } from 'vue-router'
import { sfx } from '../lib/sfx'
import { vReveal } from '../lib/reveal'

const router = useRouter()

interface Hall { to: string; label: string; glyph: string; line: string }
const GROUPS: Array<{ name: string; halls: Hall[] }> = [
  {
    name: '前殿 · 算命问事',
    halls: [
      { to: '/chart', label: '八字排盘', glyph: '八', line: '四柱翻牌，七维评分' },
      { to: '/ziwei', label: '紫微命盘', glyph: '紫', line: '十二宫与星空盘' },
      { to: '/liuyao', label: '六爻纳甲', glyph: '爻', line: '摇铜钱装卦，附卦库' },
      { to: '/meihua', label: '梅花易数', glyph: '梅', line: '时间起卦，体用生克' },
      { to: '/shuzi', label: '数字能量', glyph: '数', line: '号码起卦，梅花新玩' },
    ],
  },
  {
    name: '偏殿 · 每日速占',
    halls: [
      { to: '/daily', label: '每日一签', glyph: '签', line: '签筒摇签，六十支池' },
      { to: '/jiaobei', label: '杯筊问事', glyph: '筊', line: '掷筊问允否，三圣为凭' },
      { to: '/xiaoliuren', label: '小六壬', glyph: '掌', line: '掐指一算，速断小事' },
      { to: '/almanac', label: '今日黄历', glyph: '历', line: '十二时辰黄黑道' },
    ],
  },
  {
    name: '后山 · 观星演道',
    halls: [
      { to: '/wuxing', label: '五行天穹', glyph: '五', line: '体素五行，拖拽环游' },
      { to: '/qimen', label: '奇门入门盘', glyph: '奇', line: '定局布仪，旬空驿马' },
      { to: '/yanyi', label: '演易长卷', glyph: '䷀', line: '从无极到六十四卦' },
      { to: '/sages', label: '道长图鉴', glyph: '鉴', line: '十位当值道长在此' },
      { to: '/memory', label: '卦象记忆', glyph: '忆', line: '翻牌配对记八卦' },
      { to: '/story', label: '易道长卷', glyph: '易', line: '滚动叙事，六幕演进' },
    ],
  },
  {
    name: '藏经阁 · 资料库',
    halls: [
      { to: '/classics', label: '典籍语料', glyph: '卷', line: '七部古书主题密度' },
      { to: '/geju', label: '格局辞典', glyph: '格', line: '49 格局五书互证' },
      { to: '/rules', label: '规则库', glyph: '规', line: '799 条规则可审计' },
      { to: '/cases', label: '案例库', glyph: '案', line: '两千余例按信度筛' },
      { to: '/settings', label: '客舍', glyph: '舍', line: '皮肤偏好与记录管理' },
    ],
  },
]

function go(to: string): void {
  const g = GUIDE[to]
  if (g) window.dispatchEvent(new CustomEvent('sage-say', { detail: `${g.who}：「${g.line}」` }))
  sfx.ding()
  router.push(to)
}

/** 各殿当值道长的引路话——跨路由也听得见，角标那位会替她捎到 */
const GUIDE: Record<string, { who: string; line: string }> = {
  '/chart': { who: '丹霞', line: '客官里边请，罗盘都替你擦亮了。' },
  '/ziwei': { who: '星阑', line: '今夜星空刚归位，就差点灯人了。' },
  '/liuyao': { who: '灵蓍', line: '铜钱洗净了，想问什么，摇之前先想清楚。' },
  '/meihua': { who: '灵蓍', line: '梅花一枝，时间起卦，最快的一课。' },
  '/daily': { who: '梅雪', line: '签筒抱来了——一支就好，不许偷看下一支。' },
  '/jiaobei': { who: '梅雪', line: '筊杯掷得响，答案掷得准。允不允，问了才算。' },
  '/xiaoliuren': { who: '灵蓍', line: '大安留连速喜，掐指便知，小事别排盘。' },
  '/almanac': { who: '素问', line: '今日五行穿什么颜色、哪个时辰行事，历上都写着。' },
  '/shuzi': { who: '灵蓍', line: '一串数字也能起卦，手机号生日都使得。' },
  '/wuxing': { who: '素问', line: '五行天穹开着，进去转一圈，比背口诀快。' },
  '/qimen': { who: '丹霞', line: '奇门地基刚打好，先看定局布仪，别急着上天盘。' },
  '/yanyi': { who: '星阑', line: '从无极滚到六十四卦，一路往下看就是一部易学史。' },
  '/sages': { who: '青玄', line: '观里上下十位都在图鉴里，去挑个投缘的说话。' },
  '/memory': { who: '青玄', line: '翻牌配对玩两局，八卦长相就刻进脑子了。' },
  '/story': { who: '云笈', line: '易道长卷铺开了，慢慢往下滚，六幕一路看到底。' },
  '/classics': { who: '云笈', line: '藏经阁七部古书都在架上，我扫了这么久的地，随你翻。' },
  '/geju': { who: '霜华', line: '四十九族格局谱系，个个来路清白，尽管查。' },
  '/rules': { who: '守拙', line: '七百九十九条规则码得整整齐齐，欢迎挑刺。' },
  '/cases': { who: '拾遗', line: '两千多个命例落着灰，提灯给你照着挑。' },
  '/settings': { who: '青玄', line: '衣房在客舍里，六套道袍随主题换，慢慢挑。' },
}
</script>

<template>
  <main class="page">
    <div class="card" v-reveal>
      <h2>道观地图 · 一图通全观</h2>
      <p class="sub">二十进殿宇按功能分了四路。初来客官从前殿走起；老香客直接奔后山。</p>
    </div>
    <section v-for="(g, gi) in GROUPS" :key="g.name" v-reveal="gi * 60" class="zone">
      <h2>{{ g.name }}</h2>
      <div class="hall-grid">
        <button v-for="h in g.halls" :key="h.to" class="hall" @click="go(h.to)" @mouseenter="sfx.tick()">
          <span class="h-glyph">{{ h.glyph }}</span>
          <span class="h-label">{{ h.label }}</span>
          <span class="h-line">{{ h.line }}</span>
          <i class="h-arrow">→</i>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.zone { margin-bottom: 20px; }
.hall-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.hall {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: linear-gradient(160deg, var(--card-2), var(--card));
  color: var(--fg);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.22s ease;
}
.hall:hover { transform: translateY(-4px); border-color: rgba(var(--acc-rgb), 0.5); }
.h-glyph { font-size: 1.45rem; transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.hall:hover .h-glyph { transform: scale(1.2) rotate(-8deg); }
.h-label { font-family: var(--cute); font-size: 1rem; color: var(--gold-bright); }
.h-line { font-size: 0.7rem; color: var(--dim); }
.h-arrow {
  position: absolute;
  right: 14px;
  bottom: 12px;
  font-style: normal;
  color: var(--teal);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hall:hover .h-arrow { opacity: 1; transform: translateX(3px); }
</style>
