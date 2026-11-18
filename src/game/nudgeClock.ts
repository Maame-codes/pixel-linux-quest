// Pip's "want a quick break?" nudge: counts active learning time in levels
// (only while the tab is visible) and says when a nudge is due. Pure
// functions plus a small in-memory store shared by every level page.

export const NUDGE_EVERY_MS = 20 * 60 * 1000
/** Wait this long after the last key press, so the nudge never lands mid-command. */
export const QUIET_MS = 5000

export type NudgeClock = {
  /** Active time in levels so far. */
  activeMs: number
  /** Active time at which the next nudge is due. */
  nextAt: number
}

export function newNudgeClock(): NudgeClock {
  return { activeMs: 0, nextAt: NUDGE_EVERY_MS }
}

export function addActive(c: NudgeClock, ms: number): NudgeClock {
  return { ...c, activeMs: c.activeMs + ms }
}

export function nudgeDue(c: NudgeClock): boolean {
  return c.activeMs >= c.nextAt
}

/** NOT NOW: ask again after another 20 minutes. */
export function snooze(c: NudgeClock): NudgeClock {
  return { ...c, nextAt: c.activeMs + NUDGE_EVERY_MS }
}

/** The learner has been quiet long enough to show a nudge. */
export function isQuiet(lastKeyAt: number, now: number): boolean {
  return now - lastKeyAt >= QUIET_MS
}

// One clock for the whole visit, so moving between levels keeps counting.
let clock = newNudgeClock()

export function getNudgeClock(): NudgeClock {
  return clock
}

export function setNudgeClock(next: NudgeClock): void {
  clock = next
}

/** After a break, start counting from zero again. */
export function resetNudgeClock(): void {
  clock = newNudgeClock()
}
