import { useEffect, useId, useRef, useState } from 'react'

import { BREAK_CHOICES, NUDGE_CHOICES, useSetting } from '../arcade/settings'
import { FeedbackLink } from './FeedbackLink'
import styles from './SettingsMenu.module.css'

/** A pixel gear, 9x9. */
function Gear() {
  return (
    <svg className={styles.gear} viewBox="0 0 9 9" width={22} height={22} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 0h3v1H3zM1 1h1v1H1zM7 1h1v1H7zM2 1h5v1H2zM1 2h7v1H1zM0 3h3v3H0zM6 3h3v3H6zM1 6h7v1H1zM2 7h5v1H2zM1 7h1v1H1zM7 7h1v1H7zM3 8h3v1H3zM3 2h3v1H3zM2 3h1v3H2zM6 3h1v3H6zM3 6h3v1H3z"
      />
    </svg>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.toggle} onClick={() => onChange(!on)}>
      <span className={styles.toggleLabel}>{label}</span>
      <span className={`${styles.state} ${on ? styles.on : ''}`}>{on ? 'ON' : 'OFF'}</span>
    </button>
  )
}

/** A row of pixel buttons, one pressed: a small accessible choice group. */
function Choice<T extends number>({
  label,
  choices,
  value,
  onChange,
  text,
  spoken,
}: {
  label: string
  choices: readonly T[]
  value: T
  onChange: (value: T) => void
  /** What the button shows, short so the row fits on a phone. */
  text: (value: T) => string
  /** What a screen reader says, for example "15 minutes". */
  spoken: (value: T) => string
}) {
  return (
    <fieldset className={styles.choice}>
      <legend className={styles.choiceLabel}>{label}</legend>
      <div className={styles.choiceRow}>
        {choices.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === value}
            aria-label={spoken(c)}
            className={`${styles.choiceBtn} ${c === value ? styles.on : ''}`}
            onClick={() => onChange(c)}
          >
            {text(c)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** The gear button in the header, opening a small settings panel. */
export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [sound, setSound] = useSetting('sound')
  const [nudgeMinutes, setNudgeMinutes] = useSetting('nudgeMinutes')
  const [breakMinutes, setBreakMinutes] = useSetting('breakMinutes')
  const panelId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close with Esc or a click outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && e.target instanceof Node && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label="Settings"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <Gear />
      </button>
      {open ? (
        <div id={panelId} className={styles.panel} role="group" aria-label="Settings">
          <p className={styles.title}>SETTINGS</p>
          <Choice
            label="Break reminder every"
            choices={NUDGE_CHOICES}
            value={nudgeMinutes}
            onChange={setNudgeMinutes}
            text={(m) => (m === 0 ? 'OFF' : String(m))}
            spoken={(m) => (m === 0 ? 'Off' : `${m} minutes`)}
          />
          <p className={styles.unit} aria-hidden="true">
            {nudgeMinutes === 0 ? 'No reminders' : `Every ${nudgeMinutes} minutes in levels`}
          </p>
          <Choice
            label="Break length"
            choices={BREAK_CHOICES}
            value={breakMinutes}
            onChange={setBreakMinutes}
            text={(m) => String(m)}
            spoken={(m) => `${m} minutes`}
          />
          <p className={styles.unit} aria-hidden="true">
            {breakMinutes} minutes
          </p>
          <Toggle label="Sound" on={sound} onChange={setSound} />
          <FeedbackLink className={styles.feedback} />
        </div>
      ) : null}
    </div>
  )
}
