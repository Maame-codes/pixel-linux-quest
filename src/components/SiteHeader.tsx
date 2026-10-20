import { NavLink } from 'react-router-dom'

import { Pip } from './Pip'
import { XPBar } from './XPBar'
import styles from './SiteHeader.module.css'

// Placeholder progress until Phase 6 wires up real localStorage state.
const PLACEHOLDER = { level: 3, value: 340, max: 500 }

const NAV = [
  { to: '/map', label: 'MAP' },
  { to: '/sandbox', label: 'SANDBOX' },
  { to: '/badges', label: 'BADGES' },
]

export function SiteHeader() {
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

        <XPBar level={PLACEHOLDER.level} value={PLACEHOLDER.value} max={PLACEHOLDER.max} />
      </div>
    </header>
  )
}
