import type { ElementType, ReactNode } from 'react'

import styles from './Panel.module.css'

type PanelProps = {
  children: ReactNode
  /** Base colour: the slate panel (default) or the deep-blue panel-2. */
  tone?: 'panel' | 'panel-2'
  as?: ElementType
  className?: string
}

export function Panel({ children, tone = 'panel', as: As = 'section', className }: PanelProps) {
  const toneClass = tone === 'panel-2' ? styles.panel2 : styles.panel
  const cls = [styles.base, toneClass, className].filter(Boolean).join(' ')
  return <As className={cls}>{children}</As>
}
