import type { ReactNode } from 'react'

import styles from './SpeechBubble.module.css'

type SpeechBubbleProps = {
  children: ReactNode
  /** Small caps label above the text, e.g. "PIP SAYS". */
  label?: string
  className?: string
}

export function SpeechBubble({ children, label, className }: SpeechBubbleProps) {
  const cls = [styles.bubble, className].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
