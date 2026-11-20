// "Clear my saved data": everything this site keeps lives in this browser's
// localStorage under keys that start with "plq." (progress, high scores,
// settings, weak spots, map choice, last page). Nothing is sent anywhere.

import { reloadSettings } from '../arcade/settings'
import { clearAllSnapshots } from './levelSnapshots'
import { resetNudgeClock } from './nudgeClock'

const PREFIX = 'plq.'
const listeners = new Set<() => void>()

/** Delete every key this site saved, and reset what is held in memory. */
export function clearSavedData(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage blocked: there was nothing saved to clear.
  }
  clearAllSnapshots()
  resetNudgeClock()
  reloadSettings()
  listeners.forEach((l) => l())
}

/** Run `listener` after saved data is cleared. Returns an unsubscribe function. */
export function onSavedDataCleared(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
