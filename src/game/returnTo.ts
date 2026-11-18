import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { nextPlayableLevel, type Progress } from './progress'

// Remembers the last page the learner was on outside the Break Room, so
// BACK TO MY QUEST can send them there.

const KEY = 'plq.returnTo'
export const BREAK_PATH = '/break'

/** Pages worth coming back to: anything except the Break Room and the title screen. */
export function isReturnPage(path: string): boolean {
  return path.startsWith('/') && path !== '/' && path !== BREAK_PATH && !path.startsWith(`${BREAK_PATH}/`)
}

export function rememberPage(path: string): void {
  if (!isReturnPage(path)) return
  try {
    localStorage.setItem(KEY, path)
  } catch {
    // Storage blocked: BACK TO MY QUEST falls back to the next level.
  }
}

export function rememberedPage(): string | null {
  try {
    const path = localStorage.getItem(KEY)
    return path && isReturnPage(path) ? path : null
  } catch {
    return null
  }
}

/** Where BACK TO MY QUEST goes: the remembered page, else the next playable level, else the map. */
export function questReturnPath(progress: Progress): string {
  const remembered = rememberedPage()
  if (remembered) return remembered
  const next = nextPlayableLevel(progress)
  return next ? `/level/${next}` : '/map'
}

/** Keeps track of the current page. Mount once inside the router. */
export function useRememberPage(): void {
  const { pathname } = useLocation()
  useEffect(() => {
    rememberPage(pathname)
  }, [pathname])
}
