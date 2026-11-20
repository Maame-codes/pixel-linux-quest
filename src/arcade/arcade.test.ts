import { beforeEach, describe, expect, it } from 'vitest'

import {
  MINUTE_MS,
  canStep,
  extendBreak,
  formatClock,
  hasTimer,
  isBreakOver,
  newBreak,
  noTimer,
  setBreak,
  startingBreak,
  stepBreak,
  tickBreak,
} from './breakTimer'
import { getHighScore, recordScore } from './highScores'
import { controlForKey, isPauseKey, swipeDirection } from './input'
import { nextRandom, randomInt } from './random'
import { getSettings, parseSettings, reloadSettings, setSetting } from './settings'

describe('break timer', () => {
  it('from a level starts with the break length, from anywhere else with no timer', () => {
    expect(startingBreak(true, 5).remainingMs).toBe(5 * MINUTE_MS)
    expect(startingBreak(true, 10).remainingMs).toBe(10 * MINUTE_MS)
    expect(startingBreak(false, 5).remainingMs).toBeNull()
    expect(hasTimer(startingBreak(false, 5))).toBe(false)
  })

  it('counts down to zero and is then over', () => {
    let t = newBreak(5)
    t = tickBreak(t, 5 * MINUTE_MS - 1000)
    expect(isBreakOver(t)).toBe(false)
    t = tickBreak(t, 5000)
    expect(t.remainingMs).toBe(0)
    expect(isBreakOver(t)).toBe(true)
  })

  it('with no timer, never ticks and is never over', () => {
    const t = tickBreak(noTimer(), 99 * MINUTE_MS)
    expect(t.remainingMs).toBeNull()
    expect(isBreakOver(t)).toBe(false)
  })

  it('- and + move one minute, kept between 1 and 60 minutes', () => {
    let t = newBreak(5)
    t = stepBreak(t, 1)
    expect(t.remainingMs).toBe(6 * MINUTE_MS)
    t = stepBreak(stepBreak(t, -1), -1)
    expect(t.remainingMs).toBe(4 * MINUTE_MS)
    expect(stepBreak(newBreak(1), -1).remainingMs).toBe(MINUTE_MS)
    expect(canStep(newBreak(1), -1)).toBe(false)
    expect(canStep(newBreak(1), 1)).toBe(true)
    expect(stepBreak(newBreak(60), 1).remainingMs).toBe(60 * MINUTE_MS)
    expect(canStep(newBreak(60), 1)).toBe(false)
    // Part way through a minute, - still never goes under 1 minute.
    expect(stepBreak(tickBreak(newBreak(2), 30_000), -1).remainingMs).toBe(MINUTE_MS)
    // No timer: nothing to step.
    expect(stepBreak(noTimer(), 1).remainingMs).toBeNull()
    expect(canStep(noTimer(), 1)).toBe(false)
  })

  it('quick choices and SET A TIMER set the clock to exactly that', () => {
    expect(setBreak(15).remainingMs).toBe(15 * MINUTE_MS)
    expect(setBreak(5).remainingMs).toBe(5 * MINUTE_MS)
  })

  it('+5, +10 and +15 when time is up work again and again', () => {
    let t = tickBreak(newBreak(5), 5 * MINUTE_MS)
    for (const m of [5, 10, 15, 5]) {
      t = extendBreak(t, m)
      expect(t.remainingMs).toBe(m * MINUTE_MS)
      t = tickBreak(t, m * MINUTE_MS)
      expect(isBreakOver(t)).toBe(true)
    }
  })

  it('NO TIMER removes the timer, even when time is up', () => {
    expect(isBreakOver(noTimer())).toBe(false)
    expect(noTimer().remainingMs).toBeNull()
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
    expect(getSettings()).toEqual({ sound: false, nudgeMinutes: 20, breakMinutes: 5, bossTimer: true })
  })

  it('migrates the old on/off nudge switch', () => {
    localStorage.setItem('plq.settings', JSON.stringify({ sound: true, nudges: false }))
    reloadSettings()
    expect(getSettings()).toEqual({ sound: true, nudgeMinutes: 0, breakMinutes: 5, bossTimer: true })
    expect(parseSettings({ nudges: true }).nudgeMinutes).toBe(20)
  })

  it('ignores values that are not one of the choices', () => {
    expect(parseSettings({ nudgeMinutes: 7, breakMinutes: 60 })).toEqual({
      sound: false,
      nudgeMinutes: 20,
      breakMinutes: 5,
      bossTimer: true,
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
