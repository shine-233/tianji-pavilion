/** 女道士吉祥物家族：同一套像素骨架，十位角色靠道袍配色与手持法器区分 */

export const TAO_PALETTE: Record<string, string> = {
  K: '#241f31',
  H: '#34294a',
  h: '#4a3d68',
  G: '#e8c473',
  S: '#ffe3c9',
  E: '#2a2440',
  B: '#f5a8a0',
  R: '#74b09c',
  D: '#4c8573',
  Y: '#e8c473',
  W: '#f6f1e3',
  O: '#8a5a3b',
  P: '#caa14f',
  Q: '#fff6ec',
}

/** 主骨架：高髻道冠 + 广袖道袍 + 束腰长裙 */
export const TAO_BASE_SPRITE = [
  '..........KKK..........',
  '.........KHHHK.........',
  '.........KhGhK.........',
  '..........KGK..........',
  '........KHHHHHK........',
  '.......KHHHHHHHK.......',
  '......KHHHHHHHHHK......',
  '....KKHHHHHHHHHHHKK....',
  '...KHHHHHHHHHHHHHHHK...',
  '..KHHHHHHHHHHHHHHHHHK..',
  '...KHHSSSSSSSSSSSHHK...',
  '...KHSSSSSSSSSSSSSHK...',
  '...KHSSESSSSSSSESSHK...',
  '...KHSSSSSSSSSSSSSHK...',
  '...KHSBSSSSSSSSSBSHK...',
  '.....KSSSSSKKSSSSSK....',
  '.....KWRRRRRRRRWK.....',
  '....KSWRRRWWRRRWSK....',
  '....KDRRRWWWWRRRDK....',
  '.....KDRRWWWWRRDK.....',
  '.....KDRYYYYYYRDK.....',
  '....KDRRRRRRRRRRDK....',
  '...KDRRRRRRRRRRRRDK...',
  '...KDDRRRRRRRRRRDDK...',
  '.....KDDRRRRRRDDK.....',
  '.....KOOK..KOOK........',
  '.....KKKK..KKKK........',
]

/** 法器浮层：[x, y, 字母]，叠加在主骨架上 */
export type PropOverlay = Array<[number, number, string]>

export const TAO_PROPS: Record<string, PropOverlay> = {
  whisk: [
    [20, 9, 'Q'], [20, 10, 'Q'], [19, 10, 'Q'], [20, 11, 'Q'], [19, 11, 'Q'], [20, 12, 'Q'],
    [19, 13, 'P'], [20, 13, 'P'], [19, 14, 'P'], [20, 14, 'P'], [19, 15, 'P'], [19, 16, 'P'],
    [19, 17, 'P'], [19, 18, 'P'],
  ],
  luopan: [
    [8, 17, 'P'], [9, 16, 'P'], [10, 16, 'P'], [11, 16, 'P'], [12, 16, 'P'], [13, 17, 'P'],
    [8, 18, 'P'], [13, 18, 'P'], [8, 19, 'P'], [9, 20, 'P'], [10, 20, 'P'], [11, 20, 'P'],
    [12, 20, 'P'], [13, 19, 'P'], [10, 18, 'Q'], [11, 18, 'G'], [12, 18, 'Q'],
  ],
  scrollStars: [
    [7, 17, 'P'], [14, 17, 'P'], [8, 17, 'Q'], [9, 17, 'G'], [10, 17, 'Q'], [11, 17, 'G'],
    [12, 17, 'Q'], [13, 17, 'Q'], [7, 18, 'P'], [14, 18, 'P'], [8, 18, 'Q'], [9, 18, 'Q'],
    [10, 18, 'G'], [11, 18, 'Q'], [12, 18, 'Q'], [13, 18, 'Q'],
  ],
  taiji: [
    [10, 16, 'Q'], [11, 16, 'Q'], [12, 16, 'Q'], [9, 17, 'Q'], [10, 17, 'K'], [11, 17, 'Q'],
    [12, 17, 'K'], [13, 17, 'Q'], [9, 18, 'K'], [10, 18, 'Q'], [11, 18, 'K'], [12, 18, 'Q'],
    [10, 19, 'Q'], [11, 19, 'Q'], [12, 19, 'Q'],
  ],
  scripture: [
    [8, 17, 'Q'], [9, 16, 'P'], [10, 16, 'P'], [11, 16, 'P'], [12, 16, 'P'],
    [8, 18, 'P'], [9, 17, 'Q'], [10, 17, 'Q'], [11, 17, 'Q'], [12, 17, 'Q'],
    [9, 18, 'P'], [10, 18, 'P'], [11, 18, 'P'], [12, 18, 'P'],
  ],
  sword: [
    [3, 11, 'Q'], [4, 12, 'Q'], [4, 11, 'Q'], [5, 13, 'Q'], [5, 12, 'Q'], [6, 14, 'Q'],
    [6, 13, 'Q'], [7, 15, 'G'], [6, 16, 'G'], [7, 16, 'P'], [5, 17, 'P'], [4, 18, 'P'],
  ],
  ruler: [
    [6, 14, 'P'], [6, 15, 'P'], [6, 16, 'Q'], [6, 17, 'P'], [6, 18, 'P'], [6, 19, 'P'],
    [6, 20, 'P'], [6, 21, 'P'],
  ],
  lantern: [
    [20, 13, 'P'], [19, 14, 'P'], [20, 14, 'G'], [21, 14, 'P'], [19, 15, 'P'], [20, 15, 'G'],
    [21, 15, 'P'], [19, 16, 'P'], [20, 16, 'G'], [21, 16, 'P'], [20, 17, 'P'],
  ],
  coins: [
    [19, 13, 'G'], [20, 13, 'Q'], [19, 14, 'G'], [20, 14, 'Q'], [20, 15, 'G'],
    [18, 16, 'G'], [19, 16, 'Q'], [19, 17, 'G'], [20, 17, 'Q'], [19, 18, 'G'],
  ],
  stickpot: [
    [9, 14, 'Q'], [10, 14, 'Q'], [11, 14, 'Q'], [12, 14, 'Q'], [9, 15, 'Q'], [11, 15, 'Q'],
    [8, 16, 'P'], [9, 16, 'P'], [10, 16, 'P'], [11, 16, 'P'], [12, 16, 'P'], [13, 16, 'P'],
    [8, 17, 'P'], [13, 17, 'P'], [8, 18, 'P'], [13, 18, 'P'], [8, 19, 'P'], [9, 19, 'P'],
    [10, 19, 'P'], [11, 19, 'P'], [12, 19, 'P'], [13, 19, 'P'],
  ],
}

/** 造型补丁：发型/头饰/佩饰的专属差异像素，让十位道长剪影即可分辨 */
export const TAO_PATCHES: Record<string, PropOverlay> = {
  qingxuan: [[7, 2, 'G'], [15, 2, 'G']],
  danxia: [[7, 4, 'H'], [6, 5, 'H'], [15, 4, 'H'], [16, 5, 'H'], [7, 5, 'G'], [15, 5, 'G']],
  xinglan: [[4, 16, 'H'], [18, 16, 'H'], [4, 17, 'H'], [18, 17, 'H'], [3, 15, 'H'], [19, 15, 'H']],
  suwen: [[8, 2, 'Y'], [14, 2, 'Y']],
  yunji: [[11, 10, 'G']],
  shuanghua: [[20, 9, 'H'], [21, 10, 'H'], [21, 11, 'H'], [22, 12, 'H']],
  shouzhuo: [[6, 5, 'Y'], [16, 5, 'Y'], [5, 6, 'Y'], [17, 6, 'Y']],
  shiyi: [[4, 10, 'G'], [18, 10, 'G']],
  lingshi: [[8, 1, 'G'], [14, 1, 'G'], [9, 0, 'Q'], [13, 0, 'Q']],
  meixue: [[12, 1, 'G'], [3, 15, 'H'], [19, 15, 'H'], [3, 16, 'H'], [19, 16, 'H']],
}

export interface TaoessDef {
  id: string
  nameCn: string
  title: string
  /** 出场问候（拟人口吻） */
  hello: string
  prop: keyof typeof TAO_PROPS
  orbit: string
  palette: Partial<Record<string, string>>
}

export const TAOESSES: Record<string, TaoessDef> = {
  qingxuan: {
    id: 'qingxuan', nameCn: '青玄', title: '知客道长', prop: 'whisk', orbit: '☯',
    hello: '小住观青玄，客官是来排盘，还是只想听我唠两句？',
    palette: { H: '#34294a', R: '#74b09c', D: '#4c8573', Y: '#e8c473' },
  },
  danxia: {
    id: 'danxia', nameCn: '丹霞', title: '掌盘道长', prop: 'luopan', orbit: '☰',
    hello: '我是丹霞，罗盘都擦亮了——报个生辰，四柱马上给你翻出来。',
    palette: { H: '#5c4033', R: '#d97b62', D: '#a3543e', Y: '#ffd76e' },
  },
  xinglan: {
    id: 'xinglan', nameCn: '星阑', title: '司星道长', prop: 'scrollStars', orbit: '✷',
    hello: '星阑在此守夜。紫微诸星已经归位，就差你的生辰点灯了。',
    palette: { H: '#2c3a58', R: '#9080d8', D: '#5e4fa6', Y: '#b3a6f7' },
  },
  suwen: {
    id: 'suwen', nameCn: '素问', title: '五行道长', prop: 'taiji', orbit: '◈',
    hello: '素问向你行礼。木火土金水，五气朝元，随我去天穹里转一圈？',
    palette: { H: '#3d4433', R: '#86a86b', D: '#5a7a48', Y: '#c9a15f' },
  },
  yunji: {
    id: 'yunji', nameCn: '云笈', title: '藏经道长', prop: 'scripture', orbit: '✎',
    hello: '我叫云笈，藏经阁第七层归我扫。想翻哪部典籍，说一声就行。',
    palette: { H: '#33404d', R: '#cfd6de', D: '#98a2b0', Y: '#e8c473' },
  },
  shuanghua: {
    id: 'shuanghua', nameCn: '霜华', title: '执剑道长', prop: 'sword', orbit: '⚔',
    hello: '霜华按剑而立。五十九个格局谱系，个个来路清白，尽管查。',
    palette: { H: '#b9aed6', R: '#dde3ea', D: '#aab4c0', Y: '#e8c473' },
  },
  shouzhuo: {
    id: 'shouzhuo', nameCn: '守拙', title: '持尺道长', prop: 'ruler', orbit: '⚖',
    hello: '守拙，规矩的规矩。七百九十九条规则一条条码好，欢迎挑刺。',
    palette: { H: '#4a3626', R: '#708090', D: '#4a5866', Y: '#c9a15f' },
  },
  shiyi: {
    id: 'shiyi', nameCn: '拾遗', title: '掌灯道长', prop: 'lantern', orbit: '❈',
    hello: '提灯人拾遗，专翻旧案。两千多个命例在架上落灰，借你灯光看看？',
    palette: { H: '#6b4a32', R: '#e0aa78', D: '#b07c50', Y: '#ffd76e' },
  },
  lingshi: {
    id: 'lingshi', nameCn: '灵蓍', title: '揲蓍道长', prop: 'coins', orbit: '☱',
    hello: '灵蓍洗手上铜钱啦。心诚则灵，摇一摇，卦象自会说话。',
    palette: { H: '#2f3d2f', R: '#9ab87a', D: '#68854f', Y: '#e8c473' },
  },
  meixue: {
    id: 'meixue', nameCn: '梅雪', title: '解签道长', prop: 'stickpot', orbit: '❀',
    hello: '梅雪抱签筒来也。今日运势如何，抽一支便知——不许偷看下一支。',
    palette: { H: '#262033', R: '#e8a4b8', D: '#b8748c', Y: '#ffd76e' },
  },
}

export const TAOESS_IDS = Object.keys(TAOESSES)

export interface TaoPixel {
  x: number
  y: number
  fill: string
  isEye: boolean
}

const EYE_CHAR = 'E'

/** 组装某位角色的完整像素列表（主骨架 + 配色替换 + 法器浮层）
 *  palOverride：额外覆盖调色板键（R 道袍 / D 辅色 / Y 饰金…），供主星拟人等场景复用骨架 */
export function buildTaoess(id: string, palOverride?: Partial<Record<string, string>>): TaoPixel[] {
  const def = TAOESSES[id] ?? TAOESSES.qingxuan!
  const pal: Record<string, string> = { ...TAO_PALETTE }
  for (const k of Object.keys(def.palette)) {
    const v = def.palette[k]
    if (v) pal[k] = v
  }
  if (palOverride) {
    for (const k of Object.keys(palOverride)) {
      const v = palOverride[k]
      if (v) pal[k] = v
    }
  }
  const out: TaoPixel[] = []
  TAO_BASE_SPRITE.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === '.') return
      out.push({ x: x + 1, y, fill: pal[ch] ?? TAO_PALETTE.K!, isEye: ch === EYE_CHAR })
    })
  })
  ;(TAO_PROPS[def.prop] ?? []).forEach(([x, y, ch]) => {
    out.push({ x: x + 1, y, fill: pal[ch] ?? ch, isEye: false })
  })
  ;(TAO_PATCHES[def.id] ?? []).forEach(([x, y, ch]) => {
    out.push({ x: x + 1, y, fill: pal[ch] ?? ch, isEye: false })
  })
  return out
}

/** 牌背纹样：小像居中，四角饰点，供翻牌卡背使用 */
export const CARD_BACK_SPRITE = [
  '..K.......K..',
  '..KK.....KK..',
  '...KKKKKKK...',
  '..KHHHHHHHK..',
  '.KHHHHHHHHHK.',
  '.KHHHHHHHHHK.',
  '.KHSSSSSSSHK.',
  '.KHSSEESSSHK.',
  '.KHSSSSSSSHK.',
  '.KHSBSSSSSHK.',
  '..KSSSSSSK...',
  '...KWRRRWK...',
  '..KWRRRRRWK..',
  '..KWRRRRRWK..',
  '...KRRRRRK...',
  '..KRRRRRRRK..',
  '.KR.RRRRR.RK.',
]

export function cardBackPixels(palOverride?: Partial<Record<string, string>>): TaoPixel[] {
  const pal: Record<string, string> = { ...TAO_PALETTE }
  if (palOverride) {
    for (const k of Object.keys(palOverride)) {
      const v = palOverride[k]
      if (v) pal[k] = v
    }
  }
  const out: TaoPixel[] = []
  CARD_BACK_SPRITE.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === '.') return
      out.push({ x, y, fill: pal[ch] ?? pal.K!, isEye: false })
    })
  })
  return out
}
