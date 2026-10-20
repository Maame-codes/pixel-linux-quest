import { Page } from '../components/Page'
import { PixelButton } from '../components/PixelButton'
import { SpeechBubble } from '../components/SpeechBubble'
import { WorldCard } from '../components/WorldCard'
import { getLevelsByWorld, LEVELS } from '../content/levels'
import { WORLDS } from '../content/worlds'
import { IntroArt } from '../game/IntroArt'
import { useProgress } from '../game/ProgressContext'
import {
  badges,
  completedCount,
  earnedXp,
  nextLevelInWorld,
  nextPlayableLevel,
  worldClearedCount,
  worldStatus,
} from '../game/progress'
import styles from './MapPage.module.css'

export function MapPage() {
  const { progress } = useProgress()

  const cleared = completedCount(progress)
  const xp = earnedXp(progress)
  const badgeCount = badges(progress).filter((b) => b.earned).length

  const next = nextPlayableLevel(progress)
  const continueHref = next ? `/level/${next}` : `/level/${LEVELS[0].id}`
  const continueLabel = cleared > 0 ? 'CONTINUE' : 'START LEVEL 1'

  const totalLevels = WORLDS.reduce((n, w) => n + w.levelCount, 0)

  return (
    <Page>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>YOUR QUEST</p>
          <h1 className={styles.headline}>Learn Linux one level at a time.</h1>
          <p className={styles.blurb}>
            Type real commands in a pocket terminal, clear quests, earn XP and unlock new worlds.
            Nothing to install — just you, Pip and the shell.
          </p>
          <div className={styles.heroButtons}>
            <PixelButton to={continueHref}>{continueLabel}</PixelButton>
            <PixelButton to="/sandbox" variant="secondary">
              FREE PLAY SANDBOX
            </PixelButton>
            <PixelButton to="/intro" variant="secondary">
              REPLAY STORY
            </PixelButton>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{xp}</span>
              <span className={styles.statLabel}>XP earned</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{cleared}</span>
              <span className={styles.statLabel}>levels cleared</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{badgeCount}</span>
              <span className={styles.statLabel}>badges</span>
            </div>
          </div>
        </div>

        <div className={styles.heroArt}>
          <div className={styles.artFrame}>
            <IntroArt sceneId="your-turn" />
          </div>
          <SpeechBubble>Hi, I’m Pip! Pick a world and let’s dig in.</SpeechBubble>
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.mapHead}>
          <h2 className={styles.mapTitle}>WORLD MAP</h2>
          <span className={styles.mapMeta}>
            {WORLDS.length} worlds, {totalLevels} levels, 1 final boss
          </span>
        </div>
        <div className={styles.grid}>
          {WORLDS.map((world) => {
            const status = worldStatus(progress, world.num)
            const worldLevels = getLevelsByWorld(world.num)
            let actionHref: string | null = null
            if (status === 'done') actionHref = `/level/${worldLevels[0].id}`
            else if (status === 'current') {
              const nextId = nextLevelInWorld(progress, world.num)
              actionHref = nextId ? `/level/${nextId}` : null
            }
            return (
              <WorldCard
                key={world.num}
                world={world}
                status={status}
                cleared={worldClearedCount(progress, world.num)}
                actionHref={actionHref}
              />
            )
          })}
        </div>
      </section>
    </Page>
  )
}
