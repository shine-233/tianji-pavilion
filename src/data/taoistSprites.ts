/**
 * 云鹤观·道姑姐妹 像素画系统
 *
 * 全站吉祥物共用一套「基础人形」，通过 发型层 + 法器层 组合出不同角色，
 * 保证风格统一又各有辨识度。所有颜色都是语义 token（--dg-*），由主题系统换肤。
 *
 * 字符约定（叠加时上层字符覆盖下层，'.' 表示透出下层）：
 *   . 透明   K 描边   S 皮肤   E 眼睛   B 腮红
 *   H 头发   h 头发暗部   G 金饰   V 玉饰   F 发带
 *   R 道袍   r 道袍暗部   W 白滚边/衬里   T 绦带   t 绦带暗部
 *   P 法器主色   p 法器暗部   Q 法器点缀
 */

export const DAOGU_PALETTE: Record<string, string> = {
  K: '--dg-line',
  S: '--dg-skin',
  E: '--dg-eye',
  B: '--dg-blush',
  H: '--dg-hair',
  h: '--dg-hair-dark',
  G: '--dg-gold',
  V: '--dg-jade',
  F: '--dg-ribbon',
  R: '--dg-robe',
  r: '--dg-robe-dark',
  W: '--dg-trim',
  T: '--dg-sash',
  t: '--dg-sash-dark',
  P: '--dg-prop',
  p: '--dg-prop-dark',
  Q: '--dg-prop-lite',
}

/** 基础人形：圆脸道姑，交领广袖道袍。不含发型与法器，头顶以暗发打底防穿帮 */
export const DAOGU_BASE = [
  '..........................',
  '........KKKKKKKK..........',
  '.......KHHHHHHHHHK........',
  '......KHHHHHHHHHHHK.......',
  '......KHSSSSSSSSSHK.......',
  '.....KHSSSSSSSSSSSHK......',
  '.....KSSEESSSSEESSSK......',
  '.....KSSEESSSSEESSSK......',
  '.....KSSSSSSSSSSSSSK......',
  '.....KSBSSSKKSSSBSSK......',
  '......KSSSSKKSSSSSK.......',
  '.......KSSSSSSSSSK........',
  '.......KSSBBBSSSSK........',
  '........KKWWWWKK..........',
  '......KKRWWWWWWRRKK.......',
  '....KRRRWWRRRRWWRRRKK.....',
  '..KKRRRRWWRRRRWWRRRRKK....',
  '.KRRrRRRWWRRRRWWRRRrRRK...',
  '.KRrrRRRWWWWWWWWRRRrrRK...',
  '.KRrRRRTTTTTTTTTTRRrRRK...',
  '.KRrRRTTtTTTTTTtTTRRrRK...',
  '..KRRRRRRRRRRRRRRRRRRK....',
  '..KrRRRRRRRRRRRRRRRRrK....',
  '..KrRRRRRRRRRRRRRRRRrK....',
  '..KrRRRRRRRRRRRRRRRRrK....',
  '...KrRRRRRRRRRRRRRRrK.....',
  '...KrrRRRRRRRRRRRRrrK.....',
  '....KKrrrrrrrrrrrrKK......',
]

/** 发型：双环髻（少女感） */
export const HAIR_SHUANGHUAN = [
  '....KK..............KK....',
  '...KHHHK..........KHHHK...',
  '..KHHHHHK........KHHHHHK..',
  '..KHhhHHHK.KKKK.KHHHhhHK..',
  '..KHHHHHHHKKHHHKKHHHHHHK..',
  '...KKHHHHHHHHHHHHHHHHKK...',
  '.....KHHHHHHHHHHHHHHK.....',
  '......KKHHHHHHHHHHKK......',
]

/** 发型：高髻玉簪（沉静大师姐） */
export const HAIR_GAOJI = [
  '..........KKKKK...........',
  '.........KHHHHHK..........',
  '........KHHhhhHHK.........',
  '........KHGVVVGHK.........',
  '........KHHhVVhHHK........',
  '.......KKHHHHHHHHKK.......',
  '.....KKHHHHHHHHHHHHKK.....',
  '......KKHHHHHHHHHHKK......',
]

/** 发型：半披发缀小铃（活泼小师妹） */
export const HAIR_PIPI = [
  '...........KKKK...........',
  '..........KHHHHK..........',
  '.........KHhhhhHK.........',
  '........KHHHHHHHHK........',
  '.......KHHQHQHQHHHK.......',
  '.....KKHHHHHHHHHHHKK......',
  '....KHHKHHHHHHHHHKHHK.....',
  '...KHHhKKHHHHHHHKKhHHK....',
]

/** 发型：灵官巾束发（执事风，利落） */
export const HAIR_LINGGUAN = [
  '...........KKKK...........',
  '..........KHHHHK..........',
  '.........KHHHHHHK.........',
  '........KHHhhhhHHK........',
  '........KKFFFFFFKK........',
  '.......KHHHHHHHHHHK.......',
  '......KFHHHHHHHHHHFK......',
  '.......KKFHHHHHHFKK.......',
]

/** 法器：拂尘（右手斜倚，红穗白丝） */
export const PROP_FUCHEN = [
  '......................KPQ.',
  '.....................KPPQ.',
  '.....................KPK..',
  '....................KPQK..',
  '....................KPK...',
  '...................KpQK...',
  '...................KpK....',
  '..................KppK....',
  '..................KpK.....',
  '.................KppK.....',
  '.................KpK......',
  '................KppK......',
  '................KpK.......',
]

/** 法器：一串铜钱（双手捧在身前） */
export const PROP_TONGQIAN = [
  '.........KKKKKKKK.........',
  '........KGQGGQGGQGK.......',
  '........KGGGGGGGGGK.......',
  '.........KGGGGGGGK........',
  '..........KKKKKKK.........',
]

/** 法器：签筒（抱在左臂弯，内有签支） */
export const PROP_QIANTONG = [
  '.KKPPK....................',
  '.KQPQPK...................',
  '.KQPQPK...................',
  '.KPpPPK...................',
  '.KPpPPK...................',
  '.KPpPPK...................',
  '.KPPPPK...................',
  '.KKKKKK...................',
]

/** 法器：罗盘（托在双掌） */
export const PROP_LUOPAN = [
  '........KKKKKKKK..........',
  '.......KGRRRRRRRGK........',
  '.......KGRQQRQQRGK........',
  '.......KGRRRVVRRRGK.......',
  '.......KGRRRQRQRRGK.......',
  '.......KGGGGGGGGGGK.......',
]

/** 法器：书卷（夹在腋下的古籍） */
export const PROP_SHIJUAN = [
  '.KWWWWK...................',
  '.KWPPWK...................',
  '.KWPPWK...................',
  '.KWPPWK...................',
  '.KWWWWK...................',
]

/** 法器：小葫芦（腰间挂） */
export const PROP_HULU = [
  '..........KPK.............',
  '.........KPPK.............',
  '.........KPPK.............',
  '........KQPPQK............',
  '........KPPPPK............',
  '........KpPPpK............',
  '.........KKKK.............',
]

export type DaoguVariant = {
  id: string
  nameCn: string
  title: string
  hair: string[]
  prop?: string[]
  /** 发带络子色：--dg-ribbon-N */
  ribbonN: number
}

/** 云鹤观六位道姑师姐妹：同一套道袍制式，靠发型、法器、络子区分 */
export const DAOGU_VARIANTS: DaoguVariant[] = [
  { id: 'xuanwei', nameCn: '玄微', title: '掌坛 · 拂尘', hair: HAIR_GAOJI, prop: PROP_FUCHEN, ribbonN: 1 },
  { id: 'lingqian', nameCn: '灵签', title: '司签 · 签筒', hair: HAIR_SHUANGHUAN, prop: PROP_QIANTONG, ribbonN: 2 },
  { id: 'suwen', nameCn: '素问', title: '摇卦 · 铜钱', hair: HAIR_PIPI, prop: PROP_TONGQIAN, ribbonN: 3 },
  { id: 'shuying', nameCn: '疏影', title: '梅花 · 罗盘', hair: HAIR_PIPI, prop: PROP_HULU, ribbonN: 4 },
  { id: 'sili', nameCn: '司历', title: '执历 · 黄卷', hair: HAIR_LINGGUAN, prop: PROP_SHIJUAN, ribbonN: 5 },
  { id: 'xuanji', nameCn: '璇玑', title: '观星 · 罗盘', hair: HAIR_GAOJI, prop: PROP_LUOPAN, ribbonN: 6 },
]

export function getVariant(id: string): DaoguVariant {
  return DAOGU_VARIANTS.find((v) => v.id === id) ?? DAOGU_VARIANTS[0]
}

function layer(base: string[], over: string[], rawDy: number): string[] {
  let dy = rawDy
  let rows = [...base]
  if (dy < 0) {
    rows = [...Array.from({ length: -dy }, () => ''), ...rows]
    dy = 0
  }
  over.forEach((line, i) => {
    const y = i + dy
    while (rows.length <= y) rows.push('')
    const chars = rows[y].padEnd(Math.max(rows[y].length, line.length), '.').split('')
    line.split('').forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return
      chars[x] = ch
    })
    rows[y] = chars.join('')
  })
  return rows
}

/** 发型锚点：叠在基础图上方（负数表示向上扩展），-7 使发底与颅顶无缝衔接 */
const HAIR_DY = -7

/** 各法器在合成后坐标系里的纵向锚点 */
function propAnchor(v: DaoguVariant): number {
  switch (v.prop) {
    case PROP_FUCHEN:
      return 10 // 从鬓角旁垂到袖口
    case PROP_TONGQIAN:
      return 18
    case PROP_QIANTONG:
      return 17
    case PROP_LUOPAN:
      return 18
    case PROP_SHIJUAN:
      return 17
    case PROP_HULU:
      return 19
    default:
      return 18
  }
}

/** 合成完整精灵图（字符串矩阵） */
export function composeDaogu(variant: DaoguVariant): string[] {
  let rows = layer(DAOGU_BASE, variant.hair, HAIR_DY)
  if (variant.prop) {
    rows = layer(rows, variant.prop, propAnchor(variant))
  }
  return rows
}

export interface DaoguPixel {
  x: number
  y: number
  token: string
  varName: string
  isEye: boolean
}

/** 展开成可渲染像素列表；fill 是 CSS 变量名，随主题实时换肤 */
export function daoguPixels(variant: DaoguVariant): DaoguPixel[] {
  const composed = composeDaogu(variant)
  const cols = Math.max(...composed.map((r) => r.length))
  const out: DaoguPixel[] = []
  composed.forEach((row, y) => {
    row.padEnd(cols, '.').split('').forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return
      const varName = DAOGU_PALETTE[ch]
      if (!varName) return
      out.push({ x, y, token: ch, varName: ch === 'F' ? `--dg-ribbon-${variant.ribbonN}` : varName, isEye: ch === 'E' })
    })
  })
  return out
}

/** 供 three.js 体素化使用 */
export function daoguGrid(variant: DaoguVariant): { cells: Array<{ x: number; y: number; token: string }>; rows: number; cols: number } {
  const composed = composeDaogu(variant)
  const cols = Math.max(...composed.map((r) => r.length))
  const cells: Array<{ x: number; y: number; token: string }> = []
  composed.forEach((row, y) => {
    row.padEnd(cols, '.').split('').forEach((ch, x) => {
      if (ch !== '.' && ch !== ' ') cells.push({ x, y, token: ch })
    })
  })
  return { cells, rows: composed.length, cols }
}
