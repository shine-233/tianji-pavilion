/** 8-bit 音效：WebAudio 实时合成，零音频素材，状态存 localStorage */
let ctx: AudioContext | null = null

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem('bs-sound') !== 'off'
  } catch {
    return true
  }
}

export function toggleSound(): boolean {
  const next = !isSoundOn()
  try {
    localStorage.setItem('bs-sound', next ? 'on' : 'off')
  } catch { /* noop */ }
  if (next) tone(880, 0.05, 'square', 0.03)
  return next
}

function ac(): AudioContext | null {
  if (!isSoundOn()) return null
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04, slideTo?: number, delay = 0): void {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, vol = 0.03): void {
  const c = ac()
  if (!c) return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  const gain = c.createGain()
  gain.gain.value = vol
  src.buffer = buf
  src.connect(gain).connect(c.destination)
  src.start()
}

export const sfx = {
  flip(): void { tone(520, 0.09, 'square', 0.04, 880) },
  ding(): void {
    tone(660, 0.09); tone(880, 0.09, 'square', 0.04, undefined, 0.09); tone(1320, 0.14, 'square', 0.04, undefined, 0.18)
  },
  blip(): void { tone(980, 0.05, 'square', 0.03) },
  pop(): void { tone(300, 0.12, 'triangle', 0.05, 720) },
  toggle(): void { tone(440, 0.06, 'square', 0.035, 330) },
  gong(): void {
    tone(196, 0.9, 'sine', 0.06, 180)
    tone(392, 0.7, 'sine', 0.03, 370, 0.02)
    noise(0.3, 0.02)
  },
  tick(): void { tone(1400 + Math.random() * 500, 0.018, 'square', 0.008) },
}
