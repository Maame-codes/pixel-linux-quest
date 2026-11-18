import { useEffect, useRef, useState } from 'react'

import { PixelButton } from '../components/PixelButton'
import type { ShellEvent } from '../shell'
import { IntroArt } from './IntroArt'
import { browserShareEnv, crashShareText, shareOrCopy } from './share'
import styles from './CrashScreen.module.css'

type CrashScreenProps = {
  kind: ShellEvent
  /** The command line that did it. */
  command: string
  /** Whether it was run with sudo. */
  sudo: boolean
  /** True the first time: the Chaos Penguin badge was just earned. */
  newBadge: boolean
  onReset: () => void
}

function explanation(kind: ShellEvent, sudo: boolean): string[] {
  if (kind === 'frozen') {
    return [
      'This line is a fork bomb: a tiny function that starts two copies of itself, and every copy starts two more.',
      'In seconds there is no room left for new processes, so a real computer stops responding and needs a restart.',
      'Many Linux systems limit how many processes one user can run, which can stop it.',
    ]
  }
  if (sudo) {
    return [
      'With sudo, nothing stops rm -rf: it deletes the programs Linux runs on, its settings and every file on the disk.',
      'A real computer would not start again until Linux was reinstalled.',
      'rm has no recycle bin, so there is no easy way to get the files back.',
    ]
  }
  return [
    'On a real computer, Linux would block most of this with "Permission denied", but rm -rf would still delete every file you own.',
    'With sudo in front, it deletes everything, and the computer would not start again until Linux was reinstalled.',
    'rm has no recycle bin, so there is no easy way to get files back.',
  ]
}

const SHARE_MESSAGES = {
  copied: 'Copied!',
  failed: 'Could not copy. Try a screenshot instead!',
} as const

/** SHARE: the share sheet on phones, the clipboard everywhere else. */
function ShareButton({ command }: { command: string }) {
  const [message, setMessage] = useState<keyof typeof SHARE_MESSAGES | null>(null)
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(null), 2500)
    return () => window.clearTimeout(t)
  }, [message])

  const onShare = async () => {
    const outcome = await shareOrCopy(crashShareText(command), browserShareEnv())
    if (outcome === 'copied' || outcome === 'failed') setMessage(outcome)
  }

  return (
    <>
      <PixelButton onClick={() => void onShare()} variant="secondary">
        SHARE
      </PixelButton>
      <p className={styles.shareStatus} role="status">
        {message ? SHARE_MESSAGES[message] : ''}
      </p>
    </>
  )
}

/** The shareable "you broke it" screen, with a RESET button. */
export function CrashScreen({ kind, command, sudo, newBadge, onReset }: CrashScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const frozen = kind === 'frozen'
  return (
    <section className={`${styles.screen} ${frozen ? styles.frozen : styles.destroyed}`} aria-labelledby="crash-title">
      <h1 id="crash-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        {frozen ? 'SYSTEM FROZEN' : 'SYSTEM DESTROYED'}
      </h1>

      <div className={styles.art}>
        <IntroArt sceneId={kind} />
      </div>

      <p className={styles.command}>
        <span className={styles.prompt}>pip@island:~$</span> {command}
      </p>

      <div className={styles.body}>
        {explanation(kind, sudo).map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>

      {newBadge ? (
        <p className={styles.badge} role="status">
          SECRET BADGE: CHAOS PENGUIN
        </p>
      ) : null}

      <div className={styles.actions}>
        <PixelButton onClick={onReset}>RESET</PixelButton>
        <PixelButton to="/badges" variant="secondary">
          BADGES
        </PixelButton>
        <ShareButton command={command} />
      </div>

      <p className={styles.credit}>PIXEL LINUX QUEST · BREAK IT SANDBOX</p>
    </section>
  )
}
