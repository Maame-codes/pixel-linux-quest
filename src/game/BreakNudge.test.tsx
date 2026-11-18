import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reloadSettings, setSetting } from '../arcade/settings'
import { SettingsMenu } from '../components/SettingsMenu'
import { BreakNudge } from './BreakNudge'
import {
  NUDGE_EVERY_MS,
  addActive,
  isQuiet,
  newNudgeClock,
  nudgeDue,
  resetNudgeClock,
  snooze,
} from './nudgeClock'

const MESSAGE = "You've been at it for a while. Want a quick break?"

function renderNudge() {
  render(
    <MemoryRouter initialEntries={['/level/x']}>
      <Routes>
        <Route
          path="/level/x"
          element={
            <>
              <input aria-label="command" />
              <BreakNudge />
            </>
          }
        />
        <Route path="/break" element={<p>break room</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const minutes = (m: number) =>
  act(() => {
    vi.advanceTimersByTime(m * 60 * 1000)
  })

describe('nudge clock', () => {
  it('is due after 20 minutes of active time', () => {
    const c = addActive(newNudgeClock(), NUDGE_EVERY_MS - 1)
    expect(nudgeDue(c)).toBe(false)
    expect(nudgeDue(addActive(c, 1))).toBe(true)
  })

  it('NOT NOW waits another 20 minutes', () => {
    const c = snooze(addActive(newNudgeClock(), NUDGE_EVERY_MS))
    expect(nudgeDue(c)).toBe(false)
    expect(nudgeDue(addActive(c, NUDGE_EVERY_MS))).toBe(true)
  })

  it('waits for a quiet moment after typing', () => {
    expect(isQuiet(1000, 3000)).toBe(false)
    expect(isQuiet(1000, 7000)).toBe(true)
  })
})

describe('BreakNudge', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
    resetNudgeClock()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('appears after 20 minutes and TAKE A BREAK goes to the Break Room', () => {
    renderNudge()
    minutes(19)
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    minutes(1.5)
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'TAKE A BREAK' }))
    expect(screen.getByText('break room')).toBeInTheDocument()
  })

  it('NOT NOW hides it for another 20 minutes', () => {
    renderNudge()
    minutes(21)
    fireEvent.click(screen.getByRole('button', { name: 'NOT NOW' }))
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    minutes(19)
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    minutes(2)
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
  })

  it('never appears while a command is half typed', () => {
    renderNudge()
    const input = screen.getByRole('textbox', { name: 'command' })
    input.focus()
    fireEvent.change(input, { target: { value: 'mkdir trea' } })
    minutes(25)
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    minutes(0.1)
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
  })

  it('does not count time while the tab is hidden', () => {
    renderNudge()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    minutes(30)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it('stays away when nudges are turned off', () => {
    setSetting('nudges', false)
    renderNudge()
    minutes(45)
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })
})

describe('SettingsMenu', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })

  it('the gear opens switches for nudges and sound, remembered in localStorage', () => {
    render(<SettingsMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const nudges = screen.getByRole('switch', { name: /Break nudges/ })
    const sound = screen.getByRole('switch', { name: /Sound/ })
    expect(nudges).toHaveAttribute('aria-checked', 'true')
    expect(sound).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(nudges)
    fireEvent.click(sound)
    expect(JSON.parse(localStorage.getItem('plq.settings') ?? '{}')).toEqual({ sound: true, nudges: false })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('switch', { name: /Sound/ })).not.toBeInTheDocument()
  })
})
