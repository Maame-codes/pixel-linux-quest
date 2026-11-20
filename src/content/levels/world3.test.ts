import { describe, expect, it } from 'vitest'

import { createShellState, getNode, runCommand, type CommandResult, type ShellState } from '../../shell'
import type { ChallengeTest, Level } from '../types'
import { getLevelsByWorld } from './index'
import { cleanUp } from './w3l2-clean-up'
import { forestFire } from './w3l6-forest-fire'

const WORLD3 = getLevelsByWorld(3)

function challenge(level: Level): ChallengeTest {
  if (level.test.kind !== 'challenge') throw new Error(`${level.id} is not a challenge`)
  return level.test
}

function start(test: ChallengeTest): ShellState {
  return createShellState({ seedFs: test.seedFs, cwd: test.startDir })
}

/** Play lines the way the level player does: objectives latch, failure is checked after each one. */
function play(test: ChallengeTest, lines: string[]) {
  let state = start(test)
  const done = test.objectives.map(() => false)
  let failure: string | null = null
  let last: CommandResult | null = null
  for (const line of lines) {
    last = runCommand(state, line, { commands: test.commands })
    state = last.state
    test.objectives.forEach((o, i) => {
      if (!done[i] && last && o.check(state, last)) done[i] = true
    })
    failure ??= test.failure?.(state) ?? null
  }
  return { state, done, failure, last }
}

/** Every bit of on-screen text in a level. */
function screenText(level: Level): string[] {
  const t = challenge(level)
  return [level.title, level.blurb, ...level.lessonPages, ...t.objectives.flatMap((o) => [o.label, o.hint])]
}

describe('World 3: File Forest', () => {
  it('has 6 levels, in order, the last one a boss', () => {
    expect(WORLD3.map((l) => l.level)).toEqual([1, 2, 3, 4, 5, 6])
    expect(challenge(WORLD3[5]).boss).toBeDefined()
    expect(WORLD3.slice(0, 5).every((l) => !challenge(l).boss)).toBe(true)
  })

  for (const level of WORLD3) {
    describe(level.title, () => {
      const test = challenge(level)

      it('is cleared by playing its own answers, with every command succeeding', () => {
        const { done, failure } = play(test, [])
        expect(done.some(Boolean)).toBe(false)
        let state = start(test)
        const flags = test.objectives.map(() => false)
        for (const obj of test.objectives) {
          const r = runCommand(state, obj.answer, { commands: test.commands })
          expect(r.code, `${obj.answer}: ${r.stderr}`).toBe(0)
          state = r.state
          test.objectives.forEach((o, i) => {
            if (!flags[i] && o.check(state, r)) flags[i] = true
          })
          expect(test.failure?.(state) ?? null, obj.answer).toBeNull()
        }
        expect(flags).toEqual(test.objectives.map(() => true))
        expect(failure).toBeNull()
      })

      it('has 2 to 4 short lesson pages and only uses commands it unlocks', () => {
        expect(level.lessonPages.length).toBeGreaterThanOrEqual(2)
        expect(level.lessonPages.length).toBeLessThanOrEqual(4)
        for (const obj of test.objectives) {
          const name = obj.answer.split(' ')[0]
          expect(test.commands, obj.id).toContain(name)
        }
      })

      it('has no em dashes on screen', () => {
        for (const text of screenText(level)) expect(text).not.toMatch(/[—–]/)
      })

      it('recall objectives give no hint and never name the command', () => {
        for (const obj of test.objectives.filter((o) => o.recall)) {
          const name = obj.answer.split(' ')[0]
          expect(obj.hint).toBe('You learned this in World 2.')
          expect(obj.label.split(/\W+/), obj.id).not.toContain(name)
        }
      })
    })
  }

  it('at least two non-boss levels have a recall objective', () => {
    const withRecall = WORLD3.slice(0, 5).filter((l) => challenge(l).objectives.some((o) => o.recall))
    expect(withRecall.length).toBeGreaterThanOrEqual(2)
  })

  it('the boss mixes every World 3 command with at least two World 2 recall objectives', () => {
    const test = challenge(forestFire)
    const used = new Set(test.objectives.map((o) => o.answer.split(' ')[0]))
    for (const cmd of ['cp', 'rm', 'rmdir', 'tail', 'find', 'chmod']) expect(used.has(cmd), cmd).toBe(true)
    expect(test.objectives.filter((o) => o.recall).length).toBeGreaterThanOrEqual(2)
    expect(test.boss?.timeLimitSec).toBeGreaterThan(0)
  })

  it('Clean Up fails if an important file is deleted, and starts clean again', () => {
    const test = challenge(cleanUp)
    expect(play(test, ['rm thesis.txt']).failure).toContain('thesis.txt was important')
    expect(play(test, ['rm -r downloads']).failure).toContain('passport-scan.pdf')
    expect(play(test, ['rm -r photos']).failure).toContain('photos/family.jpg')
    // A restart begins from the untouched seed.
    expect(test.failure?.(start(test))).toBeNull()
    expect(getNode(start(test).fs, '/home/pip/thesis.txt')).not.toBeNull()
  })

  it('Clean Up: rmdir refuses the cache folder, which is not empty', () => {
    const { last } = play(challenge(cleanUp), ['rmdir cache'])
    expect(last?.stderr).toBe("rmdir: failed to remove 'cache': Directory not empty")
  })

  it('Forest Fire fails if a file that must be kept is deleted', () => {
    expect(play(challenge(forestFire), ['rm keys.txt']).failure).toContain('keys.txt')
  })

  it('Forest Fire: deleting the whole tmp folder at once also clears the smoke', () => {
    const test = challenge(forestFire)
    const { done } = play(test, ['rm -r server/tmp'])
    const ids = test.objectives.map((o) => o.id)
    expect(done[ids.indexOf('smoke')]).toBe(true)
    expect(done[ids.indexOf('tmpdir')]).toBe(true)
  })

  it('Find It: an unquoted *.txt still works here, because nothing in the home folder matches it', () => {
    // There is no .txt file in the home folder, so bash leaves *.txt alone and find gets it.
    const { done } = play(challenge(WORLD3[3]), ['find forest -name *.txt'])
    expect(done[1]).toBe(true)
  })
})
