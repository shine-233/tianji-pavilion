/**
 * 性能预算层：
 * - LOW_END：低端设备判定（核数/内存），一次性计算
 * - dprCap：按设备档位封顶像素比
 * - FrameGate：渲染门控——离开视口、切后台、低帧率档时跳过渲染
 */

export const LOW_END: boolean = (() => {
  if (typeof navigator === 'undefined') return false
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return cores <= 4 || mem <= 4
})()

/** 渲染像素比上限：高端 1.75 / 普通 1.5 / 低端 1 */
export function dprCap(base = 1.5): number {
  const raw = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  const cap = LOW_END ? Math.min(base, 1) : base
  return Math.min(raw, cap)
}

export interface FrameGateOptions {
  /** 低端机帧率上限（默认 30fps）；传 0 不限 */
  fpsCapOnLowEnd?: number
  /** 是否启用视口检测（默认开；全屏固定层可关） */
  watchViewport?: boolean
}

/** 渲染门控：tick 里问一句 gate.shouldRender，不该画就早退 */
export class FrameGate {
  private visible = true
  private hiddenTab = false
  private lastRender = 0
  private minInterval: number
  private io: IntersectionObserver | null = null
  private onVis: (() => void) | null = null

  readonly lowEnd = LOW_END

  constructor(el?: HTMLElement | Element | null, opts: FrameGateOptions = {}) {
    this.minInterval = opts.fpsCapOnLowEnd === undefined || opts.fpsCapOnLowEnd <= 0 ? 0 : Math.ceil(1000 / opts.fpsCapOnLowEnd)
    if (typeof document !== 'undefined') {
      this.hiddenTab = document.hidden
      this.onVis = () => {
        this.hiddenTab = document.hidden
      }
      document.addEventListener('visibilitychange', this.onVis)
    }
    if (opts.watchViewport !== false && el && typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) this.visible = e.isIntersecting
        },
        { rootMargin: '80px' }, // 提前一点恢复渲染，避免滚入时闪空白
      )
      this.io.observe(el)
    } else if (opts.watchViewport === false) {
      this.visible = true
    } else {
      this.visible = true
    }
  }

  get shouldRender(): boolean {
    if (this.hiddenTab || !this.visible) return false
    if (this.minInterval > 0) {
      const now = performance.now()
      if (now - this.lastRender < this.minInterval) return false
      this.lastRender = now
    }
    return true
  }

  dispose(): void {
    this.io?.disconnect()
    this.io = null
    if (this.onVis && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVis)
    }
    this.onVis = null
  }
}
