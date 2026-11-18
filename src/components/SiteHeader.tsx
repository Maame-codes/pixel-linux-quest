import { NavLink } from 'react-router-dom'

import { useProgress } from '../game/ProgressContext'
import { completedCount, earnedXp, totalXp } from '../game/progress'
import { Pip } from './Pip'
import { SettingsMenu } from './SettingsMenu'
import { XPBar } from './XPBar'
import styles from './SiteHeader.module.css'

const NAV = [
  { to: '/map', label: 'MAP' },
  { to: '/sandbox', label: 'SANDBOX' },
  { to: '/badges', label: 'BADGES' },
  { to: '/break', label: 'BREAK ROOM' },
]

export function SiteHeader() {
  const { progress } = useProgress()
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          <Pip size={40} title="Pixel Linux Quest logo" />
          <span className={styles.title}>PIXEL LINUX QUEST</span>
        </NavLink>

        <nav aria-label="Main" className={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.right}>
          <XPBar level={completedCount(progress)} value={earnedXp(progress)} max={totalXp()} />
          <SettingsMenu />
        </div>
      </div>
    </header>
  )
}
