import type { Directive } from 'vue'

let io: IntersectionObserver | null = null

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

/** v-reveal：进入视口时浮现，可传延迟毫秒 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) return
    el.classList.add('reveal')
    if (binding.value) el.style.setProperty('--rv-d', `${binding.value}ms`)
    observer().observe(el)
  },
  unmounted(el) {
    io?.unobserve(el)
  },
}
