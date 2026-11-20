import type { ReactNode } from 'react'

import { FeedbackLink } from './FeedbackLink'
import { SiteHeader } from './SiteHeader'
import styles from './Page.module.css'

type PageProps = {
  children: ReactNode
}

/** Standard chrome for in-app pages: the site header plus a centred content column. */
export function Page({ children }: PageProps) {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Curriculum topics inspired by the free Introduction to Linux (LFS101) course. Not
          affiliated with or endorsed by the Linux Foundation. Linux is a registered trademark of
          Linus Torvalds.
        </p>
        <p className={styles.footerText}>
          Your progress, scores and settings are saved only in your browser. Nothing is sent to a server.
        </p>
        <p className={styles.footerText}>
          <FeedbackLink className={styles.footerLink} />
        </p>
      </footer>
    </div>
  )
}
