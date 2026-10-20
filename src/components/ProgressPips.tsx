import styles from './ProgressPips.module.css'

type ProgressPipsProps = {
  total: number
  cleared: number
  /** Index of the level currently in progress (highlighted), if any. */
  currentIndex?: number
  label?: string
  className?: string
}

export function ProgressPips({ total, cleared, currentIndex, label, className }: ProgressPipsProps) {
  const cls = [styles.pips, className].filter(Boolean).join(' ')
  return (
    <div className={cls} aria-label={label ?? `${cleared} of ${total} levels cleared`}>
      {Array.from({ length: total }, (_, i) => {
        let state = styles.empty
        if (i < cleared) state = styles.cleared
        else if (i === currentIndex) state = styles.current
        return <div key={i} className={`${styles.pip} ${state}`} />
      })}
    </div>
  )
}
