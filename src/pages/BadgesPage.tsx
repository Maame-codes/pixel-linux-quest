import { Page } from '../components/Page'
import { Pip } from '../components/Pip'
import { ProgressPips } from '../components/ProgressPips'
import { useProgress } from '../game/ProgressContext'
import { badges, secretBadges } from '../game/progress'
import styles from './BadgesPage.module.css'

export function BadgesPage() {
  const { progress } = useProgress()
  const list = badges(progress)
  const secrets = secretBadges(progress)
  const earnedCount = list.filter((b) => b.earned).length + secrets.filter((b) => b.earned).length
  const totalCount = list.length + secrets.length

  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>BADGES</h1>
        <span className={styles.meta}>
          {earnedCount} / {totalCount} earned
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
        {secrets.map((secret) => (
          <div
            key={secret.id}
            className={`${styles.badge} ${secret.earned ? styles.secretEarned : styles.secretHidden}`}
          >
            <div className={`${styles.medal} ${styles.secretMedal}`} aria-hidden="true">
              {secret.earned ? <Pip size={56} mood="cheer" /> : <span className={styles.mystery}>?</span>}
            </div>
            <div className={styles.info}>
              <span className={styles.worldNum}>SECRET BADGE</span>
              <h2 className={styles.name}>{secret.earned ? secret.name.toUpperCase() : '???'}</h2>
              <span className={styles.statusText}>{secret.earned ? secret.how : 'Not found yet.'}</span>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}
