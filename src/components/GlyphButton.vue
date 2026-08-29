<script setup lang="ts">
/** 字符徽章按钮：全站「汉字徽章 + 文案」按钮的统一形态（导航项、模块入口同款）。 */
defineProps<{
  /** 徽章字符，如 ☯ / 八 / 签 */
  glyph: string
  variant?: 'solid' | 'ghost'
}>()
</script>

<template>
  <button class="glyph-btn" :class="variant ?? 'solid'" type="button">
    <i class="g" aria-hidden="true">{{ glyph }}</i>
    <span class="label"><slot /></span>
  </button>
</template>

<style scoped>
.glyph-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: 40px;
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-pill);
  border: 1px solid transparent;
  font-family: var(--cute);
  font-size: var(--fs-sub);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.glyph-btn:active { transform: scale(0.97); }
.glyph-btn .g {
  font-style: normal;
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.78rem;
}
.glyph-btn.solid {
  background: linear-gradient(135deg, var(--btn-a), var(--btn-b));
  color: var(--on-accent);
}
.glyph-btn.solid .g { background: rgba(0, 0, 0, 0.14); }
.glyph-btn.ghost {
  background: transparent;
  border-color: var(--line);
  color: var(--fg);
}
.glyph-btn.ghost .g { background: rgba(var(--acc-rgb), 0.14); color: var(--gold-bright); }
.glyph-btn:hover { border-color: var(--card-glow); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); }
</style>
