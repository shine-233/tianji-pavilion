export interface HistoryItem {
  y: number; m: number; d: number; hh: number; mm: number
  gender: number
  tot: number
  pctl: number | null
  pillars: string[]
  ts: number
}

const KEY = 'bs-history'

export function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as HistoryItem[]
  } catch {
    return []
  }
}

export function saveHistory(item: HistoryItem): void {
  const list = loadHistory().filter((x) => x.ts !== item.ts)
  list.unshift(item)
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 24)))
  } catch { /* noop */ }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* noop */ }
}
