import type { ReactNode } from 'react'

import styles from './Chip.module.css'

type ChipTone = 'done' | 'current' | 'locked' | 'xp'

type ChipProps = {
  children: ReactNode
  tone?: ChipTone
  className?: string
}

const toneClass: Record<ChipTone, string> = {
  done: styles.done,
  current: styles.current,
  locked: styles.locked,
  xp: styles.xp,
}

export function Chip({ children, tone = 'current', className }: ChipProps) {
  const cls = [styles.chip, toneClass[tone], className].filter(Boolean).join(' ')
  return <span className={cls}>{children}</span>
}
