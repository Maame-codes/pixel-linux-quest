import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { SettingsMenu } from '../components/SettingsMenu'
import { XPBar } from '../components/XPBar'
import { BreakNudge } from './BreakNudge'
import { getWorld } from '../content/worlds'
import type { Level } from '../content/types'
import { useProgress } from './ProgressContext'
import { completedCount, earnedXp, totalXp } from './progress'
import styles from './LevelShell.module.css'

type LevelShellProps = {
  level: Level
  children: ReactNode
}

export function LevelShell({ level, children }: LevelShellProps) {
  const { progress } = useProgress()
  const world = getWorld(level.world)
  const worldLabel = `WORLD ${level.world}: ${(world?.name ?? '').toUpperCase()}`
  const levelLabel = `LEVEL ${level.level}: ${level.title.toUpperCase()}`

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.left}>
            <Link to="/map" className={styles.back}>
              &lt; MAP
            </Link>
            <Link to="/break" className={styles.back}>
              BREAK ROOM
            </Link>
            <div className={styles.labels}>
              <span className={styles.world}>{worldLabel}</span>
              <span className={styles.level}>{levelLabel}</span>
            </div>
          </div>
          <div className={styles.right}>
            <XPBar
              level={completedCount(progress)}
              value={earnedXp(progress)}
              max={totalXp()}
            />
            <SettingsMenu />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <BreakNudge />
        {children}
      </main>
    </div>
  )
}
