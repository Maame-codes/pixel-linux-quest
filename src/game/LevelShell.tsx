import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { XPBar } from '../components/XPBar'
import { getWorld } from '../content/worlds'
import type { Level } from '../content/types'
import styles from './LevelShell.module.css'

type LevelShellProps = {
  level: Level
  /** Optional header XP readout; omitted until progress is wired up. */
  xp?: { level: number; value: number; max: number }
  children: ReactNode
}

export function LevelShell({ level, xp, children }: LevelShellProps) {
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
            <div className={styles.labels}>
              <span className={styles.world}>{worldLabel}</span>
              <span className={styles.level}>{levelLabel}</span>
            </div>
          </div>
          {xp ? <XPBar level={xp.level} value={xp.value} max={xp.max} /> : null}
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  )
}
