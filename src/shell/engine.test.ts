import { beforeEach, describe, expect, it } from 'vitest'

import { createShellState, runCommand, type RunOptions } from './engine'
import { getNode } from './fs'
import { dir, file, isDir, isFile, type ShellState } from './types'

const ALL: RunOptions = {
  commands: ['pwd', 'ls', 'whoami', 'cd', 'mkdir', 'touch', 'cat', 'echo', 'man', 'history'],
}

function seeded(): ShellState {
  return createShellState({
    seedFs: dir({
      home: dir({
        pip: dir({
          'notes.txt': file('find the treasure'),
          snacks: dir({ 'fish.txt': file('><>') }),
        }),
      }),
    }),
  })
}

describe('runCommand basics', () => {
  let state: ShellState

  beforeEach(() => {
    state = seeded()
  })

  it('does not mutate the input state', () => {
    runCommand(state, 'mkdir treasure', ALL)
    expect(getNode(state.fs, '/home/pip/treasure')).toBeNull()
  })

  it('an empty line is a no-op', () => {
    const r = runCommand(state, '   ', ALL)
    expect(r.stdout).toBe('')
    expect(r.stderr).toBe('')
    expect(r.code).toBe(0)
  })

  it('records non-empty commands in history', () => {
    const r = runCommand(state, 'pwd', ALL)
    expect(r.state.history).toEqual(['pwd'])
  })
})

describe('pwd / whoami / echo', () => {
  it('pwd prints the current directory', () => {
    expect(runCommand(seeded(), 'pwd', ALL).stdout).toBe('/home/pip')
  })

  it('whoami prints the user', () => {
    expect(runCommand(seeded(), 'whoami', ALL).stdout).toBe('pip')
  })

  it('echo prints its arguments', () => {
    expect(runCommand(seeded(), 'echo hello there', ALL).stdout).toBe('hello there')
  })
})

describe('ls', () => {
  it('lists the current directory sorted', () => {
    expect(runCommand(seeded(), 'ls', ALL).stdout).toBe('notes.txt  snacks')
  })

  it('lists a subdirectory', () => {
    expect(runCommand(seeded(), 'ls snacks', ALL).stdout).toBe('fish.txt')
  })

  it('errors on a missing path', () => {
    const r = runCommand(seeded(), 'ls nope', ALL)
    expect(r.stderr).toContain('No such file or directory')
    expect(r.code).toBe(2)
  })
})

describe('cd', () => {
  it('moves into a directory', () => {
    const r = runCommand(seeded(), 'cd snacks', ALL)
    expect(r.state.cwd).toBe('/home/pip/snacks')
  })

  it('cd .. goes up', () => {
    const inSnacks = runCommand(seeded(), 'cd snacks', ALL).state
    const r = runCommand(inSnacks, 'cd ..', ALL)
    expect(r.state.cwd).toBe('/home/pip')
  })

  it('cd with no argument goes home', () => {
    const inSnacks = runCommand(seeded(), 'cd snacks', ALL).state
    const r = runCommand(inSnacks, 'cd', ALL)
    expect(r.state.cwd).toBe('/home/pip')
  })

  it('errors on a missing directory', () => {
    const r = runCommand(seeded(), 'cd nope', ALL)
    expect(r.stderr).toContain('No such file or directory')
  })

  it('errors when the target is a file', () => {
    const r = runCommand(seeded(), 'cd notes.txt', ALL)
    expect(r.stderr).toContain('Not a directory')
  })
})

describe('mkdir', () => {
  it('creates a directory', () => {
    const r = runCommand(seeded(), 'mkdir treasure', ALL)
    expect(isDir(getNode(r.state.fs, '/home/pip/treasure'))).toBe(true)
  })

  it('errors when the name already exists', () => {
    const r = runCommand(seeded(), 'mkdir snacks', ALL)
    expect(r.stderr).toContain('File exists')
  })

  it('errors with no operand', () => {
    expect(runCommand(seeded(), 'mkdir', ALL).stderr).toContain('missing operand')
  })
})

describe('touch', () => {
  it('creates an empty file', () => {
    const r = runCommand(seeded(), 'touch map.txt', ALL)
    const node = getNode(r.state.fs, '/home/pip/map.txt')
    expect(isFile(node)).toBe(true)
  })

  it('is a no-op on an existing file', () => {
    const r = runCommand(seeded(), 'touch notes.txt', ALL)
    expect(r.code).toBe(0)
  })
})

describe('cat', () => {
  it('prints file contents', () => {
    expect(runCommand(seeded(), 'cat notes.txt', ALL).stdout).toBe('find the treasure')
  })

  it('errors on a directory', () => {
    expect(runCommand(seeded(), 'cat snacks', ALL).stderr).toContain('Is a directory')
  })

  it('errors on a missing file', () => {
    expect(runCommand(seeded(), 'cat nope.txt', ALL).stderr).toContain('No such file or directory')
  })
})

describe('clear', () => {
  it('signals a screen wipe', () => {
    const r = runCommand(seeded(), 'clear', { commands: [] })
    expect(r.clear).toBe(true)
  })
})

describe('help and man', () => {
  it('help lists unlocked commands and is always available', () => {
    const r = runCommand(seeded(), 'help', { commands: ['pwd', 'ls'] })
    expect(r.stdout).toContain('pwd')
    expect(r.stdout).toContain('ls')
    expect(r.stdout).toContain('clear')
  })

  it('man shows a manual page for a known command', () => {
    const r = runCommand(seeded(), 'man ls', ALL)
    expect(r.stdout).toContain('NAME')
    expect(r.stdout).toContain('ls')
  })

  it('man errors for an unknown command', () => {
    expect(runCommand(seeded(), 'man blorp', ALL).stderr).toContain('No manual entry')
  })

  it('--help prints usage for a command', () => {
    const r = runCommand(seeded(), 'ls --help', ALL)
    expect(r.stdout).toContain('Usage:')
  })
})

describe('locking and easter eggs', () => {
  it('a locked command is not found', () => {
    const r = runCommand(seeded(), 'mkdir treasure', { commands: ['pwd'] })
    expect(r.stderr).toContain('command not found')
    expect(r.code).toBe(127)
  })

  it('rm gives a friendly Pip message before it is unlocked', () => {
    const r = runCommand(seeded(), 'rm notes.txt', { commands: ['ls'] })
    expect(r.stdout).toContain('World 3')
    expect(r.code).toBe(0)
  })

  it('sudo gives a friendly Pip message', () => {
    const r = runCommand(seeded(), 'sudo rm', { commands: ['ls'] })
    expect(r.stdout).toContain('World 6')
  })

  it('unknown commands report command not found', () => {
    const r = runCommand(seeded(), 'blorp', ALL)
    expect(r.stderr).toContain('command not found')
  })
})

describe('history command', () => {
  it('lists prior commands including itself', () => {
    let s = seeded()
    s = runCommand(s, 'pwd', ALL).state
    s = runCommand(s, 'ls', ALL).state
    const r = runCommand(s, 'history', ALL)
    expect(r.stdout).toContain('pwd')
    expect(r.stdout).toContain('ls')
    expect(r.stdout).toContain('history')
  })
})
