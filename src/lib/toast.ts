/** 轻量 toast：替代 alert 的非阻塞提示 */
let host: HTMLDivElement | null = null

export function toast(msg: string, dur = 2800): void {
  if (typeof document === 'undefined') return
  if (!host || !host.isConnected) {
    host = document.createElement('div')
    host.className = 'toast-host'
    document.body.appendChild(host)
  }
  const el = document.createElement('div')
  el.className = 'toast-item'
  el.textContent = msg
  el.setAttribute('role', 'status')
  host.appendChild(el)
  window.setTimeout(() => {
    el.classList.add('out')
    window.setTimeout(() => {
      el.remove()
      if (host && host.childElementCount === 0) {
        host.remove()
        host = null
      }
    }, 240)
  }, dur)
}
