import { beforeEach, describe, expect, it } from 'vitest'

import { BREAK_MS, EXTRA_MS, canExtend, extendBreak, formatClock, isBreakOver, newBreak, tickBreak } from './breakTimer'
import { getHighScore, recordScore } from './highScores'
import { controlForKey, isPauseKey, swipeDirection } from './input'
import { nextRandom, randomInt } from './random'
import { getSettings, reloadSettings, setSetting } from './settings'

describe('break timer', () => {
  it('runs for five minutes', () => {
    let t = newBreak()
    expect(t.remainingMs).toBe(BREAK_MS)
    t = tickBreak(t, BREAK_MS - 1000)
    expect(isBreakOver(t)).toBe(false)
    t = tickBreak(t, 5000)
    expect(t.remainingMs).toBe(0)
    expect(isBreakOver(t)).toBe(true)
  })

  it('+2 minutes works once per break', () => {
    let t = tickBreak(newBreak(), BREAK_MS)
    expect(canExtend(t)).toBe(true)
    t = extendBreak(t)
    expect(t.remainingMs).toBe(EXTRA_MS)
    expect(canExtend(t)).toBe(false)
    expect(extendBreak(t)).toBe(t)
  })

  it('formats the clock', () => {
    expect(formatClock(BREAK_MS)).toBe('5:00')
    expect(formatClock(65_000)).toBe('1:05')
    expect(formatClock(400)).toBe('0:01')
    expect(formatClock(0)).toBe('0:00')
  })
})

describe('high scores', () => {
  beforeEach(() => localStorage.clear())

  it('keeps the best score per game', () => {
    expect(getHighScore('snake')).toBe(0)
    expect(recordScore('snake', 40)).toBe(true)
    expect(recordScore('snake', 20)).toBe(false)
    expect(getHighScore('snake')).toBe(40)
    expect(getHighScore('bugs')).toBe(0)
  })

  it('ignores broken saved data', () => {
    localStorage.setItem('plq.highScores', '{nope')
    expect(getHighScore('snake')).toBe(0)
  })
})

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
    reloadSettings()
  })

  it('sound is off and nudges are on by default', () => {
    expect(getSettings()).toEqual({ sound: false, nudges: true })
  })

  it('remembers changes', () => {
    setSetting('sound', true)
    reloadSettings()
    expect(getSettings().sound).toBe(true)
  })
})

describe('input', () => {
  it('maps arrows, WASD, Space and Enter', () => {
    expect(controlForKey('ArrowLeft')).toBe('left')
    expect(controlForKey('w')).toBe('up')
    expect(controlForKey('D')).toBe('right')
    expect(controlForKey(' ')).toBe('action')
    expect(controlForKey('Enter')).toBe('action')
    expect(controlForKey('5')).toBe('5')
    expect(controlForKey('x')).toBeNull()
  })

  it('P and Esc pause', () => {
    expect(isPauseKey('p')).toBe(true)
    expect(isPauseKey('Escape')).toBe(true)
    expect(isPauseKey('q')).toBe(false)
  })

  it('turns swipes into directions', () => {
    expect(swipeDirection(60, 5)).toBe('right')
    expect(swipeDirection(-3, -50)).toBe('up')
    expect(swipeDirection(4, 4)).toBeNull()
  })
})

describe('seeded random', () => {
  it('is repeatable', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42))
    const [n] = randomInt(7, 9)
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThan(9)
  })
})
