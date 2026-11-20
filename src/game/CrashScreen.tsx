import { useEffect, useRef, useState } from 'react'

import { PixelButton } from '../components/PixelButton'
import { SpeechBubble } from '../components/SpeechBubble'
import type { ShellEvent } from '../shell'
import { IntroArt } from './IntroArt'
import { browserShareEnv, crashShareText, shareOrCopy, type SystemBreak } from './share'
import styles from './CrashScreen.module.css'

/** For HOME FOLDER WIPED: what was deleted and what permissions saved. */
export type WipeStats = {
  /** Files and folders of pip's that rm deleted. */
  deleted: number
  /** "Permission denied" lines: system files that permissions protected. */
  protectedCount: number
}

type CrashScreenProps = {
  kind: ShellEvent
  /** The command line that did it. */
  command: string
  /** True the first time: the Chaos Penguin badge was just earned. */
  newBadge: boolean
  /** Only for kind "home-wiped". */
  stats?: WipeStats
  onReset: () => void
}

const TITLES: Record<ShellEvent, string> = {
  destroyed: 'SYSTEM DESTROYED',
  frozen: 'SYSTEM FROZEN',
  'home-wiped': 'HOME FOLDER WIPED',
}

function explanation(kind: ShellEvent): string[] {
  if (kind === 'frozen') {
    return [
      'This line is a fork bomb: a tiny function that starts two copies of itself, and every copy starts two more.',
      'In seconds there is no room left for new processes, so a real computer stops responding and needs a restart.',
      'Many Linux systems limit how many processes one user can run, which can stop it.',
    ]
  }
  if (kind === 'home-wiped') {
    return [
      'Linux survived! The system files belong to root, and your user, pip, has no permission to delete them. That is what all those "Permission denied" lines were: permissions protecting the system.',
      'Your own files had no such protection, because you own them. Everything you could delete in your home folder is gone, and rm has no recycle bin.',
      'Put sudo in front and rm runs as root, which ignores permissions. That is what makes this command destroy everything.',
    ]
  }
  return [
    'With sudo, nothing stops rm -rf: it deletes the programs Linux runs on, its settings and every file on the disk.',
    'A real computer would not start again until Linux was reinstalled.',
    'rm has no recycle bin, so there is no easy way to get the files back.',
  ]
}

const SHARE_MESSAGES = {
  copied: 'Copied!',
  failed: 'Could not copy. Try a screenshot instead!',
} as const

/** SHARE: the share sheet on phones, the clipboard everywhere else. */
function ShareButton({ command, kind }: { command: string; kind: SystemBreak }) {
  const [message, setMessage] = useState<keyof typeof SHARE_MESSAGES | null>(null)
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(null), 2500)
    return () => window.clearTimeout(t)
  }, [message])

  const onShare = async () => {
    const outcome = await shareOrCopy(crashShareText(command, kind), browserShareEnv())
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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * The screen after the sandbox breaks: the shareable SYSTEM DESTROYED and
 * SYSTEM FROZEN, or the lighter HOME FOLDER WIPED, each with RESET.
 */
export function CrashScreen({ kind, command, newBadge, stats, onReset }: CrashScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const tone = kind === 'frozen' ? styles.frozen : kind === 'home-wiped' ? styles.homeWiped : styles.destroyed
  const home = kind === 'home-wiped'
  const text = explanation(kind)

  return (
    <section className={`${styles.screen} ${tone}`} aria-labelledby="crash-title">
      <h1 id="crash-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        {TITLES[kind]}
      </h1>

      <div className={styles.art}>
        <IntroArt sceneId={kind} />
      </div>

      <p className={styles.command}>
        <span className={styles.prompt}>pip@island:~$</span> {command}
      </p>

      {home && stats ? (
        <p className={styles.stats}>
          {plural(stats.deleted, 'file or folder of yours', 'of your files and folders')} deleted.{' '}
          {plural(stats.protectedCount, 'system file', 'system files')} protected by permissions.
        </p>
      ) : null}

      {home ? (
        <SpeechBubble label="PIP SAYS" className={styles.bubble}>
          {text.map((t) => (
            <p key={t} className={styles.bubbleText}>
              {t}
            </p>
          ))}
        </SpeechBubble>
      ) : (
        <div className={styles.body}>
          {text.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      )}

      {newBadge && !home ? (
        <p className={styles.badge} role="status">
          SECRET BADGE: CHAOS PENGUIN
        </p>
      ) : null}

      <div className={styles.actions}>
        <PixelButton onClick={onReset}>RESET</PixelButton>
        {kind === 'home-wiped' ? null : (
          <>
            <PixelButton to="/badges" variant="secondary">
              BADGES
            </PixelButton>
            <ShareButton command={command} kind={kind} />
          </>
        )}
      </div>

      <p className={styles.credit}>PIXEL LINUX QUEST · BREAK IT SANDBOX</p>
    </section>
  )
}
