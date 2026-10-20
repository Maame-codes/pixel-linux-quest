import { Chip } from './Chip'
import { PixelButton } from './PixelButton'
import { ProgressPips } from './ProgressPips'
import type { World } from '../content/worlds'
import type { WorldStatus } from '../game/progress'
import styles from './WorldCard.module.css'

type WorldCardProps = {
  world: World
  status: WorldStatus
  cleared: number
  /** Route for the action button (continue/replay), or null when locked. */
  actionHref: string | null
}

const CHIP_LABEL: Record<WorldStatus, string> = {
  done: 'CLEARED',
  current: 'IN PROGRESS',
  locked: 'LOCKED',
}

const CHIP_TONE = { done: 'done', current: 'current', locked: 'locked' } as const

export function WorldCard({ world, status, cleared, actionHref }: WorldCardProps) {
  const total = world.levelCount
  const bandClass =
    status === 'done' ? styles.bandDone : status === 'current' ? styles.bandCurrent : styles.bandLocked

  return (
    <article className={status === 'current' ? `${styles.card} ${styles.cardCurrent}` : styles.card}>
      <div className={`${styles.band} ${bandClass}`} />
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.num}>WORLD {world.num}</span>
          <Chip tone={CHIP_TONE[status]}>{CHIP_LABEL[status]}</Chip>
        </div>
        <h3 className={styles.name}>{world.name}</h3>
        <p className={styles.topic}>{world.topic}</p>

        <ProgressPips
          total={total}
          cleared={cleared}
          currentIndex={status === 'current' ? cleared : undefined}
          label={`${cleared} of ${total} levels cleared`}
        />

        <div className={styles.bottomRow}>
          <span className={styles.progress}>
            {cleared}/{total} levels
          </span>
          {status === 'done' && actionHref ? (
            <PixelButton to={actionHref} variant="secondary">
              REPLAY
            </PixelButton>
          ) : null}
          {status === 'current' && actionHref ? (
            <PixelButton to={actionHref}>CONTINUE</PixelButton>
          ) : null}
          {status === 'locked' ? (
            <PixelButton disabled aria-label={`${world.name} is locked`}>
              LOCKED
            </PixelButton>
          ) : null}
        </div>
      </div>
    </article>
  )
}
