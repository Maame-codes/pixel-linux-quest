import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import styles from './PixelButton.module.css'

type PixelButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  /** Internal route (react-router). */
  to?: string
  /** External link. */
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  'aria-label'?: string
}

export function PixelButton({
  children,
  variant = 'primary',
  className,
  to,
  href,
  onClick,
  type = 'button',
  disabled = false,
  'aria-label': ariaLabel,
}: PixelButtonProps) {
  const cls = [styles.btn, styles[variant], className].filter(Boolean).join(' ')

  if (to !== undefined) {
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }

  if (href !== undefined) {
    return (
      <a
        href={href}
        className={cls}
        aria-label={ariaLabel}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
