import { Page } from '../components/Page'
import { Panel } from '../components/Panel'
import { PixelButton } from '../components/PixelButton'
import styles from './PlaceholderPage.module.css'

export function BadgesPage() {
  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>BADGES</h1>
      </div>
      <Panel>
        <p className={styles.lead}>
          Your badges and XP breakdown will live here. The real page comes in Phase 6 with progress
          saved to your browser.
        </p>
        <div className={styles.links}>
          <PixelButton to="/map" variant="secondary">
            &lt; BACK TO MAP
          </PixelButton>
        </div>
      </Panel>
    </Page>
  )
}
