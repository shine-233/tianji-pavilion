# DESIGN.md · 天机阁前端设计系统

> 2026-08-28 前端审计后建立。颜色令牌沿用 `global.css` 的 6 套主题变量；本文件记录尺度令牌、共享组件与迁移约定。
> 审计结论：不换架构，渐进收敛。新页面一律走共享组件；旧页面改动时顺手迁移。

## 模式（Modes）

- **Operate** 为主：排盘/问卦是"完成任务"型工具页，可扫读、一致、低装饰优先。
- 首页 `/` 是 **Persuade**：卖的是"命理可以被量化复核"这件事本身。
- `/classics` `/geju` `/rules` `/cases` 是 **Read**：为理解而排版，长文行宽 45–75 字。

## 颜色（`src/styles/global.css`）

- `--fg` 正文 / `--dim` 次要文字 / `--card` 卡片面：**任意组合 ≥ 4.5:1（WCAG AA）**。改主题时跑 `bazi-audit/contrast-check.cjs` 复核。
- 五行色 `--wood/fire/earth/metal/water` 是全站唯一的分类色系，同一含义永远同色。
- 深色主题文字禁用纯白（`--fg` 各主题已定为暖白/米白）。

## 尺度（`src/styles/tokens.css`）

- 间距：`--sp-1..8`（4px 基），只取档位不写裸值。
- 字号：`--fs-display/h2/body/sub/note`；正文最小 16px，`--fs-note` 只作短注。
- 圆角：`--r-sm/md/lg/pill`。

## 共享组件（`src/components/`）

| 组件 | 用途 | 替代的旧写法 |
|---|---|---|
| `PageShell` | `<main class="page">` + 可选 h1/导语 | 每个视图手写 main 开场 |
| `SectionCard` | `.card` + 可选 h2 + 自带 v-reveal 延迟 | 手写 `<div class="card" v-reveal="60"><h2>` |
| `GlyphButton` | 汉字徽章 + 文案的按钮（solid/ghost） | 手写徽章按钮 |
| `StatBar` | 标签 + 数值条 + 读数 | 各页手搓分数条 |

已迁移示范：`ShuziView`。其余 21 个视图按"改动即迁移"推进，不强制一次性重写。

## 交互约定

- 路由过渡：`App.vue` 的 `<transition>` 带 `:duration` 兜底（后台标签页节流时不会卡视图），**别删**。
- 入场 reveal：`v-reveal` 有 1.4s 强制可见兜底；新组件用 `SectionCard` 即可继承。
- 音效、磁吸、tilt 已按触屏/减少动效偏好自动降级；新增循环动画必须套 `@media (prefers-reduced-motion: reduce)` 关闭（`global.css` 底部有全局兜底规则）。
- 键盘焦点：全局 `:focus-visible` 金色描边已启用，不要再写 `outline: none` 不加替代。

## 内容诚实约定（本站卖点，勿破坏）

- 任何展示数字（评分/百分位/统计）必须与数据源同义：`percentile()` 返回"击败池中百分比"，文案两侧数字必须同源。
- 展示引擎局限（晚子时/女命池/真太阳时）的免责条保留。
- 分享卡只放可复核的信息（四柱/命宫/总分/四化），不放没有数据支撑的断言。
