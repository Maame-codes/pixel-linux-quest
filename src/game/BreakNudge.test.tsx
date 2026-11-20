import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reloadSettings, setSetting } from '../arcade/settings'
import { SettingsMenu } from '../components/SettingsMenu'
import { BreakNudge } from './BreakNudge'
import {
  MINUTE_MS,
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
  it('is due after the chosen number of minutes of active time', () => {
    const c = addActive(newNudgeClock(), 20 * MINUTE_MS - 1)
    expect(nudgeDue(c, 20)).toBe(false)
    expect(nudgeDue(addActive(c, 1), 20)).toBe(true)
    expect(nudgeDue(c, 15)).toBe(true)
    expect(nudgeDue(addActive(c, 1), 30)).toBe(false)
  })

  it('is never due when reminders are off', () => {
    expect(nudgeDue(addActive(newNudgeClock(), 999 * MINUTE_MS), 0)).toBe(false)
  })

  it('NOT NOW waits another full interval', () => {
    const c = snooze(addActive(newNudgeClock(), 45 * MINUTE_MS))
    expect(nudgeDue(c, 45)).toBe(false)
    expect(nudgeDue(addActive(c, 45 * MINUTE_MS), 45)).toBe(true)
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

  it('follows the chosen interval', () => {
    setSetting('nudgeMinutes', 15)
    renderNudge()
    minutes(14)
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
    minutes(1.5)
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
  })

  it('stays away when reminders are Off', () => {
    setSetting('nudgeMinutes', 0)
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

  it('the gear opens reminder, break length and sound settings, remembered in localStorage', () => {
    render(<SettingsMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const reminder = screen.getByRole('group', { name: 'Break reminder every' })
    const length = screen.getByRole('group', { name: 'Break length' })
    const sound = screen.getByRole('switch', { name: /Sound/ })
    expect(within(reminder).getByRole('button', { name: '20 minutes' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(length).getByRole('button', { name: '5 minutes' })).toHaveAttribute('aria-pressed', 'true')
    expect(sound).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(within(reminder).getByRole('button', { name: 'Off' }))
    fireEvent.click(within(length).getByRole('button', { name: '10 minutes' }))
    fireEvent.click(sound)
    expect(JSON.parse(localStorage.getItem('plq.settings') ?? '{}')).toEqual({
      sound: true,
      nudgeMinutes: 0,
      breakMinutes: 10,
    })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('switch', { name: /Sound/ })).not.toBeInTheDocument()
  })
})
