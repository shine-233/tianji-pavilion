<script setup lang="ts">
import { computed, ref } from 'vue'
import { applyTheme, THEMES, themeId } from '../data/themes'
import { isSoundOn, sfx, toggleSound } from '../lib/sfx'
import { clearHistory } from '../lib/history'
import { clearRecords, loadRecords } from '../lib/records'

const current = themeId
const soundOn = ref(isSoundOn())
const records = ref(loadRecords())
const cleared = ref(false)

const KIND_META: Record<string, { icon: string; label: string }> = {
  liuyao: { icon: '🪙', label: '六爻' },
  meihua: { icon: '❄', label: '梅花' },
  sign: { icon: '🎋', label: '灵签' },
}

function fmtTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 最近在前面，最多展示 12 条 */
const recent = computed(() => records.value.slice(0, 12))

function refresh(): void {
  records.value = loadRecords()
}

function pick(id: string): void {
  applyTheme(id)
  sfx.ding()
}

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

const confirmArm = ref(false)
let armTimer: number | null = null

/** 两段式确认代替原生 confirm：第一下进入待发状态，3 秒内再点才真清 */
function doClear(): void {
  if (!confirmArm.value) {
    confirmArm.value = true
    sfx.tick()
    if (armTimer !== null) window.clearTimeout(armTimer)
    armTimer = window.setTimeout(() => (confirmArm.value = false), 3000)
    return
  }
  if (armTimer !== null) window.clearTimeout(armTimer)
  confirmArm.value = false
  clearRecords()
  clearHistory()
  refresh()
  cleared.value = true
  sfx.gong()
  window.setTimeout(() => (cleared.value = false), 2200)
}
</script>

<template>
  <main class="page">
    <h1>设置</h1>
    <p class="sub">换一身衣裳，或者清一清账本。所有偏好都存在你自己浏览器里，不上传任何东西。</p>

    <section v-reveal="0" class="card">
      <h2>衣橱 · 六套主题</h2>
      <p class="note wardrobe-note">每套主题都是一件整体设计：界面配色、环境装置、牌背纹样、道长的道袍一起换，不会混出脏色。</p>
      <div class="wardrobe">
        <button
          v-for="t in THEMES"
          :key="t.id"
          class="skin"
          :class="{ active: current === t.id }"
          :style="{ '--pv-bg': t.swatch[0], '--pv-accent': t.swatch[1], '--pv-robe': t.swatch[2] }"
          @click="pick(t.id)"
        >
          <span class="swatches">
            <i class="sw bg"></i><i class="sw accent"></i><i class="sw robe"></i>
          </span>
          <b>{{ t.nameCn }}</b>
          <small>{{ t.note }}</small>
          <span v-if="current === t.id" class="on">穿着中</span>
        </button>
      </div>

      <div class="preview-row">
        <div class="preview-note note">
          十位道长各有发型、法器与道袍色，进「道长图鉴」可以逐个点过去看；
          换主题时他们的袍子颜色也跟着整套变。
        </div>
      </div>
    </section>

    <section v-reveal="100" class="card">
      <h2>占卜手账 · {{ records.length }} 条</h2>
      <div v-if="records.length === 0" class="sub empty-line">
        手账还是空的。去摇一卦、抽支签，回来就有得翻了。
      </div>
      <ul v-else class="ledger">
        <li v-for="r in recent" :key="r.ts" class="ledger-row" :style="{ '--i': 0 }">
          <span class="lg-icon">{{ KIND_META[r.kind]?.icon ?? '☯' }}</span>
          <span class="lg-main">
            <b>{{ r.title }}</b>
            <small>{{ r.detail }}</small>
          </span>
          <span class="lg-time">{{ fmtTime(r.ts) }}</span>
        </li>
      </ul>
      <div class="row-actions" style="margin-top: 12px">
        <button class="ghost" @click="onToggleSound">{{ soundOn ? '🔊 音效已开' : '🔇 音效已关' }}</button>
        <button class="ghost danger" :class="{ armed: confirmArm }" @click="doClear">
          {{ confirmArm ? '⚠ 再点一次，真的清空（3秒内）' : '🗑 清空全部记录' }}
        </button>
        <transition name="pop">
          <span v-if="cleared" class="tag teal">已清空</span>
        </transition>
      </div>
      <p class="note">手账只写在这台电脑的浏览器里（localStorage），清了就是真没了。</p>
    </section>

    <section v-reveal="180" class="card">
      <h2>关于这座观</h2>
      <p class="sub about-text">
        云鹤观是一座虚构的线上小道观，供各位把玩八字、紫微、六爻、梅花这些老玩意儿。
        排盘评分引擎按公开规则计算，测试用例与 Python 版对齐；断语部分是把传统口诀翻译成白话，
        娱乐为主，别拿它替你做人生决定。数据不出你的浏览器，放心玩。
      </p>
    </section>
  </main>
</template>

<style scoped>
.wardrobe {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 12px;
  margin-top: 14px;
}
.skin {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  text-align: left;
  background: var(--card-2);
  border: 1.5px solid var(--line);
  border-radius: 13px;
  padding: 14px;
  cursor: pointer;
  color: var(--fg);
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.skin:hover { transform: translateY(-4px); border-color: var(--pv-accent); }
.skin.active { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(232, 196, 115, 0.18), 0 10px 24px rgba(0, 0, 0, 0.3); }
.swatches { display: flex; gap: 6px; }
.sw { width: 20px; height: 20px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.18); animation: sw-in 0.4s ease both; }
.sw:nth-child(2) { animation-delay: 0.06s; }
.sw:nth-child(3) { animation-delay: 0.12s; }
.sw:nth-child(4) { animation-delay: 0.18s; }
@keyframes sw-in { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: none; } }
.sw.bg { background: var(--pv-bg); }
.sw.accent { background: var(--pv-accent); }
.sw.robe { background: var(--pv-robe); }
.skin b { font-family: var(--cute); font-size: 0.98rem; }
.skin small { font-size: 0.72rem; color: var(--dim); line-height: 1.5; }
.on {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.68rem;
  font-family: var(--cute);
  color: #201804;
  background: linear-gradient(140deg, var(--btn-a), var(--btn-b));
  padding: 2px 9px;
  border-radius: 999px;
}

.preview-row {
  margin-top: 18px;
  padding: 16px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed var(--line);
  display: flex;
  align-items: flex-end;
  gap: 18px;
  flex-wrap: wrap;
}
.preview-note { flex: 1; min-width: 220px; }

.row-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.danger:hover { border-color: var(--red); color: var(--red); }
.danger.armed {
  border-color: var(--red);
  color: var(--red);
  background: rgba(var(--red-rgb), 0.1);
  animation: arm-shake 0.4s ease;
}
@keyframes arm-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.ledger { list-style: none; display: flex; flex-direction: column; gap: 7px; }
.ledger-row {
  display: grid;
  grid-template-columns: 2em 1fr auto;
  align-items: baseline;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 10px;
  background: rgba(127, 127, 127, 0.05);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.ledger-row:hover { border-color: var(--card-glow); transform: translateX(4px); }
.lg-icon { font-size: 1.1rem; }
.lg-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lg-main b { font-family: var(--cute); font-weight: normal; font-size: 0.92rem; }
.lg-main small { color: var(--dim); font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lg-time { color: var(--dim); font-size: 0.72rem; white-space: nowrap; }
.empty-line { padding: 8px 0; }

.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.8); }

.about-text { max-width: 720px; }
.wardrobe-note { margin-top: -4px; }

/* 窄屏：时间戳挪到标题下面，别跟长标题挤一行 */
@media (max-width: 560px) {
  .ledger-row { grid-template-columns: 2em 1fr; row-gap: 2px; }
  .lg-time { grid-column: 2; white-space: normal; }
  .skin { padding: 11px; }
}
</style>
