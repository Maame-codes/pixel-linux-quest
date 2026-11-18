import { Terminal } from '../components/Terminal'
import { PixelButton } from '../components/PixelButton'
import type { ShellState } from '../shell'
import { FolderMap } from './FolderMap'
import type { FolderMapOptions } from './folderMapModel'
import { useShowMap } from './mapPreference'
import type { TerminalLine } from './useShellSession'
import styles from './TerminalWithMap.module.css'

type TerminalWithMapProps = {
  lines: TerminalLine[]
  prompt: string
  title: string
  state: ShellState
  onSubmit: (input: string) => void
  mapOptions?: FolderMapOptions
  disabled?: boolean
  collapsing?: boolean
}

/** The terminal with the live folder map beside it (below it on narrow screens). */
export function TerminalWithMap({
  lines,
  prompt,
  title,
  state,
  onSubmit,
  mapOptions,
  disabled,
  collapsing,
}: TerminalWithMapProps) {
  const [showMap, toggleMap] = useShowMap()

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <PixelButton variant="secondary" onClick={toggleMap} className={styles.toggle}>
          {showMap ? 'HIDE MAP' : 'SHOW MAP'}
        </PixelButton>
      </div>
      <div className={styles.row}>
        <div className={styles.term}>
          <Terminal
            lines={lines}
            prompt={prompt}
            title={title}
            history={state.history}
            onSubmit={onSubmit}
            disabled={disabled}
            collapsing={collapsing}
          />
        </div>
        {showMap ? (
          <FolderMap
            state={state}
            options={mapOptions}
            collapsing={collapsing}
            className={styles.map}
          />
        ) : null}
      </div>
    </div>
  )
}
