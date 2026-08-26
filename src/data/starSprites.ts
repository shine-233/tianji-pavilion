/** 紫微十四主星 · 女道童拟人小像
 * 每尊 12×13 手绘像素：发饰、法器、配色随星性而变，共用一张脸（S 肤 + E 眼）。
 * 网格字符：K 描边 / S 肤 / E 眼 / H 发冠 / R 道袍主色 / D 裙边 / G 金饰 / Y 亮金 / X 法器主色 / x 法器暗部 / W 白 */
import { spritePixels } from './pillarSprites'
import type { Pixel } from './pillarSprites'

export interface StarSprite { pal: Record<string, string>; rows: string[] }

const BASE = {
  K: '#1a1622', S: '#ffe3c9', E: '#2a2440', W: '#f6f1e3', G: '#e8c473', Y: '#ffe3a8',
}

function star(
  hair: string, robe: string, trim: string,
  hairRows: string[], prop: Array<[number, number, string]>, propColor: Record<string, string>,
): StarSprite {
  const rows = [
    ...hairRows,
    '..HSSSSSH...',
    '..SESSSSES..',
    '..SSSSSSSS..',
    '...SYSSYS...',
    '..WRRRRRRW..',
    '.SRRRRRRRRS.',
    '.DRRRRRRRRD.',
    '.DDRRRRRRDD.',
    '..DDDDDDDD..',
    '...DD..DD...',
    '...D....D...',
  ]
  const grid = rows.map((r) => r.split(''))
  prop.forEach(([x, y, ch]) => {
    if (grid[y]) grid[y]![x] = ch
  })
  return {
    pal: { ...BASE, H: hair, R: robe, D: trim, ...propColor },
    rows: grid.map((r) => r.join('')),
  }
}

export const STAR_SPRITES: Record<string, StarSprite> = {
  // 紫微：北辰帝君 —— 高冕垂旒，手捧玉笏
  紫微: star('#6d5ac8', '#8f78d8', '#4c3f96',
    ['...GHHHHG...', '..HHHHHHHH..'],
    [[5, 7, 'W'], [6, 7, 'W'], [5, 8, 'x'], [6, 8, 'x']],
    { x: '#b9a8ef', W: '#efe8ff' }),
  // 天机：智算军师 —— 双鬟插签，持羽扇
  天机: star('#4a7fb8', '#5a94cf', '#31598a',
    ['..H.HHHH.H..', '..HHHHHHHH..'],
    [[10, 7, 'X'], [10, 8, 'X'], [9, 8, 'W'], [10, 9, 'W'], [9, 9, 'x']],
    { X: '#bcd8f2', x: '#7fa8d0' }),
  // 太阳：光明使者 —— 金环耀顶
  太阳: star('#e0913f', '#ef9d55', '#b06a2a',
    ['.Y.GHHHG.Y..', '.YHHHHHHHHY.', '.YYHHHHHHYY.'],
    [],
    {}),
  // 武曲：财帛将军 —— 银甲佩剑
  武曲: star('#aab4c0', '#8d99a8', '#5f6b7a',
    ['..HHHHHHHH..', '..GGGGGGGG..'],
    [[11, 6, 'x'], [11, 7, 'W'], [11, 8, 'W'], [11, 9, 'W'], [11, 10, 'G']],
    { x: '#76828f' }),
  // 天同：福逸散人 —— 抱葫芦
  天同: star('#5f9e6b', '#77b383', '#487752',
    ['...HHHHHH...', '..HHHHHHHH..'],
    [[1, 9, 'X'], [1, 10, 'X'], [1, 11, 'x'], [2, 11, 'G']],
    { X: '#c9a15f', x: '#96733c' }),
  // 廉贞：肃纪官星 —— 方正官帽
  廉贞: star('#a84a52', '#c05a62', '#7c333a',
    ['..HHHHHHHH..', '..HHHHHHHH..', '..G......G..'],
    [[5, 8, 'G'], [6, 8, 'G']],
    {}),
  // 天府：库藏守官 —— 腰悬钱袋
  天府: star('#b8863f', '#caa14f', '#8a6a30',
    ['...HHHHHH...', '..HHGGGGHH..'],
    [[1, 9, 'X'], [2, 10, 'X'], [1, 11, 'X'], [2, 11, 'x']],
    { X: '#d8b46a', x: '#a37f3d' }),
  // 太阴：月华仙子 —— 弯月簪
  太阴: star('#7f95c9', '#93a9dd', '#57689c',
    ['..XX.HH.XX..', '...HHHHHH...'],
    [],
    { X: '#dfe8ff' }),
  // 贪狼：风情才子 —— 鬓插花枝
  贪狼: star('#b0568f', '#c96ba4', '#873d6e',
    ['..XHHHHHH...', '..XHHHHHHHX.'],
    [[10, 9, 'X'], [11, 9, 'X'], [10, 10, 'W']],
    { X: '#f0a6ca' }),
  // 巨门：雄辩之口 —— 展卷陈词
  巨门: star('#5f7a72', '#73958c', '#41564f',
    ['..HHHHHHHH..', '..HHHHHHHH..'],
    [[9, 7, 'W'], [10, 7, 'W'], [9, 8, 'W'], [10, 8, 'W'], [9, 9, 'W'], [10, 9, 'W']],
    {}),
  // 天相：辅弼宰辅 —— 相纱捧笏
  天相: star('#4f8f86', '#63a89e', '#35655e',
    ['..GHHHHHHG..', '..HHHHHHHH..'],
    [[5, 7, 'W'], [6, 7, 'W'], [5, 8, 'x'], [6, 8, 'x']],
    { x: '#a8d4cd' }),
  // 天梁：荫庇长者 —— 高冠扶杖
  天梁: star('#8a6a42', '#a3824f', '#5e4728',
    ['...GHHHHG...', '..HHHHHHHH..'],
    [[0, 6, 'x'], [0, 7, 'x'], [0, 8, 'x'], [0, 9, 'x'], [0, 10, 'x'], [0, 11, 'G']],
    { x: '#96733c' }),
  // 七杀：破阵红缨 —— 立枪而侍
  七杀: star('#9e3c46', '#b8505a', '#6e262e',
    ['..HHHHHHHH.X', '..HHHHHHHH.X', '..HHHHHHHH.x'],
    [[11, 5, 'G'], [11, 6, 'X'], [11, 11, 'x']],
    { X: '#e05a5a', x: '#8f3535' }),
  // 破军：先锧行者 —— 战盔扛斧
  破军: star('#6f6a8f', '#857ea8', '#4a4566',
    ['..HHHHHHHH..', '..GHHHHHHG..'],
    [[11, 6, 'x'], [11, 7, 'W'], [11, 8, 'X'], [11, 9, 'X'], [10, 9, 'x']],
    { X: '#b0aac9', x: '#736d92' }),
}

/** 兜底小仙：辅星借五行小仙风格 */
const FALLBACK = star('#8b93a7', '#98a2b0', '#6b7684', ['...HHHHHH...', '..HHHHHHHH..'], [], {})

export function starSpritePixels(name: string): Pixel[] {
  const def = STAR_SPRITES[name] ?? FALLBACK
  return spritePixels(def)
}

export const MAIN_STAR_NAMES = Object.keys(STAR_SPRITES)
