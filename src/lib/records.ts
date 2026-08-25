/** 占卜记录：六爻 / 梅花 / 灵签 共用一份流水，与八字排盘历史分开 */
export interface DivRecord {
  kind: 'liuyao' | 'meihua' | 'sign'
  title: string
  detail: string
  ts: number
}

const KEY = 'bs-div-records'

export function loadRecords(): DivRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as DivRecord[]
  } catch {
    return []
  }
}

export function addRecord(rec: Omit<DivRecord, 'ts'>): void {
  const list = loadRecords()
  list.unshift({ ...rec, ts: Date.now() })
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
  } catch { /* noop */ }
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* noop */ }
}
