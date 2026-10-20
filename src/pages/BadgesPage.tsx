import { Page } from '../components/Page'
import { Pip } from '../components/Pip'
import { ProgressPips } from '../components/ProgressPips'
import { useProgress } from '../game/ProgressContext'
import { badges } from '../game/progress'
import styles from './BadgesPage.module.css'

export function BadgesPage() {
  const { progress } = useProgress()
  const list = badges(progress)
  const earnedCount = list.filter((b) => b.earned).length

  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>BADGES</h1>
        <span className={styles.meta}>
          {earnedCount} / {list.length} earned
        </span>
      </div>

      <div className={styles.grid}>
        {list.map((badge) => {
          const comingSoon = badge.total === 0
          const state = badge.earned ? styles.earned : comingSoon ? styles.soon : styles.inProgress
          return (
            <div key={badge.world} className={`${styles.badge} ${state}`}>
              <div className={styles.medal} aria-hidden="true">
                <Pip size={56} mood={badge.earned ? 'cheer' : 'happy'} />
              </div>
              <div className={styles.info}>
                <span className={styles.worldNum}>WORLD {badge.world}</span>
                <h2 className={styles.name}>{badge.name}</h2>
                {comingSoon ? (
                  <span className={styles.statusText}>Coming soon</span>
                ) : (
                  <>
                    <ProgressPips
                      total={badge.total}
                      cleared={badge.cleared}
                      label={`${badge.cleared} of ${badge.total} levels cleared`}
                    />
                    <span className={styles.statusText}>
                      {badge.earned
                        ? 'Badge earned!'
                        : `${badge.cleared} / ${badge.total} levels cleared`}
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Page>
  )
}
