# 八字研究 · Studio（bazi-studio）

纯浏览器端的八字/紫微量化研究工作台——把 `site/` 里那个单文件简陋版彻底重写：
Vue 3 + Three.js + GSAP，八个页面全部带交互动画、音效与体素建模，数据与引擎公开可审计。

## 页面导览

| 路由 | 页面 | 亮点 |
|---|---|---|
| `/` | 首页 | 星野视差 + 流星 + 像素圣人 PixelSage |
| `/chart` | 排盘评分 | 四柱翻牌、七维雷达、百分位仪表、大运时间轴、离线白话解读、引擎自检 |
| `/ziwei` | 紫微命盘 | 十二宫交互命盘、三方四正评分明细 |
| `/wuxing` | 五行天穹 | Three.js 体素五行建模，公转/拖拽/点击拾取，相生相克连线 |
| `/classics` | 典籍语料 | 七书 × 八大主题密度矩阵、章节检索、逐章主题解剖 |
| `/geju` | 格局辞典 | 49 格局五书互证谱系、书证分布条形、原文节选展开 |
| `/rules` | 规则库 | 古法条文「条件→结论」解剖视图、主题/书名筛选、🎲 抽古法签 |
| `/cases` | 案例库 | 古籍命例四柱卡片（五行着色）、标注层级筛选、多书互证徽章、千里命稿专列 |

全局：光标星屑拖尾、随机流星、WebAudio 音效引擎（翻牌/锣/叮）、页面切换动画。

## 引擎

v5 公开规则评分，权重合计 100：

```
结构22 / 格局20 / 层次10 / 调候16 / 大运联动14 / 紫微三方10 / 神煞8
```

- 百分位基准：2001–2005 出生男命 **21,912 盘**全量池（`public/data/percentiles_*.json`）。
- 一致性：`src/data/__tests__/vectors.test.ts` 用 Python 标准答案回归。
  natal / yinshi 两盘 lk 与 Python 精确对齐；wushi 盘因 lunar_python 与
  lunar-javascript 的起运岁版本漂移允许 ±2 容差，另用 JS 快照锁定当前输出。

## 开发

```bash
npm install
npm run dev       # 本地开发
npm test          # vitest：引擎单测 + Python 向量回归 + 快照
npm run build     # vue-tsc 类型检查 + vite 构建
npm run preview   # 预览 dist
```

## 数据来源

`public/data/` 全部来自仓库上层 `../pipeline/` 的抓取、清洗、标注脚本产物：

- 典籍全文：《滴天髓阐微》《三命通会》《穷通宝鉴》《子平真诠评注》《渊海子平》《神峰通考》《千里命稿》
- 规则库 `rules_clean_v2.json`：条文 → 条件/结论结构化
- 案例库 `classics_master_final.json` / `qianli_cases_v2.json`：命例抽取 + 标注复核 + 多书互证

## 声明

仅供传统文化研究与娱乐参考，不构成人生建议。晚子时（23:00 后）因换日流派争议暂不支持；女命百分位池建设中。MIT License。
