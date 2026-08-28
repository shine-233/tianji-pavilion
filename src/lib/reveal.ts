import type { Directive } from 'vue'

let io: IntersectionObserver | null = null
const fallbacks = new WeakMap<HTMLElement, number>()

function observer(): IntersectionObserver {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io!.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12 },
    )
  }
  return io
}

function settle(el: HTMLElement): void {
  el.classList.add('in')
  const t = fallbacks.get(el)
  if (t !== undefined) {
    window.clearTimeout(t)
    fallbacks.delete(el)
  }
}

/** v-reveal：进入视口时浮现，可传延迟毫秒。
 *  兜底策略：路由切换后 IO 偶发不回调，内容会一直卡在 opacity:0——
 *  所以挂载时已在视口内的元素立即落定，其余元素最多等 1.4s 强制可见。 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
    el.classList.add('reveal')
    if (binding.value) el.style.setProperty('--rv-d', `${binding.value}ms`)
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 800
    if (r.top < vh && r.bottom > 0) {
      settle(el)
      return
    }
    fallbacks.set(el, window.setTimeout(() => settle(el), 1400))
    observer().observe(el)
  },
  unmounted(el) {
    io?.unobserve(el)
    const t = fallbacks.get(el)
    if (t !== undefined) {
      window.clearTimeout(t)
      fallbacks.delete(el)
    }
  },
}
