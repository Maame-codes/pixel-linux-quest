import { useLocation } from 'react-router-dom'

import { Page } from '../components/Page'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import styles from './NotFoundPage.module.css'

/** A pixel question mark, 5x8, floating over Pip's head. */
function Lost() {
  return (
    <svg className={styles.question} viewBox="0 0 5 8" width={30} height={48} aria-hidden="true">
      <path fill="currentColor" d="M1 0h3v1H1zM0 1h1v2H0zM4 1h1v3H4zM3 4h1v1H3zM2 5h1v1H2zM2 7h1v1H2z" />
    </svg>
  )
}

/** Shown for any address the site does not know. */
export function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <Page>
      <section className={styles.lost} aria-labelledby="not-found-title">
        <div className={styles.pip}>
          <Lost />
          <Pip size={112} mood="think" title="Pip the penguin, looking lost" />
        </div>
        <p className={styles.code}>404</p>
        <h1 id="not-found-title" className={styles.title}>
          This folder does not exist
        </h1>
        <p className={styles.terminal}>
          <span className={styles.prompt}>pip@island:~$</span> cd {pathname}
          <br />
          bash: cd: {pathname}: No such file or directory
        </p>
        <p className={styles.lead}>Pip looked everywhere. Let&apos;s head somewhere that does exist.</p>
        <div className={styles.links}>
          <PixelButton to="/map">GO TO THE MAP</PixelButton>
          <PixelButton to="/" variant="secondary">
            TITLE SCREEN
          </PixelButton>
        </div>
      </section>
    </Page>
  )
}
