import type { Control } from './types'

// Keyboard mapping shared by every game. Pure, so it is easy to test.

const KEYS: Record<string, Control> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
  ' ': 'action',
  Enter: 'action',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
}

/** The game control for a KeyboardEvent.key, if any. */
export function controlForKey(key: string): Control | null {
  return KEYS[key] ?? null
}

/** P and Esc pause or resume. */
export function isPauseKey(key: string): boolean {
  return key === 'p' || key === 'P' || key === 'Escape'
}

/** Turn a swipe (in screen pixels) into a direction, or null if it was a tap. */
export function swipeDirection(dx: number, dy: number, min = 24): Control | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}
