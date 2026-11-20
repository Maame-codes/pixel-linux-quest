import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSettings, reloadSettings } from '../arcade/settings'
import { cleanUp } from '../content/levels/w3l2-clean-up'
import { readTheLogs } from '../content/levels/w3l3-read-the-logs'
import { forestFire } from '../content/levels/w3l6-forest-fire'
import type { ChallengeTest, Level } from '../content/types'
import { ChallengePlayer } from './ChallengePlayer'

function testOf(level: Level): ChallengeTest {
  if (level.test.kind !== 'challenge') throw new Error('expected a challenge')
  return level.test
}

function renderLevel(level: Level) {
  render(
    <MemoryRouter>
      <ChallengePlayer
        test={testOf(level)}
        world={level.world}
        xp={level.xp}
        clearMessage="Nice work."
        nextHref={null}
        onReviewLesson={() => {}}
        onCompleted={() => {}}
      />
    </MemoryRouter>,
  )
}

function type(command: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: command } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

beforeEach(() => {
  localStorage.clear()
  reloadSettings()
})
afterEach(() => vi.useRealTimers())

describe('a mission that can fail', () => {
  it('stops when an important file is deleted, and RESTART LEVEL brings it all back', () => {
    renderLevel(cleanUp)
    type('rm thesis.txt')
    expect(screen.getByText('MISSION FAILED')).toBeInTheDocument()
    expect(screen.getAllByText(/thesis.txt was important/).length).toBeGreaterThan(0)
    expect(screen.getByRole('textbox')).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: 'RESTART LEVEL' })[0])
    expect(screen.queryByText('MISSION FAILED')).not.toBeInTheDocument()
    type('cat thesis.txt')
    expect(screen.getByText(/My thesis: penguins/)).toBeInTheDocument()
  })
})

describe('recall objectives', () => {
  it('give no hint, and SHOW ANSWER only after 3 tries', () => {
    renderLevel(readTheLogs)
    expect(screen.getByText('You learned this in World 2.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'SHOW ANSWER' })).not.toBeInTheDocument()
    expect(screen.getByText('SHOW ANSWER after 3 tries (0/3)')).toBeInTheDocument()
    type('ls')
    type('pwd')
    expect(screen.queryByRole('button', { name: 'SHOW ANSWER' })).not.toBeInTheDocument()
    type('ls /var')
    fireEvent.click(screen.getByRole('button', { name: 'SHOW ANSWER' }))
    expect(screen.getByText('cd /var/log/web', { selector: 'code' })).toBeInTheDocument()
  })
})

describe('the boss level', () => {
  it('counts down, and running out of time costs nothing: TRY AGAIN starts over', () => {
    vi.useFakeTimers()
    renderLevel(forestFire)
    expect(screen.getByText('BOSS LEVEL')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('8:00')
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('7:00')
    act(() => {
      vi.advanceTimersByTime(7 * 60_000)
    })
    expect(screen.getByText("TIME'S UP")).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'TRY AGAIN' }))
    expect(screen.getByRole('timer')).toHaveTextContent('8:00')
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('the timer can be turned off, and that is remembered', () => {
    vi.useFakeTimers()
    renderLevel(forestFire)
    act(() => {
      vi.advanceTimersByTime(8 * 60_000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'TURN TIMER OFF' }))
    expect(screen.queryByText("TIME'S UP")).not.toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.getByText('No timer. Take your time.')).toBeInTheDocument()
    expect(getSettings().bossTimer).toBe(false)
    type('whoami')
    expect(screen.getByText('pip')).toBeInTheDocument()
  })

  it('hides SHOW ANSWER until 3 tries, even for objectives with hints', () => {
    renderLevel(forestFire)
    type('whoami')
    expect(screen.getByText('Copy it, and give the folder as the destination.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'SHOW ANSWER' })).not.toBeInTheDocument()
    type('ls')
    type('ls server')
    type('ls backups')
    expect(screen.getByRole('button', { name: 'SHOW ANSWER' })).toBeInTheDocument()
  })
})
