/** 点击处的五行粒子迸溅（DOM 实现，零依赖） */
export function sparkle(x: number, y: number, count = 8): void {
  const chars = ['✦', '✧', '☯', '·', '⋆']
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'fx-spark'
    el.textContent = chars[Math.floor(Math.random() * chars.length)]
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    const dx = (Math.random() - 0.5) * 90
    const dy = -30 - Math.random() * 70
    const rot = (Math.random() - 0.5) * 240
    el.style.setProperty('--dx', `${dx}px`)
    el.style.setProperty('--dy', `${dy}px`)
    el.style.setProperty('--rot', `${rot}deg`)
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 800)
  }
}
