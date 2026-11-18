import { describe, expect, it } from 'vitest'

import { complete } from './complete'
import { availableCommands, createShellState } from './engine'
import { dir, file } from './types'

const state = createShellState({
  seedFs: dir({
    home: dir({
      pip: dir({
        'notes.txt': file('hi'),
        'snacks': dir({ 'fish.txt': file('><>') }),
        'snack-list.txt': file('fish'),
        'treasure map.txt': file('X'),
        '.secret': file('shh'),
        cave: dir({ tunnel: dir({}) }),
      }),
    }),
    var: dir({ log: dir({ 'boot.log': file('ok') }), lib: dir({}) }),
  }),
})
const commands = availableCommands(['ls', 'cd', 'cat', 'clear', 'touch', 'mkdir'])

describe('availableCommands', () => {
  it('adds the always-available commands without duplicates', () => {
    expect(commands).toEqual(['cat', 'cd', 'clear', 'help', 'ls', 'mkdir', 'touch', 'type'])
  })
})

describe('complete: command names', () => {
  it('finishes a command with one match and adds a space', () => {
    expect(complete('mk', state, commands)).toEqual({ insert: 'dir ', matches: ['mkdir'] })
  })

  it('lists several matches and adds nothing when they share no more letters', () => {
    expect(complete('c', state, commands)).toEqual({ insert: '', matches: ['cat', 'cd', 'clear'] })
  })

  it('extends to the letters every match shares', () => {
    expect(complete('t', state, commands)).toEqual({ insert: '', matches: ['touch', 'type'] })
    expect(complete('cl', state, commands).insert).toBe('ear ')
  })

  it('only offers commands that are unlocked', () => {
    expect(complete('r', state, commands)).toEqual({ insert: '', matches: [] })
  })

  it('does nothing on an empty line', () => {
    expect(complete('', state, commands)).toEqual({ insert: '', matches: [] })
  })

  it('completes the command after sudo when sudo is unlocked', () => {
    expect(complete('sudo mk', state, [...commands, 'sudo']).insert).toBe('dir ')
    // Without sudo unlocked, the word after it is treated as a path.
    expect(complete('sudo mk', state, commands).matches).toEqual([])
  })
})

describe('complete: paths', () => {
  it('finishes a folder with a slash', () => {
    expect(complete('cd ca', state, commands)).toEqual({ insert: 've/', matches: ['cave/'] })
  })

  it('finishes a file with a space', () => {
    expect(complete('cat no', state, commands)).toEqual({ insert: 'tes.txt ', matches: ['notes.txt'] })
  })

  it('extends to the shared part, then lists the choices', () => {
    expect(complete('cat sn', state, commands)).toEqual({ insert: 'ack', matches: ['snack-list.txt', 'snacks/'] })
    expect(complete('cat snack', state, commands)).toEqual({ insert: '', matches: ['snack-list.txt', 'snacks/'] })
  })

  it('lists everything in the folder for an empty word', () => {
    expect(complete('ls ', state, commands).matches).toEqual([
      'cave/',
      'notes.txt',
      'snack-list.txt',
      'snacks/',
      'treasure map.txt',
    ])
  })

  it('completes inside a relative folder', () => {
    expect(complete('cat snacks/f', state, commands).insert).toBe('ish.txt ')
    expect(complete('cd cave/t', state, commands).insert).toBe('unnel/')
  })

  it('completes absolute paths, ~ paths and ..', () => {
    expect(complete('cd /va', state, commands).insert).toBe('r/')
    expect(complete('cat /var/log/b', state, commands).insert).toBe('oot.log ')
    expect(complete('cat ~/no', state, commands).insert).toBe('tes.txt ')
    expect(complete('ls ../../v', state, commands).insert).toBe('ar/')
  })

  it('escapes spaces, or keeps them inside quotes', () => {
    expect(complete('cat tr', state, commands).insert).toBe('easure\\ map.txt ')
    expect(complete('cat "tr', state, commands).insert).toBe('easure map.txt" ')
    expect(complete('cat treasure\\ m', state, commands).insert).toBe('ap.txt ')
  })

  it('hides dot files until a dot is typed', () => {
    expect(complete('cat ', state, commands).matches).not.toContain('.secret')
    expect(complete('cat .s', state, commands).insert).toBe('ecret ')
  })

  it('finds nothing in a folder that does not exist, or for ~ on its own', () => {
    expect(complete('cd nope/x', state, commands)).toEqual({ insert: '', matches: [] })
    expect(complete('cd ~', state, commands)).toEqual({ insert: '', matches: [] })
    expect(complete('cat notes.txt/x', state, commands)).toEqual({ insert: '', matches: [] })
  })

  it('only offers folders after cd', () => {
    expect(complete('cd ', state, commands).matches).toEqual(['cave/', 'snacks/'])
    expect(complete('cd sn', state, commands).insert).toBe('acks/')
    expect(complete('cat sn', state, commands).matches).toEqual(['snack-list.txt', 'snacks/'])
  })

  it('completes the word at the cursor, even after other arguments', () => {
    expect(complete('ls -a ca', state, commands).insert).toBe('ve/')
  })
})
