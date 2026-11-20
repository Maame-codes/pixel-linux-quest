// The Break Room's timer, as pure functions. A break can have a timer or
// none at all, and the player can change it at any time. Nothing here is
// saved: timer choices last for this visit to the Break Room only.

export const MINUTE_MS = 60 * 1000
/** - and + keep the timer between 1 and 60 minutes. */
export const MIN_MINUTES = 1
export const MAX_MINUTES = 60
/** The quick choices next to the clock, and the "add more" choices when time is up. */
export const QUICK_MINUTES = [5, 10, 15] as const

export type BreakTimer = {
  /** Time left, or null for no timer. */
  remainingMs: number | null
}

/** A break with a timer of `minutes`, or no timer when `minutes` is null. */
export function newBreak(minutes: number | null): BreakTimer {
  return { remainingMs: minutes === null ? null : minutes * MINUTE_MS }
}

/**
 * Where the break started decides the timer: a break taken from a level
 * uses the "Break length" setting, anywhere else starts with no timer.
 */
export function startingBreak(fromLevel: boolean, breakMinutes: number): BreakTimer {
  return newBreak(fromLevel ? breakMinutes : null)
}

export function hasTimer(t: BreakTimer): t is { remainingMs: number } {
  return t.remainingMs !== null
}

export function tickBreak(t: BreakTimer, dt: number): BreakTimer {
  if (t.remainingMs === null || t.remainingMs <= 0) return t
  return { remainingMs: Math.max(0, t.remainingMs - dt) }
}

export function isBreakOver(t: BreakTimer): boolean {
  return t.remainingMs !== null && t.remainingMs <= 0
}

const clampMs = (ms: number) => Math.min(MAX_MINUTES * MINUTE_MS, Math.max(MIN_MINUTES * MINUTE_MS, ms))

/** - and +: one minute less or more, kept between 1 and 60 minutes. */
export function stepBreak(t: BreakTimer, minutes: 1 | -1): BreakTimer {
  if (t.remainingMs === null) return t
  return { remainingMs: clampMs(t.remainingMs + minutes * MINUTE_MS) }
}

export function canStep(t: BreakTimer, minutes: 1 | -1): boolean {
  if (t.remainingMs === null) return false
  return minutes > 0 ? t.remainingMs < MAX_MINUTES * MINUTE_MS : t.remainingMs > MIN_MINUTES * MINUTE_MS
}

/** A quick choice (5, 10, 15) or SET A TIMER: the timer now shows exactly that. */
export function setBreak(minutes: number): BreakTimer {
  return { remainingMs: clampMs(minutes * MINUTE_MS) }
}

/** When time is up, +5, +10 or +15 more minutes, as often as the player likes. */
export function extendBreak(t: BreakTimer, minutes: number): BreakTimer {
  return { remainingMs: clampMs((t.remainingMs ?? 0) + minutes * MINUTE_MS) }
}

/** NO TIMER. */
export function noTimer(): BreakTimer {
  return { remainingMs: null }
}

/** "4:05" style clock text. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
