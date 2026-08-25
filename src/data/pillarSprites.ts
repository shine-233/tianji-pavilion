/** 牌面图鉴：十二生肖兽像与五行小仙，供四柱卡牌正面使用。
 * 全部为手绘像素网格，字符 → 色板；'.' 为透明。 */

export interface SpriteDef {
  pal: Record<string, string>
  rows: string[]
}

const OUT = '#1a1622'

/** 五行小仙：同骨架不同发饰与配色，都有眼睛——拟人风 */
function spirit(hair: string, dress: string, trim: string): SpriteDef {
  return {
    pal: { K: OUT, H: hair, S: '#ffe3c9', E: '#2a2440', R: dress, D: trim, Y: '#ffe3a8', W: '#f6f1e3' },
    rows: [
      '..HHHH..',
      '.HHHHHH.',
      'HHHHHHHH',
      '.HSSSSH.',
      '.SESSSES',
      '.SSSSSS.',
      '..SYYSS.',
      '.WRRRRW.',
      'SRRRRRRS',
      '.DRRRRD.',
      '.DDDDDD.',
      '..D..D..',
    ],
  }
}

export const ELEMENT_SPIRITS: Record<string, SpriteDef> = {
  木: spirit('#5da862', '#3e7a4a', '#2c5836'),
  火: spirit('#ef7d57', '#c8543a', '#8f3524'),
  土: spirit('#b08d52', '#8a6a38', '#5e4726'),
  金: spirit('#dfe4ec', '#98a2b0', '#6b7684'),
  水: spirit('#64a7e8', '#3d76b8', '#28517f'),
}

const Z_PAL = { K: OUT, B: '#241f31', W: '#f2ede0', E: '#120f18', G: '#ffd76e' }

export const ZODIAC_SPRITES: Record<string, SpriteDef> = {
  鼠: {
    pal: { ...Z_PAL, G: '#9aa3b2' },
    rows: [
      '.GG....GG..',
      '.GGG..GGG..',
      '..GGGGGG...',
      '.GGGGGGGG..',
      'GGEGGGGEGG.',
      'GGGGWWGGGG..',
      '.GGGGGGGG.G',
      '..GGGGGG..G',
      '..G.GG.G.G.',
      '...........',
    ],
  },
  牛: {
    pal: { ...Z_PAL, G: '#c8b394' },
    rows: [
      'G.........G',
      'GG.......GG',
      '.GGGGGGGGG.',
      '.GBGGGGGBG.',
      'GGBEGGEBGGG',
      '.GGGGGGGGG.',
      '.GG.WWWW.G.',
      '..GGGGGGG..',
      '...G...G...',
      '...........',
    ],
  },
  虎: {
    pal: { ...Z_PAL, G: '#e8a34c' },
    rows: [
      '.G.GG.GG.G.',
      '.GGGGGGGGG.',
      'GGGWKGKWGGG',
      'GGEEGGGEEGG',
      '.GGWKWKGGG.',
      '.GGGGGGGGG.',
      '.GKGGGGKGG.',
      '..GGGGGGG..',
      '...KK.KK...',
      '...........',
    ],
  },
  兔: {
    pal: { ...Z_PAL, G: '#dcd3cf' },
    rows: [
      '..GG...GG..',
      '..GG...GG..',
      '..GG...GG..',
      '..GGGGGGG..',
      '.GGEGGEEGG.',
      '.GGGGWWGGG.',
      '..GGGGGGG..',
      '.GGGGGGGGG.',
      '..GG...GG..',
      '...........',
    ],
  },
  龙: {
    pal: { ...Z_PAL, G: '#7fb8a0' },
    rows: [
      '..G.....KG.',
      '.GGG...KK..',
      '.GEGGKGKG..',
      '.GGGGGGGGG.',
      '..GGYGGGG..',
      '.GGGGGYGG.G',
      'G.GGGGGG.GG',
      '..GG.GGG.G.',
      '.GG...GG...',
      '...........',
    ],
  },
  蛇: {
    pal: { ...Z_PAL, G: '#96b86a' },
    rows: [
      '....GGGG...',
      '..GGGGGGG..',
      '.GGEGGGEGG.',
      '.GGGGGGGGG.',
      '..GGKKKGG..',
      '...GGGGG...',
      '..GGG.GGG..',
      '.GGG...GGG.',
      '.G.......G.',
      '...........',
    ],
  },
  马: {
    pal: { ...Z_PAL, G: '#a8703f' },
    rows: [
      '.KK......G.',
      '.GKG....GG.',
      '.GGGGGGGG..',
      '.GGEGGEGG..',
      '.GGGGGGGG..',
      '.GG.KKK.G..',
      '.GGGGGGGG..',
      '..GGGGGG...',
      '..G....G...',
      '...........',
    ],
  },
  羊: {
    pal: { ...Z_PAL, G: '#e8e2d4' },
    rows: [
      '.KK.....KK.',
      '.GGG...GGG.',
      '.GGGGGGGGG.',
      '.GGEGGEEGG.',
      '.GGGGGGGGG.',
      '..GGKKKGG..',
      '.GGGGGGGGG.',
      '..GGGGGGG..',
      '..G.....G..',
      '...........',
    ],
  },
  猴: {
    pal: { ...Z_PAL, G: '#9a7858' },
    rows: [
      '.GG.....GG.',
      '.GGGGGGGGG.',
      '.GGWWWWWGG.',
      '.GWEGGEEWG.',
      '.GGWWKWWGG.',
      '.GGGGGGGGG.',
      '..GGGGGGG.G',
      '..GGGGGG..G',
      '...G..G....',
      '...........',
    ],
  },
  鸡: {
    pal: { ...Z_PAL, G: '#e09a54' },
    rows: [
      '..KK.......',
      '.GGG...KK..',
      'GGEGG.KKG..',
      'GGGGGGGGG..',
      '.GGWKWGG...',
      '.GGGGGG.KK.',
      '.GGGGGGGGG.',
      '..GGGGGGG..',
      '...KK.KK...',
      '...........',
    ],
  },
  狗: {
    pal: { ...Z_PAL, G: '#c49a6a' },
    rows: [
      '.GG.....GG.',
      '.GGG...GGG.',
      '.GGGGGGGGG.',
      'GGGEGGGEGGG',
      '.GGGKKKGGG.',
      '.GGGGGGGGG.',
      '.GGGGGGGGG.',
      '..GGGGGGG..',
      '..G.....G..',
      '...........',
    ],
  },
  猪: {
    pal: { ...Z_PAL, G: '#eda3ac' },
    rows: [
      '.GG.....GG.',
      '.GGGGGGGGG.',
      '.GGEGGGEGG.',
      '.GGGGGGGGG.',
      '.GGKKKKKGG.',
      '.GGKNNNKGG.',
      '.GGKKKKKGG.',
      '.GGGGGGGGG.',
      '..GGGGGGG..',
      '...........',
    ].map((r) => r.replace(/N/g, 'E')),
  },
}

export interface Pixel { x: number; y: number; fill: string }

export function spritePixels(def: SpriteDef): Pixel[] {
  const out: Pixel[] = []
  def.rows.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      if (ch === '.') return
      out.push({ x, y, fill: def.pal[ch] ?? ch })
    })
  })
  return out
}
