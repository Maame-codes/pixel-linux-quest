import { useSyncExternalStore } from 'react'

// Player settings shared by the arcade and the rest of the site, saved in
// localStorage. Storage can be blocked (private mode), so every access is
// wrapped and the defaults are used instead.

export type Settings = {
  /** 8-bit sound effects in the Break Room games. Off by default. */
  sound: boolean
  /** Pip's "want a quick break?" nudges during levels. On by default. */
  nudges: boolean
}

const KEY = 'plq.settings'
export const DEFAULT_SETTINGS: Settings = { sound: false, nudges: true }

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<Settings> | null
    return {
      sound: typeof parsed?.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      nudges: typeof parsed?.nudges === 'boolean' ? parsed.nudges : DEFAULT_SETTINGS.nudges,
    }
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

/** Re-read storage (used by tests after they clear it). */
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
