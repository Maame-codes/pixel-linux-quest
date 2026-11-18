import { describe, expect, it } from 'vitest'

import { ALL_COMMANDS } from './commands'
import { createShellState, runCommand } from './engine'
import { editDistance, explainMistake, type ExplainOptions } from './explain'
import { dir, file, type ShellState } from './types'

const LEVEL: ExplainOptions = {
  unlocked: ['ls', 'pwd', 'cd', 'mkdir', 'touch', 'cat', 'echo'],
  world: 2,
}
const SANDBOX: ExplainOptions = { unlocked: ALL_COMMANDS }

function start(): ShellState {
  return createShellState({
    seedFs: dir({
      home: dir({
        pip: dir({
          treasure: dir({ 'gold.txt': file('shiny') }),
          'notes.txt': file('hi'),
          'my notes.txt': file('spaces'),
        }),
      }),
    }),
  })
}

/** Run a line the way a level (or the sandbox) would, then ask Pip. */
function explain(line: string, opts: ExplainOptions = LEVEL): string | null {
  const before = start()
  const result = runCommand(before, line, { commands: opts.unlocked, sandbox: opts.world === undefined })
  return explainMistake(line, result, before, opts)
}

describe('explainMistake', () => {
  it('says nothing when the command worked', () => {
    expect(explain('ls')).toBeNull()
    expect(explain('cd treasure')).toBeNull()
  })

  it('wrong capital letters in a name', () => {
    expect(explain('cd Treasure')).toBe(
      'Close! Linux cares about capital letters. You typed Treasure, but the folder is treasure.',
    )
    expect(explain('cat NOTES.txt')).toContain('but the file is notes.txt')
  })

  it('wrong capital letters in a command', () => {
    expect(explain('LS')).toBe('Close! Linux cares about capital letters. Commands are lowercase, so try ls.')
  })

  it('a typo within two letters of an unlocked command', () => {
    expect(explain('mkdri treasure2')).toBe('Did you mean mkdir?')
    expect(explain('sl')).toBe('Did you mean ls?')
    expect(explain('xyzzy')).toBeNull()
  })

  it('a missing space: cd.. and ls-l', () => {
    expect(explain('cd..')).toContain('Put a space after cd.')
    expect(explain('ls-l')).toContain('Put a space after ls.')
  })

  it('a missing argument for mkdir, touch and cat', () => {
    expect(explain('mkdir')).toContain('mkdir needs a name for the new folder')
    expect(explain('touch')).toContain('touch needs a name for the new file')
    expect(explain('cat')).toContain('cat needs a file name')
  })

  it('cd into a file', () => {
    expect(explain('cd notes.txt')).toBe('notes.txt is a file, not a folder. You can only cd into folders.')
  })

  it('cat a folder', () => {
    expect(explain('cat treasure')).toContain('treasure is a folder, not a file.')
  })

  it('mkdir on a name that already exists', () => {
    expect(explain('mkdir treasure')).toBe('There is already something called treasure here, so mkdir left it alone.')
  })

  it('a name with a space that needs quotes', () => {
    expect(explain('cat my notes.txt')).toBe(
      'That name has a space in it. Put quotes around it, like "my notes.txt", so Linux reads it as one name.',
    )
  })

  it('backslashes in a path', () => {
    expect(explain('cd \\home\\pip')).toBe('Linux uses forward slashes / between folder names, not backslashes \\.')
  })

  it('Windows commands point to the Linux one, with the world that unlocks it', () => {
    expect(explain('cls')).toBe('cls is a Windows command. On Linux, clear wipes the screen.')
    expect(explain('del notes.txt')).toBe(
      'del is a Windows command. On Linux, rm deletes files. You unlock it in World 3, File Forest.',
    )
    expect(explain('copy a b')).toContain('On Linux, cp copies files.')
    expect(explain('move a b')).toContain('On Linux, mv moves and renames files.')
  })

  it('type and dir are real on Linux, so Pip does not say they are missing', () => {
    expect(explain('type notes.txt')).toBe(
      'type does exist on Linux, but it tells you what kind of command a name is. To show what is inside a file, use cat.',
    )
    expect(explain('dir')).toBe('dir does exist on Linux, it lists a folder much like ls. In this game, use ls.')
  })

  it('a real command that is still locked says which world unlocks it', () => {
    expect(explain('cp a b')).toBe(
      "cp is a real Linux command, but Pip's terminal does not have it yet. It arrives in World 3, File Forest.",
    )
    expect(explain('whoami', { unlocked: ['ls'], world: 2 })).toBe(
      'whoami is a real Linux command, but it is not part of this level.',
    )
  })

  it('an unclosed quote', () => {
    expect(explain('cat "notes.txt')).toContain('never closed')
  })

  it('rm -rf / hitting the built-in failsafe', () => {
    expect(explain('rm -rf /', SANDBOX)).toContain('safety check built in')
  })

  it('rm on a folder without -r', () => {
    expect(explain('rm treasure', SANDBOX)).toContain('only deletes a folder if you add -r')
  })

  it('a name that does not exist at all', () => {
    expect(explain('cd cave')).toBe('There is nothing called cave there. ls shows what is in a folder.')
  })
})

describe('editDistance', () => {
  it('counts single-letter edits and swaps', () => {
    expect(editDistance('mkdri', 'mkdir')).toBe(1)
    expect(editDistance('ls', 'ls')).toBe(0)
    expect(editDistance('pwd', 'pdw')).toBe(1)
    expect(editDistance('mkdr', 'mkdir')).toBe(1)
    expect(editDistance('tuch', 'touch')).toBe(1)
  })
})
