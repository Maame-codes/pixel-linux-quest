import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { INTRO_SCENES } from '../content/intro'
import { IntroArt } from '../game/IntroArt'
import styles from './IntroPage.module.css'

export function IntroPage() {
  const navigate = useNavigate()
  const [scene, setScene] = useState(0)

  const total = INTRO_SCENES.length
  const current = INTRO_SCENES[scene]
  const isLast = scene === total - 1

  function finish() {
    navigate('/map')
  }

  function next() {
    if (isLast) finish()
    else setScene((s) => s + 1)
  }

  return (
    <main className={styles.screen}>
      <div className={styles.stage}>
        <p className={styles.kicker}>THE STORY OF LINUX</p>

        <div className={styles.artFrame}>
          <IntroArt sceneId={current.id} />
        </div>

        <div className={styles.dots} aria-hidden="true">
          {INTRO_SCENES.map((s, i) => (
            <span key={s.id} className={i === scene ? styles.dotOn : styles.dot} />
          ))}
        </div>

        <div className={styles.speech}>
          <Pip size={72} mood={isLast ? 'cheer' : 'happy'} />
          <div className={styles.bubble} aria-live="polite">
            {current.text}
          </div>
        </div>

        <div className={styles.controls}>
          <PixelButton variant="secondary" onClick={finish} aria-label="Skip the story">
            SKIP
          </PixelButton>
          <div className={styles.rightControls}>
            <PixelButton
              variant="secondary"
              onClick={() => setScene((s) => Math.max(0, s - 1))}
              disabled={scene === 0}
            >
              BACK
            </PixelButton>
            <PixelButton onClick={next}>{isLast ? 'ENTER THE MAP' : 'NEXT'}</PixelButton>
          </div>
        </div>
      </div>
    </main>
  )
}
