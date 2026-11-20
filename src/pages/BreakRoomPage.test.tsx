import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../App'
import { reloadSettings, setSetting } from '../arcade/settings'
import { FROM_LEVEL } from '../game/breakEntry'
import { ProgressProvider } from '../game/ProgressContext'
import { rememberPage } from '../game/returnTo'
import { BreakRoomPage } from './BreakRoomPage'

function renderRoom(fromLevel = false) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/break', state: fromLevel ? FROM_LEVEL : undefined }]}>
      <ProgressProvider>
        <Routes>
          <Route path="/break" element={<BreakRoomPage />} />
          <Route path="/badges" element={<p>badges page</p>} />
          <Route path="/level/:id" element={<p>level page</p>} />
        </Routes>
      </ProgressProvider>
    </MemoryRouter>,
  )
}

const minutes = (m: number) =>
  act(() => {
    vi.advanceTimersByTime(m * 60 * 1000)
  })

const timerBar = () => screen.getByRole('group', { name: 'Break timer' })
const clock = () => screen.getByRole('timer')

describe('BreakRoomPage', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })
  afterEach(() => vi.useRealTimers())

  it('shows the arcade scene and the games as buttons', () => {
    renderRoom()
    expect(screen.getByRole('heading', { name: 'BREAK ROOM' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /The Break Room/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /PACKET SNAKE|BUG SMASH|BIT BREAKER/ })).toHaveLength(3)
  })

  it('opened from the map, title or nav: no timer, and SET A TIMER uses the break length', () => {
    setSetting('breakMinutes', 10)
    renderRoom()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(within(timerBar()).getByText('NO TIMER')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'SET A TIMER' }))
    expect(clock()).toHaveTextContent('10:00')
  })

  it('opened from a level: the break starts with the break length from settings', () => {
    setSetting('breakMinutes', 3)
    renderRoom(true)
    expect(clock()).toHaveTextContent('3:00')
  })

  it('- and + change the timer a minute at a time, between 1 and 60 minutes', () => {
    renderRoom(true)
    const bar = timerBar()
    fireEvent.click(within(bar).getByRole('button', { name: 'One minute more' }))
    expect(clock()).toHaveTextContent('6:00')
    for (let i = 0; i < 10; i++) fireEvent.click(within(bar).getByRole('button', { name: 'One minute less' }))
    expect(clock()).toHaveTextContent('1:00')
    expect(within(bar).getByRole('button', { name: 'One minute less' })).toBeDisabled()
    fireEvent.click(within(bar).getByRole('button', { name: '15 minutes' }))
    for (let i = 0; i < 50; i++) fireEvent.click(within(bar).getByRole('button', { name: 'One minute more' }))
    expect(clock()).toHaveTextContent('60:00')
    expect(within(bar).getByRole('button', { name: 'One minute more' })).toBeDisabled()
  })

  it('quick choices set the timer, and NO TIMER removes it', () => {
    renderRoom(true)
    const bar = timerBar()
    fireEvent.click(within(bar).getByRole('button', { name: '10 minutes' }))
    expect(clock()).toHaveTextContent('10:00')
    fireEvent.click(within(bar).getByRole('button', { name: '5 minutes' }))
    expect(clock()).toHaveTextContent('5:00')
    fireEvent.click(within(bar).getByRole('button', { name: 'NO TIMER' }))
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SET A TIMER' })).toBeInTheDocument()
  })

  it('with no timer, time never runs out', () => {
    vi.useFakeTimers()
    renderRoom()
    minutes(90)
    expect(screen.queryByText('Ready to jump back in?')).not.toBeInTheDocument()
  })

  it('when time is up: BACK TO MY QUEST, +5, +10, +15 and NO TIMER, as often as the player likes', () => {
    vi.useFakeTimers()
    renderRoom(true)
    minutes(5)
    expect(screen.getByText('Ready to jump back in?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'STAY A BIT LONGER' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'BACK TO MY QUEST' }).length).toBeGreaterThan(0)

    for (const m of [5, 10, 15, 5]) {
      fireEvent.click(screen.getByRole('button', { name: `${m} more minutes` }))
      expect(screen.queryByText('Ready to jump back in?')).not.toBeInTheDocument()
      expect(clock()).toHaveTextContent(`${m}:00`)
      minutes(m)
      expect(screen.getByText('Ready to jump back in?')).toBeInTheDocument()
    }

    const prompt = screen.getByText('Ready to jump back in?').closest('[role="status"]') as HTMLElement
    fireEvent.click(within(prompt).getByRole('button', { name: 'NO TIMER' }))
    expect(screen.queryByText('Ready to jump back in?')).not.toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('the clock only counts while the tab is visible', () => {
    vi.useFakeTimers()
    renderRoom(true)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    minutes(3)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    expect(clock()).toHaveTextContent('5:00')
  })

  it('timer choices are not saved: settings stay as they were', () => {
    renderRoom(true)
    fireEvent.click(within(timerBar()).getByRole('button', { name: '15 minutes' }))
    fireEvent.click(within(timerBar()).getByRole('button', { name: 'NO TIMER' }))
    expect(localStorage.getItem('plq.settings')).toBeNull()
    expect(Object.keys(localStorage).filter((k) => k.startsWith('plq.') && k !== 'plq.progress')).toEqual([])
  })

  it('BACK TO MY QUEST returns to the page the learner came from', () => {
    rememberPage('/badges')
    renderRoom()
    fireEvent.click(screen.getByRole('button', { name: 'BACK TO MY QUEST' }))
    expect(screen.getByText('badges page')).toBeInTheDocument()
  })

  it('BACK TO MY QUEST goes to the next level when there is nowhere to return to', () => {
    renderRoom()
    fireEvent.click(screen.getByRole('button', { name: 'BACK TO MY QUEST' }))
    expect(screen.getByText('level page')).toBeInTheDocument()
  })
})

describe('ways into the Break Room', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })

  function renderApp(path: string) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )
  }

  it('the BREAK ROOM link in a level starts a timed break', () => {
    renderApp('/level/w1-l1-what-is-linux')
    fireEvent.click(screen.getByRole('link', { name: 'BREAK ROOM' }))
    expect(screen.getByRole('timer')).toHaveTextContent('5:00')
  })

  it('the BREAK ROOM link in the site header opens it with no timer', () => {
    renderApp('/map')
    fireEvent.click(screen.getByRole('link', { name: 'BREAK ROOM' }))
    expect(screen.getByRole('heading', { name: 'BREAK ROOM' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })
})
