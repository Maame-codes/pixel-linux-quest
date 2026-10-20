import { Page } from '../components/Page'
import { Panel } from '../components/Panel'
import { PixelButton } from '../components/PixelButton'
import styles from './PlaceholderPage.module.css'

export function MapPage() {
  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>WORLD MAP</h1>
        <span className={styles.meta}>6 worlds, 24 levels, 1 final boss</span>
      </div>
      <Panel>
        <p className={styles.lead}>
          The interactive world map lands in Phase 6. For now this is a placeholder so routes and
          the look are in place.
        </p>
        <div className={styles.links}>
          <PixelButton to="/level/w2-l4-dig-a-folder">OPEN A SAMPLE LEVEL</PixelButton>
          <PixelButton to="/sandbox" variant="secondary">
            FREE PLAY SANDBOX
          </PixelButton>
        </div>
      </Panel>
    </Page>
  )
}
