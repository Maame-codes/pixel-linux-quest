import { describe, expect, it } from 'vitest'

import { createShellState, runCommand, type CommandResult, type ShellState } from '../../shell'
import type { ChallengeTest } from '../types'
import { digAFolder } from './w2l4-dig-a-folder'

if (digAFolder.test.kind !== 'challenge') throw new Error('expected a challenge test')
const test: ChallengeTest = digAFolder.test

function freshState(): ShellState {
  return createShellState({ seedFs: test.seedFs, cwd: test.startDir })
}

function play(lines: string[]): { state: ShellState; results: CommandResult[] } {
  let state = freshState()
  const results: CommandResult[] = []
  for (const line of lines) {
    const r = runCommand(state, line, { commands: test.commands })
    state = r.state
    results.push(r)
  }
  return { state, results }
}

/** Sticky objective completion, the way the player latches it. */
function doneFlags(lines: string[]): boolean[] {
  let state = freshState()
  const done = test.objectives.map(() => false)
  for (const line of lines) {
    const r = runCommand(state, line, { commands: test.commands })
    state = r.state
    test.objectives.forEach((o, i) => {
      if (!done[i] && o.check(state, r)) done[i] = true
    })
  }
  return done
}

describe('Dig a Folder level', () => {
  it('completes when the intended solution is played', () => {
    const done = doneFlags(['ls', 'mkdir treasure', 'cd treasure', 'touch map.txt'])
    expect(done).toEqual([true, true, true, true])
  })

  it('stays incomplete before the steps are done', () => {
    const done = doneFlags(['ls'])
    expect(done).toEqual([true, false, false, false])
  })

  it('latches cd completion even after moving back out', () => {
    const done = doneFlags(['ls', 'mkdir treasure', 'cd treasure', 'cd ..'])
    expect(done[2]).toBe(true)
  })

  it('makes the treasure directory and the map file in the right place', () => {
    const { state } = play(['mkdir treasure', 'cd treasure', 'touch map.txt'])
    const r = runCommand(state, 'ls', { commands: test.commands })
    expect(r.stdout).toBe('map.txt')
  })
})
