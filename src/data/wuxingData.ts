import { Element } from '../lib/constants'

export const WUXING_PALETTE: Record<string, string> = {
  K: '#1c2230',
  G: '#7bc47f', g: '#4e9a58', T: '#8a5a3b',
  F: '#ef7d57', f: '#fbbf24', Y: '#ffe3a8',
  E: '#c9a15f', e: '#9a7a42', R: '#7a6236',
  M: '#d8dde6', m: '#9aa3b2', O: '#e8c473',
  W: '#64a7e8', w: '#3d76b8', C: '#bfe0ff',
}

const TREE = [
  '....gGGGg...',
  '...GGGGGGG..',
  '..GGGGGGGGG.',
  '.GGGGgGGGGG.',
  '..GGGGGGGG..',
  '...gGGGGg...',
  '.....TT.....',
  '.....TT.....',
  '.....TT.....',
  '.....TT.....',
  '....TTTT....',
]
const FLAME = [
  '.....Y......',
  '....YY......',
  '....YYF.....',
  '...YFFf.....',
  '...FFff.....',
  '..FFFffF....',
  '..Ffffff....',
  '.FfffffF....',
  '.Fffffff....',
  '.fFfffFf....',
  '..fffff.....',
]
const MOUNTAIN = [
  '......E.....',
  '.....EEE....',
  '....EEeEE...',
  '...EEeeeEE..',
  '..EEeeRReEE.',
  '.EEeeeeReEE.',
  'EEeeRRRRRREE',
  'EeeeeRRReeeE',
  'EeeeeeeeeeeE',
  'EEEEEEEEEEEE',
]
const INGOT = [
  '............',
  '............',
  '...OOOOOO...',
  '..OMMMMMMO..',
  '.OMMmmmmMMO.',
  'OMmmmmmmmMmO',
  'OMmmmmmmmMmO',
  '.OMMmmmmMMO.',
  '..OOMMMMmO..',
  '....OOOO....',
]
const WAVE = [
  '............',
  '..WWWW......',
  '.WwwwwWWW...',
  'WwwCCwwwwwW.',
  '.WwwwwwwwwW.',
  '..WWwwwwWW..',
  '.wWWwwwwWWw.',
  'WwwwwCCwwwwW',
  'WwwwwwCwwwwW',
  '.WWwwwwwwWW.',
]

export const WUXING_SPRITES: Record<Element, string[]> = {
  木: TREE,
  火: FLAME,
  土: MOUNTAIN,
  金: INGOT,
  水: WAVE,
}

export interface Voxel { x: number; y: number; color: string }

export function elementVoxels(e: Element): Voxel[] {
  const out: Voxel[] = []
  const sprite = WUXING_SPRITES[e]!
  sprite.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      const color = WUXING_PALETTE[ch]
      if (color && ch !== '.') out.push({ x, y, color })
    })
  })
  return out
}

export const SHENG_CYCLE: Array<[Element, Element]> = [['木', '火'], ['火', '土'], ['土', '金'], ['金', '水'], ['水', '木']]
export const KE_CYCLE: Array<[Element, Element]> = [['木', '土'], ['土', '水'], ['水', '火'], ['火', '金'], ['金', '木']]
