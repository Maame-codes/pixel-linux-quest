// How the Break Room knows a break was taken from a level: the level's
// BREAK ROOM link and Pip's break nudge pass this as router state. Any other
// way in (the map, the title screen, the header nav, a typed address)
// starts the break with no timer.

export const FROM_LEVEL = { breakFrom: 'level' } as const

export function cameFromLevel(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { breakFrom?: unknown }).breakFrom === 'level'
}
