import { useEffect, useMemo, useRef, useState } from 'react'

import { Page } from '../components/Page'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { sandboxFs } from '../content/sandbox'
import { CrashScreen } from '../game/CrashScreen'
import type { FolderMapOptions } from '../game/folderMapModel'
import { useProgress } from '../game/ProgressContext'
import { TerminalWithMap } from '../game/TerminalWithMap'
import { useShellSession } from '../game/useShellSession'
import {
  ALL_COMMANDS,
  analyzeDanger,
  explainMistake,
  shortenPath,
  type ShellEvent,
  type ShellState,
} from '../shell'
import styles from './SandboxPage.module.css'

const WELCOME = 'Welcome to the Break It sandbox. Every command Pip knows works here. Type help to list them.'
const START_LINE = 'Nothing here is real, so try anything. Even the commands you should never type on a real computer.'
const CHAOS_BADGE = 'chaos-penguin'

/** How long the collapse plays before the crash screen. */
const FALL_MS = 2400

// The map starts at / here, with only Pip's path opened up.
const MAP_OPTIONS: FolderMapOptions = { root: '/', openDepth: 1 }

/** What bash prints over and over while a fork bomb eats every process slot. */
const FORK_ERROR = 'bash: fork: retry: Resource temporarily unavailable'

type Crash = {
  kind: ShellEvent
  command: string
  sudo: boolean
  newBadge: boolean
  stage: 'falling' | 'screen'
  /** The system just before it broke, so the map has something to tumble. */
  before: ShellState
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function SandboxPage() {
  const { progress, earnSecret } = useProgress()
  const sessionOpts = useMemo(
    () => ({
      commands: ALL_COMMANDS,
      seedFs: sandboxFs(),
      startDir: '/home/pip',
      welcome: WELCOME,
      sandbox: true,
    }),
    [],
  )
  const session = useShellSession(sessionOpts)
  const [pipLine, setPipLine] = useState(START_LINE)
  const [crash, setCrash] = useState<Crash | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleSubmit(input: string) {
    if (crash) return
    const { result, before } = session.submit(input)
    if (result.event) {
      const danger = analyzeDanger(input, before)
      const sudo = danger !== null && danger.kind !== 'fork-bomb' && danger.sudo
      const newBadge = !progress.secrets[CHAOS_BADGE]
      earnSecret(CHAOS_BADGE)
      if (result.event === 'frozen') session.print(Array.from({ length: 14 }, () => FORK_ERROR), 'err')

      const reduced = prefersReducedMotion()
      setCrash({
        kind: result.event,
        command: input.trim(),
        sudo,
        newBadge,
        stage: reduced ? 'screen' : 'falling',
        before,
      })
      setPipLine(result.event === 'frozen' ? 'Brrr. Everything is s-s-stuck!' : 'Uh oh. Uh oh! UH OH!')
      if (!reduced) {
        timer.current = window.setTimeout(() => {
          setCrash((c) => (c ? { ...c, stage: 'screen' } : c))
        }, FALL_MS)
      }
      return
    }
    setPipLine(explainMistake(input, result, before, { unlocked: ALL_COMMANDS }) ?? START_LINE)
  }

  function reset() {
    window.clearTimeout(timer.current)
    session.reset()
    setCrash(null)
    setPipLine(START_LINE)
  }

  if (crash?.stage === 'screen') {
    return (
      <Page>
        <CrashScreen
          kind={crash.kind}
          command={crash.command}
          sudo={crash.sudo}
          newBadge={crash.newBadge}
          onReset={reset}
        />
      </Page>
    )
  }

  const falling = crash?.stage === 'falling'
  const title = `${session.state.user}@${session.state.host}: ${shortenPath(session.state.cwd, session.state.home)}`

  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>BREAK IT SANDBOX</h1>
        <PixelButton variant="secondary" onClick={reset} className={styles.reset}>
          RESET
        </PixelButton>
      </div>
      <p className={styles.lead}>
        A whole pretend Linux system with every command unlocked and no quests. Explore it, build things, or
        try to break it.
      </p>

      <div className={`${styles.play} ${falling && crash?.kind === 'frozen' ? styles.freezing : ''}`}>
        <TerminalWithMap
          lines={session.lines}
          prompt={session.prompt}
          title={title}
          state={falling && crash ? crash.before : session.state}
          onSubmit={handleSubmit}
          mapOptions={MAP_OPTIONS}
          disabled={falling}
          collapsing={falling && crash?.kind === 'destroyed'}
        />

        <div className={styles.pipRow}>
          <span className={falling ? styles.panic : undefined}>
            <Pip size={88} mood="happy" />
          </span>
          <div className={styles.bubble}>
            <span className={styles.label}>PIP SAYS</span>
            <span className={styles.body} aria-live="polite">
              {pipLine}
            </span>
          </div>
        </div>
      </div>
    </Page>
  )
}
