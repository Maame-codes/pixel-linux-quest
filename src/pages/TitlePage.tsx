import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import styles from './TitlePage.module.css'

export function TitlePage() {
  return (
    <main className={styles.screen}>
      <div className={styles.stack}>
        <Pip size={128} mood="cheer" />
        <h1 className={styles.logo}>PIXEL LINUX QUEST</h1>
        <p className={styles.tagline}>A cool, brief introduction to Linux</p>
        <PixelButton to="/intro" aria-label="Press start to begin">
          PRESS START
        </PixelButton>
        <p className={styles.sub}>Free. No install, no account. Just you, Pip and the shell.</p>
      </div>
    </main>
  )
}
