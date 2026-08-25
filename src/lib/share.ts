/**
 * 命盘分享图：纯 Canvas 绘制 900×1200 卡片并下载 PNG。
 * 深夜底色 + 星点 + 四柱大字 + 七维分数条 + 页脚，零依赖。
 */

export interface ShareSpec {
  title: string
  subtitle?: string
  /** 四柱等大字，如 ['壬午','庚戌','丁卯','乙巳'] */
  pillars?: string[]
  /** 分数行：[标签, 数值0-10] */
  scores?: Array<[string, number]>
  /** 总分大字 */
  total?: string
  /** 备注小字 */
  notes?: string[]
  footer?: string
}

const W = 900
const H = 1200

function wrapText(g: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    if (g.measureText(line + ch).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line += ch
    }
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

export function drawShareCard(spec: ShareSpec): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!

  // 底色夜空
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#10131c')
  bg.addColorStop(0.55, '#0b0d12')
  bg.addColorStop(1, '#141824')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)

  // 星点
  let seed = 42
  const rnd = (): number => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  for (let i = 0; i < 130; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const r = rnd() * 1.4 + 0.3
    g.globalAlpha = 0.25 + rnd() * 0.5
    g.fillStyle = rnd() > 0.85 ? '#e8c473' : '#cfd8ea'
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  g.globalAlpha = 1

  // 双层描边框 + 四角饰点
  g.strokeStyle = 'rgba(232,196,115,0.55)'
  g.lineWidth = 3
  g.strokeRect(26, 26, W - 52, H - 52)
  g.strokeStyle = 'rgba(94,234,212,0.28)'
  g.lineWidth = 1
  g.strokeRect(40, 40, W - 80, H - 80)
  g.fillStyle = '#e8c473'
  for (const [cx, cy] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]] as const) {
    g.beginPath()
    g.arc(cx, cy, 5, 0, Math.PI * 2)
    g.fill()
  }

  let y = 108

  // 标题
  g.textAlign = 'center'
  g.fillStyle = '#ffe3a8'
  g.font = 'bold 54px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif'
  g.shadowColor = 'rgba(232,196,115,0.45)'
  g.shadowBlur = 24
  g.fillText(spec.title, W / 2, y)
  g.shadowBlur = 0

  if (spec.subtitle) {
    y += 52
    g.fillStyle = '#8b93a7'
    g.font = '24px "Microsoft YaHei", sans-serif'
    g.fillText(spec.subtitle, W / 2, y)
  }

  // 四柱大字
  if (spec.pillars?.length) {
    y += 118
    const gap = 34
    const cw = 132
    const startX = W / 2 - ((spec.pillars.length * cw + (spec.pillars.length - 1) * gap) / 2)
    const eleColors = [' #7bc47f', '#ef7d57', '#e8c473', '#64a7e8']
    spec.pillars.forEach((p, i) => {
      const cx = startX + i * (cw + gap)
      g.strokeStyle = 'rgba(232,196,115,0.35)'
      g.lineWidth = 2
      roundRect(g, cx, y - 62, cw, 124, 14)
      g.stroke()
      g.font = 'bold 58px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif'
      g.fillStyle = eleColors[i % 4]!.trim()
      ;[...p].forEach((ch, k) => {
        g.fillText(ch, cx + cw / 2, y - 20 + k * 56)
      })
    })
    y += 96
  }

  // 总分
  if (spec.total) {
    y += 74
    g.fillStyle = '#5eead4'
    g.font = 'bold 66px "ZCOOL KuaiLe", "Microsoft YaHei", sans-serif'
    g.shadowColor = 'rgba(94,234,212,0.5)'
    g.shadowBlur = 20
    g.fillText(spec.total, W / 2, y)
    g.shadowBlur = 0
  }

  // 分数条
  if (spec.scores?.length) {
    y += 46
    const barW = 520
    const bx = W / 2 - barW / 2
    g.textAlign = 'left'
    for (const [label, v] of spec.scores) {
      y += 46
      g.fillStyle = '#ece9df'
      g.font = '24px "Microsoft YaHei", sans-serif'
      g.fillText(label, bx, y)
      g.textAlign = 'right'
      g.fillText(v.toFixed(1), bx + barW, y)
      g.textAlign = 'left'
      g.fillStyle = '#232a3a'
      roundRect(g, bx, y + 10, barW, 10, 5)
      g.fill()
      const grad = g.createLinearGradient(bx, 0, bx + barW, 0)
      grad.addColorStop(0, '#5eead4')
      grad.addColorStop(1, '#e8c473')
      g.fillStyle = grad
      roundRect(g, bx, y + 10, Math.max(6, barW * Math.max(0, Math.min(1, v / 10))), 10, 5)
      g.fill()
    }
  }

  // 备注
  if (spec.notes?.length) {
    y += 58
    g.fillStyle = '#8b93a7'
    g.font = '21px "Microsoft YaHei", sans-serif'
    g.textAlign = 'center'
    for (const n of spec.notes) {
      for (const line of wrapText(g, n, 700)) {
        y += 32
        g.fillText(line, W / 2, y)
      }
    }
  }

  // 页脚
  g.fillStyle = 'rgba(139,147,167,0.75)'
  g.font = '20px "Microsoft YaHei", sans-serif'
  g.fillText(spec.footer ?? '天机阁 · 八字量化研究 · 仅供传统文化与娱乐参考', W / 2, H - 68)

  return c
}

export function downloadShareCard(spec: ShareSpec, filename = 'bazi-share.png'): void {
  const c = drawShareCard(spec)
  c.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 3000)
  }, 'image/png')
}
