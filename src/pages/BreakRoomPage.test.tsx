import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BREAK_MS } from '../arcade/breakTimer'
import { ProgressProvider } from '../game/ProgressContext'
import { rememberPage } from '../game/returnTo'
import { BreakRoomPage } from './BreakRoomPage'

function renderRoom() {
  render(
    <MemoryRouter initialEntries={['/break']}>
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

describe('BreakRoomPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('shows the arcade scene, a clock and the games as buttons', () => {
    renderRoom()
    expect(screen.getByRole('heading', { name: 'BREAK ROOM' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /The Break Room/ })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('5:00')
    expect(screen.getAllByRole('button', { name: /PACKET SNAKE|BUG SMASH|BIT BREAKER/ })).toHaveLength(3)
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

  it('asks "Ready to jump back in?" when time is up, with +2 MINUTES once', () => {
    vi.useFakeTimers()
    renderRoom()
    act(() => {
      vi.advanceTimersByTime(BREAK_MS)
    })
    expect(screen.getByText('Ready to jump back in?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+2 MINUTES' }))
    expect(screen.queryByText('Ready to jump back in?')).not.toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('2:00')
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })
    expect(screen.getByText('Ready to jump back in?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+2 MINUTES' })).not.toBeInTheDocument()
  })
})
