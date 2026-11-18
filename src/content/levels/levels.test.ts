import { describe, expect, it } from 'vitest'

import { createShellState, runCommand } from '../../shell'
import { quizPassed } from '../../game/quizScore'
import { LEVELS } from './index'

describe('level content', () => {
  it('has unique ids and sane metadata', () => {
    const ids = LEVELS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const lvl of LEVELS) {
      expect(lvl.lessonPages.length).toBeGreaterThan(0)
      expect(lvl.xp).toBeGreaterThan(0)
    }
  })

  for (const lvl of LEVELS.filter((l) => l.test.kind === 'challenge')) {
    it(`challenge "${lvl.id}" is solvable with its own answers`, () => {
      const test = lvl.test
      if (test.kind !== 'challenge') return
      let state = createShellState({ seedFs: test.seedFs, cwd: test.startDir })
      const done = test.objectives.map(() => false)
      for (const obj of test.objectives) {
        const result = runCommand(state, obj.answer, { commands: test.commands })
        state = result.state
        expect(result.code, `"${obj.answer}" should succeed`).toBe(0)
        test.objectives.forEach((o, i) => {
          if (!done[i] && o.check(state, result)) done[i] = true
        })
      }
      expect(done.every(Boolean)).toBe(true)
    })
  }

  for (const lvl of LEVELS.filter((l) => l.test.kind === 'quiz')) {
    it(`quiz "${lvl.id}" has valid questions`, () => {
      const test = lvl.test
      if (test.kind !== 'quiz') return
      expect(test.questions.length).toBeGreaterThan(0)
      for (const q of test.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(q.correct).toBeGreaterThanOrEqual(0)
        expect(q.correct).toBeLessThan(q.options.length)
        expect(q.explain.length).toBeGreaterThan(0)
      }
    })
  }
})

describe('World 1 quizzes', () => {
  it('allow one mistake under the 80% rule', () => {
    const quizzes = LEVELS.filter((l) => l.world === 1 && l.test.kind === 'quiz')
    expect(quizzes).toHaveLength(3)
    for (const lvl of quizzes) {
      if (lvl.test.kind !== 'quiz') continue
      const total = lvl.test.questions.length
      expect(quizPassed(total - 1, total), lvl.id).toBe(true)
    }
  })
})
