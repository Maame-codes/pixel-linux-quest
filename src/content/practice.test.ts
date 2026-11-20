import { describe, expect, it } from 'vitest'

import { ALL_COMMANDS, createShellState, runCommand } from '../shell'
import { LEVELS } from './levels'
import { MAX_TASKS, MIN_TASKS, PRACTICE_TASKS, PRACTISABLE, pickPracticeTasks } from './practice'

/** Every command taught in a challenge level. */
const TAUGHT = [
  ...new Set(LEVELS.flatMap((l) => (l.test.kind === 'challenge' ? l.test.commands : []))),
].filter((c) => !['help', 'clear', 'type'].includes(c))

describe('practice tasks', () => {
  it('has unique ids', () => {
    const ids = PRACTICE_TASKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least two tasks for every command a level unlocks', () => {
    for (const cmd of TAUGHT) {
      expect(PRACTICE_TASKS.filter((t) => t.command === cmd).length, cmd).toBeGreaterThanOrEqual(2)
    }
  })

  for (const task of PRACTICE_TASKS) {
    it(`"${task.id}" is solved by its own answer, and not before`, () => {
      const commands = ALL_COMMANDS
      let state = createShellState({ seedFs: task.seedFs(), cwd: task.startDir })
      for (const line of task.preRun ?? []) state = runCommand(state, line, { commands }).state
      const result = runCommand(state, task.answer, { commands })
      expect(result.code, `${task.answer}: ${result.stderr}`).toBe(0)
      expect(task.check(result.state, result)).toBe(true)
      const idle = runCommand(state, 'clear', { commands })
      expect(task.check(idle.state, idle)).toBe(false)
    })
  }
})

describe('pickPracticeTasks', () => {
  const fixed = () => 0

  it('gives nothing when there are no weak spots', () => {
    expect(pickPracticeTasks([], [], fixed)).toEqual([])
    expect(pickPracticeTasks(['not-a-command'], ['ls'], fixed)).toEqual([])
  })

  it('fills a round of at least 3 even with one weak command', () => {
    const tasks = pickPracticeTasks(['cd'], [], fixed)
    expect(tasks.length).toBe(MIN_TASKS)
    expect(tasks.every((t) => t.command === 'cd')).toBe(true)
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
  })

  it('never repeats a task, and tops up from other unlocked commands', () => {
    const pwdTasks = PRACTICE_TASKS.filter((t) => t.command === 'pwd').length
    expect(pickPracticeTasks(['pwd'], [], fixed).length).toBe(pwdTasks)
    const tasks = pickPracticeTasks(['pwd'], ['pwd', 'ls', 'cd'], fixed)
    expect(tasks.length).toBe(MIN_TASKS)
    expect(tasks.slice(0, pwdTasks).every((t) => t.command === 'pwd')).toBe(true)
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
  })

  it('takes one task per command, weakest first, at most 5', () => {
    const weakest = PRACTISABLE.slice(0, 7)
    const tasks = pickPracticeTasks(weakest, [], fixed)
    expect(tasks.length).toBe(MAX_TASKS)
    expect(tasks.map((t) => t.command)).toEqual(weakest.slice(0, MAX_TASKS))
  })
})
