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
    expect(explain('grep a b')).toBe(
      "grep is a real Linux command, but Pip's terminal does not have it yet. It arrives in World 5, Text Tundra.",
    )
    expect(explain('cp a b')).toBe(
      'cp is a real Linux command, but it is still locked. You unlock it in World 3, File Forest.',
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

describe('explainMistake: World 3 commands', () => {
  const W3: ExplainOptions = {
    unlocked: ['ls', 'cd', 'cat', 'cp', 'mv', 'rm', 'rmdir', 'head', 'tail', 'wc', 'find', 'chmod'],
    world: 3,
  }

  function forest(): ShellState {
    return createShellState({
      seedFs: dir({
        etc: dir({ 'app.conf': file('port=80') }),
        home: dir({
          pip: dir({
            'log.txt': file('a\nb'),
            'a.txt': file('a'),
            'b.txt': file('b'),
            'locked.txt': file('no', { mode: 0o000 }),
            'readonly.txt': file('ro', { mode: 0o444 }),
            'rootfile.txt': file('r', { owner: 'root', group: 'root' }),
            junk: dir({ 'old.tmp': file('') }),
            empty: dir(),
            vault: dir({}, { mode: 0o600 }),
            sub: dir({ 'c.txt': file('c') }),
          }),
        }),
        tmp: dir({ 'sam.txt': file('s', { owner: 'sam', group: 'sam' }) }, { mode: 0o1777 }),
      }),
    })
  }

  function explain3(line: string): string | null {
    const before = forest()
    const result = runCommand(before, line, { commands: W3.unlocked })
    return explainMistake(line, result, before, W3)
  }

  it('rmdir on a folder that is not empty', () => {
    expect(explain3('rmdir junk')).toBe(
      'rmdir only removes empty folders, and this one still has something inside. Use ls to look in it.',
    )
  })

  it('rmdir on a file', () => {
    expect(explain3('rmdir a.txt')).toContain('rmdir only removes folders')
  })

  it('rmdir with no name', () => {
    expect(explain3('rmdir')).toBe('rmdir needs the name of the empty folder to remove.')
  })

  it('cp on a folder without -r', () => {
    expect(explain3('cp junk junk2')).toContain('cp copies a folder only with -r')
  })

  it('cp and mv with only one name', () => {
    expect(explain3('cp a.txt')).toBe('cp needs two names: first what to copy, then where it should go.')
    expect(explain3('mv')).toBe('mv needs two names: first what to move, then where it should go.')
  })

  it('cp onto itself', () => {
    expect(explain3('cp a.txt a.txt')).toContain('the same file')
  })

  it('moving a folder inside itself', () => {
    expect(explain3('mv junk junk/inner')).toContain('cannot go inside itself')
  })

  it('several sources and a destination that is not a folder', () => {
    expect(explain3('cp a.txt b.txt log.txt')).toContain('the last name must be a folder')
  })

  it('a file and a folder with the same name in the way', () => {
    expect(explain3('mv junk a.txt')).toContain('a file cannot replace a folder')
  })

  it('mv onto a folder that is not empty', () => {
    const before = forest()
    const state = runCommand(before, 'mkdir -p dest/junk', { commands: ['mkdir'] }).state
    const nonEmpty = runCommand(state, 'touch dest/junk/x', { commands: ['touch'] }).state
    const result = runCommand(nonEmpty, 'mv junk dest', { commands: W3.unlocked })
    expect(explainMistake('mv junk dest', result, nonEmpty, W3)).toContain('it is not empty, so mv will not replace it')
  })

  it('chmod with a mode it does not understand', () => {
    expect(explain3('chmod abc a.txt')).toContain('chmod did not understand those permissions')
  })

  it('chmod with no file', () => {
    expect(explain3('chmod 600')).toBe('chmod needs two things: the new permissions first, then the file to change.')
  })

  it('chmod on a file pip does not own', () => {
    expect(explain3('chmod 600 rootfile.txt')).toContain("Only a file's owner (or root)")
  })

  it('deleting someone else’s file in a sticky folder', () => {
    expect(explain3('rm -f /tmp/sam.txt')).toContain('sticky bit')
  })

  it('reading without r permission', () => {
    expect(explain3('cat locked.txt')).toBe(
      'pip has no r (read) permission for that file, so its contents stay hidden. ls -l shows who may do what.',
    )
    expect(explain3('cp locked.txt x.txt')).toContain('no r (read) permission')
  })

  it('cd without x permission', () => {
    expect(explain3('cd vault')).toContain('For a folder, x means "may go inside"')
  })

  it('listing a folder without r permission', () => {
    const before = forest()
    const state = runCommand(before, 'chmod 000 empty', { commands: ['chmod'] }).state
    const result = runCommand(state, 'ls empty', { commands: W3.unlocked })
    expect(explainMistake('ls empty', result, state, W3)).toContain('cannot be listed')
  })

  it('writing where pip may not write', () => {
    expect(explain3('cp a.txt /etc/')).toContain('it is not writable for pip')
  })

  it('rm on a write-protected file asks, and this terminal cannot answer', () => {
    expect(explain3('rm readonly.txt')).toContain('This terminal cannot answer questions')
  })

  it('rm -i asking, which nobody can answer here', () => {
    expect(explain3('rm -i a.txt')).toBe(
      'With -i (or -I), rm asks before deleting. This terminal cannot answer questions, so nothing was deleted.',
    )
  })

  it('several sources and a target that does not exist', () => {
    expect(explain3('cp a.txt b.txt nodir')).toContain('the last name must be a folder')
  })

  it('cp -i and mv -i asking before replacing a file', () => {
    expect(explain3('cp -i a.txt b.txt')).toContain('-i makes cp ask before replacing')
  })

  it('head and tail with a bad line count', () => {
    expect(explain3('head -n many log.txt')).toBe('After -n comes a number of lines, like -n 5.')
  })

  it('head, tail or wc on a folder', () => {
    expect(explain3('tail junk')).toBe('That is a folder. tail reads files. To see what is in a folder, use ls.')
  })

  it('find with an unquoted pattern that the shell expanded', () => {
    expect(explain3('find . -name *.txt')).toBe(
      "Put quotes around the pattern, like '*.txt'. Without them, the shell swaps it for the matching names in this folder before find even sees it.",
    )
    // Quoted, it is fine.
    expect(explain3("find sub -name '*.txt'")).toBeNull()
  })

  it('find with the path after the tests', () => {
    expect(explain3('find -name x.txt sub')).toContain('find wants the folder to search first')
  })

  it('find with a misspelt test', () => {
    expect(explain3('find . -nmae x')).toBe(
      'find does not know -nmae. Its tests start with a dash, like -name or -type. Check the spelling.',
    )
  })

  it('find with a test that is missing its value', () => {
    expect(explain3('find . -name')).toContain('-name needs a pattern after it')
  })

  it('find -type with a wrong letter', () => {
    expect(explain3('find . -type x')).toBe('-type takes f for files or d for folders.')
  })

  it('less, which this terminal does not have', () => {
    expect(explain3('less log.txt')).toBe(
      "less is a real Linux command: it shows a long file one screen at a time, so you can scroll through it. Pip's terminal cannot scroll like that. Use head to see the start of a file, or tail to see the end.",
    )
    expect(explain('less notes.txt')).toContain('In World 3, File Forest, you meet head and tail')
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
