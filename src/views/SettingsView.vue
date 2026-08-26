<script setup lang="ts">
import { ref } from 'vue'
import { applyTheme, THEMES, currentThemeId } from '../lib/themes'
import { isSoundOn, sfx, toggleSound } from '../lib/sfx'
import { clearHistory } from '../lib/history'
import { clearRecords, loadRecords } from '../lib/records'
import TaoistMaiden from '../components/TaoistMaiden.vue'

const current = ref(currentThemeId())
const soundOn = ref(isSoundOn())
const recordCount = ref(loadRecords().length)
const cleared = ref(false)

function pick(id: string): void {
  current.value = applyTheme(id)
  sfx.ding()
}

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

function doClear(): void {
  if (!window.confirm('确定清空全部占卜记录？这一步没法撤销。')) return
  clearRecords()
  clearHistory()
  recordCount.value = 0
  cleared.value = true
  window.setTimeout(() => (cleared.value = false), 2200)
}
</script>

<template>
  <main class="page">
    <h1>设置</h1>
    <p class="sub">换一身衣裳，或者清一清账本。所有偏好都存在你自己浏览器里，不上传任何东西。</p>

    <section v-reveal="0" class="card">
      <h2>衣橱 · 七套主题</h2>
      <p class="note wardrobe-note">每一套都是整体设计：界面配色、道姑姐妹的道袍、绦子颜色一起换，不会出现混搭的脏色。</p>
      <div class="wardrobe">
        <button
          v-for="t in THEMES"
          :key="t.id"
          class="skin"
          :class="{ active: current === t.id }"
          :style="{ '--pv-bg': t.preview.bg, '--pv-accent': t.preview.accent, '--pv-robe': t.preview.robe, '--pv-hair': t.preview.hair }"
          @click="pick(t.id)"
        >
          <span class="swatches">
            <i class="sw bg"></i><i class="sw accent"></i><i class="sw robe"></i><i class="sw hair"></i>
          </span>
          <b>{{ t.name }}</b>
          <small>{{ t.motto }}</small>
          <span v-if="current === t.id" class="on">穿着中</span>
        </button>
      </div>

      <div class="preview-row">
        <TaoistMaiden variant="xuanwei" :width="120" chatty :idle-sec="0" :tips="['这件袍子随主题一起换色，你看。']" />
        <TaoistMaiden variant="lingqian" :width="100" chatty :idle-sec="0" :tips="['师姐我们又在试新衣啦。']" />
        <div class="preview-note note">
          道姑姐妹的道袍制式是统一的，换主题时整套跟着变。
          玄微掌坛穿高髻玉簪配拂尘，灵签抱签筒——发型和法器区分人物，配色永远是「同门」。
        </div>
      </div>
    </section>

    <section v-reveal="100" class="card">
      <h2>声音与记录</h2>
      <div class="row-actions">
        <button class="ghost" @click="onToggleSound">{{ soundOn ? '🔊 音效已开' : '🔇 音效已关' }}</button>
        <button class="ghost danger" @click="doClear">🗑 清空全部占卜记录（{{ recordCount }} 条）</button>
        <transition name="pop">
          <span v-if="cleared" class="tag teal">已清空</span>
        </transition>
      </div>
      <p class="note">占卜记录只写在你这台电脑的浏览器里（localStorage），清了就是真没了。</p>
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
.sw.hair { background: var(--pv-hair); }
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

.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.8); }

.about-text { max-width: 720px; }
.wardrobe-note { margin-top: -4px; }
</style>
