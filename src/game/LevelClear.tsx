import { PixelButton } from '../components/PixelButton'
import styles from './LevelClear.module.css'

type LevelClearProps = {
  xp: number
  message: string
  onReplay: () => void
  /** Route to the next level, or null if this is the last unlocked level. */
  nextHref: string | null
}

export function LevelClear({ xp, message, onReplay, nextHref }: LevelClearProps) {
  return (
    <div className={styles.banner} role="status">
      <div className={styles.text}>
        <span className={styles.title}>LEVEL CLEAR! +{xp} XP</span>
        <span className={styles.message}>{message}</span>
      </div>
      <div className={styles.actions}>
        <PixelButton variant="secondary" onClick={onReplay}>
          REPLAY
        </PixelButton>
        {nextHref ? (
          <PixelButton to={nextHref}>NEXT LEVEL</PixelButton>
        ) : (
          <PixelButton to="/map">BACK TO MAP</PixelButton>
        )}
      </div>
    </div>
  )
}
