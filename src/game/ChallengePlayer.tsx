import { useEffect, useMemo, useRef, useState } from 'react'

import { formatClock } from '../arcade/breakTimer'
import { useSetting } from '../arcade/settings'
import { Panel } from '../components/Panel'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { QuestList } from '../components/QuestList'
import { explainMistake, lookupCommand, shortenPath } from '../shell'
import type { ChallengeTest } from '../content/types'
import { useShellSession } from './useShellSession'
import { LevelClear } from './LevelClear'
import { clearSnapshot, loadSnapshot, saveSnapshot } from './levelSnapshots'
import { TerminalWithMap } from './TerminalWithMap'
import { mistakeCommand, recordMistake } from './weakSpots'
import styles from './ChallengePlayer.module.css'

const WELCOME = 'Welcome to Pip’s pocket terminal. Type help to see what you can do.'

/** In boss levels and on recall objectives, SHOW ANSWER appears after this many tries. */
export const TRIES_BEFORE_ANSWER = 3

type ChallengePlayerProps = {
  test: ChallengeTest
  /** Keeps an unfinished run in memory if the learner leaves and comes back. */
  levelId?: string
  /** The level's world, so Pip can say when a command unlocks. */
  world: number
  xp: number
  clearMessage: string
  nextHref: string | null
  onReviewLesson: () => void
  /** Fired once, the first time every objective is complete. */
  onCompleted: () => void
}

export function ChallengePlayer({
  test,
  levelId,
  world,
  xp,
  clearMessage,
  nextHref,
  onReviewLesson,
  onCompleted,
}: ChallengePlayerProps) {
  // An unfinished run from earlier in this visit, if the learner popped out.
  const [snapshot] = useState(() => (levelId ? loadSnapshot(levelId) : null))
  const sessionOpts = useMemo(
    () => ({
      commands: test.commands,
      seedFs: test.seedFs,
      startDir: test.startDir,
      welcome: WELCOME,
      resume: snapshot,
    }),
    [test, snapshot],
  )
  const session = useShellSession(sessionOpts)

  const objectives = test.objectives
  const fresh = () => objectives.map(() => false)
  const doneRef = useRef<boolean[]>(
    snapshot && snapshot.done.length === objectives.length ? snapshot.done : fresh(),
  )
  const completeRef = useRef(false)
  const [done, setDone] = useState<boolean[]>(doneRef.current)
  const [complete, setComplete] = useState(false)
  const [revealStep, setRevealStep] = useState<number | null>(null)
  // Pip's note on the last command, if it went wrong.
  const [mistake, setMistake] = useState<string | null>(null)
  // Set when the mission can no longer be won (an important file was deleted).
  const [failure, setFailure] = useState<string | null>(() =>
    snapshot && test.failure ? test.failure(snapshot.state) : null,
  )
  const [attempts, setAttempts] = useState<number[]>(() =>
    snapshot?.attempts?.length === objectives.length ? snapshot.attempts : objectives.map(() => 0),
  )

  // Boss levels: a countdown, unless the player turned the timer off.
  const limitMs = test.boss ? test.boss.timeLimitSec * 1000 : null
  const [timerOn, setTimerOn] = useSetting('bossTimer')
  const [timeLeft, setTimeLeft] = useState<number>(() => snapshot?.timeLeftMs ?? limitMs ?? 0)
  const timed = limitMs !== null && timerOn
  const timeUp = timed && timeLeft <= 0 && !complete
  const clockRunning = timed && !complete && !failure && !timeUp

  useEffect(() => {
    if (!clockRunning) return
    const id = window.setInterval(() => {
      if (!document.hidden) setTimeLeft((t) => Math.max(0, t - 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [clockRunning])

  // Keep the run in memory until it is finished.
  useEffect(() => {
    if (!levelId) return
    if (complete) clearSnapshot(levelId)
    else {
      saveSnapshot(levelId, {
        state: session.state,
        lines: session.lines,
        done,
        attempts,
        timeLeftMs: limitMs !== null ? timeLeft : undefined,
      })
    }
  }, [levelId, complete, session.state, session.lines, done, attempts, timeLeft, limitMs])

  const activeIndex = done.findIndex((d) => !d)
  const currentStep = activeIndex === -1 ? objectives.length : activeIndex
  const current = objectives[currentStep]
  const stopped = Boolean(failure) || timeUp

  function handleSubmit(input: string) {
    if (stopped) return
    const { result, before } = session.submit(input)
    const explanation = explainMistake(input, result, before, { unlocked: test.commands, world })
    setMistake(explanation)
    const weak = mistakeCommand(input, result, explanation !== null, test.commands)
    if (weak) recordMistake(weak)

    const next = doneRef.current.map((d, i) => d || objectives[i].check(result.state, result))
    // A try that did not finish the current objective counts towards SHOW ANSWER.
    if (input.trim() !== '' && currentStep < objectives.length && !next[currentStep]) {
      setAttempts((a) => a.map((n, i) => (i === currentStep ? n + 1 : n)))
    }
    doneRef.current = next
    setDone(next)

    const failed = test.failure?.(result.state) ?? null
    if (failed) {
      setFailure(failed)
      return
    }
    if (next.every(Boolean) && !completeRef.current) {
      completeRef.current = true
      setComplete(true)
      onCompleted()
    }
  }

  function restart() {
    session.reset()
    doneRef.current = fresh()
    completeRef.current = false
    setDone(doneRef.current)
    setComplete(false)
    setRevealStep(null)
    setMistake(null)
    setFailure(null)
    setAttempts(objectives.map(() => 0))
    setTimeLeft(limitMs ?? 0)
  }

  const gated = Boolean(test.boss) || Boolean(current?.recall)
  const tries = attempts[currentStep] ?? 0
  const answerReady = !gated || tries >= TRIES_BEFORE_ANSWER
  const showAnswer = !complete && answerReady && revealStep === currentStep
  const answer = current?.answer ?? ''

  let pipLine: string
  if (complete) pipLine = 'Quest complete. Nice work, explorer!'
  else if (failure) pipLine = failure
  else if (timeUp) pipLine = 'The fire spread before you finished. No harm done: try again as often as you like.'
  else pipLine = mistake ?? current?.hint ?? ''

  const promptTitle = `${session.state.user}@${session.state.host}: ${shortenPath(
    session.state.cwd,
    session.state.home,
  )}`

  const questItems = objectives.map((o, i) => ({ id: o.id, label: o.label, done: done[i] }))

  return (
    <div className={styles.wrap}>
      {complete ? (
        <LevelClear xp={xp} message={clearMessage} onReplay={restart} nextHref={nextHref} />
      ) : null}

      {test.boss ? (
        <div className={styles.bossBar}>
          <span className={styles.bossChip}>BOSS LEVEL</span>
          {timed ? (
            <span className={styles.clock} role="timer" aria-label={`Time left: ${formatClock(timeLeft)}`}>
              {formatClock(timeLeft)}
            </span>
          ) : (
            <span className={styles.noClock}>No timer. Take your time.</span>
          )}
          <PixelButton variant="secondary" onClick={() => setTimerOn(!timerOn)}>
            {timerOn ? 'TIMER: ON' : 'TIMER: OFF'}
          </PixelButton>
        </div>
      ) : null}

      {failure ? (
        <div className={styles.stopBanner} role="alert">
          <div>
            <p className={styles.stopTitle}>MISSION FAILED</p>
            <p className={styles.stopText}>{failure}</p>
          </div>
          <PixelButton onClick={restart}>RESTART LEVEL</PixelButton>
        </div>
      ) : null}

      {timeUp && !failure ? (
        <div className={styles.stopBanner} role="alert">
          <div>
            <p className={styles.stopTitle}>TIME&apos;S UP</p>
            <p className={styles.stopText}>No penalty. Try again as often as you like, or turn the timer off.</p>
          </div>
          <div className={styles.stopButtons}>
            <PixelButton onClick={restart}>TRY AGAIN</PixelButton>
            <PixelButton variant="secondary" onClick={() => setTimerOn(false)}>
              TURN TIMER OFF
            </PixelButton>
          </div>
        </div>
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
            <PixelButton variant="secondary" onClick={restart} className={styles.restart}>
              RESTART LEVEL
            </PixelButton>
          </Panel>
        </div>

        <div className={styles.main}>
          <TerminalWithMap
            lines={session.lines}
            prompt={session.prompt}
            title={promptTitle}
            state={session.state}
            onSubmit={handleSubmit}
            commands={test.commands}
            onPrint={session.print}
            onClearScreen={session.clearScreen}
            disabled={stopped}
          />

          <div className={styles.pipRow}>
            <Pip size={88} mood={complete ? 'cheer' : 'happy'} />
            <div className={styles.hint}>
              <div className={styles.hintText}>
                <span className={styles.hintLabel}>PIP SAYS</span>
                <span className={styles.hintBody} aria-live="polite">
                  {pipLine}
                </span>
                {showAnswer ? <code className={styles.answer}>{answer}</code> : null}
                {!complete && !stopped && answer && !answerReady ? (
                  <span className={styles.tries}>
                    SHOW ANSWER after {TRIES_BEFORE_ANSWER} tries ({tries}/{TRIES_BEFORE_ANSWER})
                  </span>
                ) : null}
              </div>
              {!complete && !stopped && answer && answerReady ? (
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
