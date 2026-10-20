import { useMemo, useRef, useState } from 'react'

import { Panel } from '../components/Panel'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { QuestList } from '../components/QuestList'
import { Terminal } from '../components/Terminal'
import { lookupCommand, shortenPath } from '../shell'
import type { ChallengeTest } from '../content/types'
import { useShellSession } from './useShellSession'
import { LevelClear } from './LevelClear'
import styles from './ChallengePlayer.module.css'

const WELCOME = 'Welcome to Pip’s pocket terminal. Type help to see what you can do.'

type ChallengePlayerProps = {
  test: ChallengeTest
  xp: number
  clearMessage: string
  nextHref: string | null
  onReviewLesson: () => void
  /** Fired once, the first time every objective is complete. */
  onCompleted: () => void
}

export function ChallengePlayer({
  test,
  xp,
  clearMessage,
  nextHref,
  onReviewLesson,
  onCompleted,
}: ChallengePlayerProps) {
  const sessionOpts = useMemo(
    () => ({
      commands: test.commands,
      seedFs: test.seedFs,
      startDir: test.startDir,
      welcome: WELCOME,
    }),
    [test],
  )
  const session = useShellSession(sessionOpts)

  const objectives = test.objectives
  const doneRef = useRef<boolean[]>(objectives.map(() => false))
  const completeRef = useRef(false)
  const [done, setDone] = useState<boolean[]>(doneRef.current)
  const [complete, setComplete] = useState(false)
  const [revealStep, setRevealStep] = useState<number | null>(null)

  const activeIndex = done.findIndex((d) => !d)
  const currentStep = activeIndex === -1 ? objectives.length : activeIndex

  function handleSubmit(input: string) {
    const result = session.submit(input)
    const next = doneRef.current.map(
      (d, i) => d || objectives[i].check(result.state, result),
    )
    doneRef.current = next
    setDone(next)
    if (next.every(Boolean) && !completeRef.current) {
      completeRef.current = true
      setComplete(true)
      onCompleted()
    }
  }

  function replay() {
    session.reset()
    doneRef.current = objectives.map(() => false)
    completeRef.current = false
    setDone(doneRef.current)
    setComplete(false)
    setRevealStep(null)
  }

  const showAnswer = !complete && revealStep === currentStep
  const pipLine = complete
    ? 'Quest complete — nice work, explorer!'
    : objectives[currentStep]?.hint ?? ''
  const answer = objectives[currentStep]?.answer ?? ''

  const promptTitle = `${session.state.user}@${session.state.host}: ${shortenPath(
    session.state.cwd,
    session.state.home,
  )}`

  const questItems = objectives.map((o, i) => ({ id: o.id, label: o.label, done: done[i] }))

  return (
    <div className={styles.wrap}>
      {complete ? (
        <LevelClear xp={xp} message={clearMessage} onReplay={replay} nextHref={nextHref} />
      ) : null}

      <div className={styles.columns}>
        <div className={styles.side}>
          <Panel className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>COMMANDS</h2>
              <PixelButton variant="secondary" onClick={onReviewLesson}>
                REVIEW LESSON
              </PixelButton>
            </div>
            <ul className={styles.cmdList}>
              {test.commands.map((name) => {
                const cmd = lookupCommand(name)
                return (
                  <li key={name} className={styles.cmdRow}>
                    <code className={styles.cmdCode}>{cmd?.usage ?? name}</code>
                    <span className={styles.cmdText}>{cmd?.summary ?? ''}</span>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>QUEST</h2>
              <span className={styles.xpChip}>+{xp} XP</span>
            </div>
            <QuestList items={questItems} activeIndex={complete ? -1 : currentStep} />
          </Panel>
        </div>

        <div className={styles.main}>
          <Terminal
            lines={session.lines}
            prompt={session.prompt}
            title={promptTitle}
            history={session.state.history}
            onSubmit={handleSubmit}
          />

          <div className={styles.pipRow}>
            <Pip size={88} mood={complete ? 'cheer' : 'happy'} />
            <div className={styles.hint}>
              <div className={styles.hintText}>
                <span className={styles.hintLabel}>PIP SAYS</span>
                <span className={styles.hintBody}>{pipLine}</span>
                {showAnswer ? <code className={styles.answer}>{answer}</code> : null}
              </div>
              {!complete && answer ? (
                <PixelButton variant="secondary" onClick={() => setRevealStep(currentStep)}>
                  SHOW ANSWER
                </PixelButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
