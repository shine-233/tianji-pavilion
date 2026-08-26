import { DAOGU_VARIANTS, daoguGrid } from '../src/data/taoistSprites'

const CHARS: Record<string, string> = {
  K: '#', S: '.', E: '@', B: '~', H: '%', h: '%', G: '*', V: 'o',
  F: '=', R: '+', r: '+', W: ' ', T: '|', t: '|', P: '&', p: '&', Q: '0',
}

for (const v of DAOGU_VARIANTS) {
  const { cells, rows, cols } = daoguGrid(v)
  const grid: string[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '))
  for (const c of cells) grid[c.y][c.x] = CHARS[c.token] ?? '?'
  console.log(`\n== ${v.nameCn} (${v.title}) ${cols}x${rows} ==`)
  console.log(grid.map((r) => r.join('')).join('\n'))
}
