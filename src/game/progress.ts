import { getLevel, getLevelsByWorld, LEVELS } from '../content/levels'
import { WORLDS } from '../content/worlds'

export type Progress = {
  version: number
  /** Map of completed level ids. */
  completed: Record<string, true>
  introSeen: boolean
}

const KEY = 'plq.progress'
const VERSION = 1

export function defaultProgress(): Progress {
  return { version: VERSION, completed: {}, introSeen: false }
}

/** Load progress from localStorage, falling back to a clean slate on any problem. */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Partial<Progress> | null
    if (!parsed || parsed.version !== VERSION || typeof parsed.completed !== 'object') {
      return defaultProgress()
    }
    const completed: Record<string, true> = {}
    for (const id of Object.keys(parsed.completed ?? {})) completed[id] = true
    return { version: VERSION, completed, introSeen: Boolean(parsed.introSeen) }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // Storage may be unavailable (private mode, quota). Progress stays in memory.
  }
}

// ---- Derived selectors -----------------------------------------------------

export function isCompleted(p: Progress, id: string): boolean {
  return Boolean(p.completed[id])
}

export function earnedXp(p: Progress): number {
  return LEVELS.reduce((sum, lvl) => (p.completed[lvl.id] ? sum + lvl.xp : sum), 0)
}

export function totalXp(): number {
  return LEVELS.reduce((sum, lvl) => sum + lvl.xp, 0)
}

export function completedCount(p: Progress): number {
  return LEVELS.filter((lvl) => p.completed[lvl.id]).length
}

export function worldClearedCount(p: Progress, world: number): number {
  return getLevelsByWorld(world).filter((lvl) => p.completed[lvl.id]).length
}

export function isWorldCleared(p: Progress, world: number): boolean {
  const levels = getLevelsByWorld(world)
  return levels.length > 0 && levels.every((lvl) => p.completed[lvl.id])
}

export function isWorldUnlocked(p: Progress, world: number): boolean {
  if (getLevelsByWorld(world).length === 0) return false
  return world === 1 || isWorldCleared(p, world - 1)
}

export function isLevelUnlocked(p: Progress, id: string): boolean {
  const lvl = getLevel(id)
  if (!lvl) return false
  if (!isWorldUnlocked(p, lvl.world)) return false
  const levels = getLevelsByWorld(lvl.world)
  const idx = levels.findIndex((l) => l.id === id)
  if (idx <= 0) return true
  return Boolean(p.completed[levels[idx - 1].id])
}

/** The next uncompleted level in a world, or null if the world is cleared. */
export function nextLevelInWorld(p: Progress, world: number): string | null {
  const levels = getLevelsByWorld(world)
  const next = levels.find((lvl) => !p.completed[lvl.id])
  return next ? next.id : null
}

/** The next level to play across the whole game, for the "continue" button. */
export function nextPlayableLevel(p: Progress): string | null {
  for (const lvl of LEVELS) {
    if (isLevelUnlocked(p, lvl.id) && !p.completed[lvl.id]) return lvl.id
  }
  return null
}

export type WorldStatus = 'done' | 'current' | 'locked'

export function worldStatus(p: Progress, world: number): WorldStatus {
  if (getLevelsByWorld(world).length === 0) return 'locked'
  if (isWorldCleared(p, world)) return 'done'
  if (isWorldUnlocked(p, world)) return 'current'
  return 'locked'
}

export type Badge = {
  world: number
  name: string
  cleared: number
  total: number
  earned: boolean
}

export function badges(p: Progress): Badge[] {
  return WORLDS.map((w) => {
    const total = getLevelsByWorld(w.num).length
    const cleared = worldClearedCount(p, w.num)
    return { world: w.num, name: w.name, cleared, total, earned: total > 0 && cleared === total }
  })
}
