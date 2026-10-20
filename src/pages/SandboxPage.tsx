import { Page } from '../components/Page'
import { Panel } from '../components/Panel'
import { PixelButton } from '../components/PixelButton'
import styles from './PlaceholderPage.module.css'

export function SandboxPage() {
  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>FREE PLAY SANDBOX</h1>
      </div>
      <Panel>
        <p className={styles.lead}>
          An open terminal with every unlocked command and no objectives. It arrives in Phase 8,
          once the shell engine is ready.
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
