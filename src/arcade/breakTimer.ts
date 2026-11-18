// The Break Room's 5 minute timer, as pure functions.

export const BREAK_MS = 5 * 60 * 1000
export const EXTRA_MS = 2 * 60 * 1000

export type BreakTimer = {
  remainingMs: number
  /** +2 MINUTES can be used once per break. */
  extended: boolean
}

export function newBreak(): BreakTimer {
  return { remainingMs: BREAK_MS, extended: false }
}

export function tickBreak(t: BreakTimer, dt: number): BreakTimer {
  if (t.remainingMs <= 0) return t
  return { ...t, remainingMs: Math.max(0, t.remainingMs - dt) }
}

export function isBreakOver(t: BreakTimer): boolean {
  return t.remainingMs <= 0
}

export function canExtend(t: BreakTimer): boolean {
  return !t.extended
}

export function extendBreak(t: BreakTimer): BreakTimer {
  if (t.extended) return t
  return { remainingMs: t.remainingMs + EXTRA_MS, extended: true }
}

/** "4:05" style clock text. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
