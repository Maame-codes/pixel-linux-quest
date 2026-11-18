import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GameFrame } from './GameFrame'
import { getHighScore } from './highScores'
import { reloadSettings } from './settings'
import type { GameDef } from './types'

type TinyState = { score: number; over: boolean }

// A one-button game: press Space to score 7 and end the round.
const tiny: GameDef<TinyState> = {
  id: 'tiny',
  name: 'Tiny Game',
  blurb: 'A test game.',
  howTo: 'Press Space.',
  width: 10,
  height: 10,
  create: () => ({ score: 0, over: false }),
  update: (s, input) => (input.pressed.has('action') ? { score: 7, over: true } : s),
  draw: () => {},
  score: (s) => s.score,
  isOver: (s) => s.over,
  events: () => [],
  hud: (s) => [{ label: 'SCORE', value: String(s.score) }],
  touch: [[{ control: 'action', label: 'GO', ariaLabel: 'Go' }]],
  tips: ['ls lists files.'],
}

function renderFrame(onRoundEnd = vi.fn()) {
  render(
    <MemoryRouter>
      <GameFrame game={tiny} onRoundEnd={onRoundEnd} onClose={() => {}} />
    </MemoryRouter>,
  )
  return onRoundEnd
}

const frames = (n: number) =>
  act(() => {
    vi.advanceTimersByTime(16 * n)
  })

describe('GameFrame', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
    vi.useFakeTimers()
    HTMLCanvasElement.prototype.getContext = (() => ({
      save() {},
      restore() {},
      translate() {},
      fillRect() {},
      imageSmoothingEnabled: true,
    })) as unknown as HTMLCanvasElement['getContext']
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays a round: START, then game over with score, best, a tip and PLAY AGAIN', () => {
    const onRoundEnd = renderFrame()
    fireEvent.click(screen.getByRole('button', { name: 'START' }))
    fireEvent.keyDown(window, { key: ' ' })
    frames(3)
    expect(screen.getByText('GAME OVER')).toBeInTheDocument()
    expect(screen.getByText('SCORE 7 · BEST 7')).toBeInTheDocument()
    expect(screen.getByText('ls lists files.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PLAY AGAIN' })).toBeInTheDocument()
    expect(onRoundEnd).toHaveBeenCalledWith(7)
    expect(getHighScore('tiny')).toBe(7)
  })

  it('P pauses and resumes', () => {
    renderFrame()
    fireEvent.click(screen.getByRole('button', { name: 'START' }))
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument()
  })

  it('pauses itself when the tab is hidden', () => {
    renderFrame()
    fireEvent.click(screen.getByRole('button', { name: 'START' }))
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByText('PAUSED')).toBeInTheDocument()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  })

  it('has a SOUND toggle that starts off and is remembered', () => {
    renderFrame()
    const toggle = screen.getByRole('button', { name: 'SOUND OFF' })
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'SOUND ON' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('plq.settings') ?? '{}').sound).toBe(true)
  })

  it('touch buttons have room for a finger', () => {
    renderFrame()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
