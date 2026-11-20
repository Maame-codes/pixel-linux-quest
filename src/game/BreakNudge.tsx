import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSetting } from '../arcade/settings'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import {
  addActive,
  getNudgeClock,
  isQuiet,
  nudgeDue,
  resetNudgeClock,
  setNudgeClock,
  snooze,
} from './nudgeClock'
import styles from './BreakNudge.module.css'

const TICK_MS = 1000

/** Is the learner part way through typing a command? */
function typingSomething(): boolean {
  const el = document.activeElement
  return el instanceof HTMLInputElement && el.value.trim() !== ''
}

/**
 * Counts active time in a level and, after the chosen number of minutes
 * (20 by default, set in the settings panel), shows a small
 * message from Pip. It sits in the page flow above the level (never over
 * the terminal) and only appears while the learner is not typing.
 */
export function BreakNudge() {
  const navigate = useNavigate()
  const [everyMinutes] = useSetting('nudgeMinutes')
  const enabled = everyMinutes > 0
  const [show, setShow] = useState(false)
  const lastKey = useRef(Date.now())

  useEffect(() => {
    const onKey = () => {
      lastKey.current = Date.now()
    }
    window.addEventListener('keydown', onKey)
    const id = window.setInterval(() => {
      if (document.hidden) return
      const clock = addActive(getNudgeClock(), TICK_MS)
      setNudgeClock(clock)
      if (nudgeDue(clock, everyMinutes) && isQuiet(lastKey.current, Date.now()) && !typingSomething()) {
        setShow(true)
      }
    }, TICK_MS)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearInterval(id)
    }
  }, [everyMinutes])

  if (!show || !enabled) return null

  return (
    <div className={styles.nudge} role="status">
      <Pip size={40} />
      <p className={styles.text}>You&apos;ve been at it for a while. Want a quick break?</p>
      <div className={styles.buttons}>
        <PixelButton
          className={styles.btn}
          onClick={() => {
            resetNudgeClock()
            navigate('/break')
          }}
        >
          TAKE A BREAK
        </PixelButton>
        <PixelButton
          variant="secondary"
          className={styles.btn}
          onClick={() => {
            setNudgeClock(snooze(getNudgeClock()))
            setShow(false)
          }}
        >
          NOT NOW
        </PixelButton>
      </div>
    </div>
  )
}
