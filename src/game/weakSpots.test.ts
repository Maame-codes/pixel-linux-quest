import { beforeEach, describe, expect, it } from 'vitest'

import { createShellState, runCommand } from '../shell'
import {
  loadWeakSpots,
  mistakeCommand,
  practiceCleared,
  recordMistake,
  weakestCommands,
  weakTotal,
} from './weakSpots'

const W2 = ['cat', 'cd', 'echo', 'ls', 'mkdir', 'pwd', 'touch']

function run(line: string) {
  return runCommand(createShellState(), line, { commands: W2 })
}

describe('weak spots', () => {
  beforeEach(() => localStorage.clear())

  it('blames the command for a non-zero exit', () => {
    expect(mistakeCommand('cd nowhere', run('cd nowhere'), true, W2)).toBe('cd')
    expect(mistakeCommand('sudo cd nowhere', run('cd nowhere'), true, W2)).toBe('cd')
  })

  it('counts a success that Pip explains as a mistake (cat with no file)', () => {
    expect(mistakeCommand('cat', run('cat'), true, W2)).toBe('cat')
    expect(mistakeCommand('cat', run('cat'), false, W2)).toBeNull()
  })

  it('ignores successes', () => {
    expect(mistakeCommand('ls', run('ls'), false, W2)).toBeNull()
  })

  it('maps glued and capitalised names to the real command', () => {
    expect(mistakeCommand('cd..', run('cd..'), true, W2)).toBe('cd')
    expect(mistakeCommand('LS', run('LS'), true, W2)).toBe('ls')
  })

  it('never records unknown words or locked commands', () => {
    expect(mistakeCommand('hunter2', run('hunter2'), false, W2)).toBeNull()
    expect(mistakeCommand('history', run('history'), true, ['ls'])).toBeNull()
  })

  it('stores only counts per known command', () => {
    recordMistake('cd')
    recordMistake('cd')
    recordMistake('ls')
    recordMistake('my secret words')
    expect(loadWeakSpots()).toEqual({ cd: 2, ls: 1 })
    const saved = localStorage.getItem('plq.weakSpots') ?? ''
    expect(saved).not.toContain('secret')
  })

  it('drops anything in storage that is not a command name', () => {
    localStorage.setItem('plq.weakSpots', JSON.stringify({ version: 1, counts: { cd: 2, 'rm -rf ~/x': 4, ls: -1 } }))
    expect(loadWeakSpots()).toEqual({ cd: 2 })
    localStorage.setItem('plq.weakSpots', '{oops')
    expect(loadWeakSpots()).toEqual({})
  })

  it('clearing a practice task lowers the count', () => {
    recordMistake('mkdir')
    recordMistake('mkdir')
    practiceCleared('mkdir')
    expect(loadWeakSpots()).toEqual({ mkdir: 1 })
    practiceCleared('mkdir')
    practiceCleared('mkdir')
    expect(loadWeakSpots()).toEqual({})
  })

  it('totals and ranks only eligible commands', () => {
    const counts = { cd: 1, ls: 3, mkdir: 3, cp: 9 }
    expect(weakTotal(counts, W2)).toBe(7)
    expect(weakestCommands(counts, W2)).toEqual(['ls', 'mkdir', 'cd'])
  })
})
