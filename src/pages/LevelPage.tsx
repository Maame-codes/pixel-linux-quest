import { useParams } from 'react-router-dom'

import { Page } from '../components/Page'
import { Panel } from '../components/Panel'
import { PixelButton } from '../components/PixelButton'
import styles from './PlaceholderPage.module.css'

export function LevelPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>LEVEL</h1>
        <span className={styles.meta}>{id ?? 'unknown'}</span>
      </div>
      <Panel>
        <p className={styles.lead}>
          The level player (lesson pages, then a terminal challenge or quiz) is built in Phase 3.
          This placeholder confirms deep links like <code>/level/{id}</code> resolve.
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
