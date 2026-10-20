import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { defaultProgress, loadProgress, saveProgress, type Progress } from './progress'

type ProgressContextValue = {
  progress: Progress
  completeLevel: (id: string) => void
  markIntroSeen: () => void
  resetProgress: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const completeLevel = useCallback((id: string) => {
    setProgress((p) => (p.completed[id] ? p : { ...p, completed: { ...p.completed, [id]: true } }))
  }, [])

  const markIntroSeen = useCallback(() => {
    setProgress((p) => (p.introSeen ? p : { ...p, introSeen: true }))
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress())
  }, [])

  const value = useMemo(
    () => ({ progress, completeLevel, markIntroSeen, resetProgress }),
    [progress, completeLevel, markIntroSeen, resetProgress],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
