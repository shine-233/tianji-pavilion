/** 全站皮肤：每套主题的变量在 global.css 中成套定义，内部色板自洽 */
import { ref } from 'vue'

export interface ThemeDef {
  id: string
  nameCn: string
  note: string
  /** 主题选择器里的小色卡（主底 / 强调 / 辅助） */
  swatch: [string, string, string]
}

export const THEMES: ThemeDef[] = [
  { id: 'xuan', nameCn: '玄夜鎏金', note: '深夜观星，烛火鎏金', swatch: ['#10131c', '#e8c473', '#5eead4'] },
  { id: 'yue', nameCn: '月白道袍', note: '月白如洗，黛青入鬓', swatch: ['#eef1f4', '#3a6ea5', '#c25b4e'] },
  { id: 'zhu', nameCn: '朱砂符箓', note: '朱砂入纸，符火通明', swatch: ['#221012', '#ff7a5c', '#f2c94c'] },
  { id: 'shui', nameCn: '松烟水墨', note: '松烟落纸，远山淡墨', swatch: ['#eceae2', '#4a5568', '#7a9e9f'] },
  { id: 'zi', nameCn: '紫霄星穹', note: '紫霄之上，星辰低垂', swatch: ['#130f22', '#c9b0ff', '#7de8c3'] },
  { id: 'qing', nameCn: '青梅烟雨', note: '青梅煮酒，烟雨江南', swatch: ['#0f1a13', '#ffd76e', '#9fd8bb'] },
]

const KEY = 'bs-theme'

/** 响应式主题 id：像素组件（牌背/吉祥物）据此联动换色 */
export const themeId = ref('xuan')

/** 像素资产的主题化配色：R 道袍主色 · D 辅色 · Y 饰金 */
export const THEME_SPRITE_PALS: Record<string, { R: string; D: string; Y: string }> = {
  xuan: { R: '#e8c473', D: '#5eead4', Y: '#ffe3a8' },
  yue: { R: '#3a6ea5', D: '#c25b4e', Y: '#2d5a8a' },
  zhu: { R: '#ff7a5c', D: '#f2c94c', Y: '#ffb08c' },
  shui: { R: '#4a5568', D: '#7a9e9f', Y: '#333d4d' },
  zi: { R: '#c9b0ff', D: '#7de8c3', Y: '#e4d6ff' },
  qing: { R: '#ffd76e', D: '#9fd8bb', Y: '#ffe9a8' },
}

export function currentTheme(): string {
  try {
    const t = localStorage.getItem(KEY)
    return THEMES.some((x) => x.id === t) ? t! : 'xuan'
  } catch {
    return 'xuan'
  }
}

export function applyTheme(id: string): void {
  if (!THEMES.some((x) => x.id === id)) return
  themeId.value = id
  document.documentElement.dataset.theme = id
  try {
    localStorage.setItem(KEY, id)
  } catch { /* noop */ }
}

export function initTheme(): string {
  const t = currentTheme()
  themeId.value = t
  document.documentElement.dataset.theme = t
  return t
}
