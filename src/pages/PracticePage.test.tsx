import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import { reloadSettings, setSetting } from '../arcade/settings'
import { loadWeakSpots } from '../game/weakSpots'

const W1 = ['w1-l1-what-is-linux', 'w1-l2-distro-families', 'w1-l3-how-it-boots']

function saveProgress(completed: string[], bonusXp = 0) {
  localStorage.setItem(
    'plq.progress',
    JSON.stringify({
      version: 1,
      completed: Object.fromEntries(completed.map((id) => [id, true])),
      introSeen: true,
      secrets: {},
      bonusXp,
    }),
  )
}

function saveWeak(counts: Record<string, number>) {
  localStorage.setItem('plq.weakSpots', JSON.stringify({ version: 1, counts }))
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function type(line: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: line } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('weak spots on the world map', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })

  it('hides the practice card below 3 mistakes', () => {
    saveProgress(W1)
    saveWeak({ cd: 2 })
    renderAt('/map')
    expect(screen.queryByRole('heading', { name: 'PRACTICE YOUR WEAK SPOTS' })).not.toBeInTheDocument()
  })

  it('ignores mistakes with commands that are not unlocked yet', () => {
    saveWeak({ cd: 5 })
    renderAt('/map')
    expect(screen.queryByRole('heading', { name: 'PRACTICE YOUR WEAK SPOTS' })).not.toBeInTheDocument()
  })

  it('shows the card at 3 mistakes, naming the weakest commands', () => {
    saveProgress(W1)
    // World 2 level 1 is open: pwd, ls and friends, but not cd yet.
    saveWeak({ ls: 2, pwd: 1, cd: 9 })
    renderAt('/map')
    const card = screen.getByRole('region', { name: 'PRACTICE YOUR WEAK SPOTS' })
    expect(card).toHaveTextContent('ls, pwd.')
    expect(within(card).getByRole('link', { name: 'START PRACTICE' })).toHaveAttribute('href', '/practice')
  })
})

describe('practice round', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })

  it('plays a round of tasks, lowers the counts and gives a small XP reward', () => {
    saveProgress(W1)
    saveWeak({ whoami: 3 })
    renderAt('/practice')
    expect(screen.getByText('TASK 1 OF 3')).toBeInTheDocument()
    // whoami has two tasks, so the round is topped up with another command.
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'SHOW ANSWER' }))
      const answer = document.querySelector('code')?.textContent ?? ''
      type(answer)
      if (i < 2) fireEvent.click(screen.getByRole('button', { name: 'NEXT TASK' }))
    }
    expect(screen.getByText('ROUND CLEAR! +10 XP')).toBeInTheDocument()
    expect(loadWeakSpots()).toEqual({ whoami: 1 })
    expect(JSON.parse(localStorage.getItem('plq.progress') ?? '{}').bonusXp).toBe(10)
  })

  it('says so when there is nothing to practice', () => {
    renderAt('/practice')
    expect(screen.getByText(/No weak spots to practice right now/)).toBeInTheDocument()
  })
})

describe('Clear my saved data', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })

  it('asks first (not a browser dialog), then deletes progress, scores, settings and weak spots', () => {
    saveProgress(W1, 10)
    saveWeak({ cd: 4 })
    localStorage.setItem('plq.highScores', JSON.stringify({ snake: 50 }))
    localStorage.setItem('other.site', 'keep me')
    setSetting('breakMinutes', 10)
    renderAt('/map')
    expect(screen.getAllByText('130')[0]).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'CLEAR MY SAVED DATA' }))
    fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }))
    expect(localStorage.getItem('plq.weakSpots')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'CLEAR MY SAVED DATA' }))
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'YES, DELETE IT' }))

    expect(screen.getByText('All cleared. You are starting fresh.')).toBeInTheDocument()
    for (const key of ['plq.progress', 'plq.weakSpots', 'plq.highScores', 'plq.settings']) {
      expect(localStorage.getItem(key), key).toBeNull()
    }
    expect(localStorage.getItem('other.site')).toBe('keep me')
    expect(screen.queryByRole('heading', { name: 'PRACTICE YOUR WEAK SPOTS' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'START LEVEL 1' })).toBeInTheDocument()
  })
})
