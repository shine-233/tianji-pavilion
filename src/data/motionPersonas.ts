/**
 * 角色动作人格：十位道长各有各的动静。
 * 剪影发型归美术数据管，动起来的脾气归这里管——
 * mode 定 idle 动画骨架，dur/amp/blink 控制节奏，delay 错开相位避免全场齐步走。
 */
export interface MotionPersona {
  /** bob=上下浮 sway=左右轻摇 tilt=带倾角的摆 bounce=落地回弹 glow=浮动+光晕呼吸 */
  mode: 'bob' | 'sway' | 'tilt' | 'bounce' | 'glow'
  /** idle 周期（秒） */
  dur: number
  /** 幅度：位移 px 或摆角 deg */
  amp: number
  /** 眨眼周期（秒） */
  blink: number
  /** 相位错开（秒），防止一群人齐步走 */
  delay: number
}

export const MOTION: Record<string, MotionPersona> = {
  qingxuan: { mode: 'bob', dur: 4.6, amp: 5, blink: 6.8, delay: 0 },
  danxia: { mode: 'bounce', dur: 2.2, amp: 8, blink: 3.4, delay: 0.3 },
  xinglan: { mode: 'sway', dur: 5.4, amp: 4, blink: 7.5, delay: 0.6 },
  suwen: { mode: 'bob', dur: 3.8, amp: 4, blink: 5.0, delay: 0.9 },
  yunji: { mode: 'bob', dur: 6.0, amp: 3, blink: 8.2, delay: 0.4 },
  shuanghua: { mode: 'tilt', dur: 2.8, amp: 7, blink: 4.1, delay: 0.2 },
  shouzhuo: { mode: 'tilt', dur: 4.0, amp: 3, blink: 6.0, delay: 0.5 },
  shiyi: { mode: 'glow', dur: 3.4, amp: 6, blink: 4.8, delay: 0.7 },
  lingshi: { mode: 'bounce', dur: 2.6, amp: 9, blink: 3.8, delay: 0.1 },
  meixue: { mode: 'sway', dur: 3.0, amp: 5, blink: 4.4, delay: 0.8 },
}

export function motionOf(id: string): MotionPersona {
  return MOTION[id] ?? MOTION.qingxuan!
}
