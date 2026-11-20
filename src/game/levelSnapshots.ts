import type { ShellState } from '../shell'
import type { TerminalLine } from './useShellSession'

// Keeps an unfinished challenge (terminal, files and ticked objectives) in
// memory while the learner pops out, for example to the Break Room, so
// coming back carries on where they left off. Finished levels are already
// saved in progress; this only covers the one in the middle.

export type LevelSnapshot = {
  state: ShellState
  lines: TerminalLine[]
  done: boolean[]
  /** Tries per objective, for SHOW ANSWER in boss levels and recall objectives. */
  attempts?: number[]
  /** Boss levels: time left on the clock. */
  timeLeftMs?: number
}

const snapshots = new Map<string, LevelSnapshot>()

export function saveSnapshot(levelId: string, snap: LevelSnapshot): void {
  snapshots.set(levelId, snap)
}

export function loadSnapshot(levelId: string): LevelSnapshot | null {
  return snapshots.get(levelId) ?? null
}

export function clearSnapshot(levelId: string): void {
  snapshots.delete(levelId)
}

/** Forget every unfinished run (used when saved data is cleared). */
export function clearAllSnapshots(): void {
  snapshots.clear()
}
