import { Panel } from '../components/Panel'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { SpeechBubble } from '../components/SpeechBubble'
import styles from './IntroPage.module.css'

export function IntroPage() {
  return (
    <main className={styles.screen}>
      <Panel tone="panel-2" className={styles.panel}>
        <p className={styles.kicker}>INTRO STORY</p>
        <div className={styles.art} aria-hidden="true" />
        <div className={styles.row}>
          <Pip size={72} mood="think" />
          <SpeechBubble label="PIP SAYS">
            The story of Linux starts here. (The full cutscene arrives in Phase 5.)
          </SpeechBubble>
        </div>
        <div className={styles.actions}>
          <PixelButton to="/map" variant="secondary">
            SKIP
          </PixelButton>
          <PixelButton to="/map">NEXT</PixelButton>
        </div>
      </Panel>
    </main>
  )
}
