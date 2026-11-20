import { beforeEach, describe, expect, it } from 'vitest'

import { EXTRA_MS, MINUTE_MS, extendBreak, formatClock, isBreakOver, newBreak, tickBreak } from './breakTimer'
import { getHighScore, recordScore } from './highScores'
import { controlForKey, isPauseKey, swipeDirection } from './input'
import { nextRandom, randomInt } from './random'
import { getSettings, parseSettings, reloadSettings, setSetting } from './settings'

describe('break timer', () => {
  it('runs for the chosen number of minutes', () => {
    let t = newBreak(5)
    expect(t.remainingMs).toBe(5 * MINUTE_MS)
    t = tickBreak(t, 5 * MINUTE_MS - 1000)
    expect(isBreakOver(t)).toBe(false)
    t = tickBreak(t, 5000)
    expect(t.remainingMs).toBe(0)
    expect(isBreakOver(t)).toBe(true)
    expect(newBreak(3).remainingMs).toBe(3 * MINUTE_MS)
    expect(newBreak(10).remainingMs).toBe(10 * MINUTE_MS)
  })

  it('+2 minutes can be added again and again', () => {
    let t = tickBreak(newBreak(5), 5 * MINUTE_MS)
    for (let i = 1; i <= 4; i++) {
      t = extendBreak(t)
      expect(t.remainingMs).toBe(EXTRA_MS)
      t = tickBreak(t, EXTRA_MS)
      expect(isBreakOver(t)).toBe(true)
    }
  })

  it('formats the clock', () => {
    expect(formatClock(5 * MINUTE_MS)).toBe('5:00')
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

  it('sound is off, reminders every 20 minutes and 5 minute breaks by default', () => {
    expect(getSettings()).toEqual({ sound: false, nudgeMinutes: 20, breakMinutes: 5 })
  })

  it('migrates the old on/off nudge switch', () => {
    localStorage.setItem('plq.settings', JSON.stringify({ sound: true, nudges: false }))
    reloadSettings()
    expect(getSettings()).toEqual({ sound: true, nudgeMinutes: 0, breakMinutes: 5 })
    expect(parseSettings({ nudges: true }).nudgeMinutes).toBe(20)
  })

  it('ignores values that are not one of the choices', () => {
    expect(parseSettings({ nudgeMinutes: 7, breakMinutes: 60 })).toEqual({
      sound: false,
      nudgeMinutes: 20,
      breakMinutes: 5,
    })
    expect(parseSettings(null).breakMinutes).toBe(5)
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
