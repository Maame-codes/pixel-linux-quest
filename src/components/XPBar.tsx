import styles from './XPBar.module.css'

type XPBarProps = {
  level: number
  value: number
  max: number
  className?: string
}

export function XPBar({ level, value, max, className }: XPBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0
  const cls = [styles.wrap, className].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <span className={styles.level}>LVL {level}</span>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Experience: ${value} of ${max} XP`}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.text}>
        {value}/{max} XP
      </span>
    </div>
  )
}
