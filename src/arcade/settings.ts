import { useSyncExternalStore } from 'react'

// Player settings shared by the arcade and the rest of the site, saved in
// localStorage. Storage can be blocked (private mode), so every access is
// wrapped and the defaults are used instead.

export const NUDGE_CHOICES = [15, 20, 30, 45, 0] as const
export const BREAK_CHOICES = [3, 5, 10] as const

/** Minutes of level time between break reminders. 0 means Off. */
export type NudgeMinutes = (typeof NUDGE_CHOICES)[number]
/** Length of a Break Room break, in minutes. */
export type BreakMinutes = (typeof BREAK_CHOICES)[number]

export type Settings = {
  /** 8-bit sound effects in the Break Room games. Off by default. */
  sound: boolean
  /** Pip's "want a quick break?" reminder, every N minutes in levels. 0 = Off. */
  nudgeMinutes: NudgeMinutes
  /** How long a break in the Break Room lasts. */
  breakMinutes: BreakMinutes
}

const KEY = 'plq.settings'
export const DEFAULT_SETTINGS: Settings = { sound: false, nudgeMinutes: 20, breakMinutes: 5 }

function pick<T>(choices: readonly T[], value: unknown, fallback: T): T {
  return choices.includes(value as T) ? (value as T) : fallback
}

/** Turn whatever is saved (maybe an older version) into valid settings. */
export function parseSettings(raw: unknown): Settings {
  const p = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  let nudgeMinutes = pick(NUDGE_CHOICES, p.nudgeMinutes, DEFAULT_SETTINGS.nudgeMinutes)
  // Older saves had an on/off switch called "nudges". Off stays off.
  if (p.nudgeMinutes === undefined && p.nudges === false) nudgeMinutes = 0
  return {
    sound: typeof p.sound === 'boolean' ? p.sound : DEFAULT_SETTINGS.sound,
    nudgeMinutes,
    breakMinutes: pick(BREAK_CHOICES, p.breakMinutes, DEFAULT_SETTINGS.breakMinutes),
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return parseSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

let current: Settings = loadSettings()
const listeners = new Set<() => void>()

function save(next: Settings): void {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Not saved, but the choice still lasts for this visit.
  }
  listeners.forEach((l) => l())
}

export function getSettings(): Settings {
  return current
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  save({ ...current, [key]: value })
}

/** Re-read storage (used by tests and after clearing saved data). */
export function reloadSettings(): void {
  current = loadSettings()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: one setting and a function to change it. */
export function useSetting<K extends keyof Settings>(key: K): [Settings[K], (value: Settings[K]) => void] {
  const value = useSyncExternalStore(subscribe, () => current[key])
  return [value, (v: Settings[K]) => setSetting(key, v)]
}
