import { describe, expect, it } from 'vitest'

import { analyzeDanger, isForkBomb } from './danger'
import { createShellState, runCommand } from './engine'
import { getNode } from './fs'
import { expandPattern, tokenize } from './parse'
import { ALL_COMMANDS } from './commands'
import { dir, file, type ShellState } from './types'

function system(): ShellState {
  return createShellState({
    seedFs: dir({
      bin: dir({ ls: file('') }),
      etc: dir({ hostname: file('island') }),
      home: dir({
        pip: dir({
          'notes.txt': file('hi'),
          'my notes.txt': file('spaces'),
          '.secret': file('hidden'),
          docs: dir({ 'a.txt': file('a') }),
        }),
      }),
      usr: dir({ bin: dir() }),
    }),
  })
}

const SANDBOX = { commands: ALL_COMMANDS, sandbox: true }

describe('tokenize', () => {
  it('splits on spaces', () => {
    const t = tokenize('ls   -l  docs')
    expect(t.ok && t.tokens.map((x) => x.text)).toEqual(['ls', '-l', 'docs'])
  })
  it('keeps quoted spaces in one word', () => {
    const t = tokenize(`cat "my notes.txt" 'a b'`)
    expect(t.ok && t.tokens.map((x) => x.text)).toEqual(['cat', 'my notes.txt', 'a b'])
  })
  it('a backslash makes the next character plain', () => {
    const t = tokenize('cat my\\ notes.txt')
    expect(t.ok && t.tokens.map((x) => x.text)).toEqual(['cat', 'my notes.txt'])
  })
  it('marks unquoted * as a pattern, but not a quoted one', () => {
    const t = tokenize(`rm * '*'`)
    expect(t.ok && t.tokens.map((x) => x.glob)).toEqual([false, true, false])
  })
  it('reports an unclosed quote', () => {
    expect(tokenize('cat "oops').ok).toBe(false)
  })
})

describe('expandPattern', () => {
  it('expands * in the current folder, skipping dot files', () => {
    expect(expandPattern('*.txt', system())).toEqual(['my notes.txt', 'notes.txt'])
  })
  it('expands /* to every top-level folder', () => {
    expect(expandPattern('/*', system())).toEqual(['/bin', '/etc', '/home', '/usr'])
  })
  it('leaves a pattern with no match as it is', () => {
    expect(expandPattern('*.png', system())).toEqual(['*.png'])
  })
})

describe('isForkBomb', () => {
  it('spots the classic fork bomb', () => {
    expect(isForkBomb(':(){ :|:& };:')).toBe(true)
  })
  it('spots it with different spacing and a different name', () => {
    expect(isForkBomb('  bomb ( ) {  bomb | bomb &  } ; bomb ')).toBe(true)
    expect(isForkBomb('f(){ f|f& }; f')).toBe(true)
  })
  it('ignores a harmless function', () => {
    expect(isForkBomb('hi(){ echo hi; };hi')).toBe(false)
    expect(isForkBomb(':(){ :|:& }')).toBe(false)
    expect(isForkBomb('ls -l')).toBe(false)
  })
})

describe('analyzeDanger', () => {
  const s = system()
  it.each(['rm -rf /', 'rm -fr /', 'rm -r -f /', 'rm --recursive --force /', 'rm -Rf //', 'rm -r /'])(
    '%s is stopped by the preserve-root failsafe',
    (line) => {
      expect(analyzeDanger(line, s)).toEqual({ kind: 'preserve-root', sudo: false })
    },
  )
  it('a leading sudo works the same way', () => {
    expect(analyzeDanger('sudo rm -rf /', s)).toEqual({ kind: 'preserve-root', sudo: true })
    expect(analyzeDanger('sudo rm -rf /*', s)).toEqual({ kind: 'wipe', sudo: true, coversHome: true })
  })
  it.each(['rm -rf --no-preserve-root /', 'rm -rf / --no-preserve-root', 'rm -rf /*'])(
    '%s wipes the system, home folder included',
    (line) => {
      expect(analyzeDanger(line, s)).toEqual({ kind: 'wipe', sudo: false, coversHome: true })
    },
  )
  it('rm -r "/etc" wipes the system but not the home folder', () => {
    expect(analyzeDanger('rm -r "/etc"', s)).toEqual({ kind: 'wipe', sudo: false, coversHome: false })
  })
  it.each(['rm -rfi --no-preserve-root /', 'rm -rI /*', 'rm -fi -r /etc'])(
    '%s asks first (and nobody can answer), so it is not a wipe',
    (line) => {
      expect(analyzeDanger(line, s)).toBeNull()
    },
  )
  it.each(['rm -rf docs', 'rm -rf ~', 'rm /', "rm -rf '/*'", 'rm -f /etc', 'ls /'])(
    '%s is not a system wipe',
    (line) => {
      expect(analyzeDanger(line, s)).toBeNull()
    },
  )
})

describe('rm', () => {
  it('removes a file', () => {
    const r = runCommand(system(), 'rm notes.txt', SANDBOX)
    expect(r.code).toBe(0)
    expect(getNode(r.state.fs, '/home/pip/notes.txt')).toBeNull()
  })
  it('refuses a directory without -r', () => {
    const r = runCommand(system(), 'rm docs', SANDBOX)
    expect(r.stderr).toBe("rm: cannot remove 'docs': Is a directory")
    expect(getNode(r.state.fs, '/home/pip/docs')).not.toBeNull()
  })
  it('removes a directory with -r', () => {
    const r = runCommand(system(), 'rm -r docs', SANDBOX)
    expect(getNode(r.state.fs, '/home/pip/docs')).toBeNull()
  })
  it('reports a missing file, unless -f is given', () => {
    expect(runCommand(system(), 'rm nope', SANDBOX).stderr).toBe(
      "rm: cannot remove 'nope': No such file or directory",
    )
    const forced = runCommand(system(), 'rm -f nope', SANDBOX)
    expect(forced.stderr).toBe('')
    expect(forced.code).toBe(0)
  })
  it('needs an operand', () => {
    expect(runCommand(system(), 'rm', SANDBOX).stderr).toBe(
      "rm: missing operand\nTry 'rm --help' for more information.",
    )
  })
  it('rejects an unknown option', () => {
    expect(runCommand(system(), 'rm -z notes.txt', SANDBOX).stderr).toContain(
      "rm: invalid option -- 'z'",
    )
  })
  it('refuses rm -rf / with the GNU failsafe message', () => {
    const r = runCommand(system(), 'rm -rf /', SANDBOX)
    expect(r.stderr).toBe(
      "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe",
    )
    expect(r.event).toBeNull()
    expect(getNode(r.state.fs, '/etc')).not.toBeNull()
  })
  it('says "same as /" when root is written another way', () => {
    expect(runCommand(system(), 'rm -rf //', SANDBOX).stderr).toContain(
      "recursively on '//' (same as '/')",
    )
  })
  it('sudo rm -rf --no-preserve-root / destroys the system', () => {
    const r = runCommand(system(), 'sudo rm -rf --no-preserve-root /', SANDBOX)
    expect(r.event).toBe('destroyed')
    expect(Object.keys(r.state.fs.children)).toEqual([])
  })
  it.each(['rm -rf --no-preserve-root /', 'rm -rf /*'])(
    'without sudo, %s only deletes pip’s own files: the home folder is wiped, Linux survives',
    (line) => {
      const r = runCommand(system(), line, SANDBOX)
      expect(r.event).toBe('home-wiped')
      expect(r.stderr).toContain("rm: cannot remove '/bin/ls': Permission denied")
      expect(r.code).toBe(1)
      expect(getNode(r.state.fs, '/bin/ls')).not.toBeNull()
      expect(getNode(r.state.fs, '/etc/hostname')).not.toBeNull()
      expect(getNode(r.state.fs, '/home/pip/notes.txt')).toBeNull()
      expect(getNode(r.state.fs, '/home/pip/docs')).toBeNull()
      // pip cannot delete its own home folder: /home belongs to root.
      expect(getNode(r.state.fs, '/home/pip')).not.toBeNull()
    },
  )
  it('without sudo, rm -rf /etc only hits Permission denied: no screen at all', () => {
    const r = runCommand(system(), 'rm -rf /etc', SANDBOX)
    expect(r.event).toBeNull()
    expect(r.stderr).toBe("rm: cannot remove '/etc/hostname': Permission denied")
    expect(getNode(r.state.fs, '/etc/hostname')).not.toBeNull()
  })
  it('with sudo, the same commands destroy the system', () => {
    expect(runCommand(system(), 'sudo rm -rf /etc', SANDBOX).event).toBe('destroyed')
    expect(runCommand(system(), 'sudo rm -rf --no-preserve-root /', SANDBOX).event).toBe('destroyed')
  })
  it('rm -rf /* destroys the system because the shell expands the *', () => {
    const r = runCommand(system(), 'sudo rm -rf /*', SANDBOX)
    expect(r.event).toBe('destroyed')
    expect(getNode(r.state.fs, '/bin')).toBeNull()
  })
  it('a wipe outside the sandbox is stopped', () => {
    const r = runCommand(system(), 'rm -rf /*', { commands: ['rm'] })
    expect(r.event).toBeNull()
    expect(getNode(r.state.fs, '/bin')).not.toBeNull()
  })
  it('the fork bomb freezes the sandbox', () => {
    expect(runCommand(system(), ':(){ :|:& };:', SANDBOX).event).toBe('frozen')
    expect(runCommand(system(), ':(){ :|:& };:', { commands: ['ls'] }).event).toBeNull()
  })
})

describe('type, dir and sudo', () => {
  it('type tells builtins from programs', () => {
    expect(runCommand(system(), 'type cd ls', { commands: [] }).stdout).toBe(
      'cd is a shell builtin\nls is /usr/bin/ls',
    )
    expect(runCommand(system(), 'type notes.txt', { commands: [] }).stderr).toBe(
      'bash: type: notes.txt: not found',
    )
  })
  it('dir lists like ls', () => {
    expect(runCommand(system(), 'dir docs', SANDBOX).stdout).toBe('a.txt')
  })
  it('sudo runs the command after it, as root', () => {
    expect(runCommand(system(), 'sudo whoami', SANDBOX).stdout).toBe('root')
  })
  it('quotes let a name with a space through', () => {
    expect(runCommand(system(), 'cat "my notes.txt"', SANDBOX).stdout).toBe('spaces')
  })
})
