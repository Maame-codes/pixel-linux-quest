import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { onSavedDataCleared } from './savedData'
import { defaultProgress, loadProgress, saveProgress, type Progress } from './progress'

type ProgressContextValue = {
  progress: Progress
  completeLevel: (id: string) => void
  markIntroSeen: () => void
  /** Earn a secret badge (does nothing if already earned). */
  earnSecret: (id: string) => void
  /** Add XP earned outside levels (a cleared practice round). */
  addBonusXp: (xp: number) => void
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveProgress(progress)
  }, [progress])

  const completeLevel = useCallback((id: string) => {
    setProgress((p) => (p.completed[id] ? p : { ...p, completed: { ...p.completed, [id]: true } }))
  }, [])

  const markIntroSeen = useCallback(() => {
    setProgress((p) => (p.introSeen ? p : { ...p, introSeen: true }))
  }, [])

  const earnSecret = useCallback((id: string) => {
    setProgress((p) => (p.secrets[id] ? p : { ...p, secrets: { ...p.secrets, [id]: true } }))
  }, [])

  const addBonusXp = useCallback((xp: number) => {
    setProgress((p) => ({ ...p, bonusXp: p.bonusXp + xp }))
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress())
  }, [])

  // "Clear my saved data" wipes storage; start again from a clean slate
  // without writing the empty progress straight back.
  const skipSave = useRef(false)
  useEffect(() => {
    return onSavedDataCleared(() => {
      skipSave.current = true
      setProgress(defaultProgress())
    })
  }, [])

  const value = useMemo(
    () => ({ progress, completeLevel, markIntroSeen, earnSecret, addBonusXp, resetProgress }),
    [progress, completeLevel, markIntroSeen, earnSecret, addBonusXp, resetProgress],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
