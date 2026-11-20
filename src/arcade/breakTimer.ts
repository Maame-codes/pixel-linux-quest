// The Break Room's timer, as pure functions.

export const MINUTE_MS = 60 * 1000
export const EXTRA_MS = 2 * MINUTE_MS

export type BreakTimer = {
  remainingMs: number
}

export function newBreak(minutes: number): BreakTimer {
  return { remainingMs: minutes * MINUTE_MS }
}

export function tickBreak(t: BreakTimer, dt: number): BreakTimer {
  if (t.remainingMs <= 0) return t
  return { remainingMs: Math.max(0, t.remainingMs - dt) }
}

export function isBreakOver(t: BreakTimer): boolean {
  return t.remainingMs <= 0
}

/** STAY A BIT LONGER: two more minutes, as often as the player likes. */
export function extendBreak(t: BreakTimer): BreakTimer {
  return { remainingMs: t.remainingMs + EXTRA_MS }
}

/** "4:05" style clock text. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
