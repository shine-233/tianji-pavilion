<script setup lang="ts">
/**
 * 粒子星盘：首页 hero 背景的金尘粒子场。
 * 粒子在「太极 ☯ → 乾卦 ☰ → 知命」三种形态间缓流变形；
 * 指针靠近会被拨开，换肤跟随主题金色，系统「减少动态效果」时静帧。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const host = ref<HTMLDivElement | null>(null)

const SHAPES = ['☯', '☰', '知命'] as const
const COUNT = 1100
const MORPH_MS = 4600
const REPEL_R = 85

interface P {
  x: number
  y: number
  tx: number
  ty: number
  ease: number
  phase: number
  size: number
  delay: number
}

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let parts: P[] = []
let raf = 0
let morphTimer: number | null = null
let shapeIdx = 0
let mx = -9999
let my = -9999
let gold = '232, 196, 115'
let running = false
let inView = true
let disposed = false
let themeObs: MutationObserver | null = null
let io: IntersectionObserver | null = null
let dpr = 1

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function readGold(): void {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--gold-bright').trim()
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16)
    gold = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
  }
}

/** 把一个字形画到离屏画布并采样成目标点阵 */
function sampleShape(shape: string, w: number, h: number): Array<[number, number]> {
  const off = document.createElement('canvas')
  const S = 300
  off.width = off.height = S
  const g = off.getContext('2d')!
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if ([...shape].length > 1) {
    g.font = `118px "ZCOOL KuaiLe", "Microsoft YaHei", serif`
    g.fillText(shape, S / 2, S / 2)
  } else {
    g.font = `230px "ZCOOL KuaiLe", "Microsoft YaHei", serif`
    g.fillText(shape, S / 2, S / 2 + 8)
  }
  const data = g.getImageData(0, 0, S, S).data
  const pts: Array<[number, number]> = []
  const step = 3
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      if (data[(y * S + x) * 4 + 3]! > 120) {
        pts.push([(x / S - 0.5) * w * 0.92 + w / 2, (y / S - 0.5) * h * 0.92 + h / 2])
      }
    }
  }
  return pts
}

function retarget(w: number, h: number): void {
  const pts = sampleShape(SHAPES[shapeIdx]!, w, h)
  if (!pts.length) return
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!
    const [tx, ty] = pts[Math.floor(Math.random() * pts.length)]!
    p.tx = tx + (Math.random() - 0.5) * 2.4
    p.ty = ty + (Math.random() - 0.5) * 2.4
    p.delay = (i % 36) * 14
  }
}

function resize(): void {
  const el = host.value
  if (!el || !canvas || !ctx) return
  const r = el.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = Math.max(2, Math.round(r.width * dpr))
  canvas.height = Math.max(2, Math.round(r.height * dpr))
  canvas.style.width = `${r.width}px`
  canvas.style.height = `${r.height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (parts.length === 0) {
    parts = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * r.width,
      y: Math.random() * r.height,
      tx: 0,
      ty: 0,
      ease: 0.035 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      size: 1.2 + (i % 5) * 0.28,
      delay: 0,
    }))
  }
  retarget(r.width, r.height)
  if (reducedMotion) drawStatic()
}

function frame(t: number): void {
  if (!ctx || !host.value) return
  const r = host.value.getBoundingClientRect()
  ctx.clearRect(0, 0, r.width, r.height)
  const tm = t / 1000
  for (const p of parts) {
    if (p.delay > 0) p.delay -= 16.7
    const k = p.delay > 0 ? 0 : p.ease
    p.x += (p.tx - p.x) * k
    p.y += (p.ty - p.y) * k
    // 指针拨开
    const dx = p.x - mx
    const dy = p.y - my
    const d2 = dx * dx + dy * dy
    if (d2 < REPEL_R * REPEL_R && d2 > 0.01) {
      const d = Math.sqrt(d2)
      const push = ((REPEL_R - d) / REPEL_R) * 7
      p.x += (dx / d) * push
      p.y += (dy / d) * push
    }
    const wob = Math.sin(tm * 1.3 + p.phase)
    ctx.beginPath()
    ctx.fillStyle = `rgba(${gold}, ${0.34 + 0.22 * Math.sin(tm * 1.7 + p.phase)})`
    ctx.arc(p.x + wob * 1.1, p.y + Math.cos(tm * 1.1 + p.phase) * 1.1, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  raf = requestAnimationFrame(frame)
}

function drawStatic(): void {
  if (!ctx || !host.value) return
  const r = host.value.getBoundingClientRect()
  ctx.clearRect(0, 0, r.width, r.height)
  ctx.fillStyle = `rgba(${gold}, 0.5)`
  for (const p of parts) {
    ctx.beginPath()
    ctx.arc(p.tx, p.ty, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function start(): void {
  if (running || disposed || reducedMotion) return
  running = true
  raf = requestAnimationFrame(frame)
  if (morphTimer === null) {
    morphTimer = window.setInterval(() => {
      shapeIdx = (shapeIdx + 1) % SHAPES.length
      const el = host.value
      if (el) retarget(el.getBoundingClientRect().width, el.getBoundingClientRect().height)
    }, MORPH_MS)
  }
}

function stop(): void {
  running = false
  cancelAnimationFrame(raf)
  if (morphTimer !== null) {
    window.clearInterval(morphTimer)
    morphTimer = null
  }
}

function onWinMove(e: MouseEvent): void {
  const el = host.value
  if (!el) return
  const r = el.getBoundingClientRect()
  mx = e.clientX - r.left
  my = e.clientY - r.top
}

function onVis(): void {
  if (document.hidden) stop()
  else if (inView) start()
}

onMounted(async () => {
  canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  canvas.style.pointerEvents = 'none'
  host.value?.appendChild(canvas)
  ctx = canvas.getContext('2d')
  readGold()
  try {
    await Promise.race([document.fonts.ready, new Promise((res) => setTimeout(res, 900))])
  } catch { /* 字体未就绪也照常采样 */ }
  if (disposed) return
  resize()
  if (reducedMotion) {
    drawStatic()
  } else {
    io = new IntersectionObserver((es) => {
      inView = es[0]?.isIntersecting ?? true
      if (inView && !document.hidden) start()
      else stop()
    })
    io.observe(host.value!)
    themeObs = new MutationObserver(readGold)
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('mousemove', onWinMove, { passive: true })
    document.addEventListener('visibilitychange', onVis)
  }
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  disposed = true
  stop()
  io?.disconnect()
  themeObs?.disconnect()
  window.removeEventListener('mousemove', onWinMove)
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVis)
  canvas?.remove()
})
</script>

<template>
  <div ref="host" class="particle-altar" aria-hidden="true"></div>
</template>

<style scoped>
.particle-altar {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  -webkit-mask-image: radial-gradient(120% 120% at 50% 45%, #000 55%, transparent 92%);
  mask-image: radial-gradient(120% 120% at 50% 45%, #000 55%, transparent 92%);
}
</style>
