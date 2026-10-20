import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Page } from '../components/Page'
import { Panel } from '../components/Panel'
import { PixelButton } from '../components/PixelButton'
import { getLevel, LEVEL_ORDER } from '../content/levels'
import type { Level } from '../content/types'
import { ChallengePlayer } from '../game/ChallengePlayer'
import { LessonPages } from '../game/LessonPages'
import { LevelShell } from '../game/LevelShell'
import styles from './PlaceholderPage.module.css'

function nextHrefFor(id: string): string | null {
  const idx = LEVEL_ORDER.indexOf(id)
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null
  return `/level/${LEVEL_ORDER[idx + 1]}`
}

function LevelRunner({ level }: { level: Level }) {
  const [phase, setPhase] = useState<'lesson' | 'test'>('lesson')
  const nextHref = nextHrefFor(level.id)
  const clearMessage = `Nice work — you cleared ${level.title}.`

  return (
    <LevelShell level={level}>
      {phase === 'lesson' ? (
        <LessonPages
          pages={level.lessonPages}
          finishLabel={level.test.kind === 'challenge' ? 'START QUEST' : 'TAKE THE QUIZ'}
          onFinish={() => setPhase('test')}
        />
      ) : level.test.kind === 'challenge' ? (
        <ChallengePlayer
          test={level.test}
          xp={level.xp}
          clearMessage={clearMessage}
          nextHref={nextHref}
          onReviewLesson={() => setPhase('lesson')}
          onCompleted={() => {}}
        />
      ) : (
        <Panel>
          <p className={styles.lead}>The quiz player arrives in the next phase.</p>
        </Panel>
      )}
    </LevelShell>
  )
}

export function LevelPage() {
  const { id } = useParams<{ id: string }>()
  const level = id ? getLevel(id) : undefined

  if (!level) {
    return (
      <Page>
        <div className={styles.head}>
          <h1 className={styles.title}>LEVEL NOT FOUND</h1>
          <span className={styles.meta}>{id ?? 'unknown'}</span>
        </div>
        <Panel>
          <p className={styles.lead}>That level does not exist yet.</p>
          <div className={styles.links}>
            <PixelButton to="/map" variant="secondary">
              &lt; BACK TO MAP
            </PixelButton>
          </div>
        </Panel>
      </Page>
    )
  }

  return <LevelRunner key={level.id} level={level} />
}
