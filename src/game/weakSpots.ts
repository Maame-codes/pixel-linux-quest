// Weak spots: how many mistakes the player has made with each command, so
// the world map can offer a short practice round. Saved only in this
// browser. Only command names and counts are stored, never what was typed.

import { registry, tokenize, type CommandResult } from '../shell'

const KEY = 'plq.weakSpots'
const VERSION = 1

export type WeakCounts = Record<string, number>

/** At least this many mistakes (with unlocked commands) before practice is offered. */
export const PRACTICE_THRESHOLD = 3

function isTracked(name: string): boolean {
  return Object.hasOwn(registry, name)
}

export function loadWeakSpots(): WeakCounts {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { version?: unknown; counts?: unknown } | null
    if (!parsed || parsed.version !== VERSION || typeof parsed.counts !== 'object' || parsed.counts === null) {
      return {}
    }
    const out: WeakCounts = {}
    for (const [name, n] of Object.entries(parsed.counts as Record<string, unknown>)) {
      // Anything that is not a known command name is dropped, so nothing the
      // player typed can end up saved here.
      if (isTracked(name) && typeof n === 'number' && Number.isFinite(n) && n > 0) out[name] = Math.floor(n)
    }
    return out
  } catch {
    return {}
  }
}

function save(counts: WeakCounts): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, counts }))
  } catch {
    // Storage blocked: weak spots just are not remembered.
  }
}

/**
 * Which command a failed line was a mistake with, or null. Only a command
 * that was unlocked where it was typed counts, so trying a locked command
 * is not a mistake. "cd.." and "LS" count for cd and ls.
 */
export function mistakeCommand(
  input: string,
  result: CommandResult,
  explained: boolean,
  unlocked: readonly string[],
): string | null {
  if (result.code === 0 && !explained) return null
  const t = tokenize(input.trim())
  if (!t.ok) return null
  const words = t.tokens.map((tok) => tok.text)
  while (words[0] === 'sudo' && words.length > 1) words.shift()
  const typed = words[0] ?? ''
  let name = typed
  if (!isTracked(name)) name = typed.toLowerCase()
  if (!isTracked(name)) {
    const glued = unlocked.find((c) => typed.length > c.length && typed.startsWith(c) && /^[.\-/~]/.test(typed.slice(c.length)))
    if (!glued) return null
    name = glued
  }
  return unlocked.includes(name) && isTracked(name) ? name : null
}

/** Add one mistake for a command. */
export function recordMistake(name: string): void {
  if (!isTracked(name)) return
  const counts = loadWeakSpots()
  counts[name] = (counts[name] ?? 0) + 1
  save(counts)
}

/** A practice task was cleared: one fewer mistake for that command. */
export function practiceCleared(name: string): void {
  const counts = loadWeakSpots()
  if (!counts[name]) return
  counts[name] -= 1
  if (counts[name] <= 0) delete counts[name]
  save(counts)
}

/** Total mistakes with commands in `eligible` (unlocked and practisable). */
export function weakTotal(counts: WeakCounts, eligible: readonly string[]): number {
  return eligible.reduce((sum, name) => sum + (counts[name] ?? 0), 0)
}

/** Eligible commands with mistakes, most mistakes first (ties by name). */
export function weakestCommands(counts: WeakCounts, eligible: readonly string[]): string[] {
  return eligible
    .filter((name) => (counts[name] ?? 0) > 0)
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || a.localeCompare(b))
}
