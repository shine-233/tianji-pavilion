/**
 * 站级动效层：
 * - Lenis 惯性平滑滚动（尊重 prefers-reduced-motion，触屏保持原生）
 * - 顶部滚动进度条
 * - v-magnetic 磁吸按钮
 * - v-countup 数字滚动
 */
import Lenis from 'lenis'
import type { Directive } from 'vue'
import type { Router } from 'vue-router'

let lenis: Lenis | null = null

export function initSmoothScroll(router: Router): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return
  lenis = new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false, // 触屏保留原生手感
  })
  function raf(time: number): void {
    lenis?.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
  router.afterEach(() => {
    lenis?.scrollTo(0, { immediate: true })
  })
}

/** 顶部阅读进度条：返回 0~100 */
export function watchScrollProgress(onProgress: (pct: number) => void): () => void {
  const update = (): void => {
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0
    onProgress(pct)
  }
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  lenis?.on('scroll', update)
  update()
  return () => {
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  }
}

/** v-magnetic：指针靠近时元素轻微吸附（触屏自动禁用） */
export const vMagnetic: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const strength = binding.value ?? 0.28
    const maxShift = 10
    let raf = 0
    const onMove = (e: MouseEvent): void => {
      const rect = el.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.max(-maxShift, Math.min(maxShift, dx * strength))}px, ${Math.max(-maxShift, Math.min(maxShift, dy * strength))}px)`
      })
    }
    const onLeave = (): void => {
      cancelAnimationFrame(raf)
      el.style.transform = ''
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    el.style.transition = 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)'
    ;(el as HTMLElement & { __magneticCleanup?: () => void }).__magneticCleanup = () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  },
  unmounted(el) {
    ;(el as HTMLElement & { __magneticCleanup?: () => void }).__magneticCleanup?.()
  },
}

/** v-countup：进入视口时数字从 0 滚到目标值；支持小数与千分位 */
export const vCountup: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const target = binding.value
    if (typeof target !== 'number' || !Number.isFinite(target)) return
    const decimals = parseFloat(el.dataset.decimals ?? '0')
    const thousands = el.dataset.thousands !== 'off'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fmt = (v: number): string => {
      const s = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))
      return thousands ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s
    }
    if (reduced || !('IntersectionObserver' in window)) {
      el.textContent = fmt(target)
      return
    }
    el.textContent = fmt(0)
    let started = false
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || started) continue
        started = true
        io.disconnect()
        const t0 = performance.now()
        const dur = 1100
        const tick = (now: number): void => {
          const p = Math.min(1, (now - t0) / dur)
          const eased = 1 - Math.pow(1 - p, 3)
          el.textContent = fmt(target * eased)
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.4 })
    io.observe(el)
  },
}
