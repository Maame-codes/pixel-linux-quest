import { useMemo, useRef, useState } from 'react'

import { Page } from '../components/Page'
import { Panel } from '../components/Panel'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { QuestList } from '../components/QuestList'
import { PRACTISABLE, pickPracticeTasks, type PracticeTask } from '../content/practice'
import { useProgress } from '../game/ProgressContext'
import { unlockedCommands } from '../game/progress'
import { TerminalWithMap } from '../game/TerminalWithMap'
import { useShellSession, type TerminalLine } from '../game/useShellSession'
import { loadWeakSpots, mistakeCommand, practiceCleared, recordMistake, weakestCommands } from '../game/weakSpots'
import { createShellState, explainMistake, runCommand, shortenPath, type ShellState } from '../shell'
import styles from './PracticePage.module.css'

/** XP for clearing a whole practice round. */
export const PRACTICE_XP = 10

const WELCOME = 'Practice terminal. Nothing here affects your quest.'

/** The task's starting terminal, after any commands Pip "already ran". */
function startFor(task: PracticeTask, commands: string[]): { state: ShellState; lines: TerminalLine[] } {
  let state = createShellState({ seedFs: task.seedFs(), cwd: task.startDir })
  for (const line of task.preRun ?? []) state = runCommand(state, line, { commands }).state
  return { state, lines: [{ id: 1, text: WELCOME, tone: 'info' }] }
}

type TaskRunnerProps = {
  task: PracticeTask
  commands: string[]
  onCleared: () => void
}

/** One practice task: a fresh terminal, one objective, Pip's hint. */
function TaskRunner({ task, commands, onCleared }: TaskRunnerProps) {
  const sessionOpts = useMemo(
    () => ({ commands, resume: startFor(task, commands) }),
    [task, commands],
  )
  const session = useShellSession(sessionOpts)
  const [done, setDone] = useState(false)
  const [mistake, setMistake] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  function handleSubmit(input: string) {
    if (done) return
    const { result, before } = session.submit(input)
    const explanation = explainMistake(input, result, before, { unlocked: commands })
    setMistake(explanation)
    const weak = mistakeCommand(input, result, explanation !== null, commands)
    if (weak) recordMistake(weak)
    if (task.check(result.state, result)) {
      setDone(true)
      practiceCleared(task.command)
      onCleared()
    }
  }

  const title = `${session.state.user}@${session.state.host}: ${shortenPath(session.state.cwd, session.state.home)}`
  const pipLine = done ? 'Got it! That one is getting easier.' : (mistake ?? task.hint)

  return (
    <div className={styles.task}>
      <Panel className={styles.card}>
        <h2 className={styles.cardTitle}>TASK</h2>
        <QuestList items={[{ id: task.id, label: task.label, done }]} activeIndex={done ? -1 : 0} />
      </Panel>
      <TerminalWithMap
        lines={session.lines}
        prompt={session.prompt}
        title={title}
        state={session.state}
        onSubmit={handleSubmit}
        commands={commands}
        onPrint={session.print}
        onClearScreen={session.clearScreen}
      />
      <div className={styles.pipRow}>
        <Pip size={72} mood={done ? 'cheer' : 'happy'} />
        <div className={styles.bubble}>
          <div className={styles.bubbleText}>
            <span className={styles.label}>PIP SAYS</span>
            <span className={styles.body} aria-live="polite">
              {pipLine}
            </span>
            {showAnswer && !done ? <code className={styles.answer}>{task.answer}</code> : null}
          </div>
          {!done ? (
            <PixelButton variant="secondary" onClick={() => setShowAnswer(true)}>
              SHOW ANSWER
            </PixelButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function PracticePage() {
  const { progress, addBonusXp } = useProgress()
  // The commands and the round are chosen once, when the page opens.
  const [commands] = useState(() => unlockedCommands(progress))
  const [tasks] = useState<PracticeTask[]>(() => {
    const eligible = commands.filter((c) => PRACTISABLE.includes(c))
    return pickPracticeTasks(weakestCommands(loadWeakSpots(), eligible), eligible)
  })
  const [index, setIndex] = useState(0)
  const clearedRef = useRef(0)
  const [cleared, setCleared] = useState(0)

  const roundDone = tasks.length > 0 && cleared >= tasks.length

  function onCleared() {
    clearedRef.current += 1
    setCleared(clearedRef.current)
    if (clearedRef.current === tasks.length) addBonusXp(PRACTICE_XP)
  }

  if (tasks.length === 0) {
    return (
      <Page>
        <h1 className={styles.title}>WEAK SPOTS</h1>
        <Panel className={styles.card}>
          <p className={styles.lead}>No weak spots to practice right now. Keep exploring, Pip is proud of you.</p>
          <div className={styles.buttons}>
            <PixelButton to="/map">BACK TO MAP</PixelButton>
          </div>
        </Panel>
      </Page>
    )
  }

  const task = tasks[index]
  const taskDone = cleared > index

  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>PRACTICE YOUR WEAK SPOTS</h1>
        <span className={styles.meta}>
          TASK {Math.min(index + 1, tasks.length)} OF {tasks.length}
        </span>
      </div>
      <p className={styles.lead}>
        Quick tasks for the commands that tripped you up. No XP lost for mistakes, and {PRACTICE_XP} XP for finishing
        the round.
      </p>

      {roundDone ? (
        <div className={styles.clear} role="status">
          <div>
            <p className={styles.clearTitle}>ROUND CLEAR! +{PRACTICE_XP} XP</p>
            <p className={styles.clearText}>Those commands should feel a little more familiar now.</p>
          </div>
          <div className={styles.buttons}>
            <PixelButton to="/map">BACK TO MAP</PixelButton>
          </div>
        </div>
      ) : null}

      <TaskRunner key={task.id} task={task} commands={commands} onCleared={onCleared} />

      {taskDone && index < tasks.length - 1 ? (
        <div className={styles.buttons}>
          <PixelButton onClick={() => setIndex((i) => i + 1)}>NEXT TASK</PixelButton>
        </div>
      ) : null}
    </Page>
  )
}
