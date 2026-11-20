import { describe, expect, it } from 'vitest'

import { ALL_COMMANDS } from './commands'
import { lsDate } from './commands/ls'
import { applyMode } from './commands/chmod'
import { globToRegExp } from './commands/find'
import { createShellState, runCommand } from './engine'
import { fileBytes, fileLines, getNode } from './fs'
import { lookup, permString, permits } from './perm'
import { dir, file, isDir, isFile, type ShellState } from './types'

const ALL = { commands: ALL_COMMANDS }
const SANDBOX = { commands: ALL_COMMANDS, sandbox: true }

const LOG = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n')

function forest(): ShellState {
  return createShellState({
    seedFs: dir({
      etc: dir({
        'app.conf': file('port=80'),
        shadow: file('secret hashes', { mode: 0o640, group: 'shadow' }),
      }),
      home: dir({
        pip: dir({
          'notes.txt': file('hello world\nsecond line'),
          'empty.txt': file(''),
          'log.txt': file(LOG),
          'diary.txt': file('dear diary', { mode: 0o600 }),
          'locked.txt': file('top secret', { mode: 0o000 }),
          'readonly.txt': file('look, do not touch', { mode: 0o444 }),
          'run.sh': file('#!/bin/bash\necho hi'),
          docs: dir({ 'a.txt': file('a'), 'b.md': file('b'), deep: dir({ 'c.txt': file('c') }) }),
          empty: dir(),
          vault: dir({ 'gold.txt': file('gold') }, { mode: 0o600 }),
          sealed: dir({ 'x.txt': file('x') }, { mode: 0o000 }),
          shelf: dir({ 'book.txt': file('words') }, { mode: 0o555 }),
          "rootfile.txt": file('mine?', { owner: 'root', group: 'root' }),
        }),
      }),
      tmp: dir({ 'other.txt': file('x', { owner: 'sam', group: 'sam', mode: 0o666 }) }, { mode: 0o1777 }),
    }),
  })
}

function run(line: string, state = forest(), opts = ALL) {
  return runCommand(state, line, opts)
}

/** Run several lines in a row and return the last result. */
function runAll(lines: string[], opts = ALL) {
  let state = forest()
  let r = runCommand(state, '', opts)
  for (const line of lines) {
    r = runCommand(state, line, opts)
    state = r.state
  }
  return r
}

const node = (s: ShellState, path: string) => getNode(s.fs, path)

describe('file model', () => {
  it('counts a newline at the end of every non-empty file', () => {
    expect(fileLines('a\nb')).toEqual(['a', 'b'])
    expect(fileLines('a\nb\n')).toEqual(['a', 'b'])
    expect(fileLines('')).toEqual([])
    expect(fileBytes('hi')).toBe(3)
    expect(fileBytes('')).toBe(0)
    expect(fileBytes('é')).toBe(3)
  })

  it('fills in owners: pip in the home, root elsewhere, default modes 644 and 755', () => {
    const s = forest()
    expect(node(s, '/home/pip/notes.txt')).toMatchObject({ owner: 'pip', group: 'pip', mode: 0o644 })
    expect(node(s, '/home/pip/docs')).toMatchObject({ owner: 'pip', mode: 0o755 })
    expect(node(s, '/etc/app.conf')).toMatchObject({ owner: 'root', group: 'root', mode: 0o644 })
    expect(node(s, '/etc/shadow')).toMatchObject({ owner: 'root', group: 'shadow', mode: 0o640 })
  })

  it('does not change the level data it was given', () => {
    const seed = dir({ home: dir({ pip: dir({ 'a.txt': file('a') }) }) })
    createShellState({ seedFs: seed })
    expect(seed.children.home).not.toHaveProperty('owner')
  })

  it('permission strings', () => {
    expect(permString(0o644)).toBe('rw-r--r--')
    expect(permString(0o755)).toBe('rwxr-xr-x')
    expect(permString(0o600)).toBe('rw-------')
    expect(permString(0o1777)).toBe('rwxrwxrwt')
    expect(permString(0o4755)).toBe('rwsr-xr-x')
  })

  it('checks owner, group and others bits, and lets root do anything', () => {
    const s = forest()
    const shadow = node(s, '/etc/shadow')!
    expect(permits(s, '/etc/shadow', shadow, 'r')).toBe(false)
    const conf = node(s, '/etc/app.conf')!
    expect(permits(s, '/etc/app.conf', conf, 'r')).toBe(true)
    expect(permits(s, '/etc/app.conf', conf, 'w')).toBe(false)
    const root = { ...s, user: 'root' }
    expect(permits(root, '/etc/shadow', shadow, 'r')).toBe(true)
    expect(permits(root, '/etc/shadow', shadow, 'w')).toBe(true)
  })

  it('needs x on every folder on the way', () => {
    expect(lookup(forest(), '/home/pip/vault/gold.txt').error).toBe('EACCES')
    expect(lookup(forest(), '/home/pip/notes.txt/x').error).toBe('ENOTDIR')
    expect(lookup(forest(), '/home/pip/nope').error).toBe('ENOENT')
  })
})

describe('ls -l', () => {
  it('shows type and mode, links, owner, group, size, date and name, lined up', () => {
    const r = run('ls -l docs')
    const lines = r.stdout.split('\n')
    expect(lines[0]).toBe('total 12')
    // The size column is as wide as the widest size in the listing (4096).
    expect(lines[1]).toMatch(/^-rw-r--r-- 1 pip pip    2 [A-Z][a-z]{2} [ \d]\d [ \d]\d:\d\d a\.txt$/)
    expect(lines[3]).toMatch(/^drwxr-xr-x 2 pip pip 4096 .* deep$/)
  })

  it('shows a single file, and pads the size column', () => {
    const r = run('ls -l diary.txt notes.txt')
    const [diary, notes] = r.stdout.split('\n')
    expect(diary).toMatch(/^-rw------- 1 pip pip 11 .* diary\.txt$/)
    expect(notes).toMatch(/^-rw-r--r-- 1 pip pip 24 .* notes\.txt$/)
  })

  it('counts a folder’s links: 2 plus one per subfolder', () => {
    expect(run('ls -ld docs').stdout).toMatch(/^drwxr-xr-x 3 pip pip 4096 /)
  })

  it('shows the sticky bit and other owners', () => {
    expect(run('ls -ld /tmp').stdout).toMatch(/^drwxrwxrwt 2 root root 4096 /)
    expect(run('ls -l /tmp').stdout).toMatch(/-rw-rw-rw- 1 sam sam 2 .* other\.txt/)
  })

  it('hides dot files unless -a, which also shows . and ..', () => {
    const s = createShellState({ seedFs: dir({ home: dir({ pip: dir({ '.hidden': file('h'), seen: file('s') }) }) }) })
    expect(runCommand(s, 'ls', ALL).stdout).toBe('seen')
    expect(runCommand(s, 'ls -a', ALL).stdout).toBe('.  ..  .hidden  seen')
    expect(runCommand(s, 'ls -A', ALL).stdout).toBe('.hidden  seen')
  })

  it('lists several folders with headings', () => {
    expect(run('ls empty docs/deep').stdout).toBe('empty:\n\ndocs/deep:\nc.txt')
  })

  it('cannot open a folder without r permission', () => {
    const r = run('ls sealed')
    expect(r.stderr).toBe("ls: cannot open directory 'sealed': Permission denied")
    expect(r.code).toBe(2)
  })

  it('rejects unknown options like GNU ls', () => {
    const r = run('ls -z')
    expect(r.stderr).toBe("ls: invalid option -- 'z'\nTry 'ls --help' for more information.")
    expect(r.code).toBe(2)
  })

  it('formats dates: time when recent, year when old', () => {
    const now = new Date(2026, 10, 20, 12, 0).getTime()
    expect(lsDate(new Date(2026, 10, 5, 9, 7).getTime(), now)).toBe('Nov  5 09:07')
    expect(lsDate(new Date(2025, 0, 15, 9, 7).getTime(), now)).toBe('Jan 15  2025')
  })
})

describe('cp', () => {
  it('copies a file to a new name', () => {
    const r = run('cp notes.txt backup.txt')
    expect(r.code).toBe(0)
    const copy = node(r.state, '/home/pip/backup.txt')
    expect(isFile(copy) && copy.content).toBe('hello world\nsecond line')
    expect(copy).toMatchObject({ owner: 'pip', mode: 0o644 })
  })

  it('copies into an existing directory with the same name', () => {
    const r = run('cp notes.txt docs')
    expect(isFile(node(r.state, '/home/pip/docs/notes.txt'))).toBe(true)
    expect(isFile(node(r.state, '/home/pip/notes.txt'))).toBe(true)
  })

  it('copies several files into a directory', () => {
    const r = run('cp notes.txt run.sh docs/')
    expect(r.code).toBe(0)
    expect(isFile(node(r.state, '/home/pip/docs/run.sh'))).toBe(true)
  })

  it('a copy keeps the source permissions (600 stays 600)', () => {
    expect(node(run('cp diary.txt d2.txt').state, '/home/pip/d2.txt')).toMatchObject({ mode: 0o600 })
  })

  it('needs -r for a directory', () => {
    const r = run('cp docs docs2')
    expect(r.stderr).toBe("cp: -r not specified; omitting directory 'docs'")
    expect(r.code).toBe(1)
  })

  it('cp -r copies a directory and everything inside', () => {
    const r = run('cp -r docs docs2')
    expect(r.code).toBe(0)
    expect(isFile(node(r.state, '/home/pip/docs2/deep/c.txt'))).toBe(true)
    expect(isFile(node(r.state, '/home/pip/docs/deep/c.txt'))).toBe(true)
  })

  it('cp -r into an existing directory puts it inside', () => {
    const r = run('cp -r docs empty')
    expect(isDir(node(r.state, '/home/pip/empty/docs'))).toBe(true)
  })

  it('gives GNU errors', () => {
    expect(run('cp').stderr).toBe("cp: missing file operand\nTry 'cp --help' for more information.")
    expect(run('cp notes.txt').stderr).toBe(
      "cp: missing destination file operand after 'notes.txt'\nTry 'cp --help' for more information.",
    )
    expect(run('cp nope.txt x').stderr).toBe("cp: cannot stat 'nope.txt': No such file or directory")
    expect(run('cp notes.txt notes.txt').stderr).toBe("cp: 'notes.txt' and 'notes.txt' are the same file")
    expect(run('cp notes.txt run.sh empty.txt').stderr).toBe("cp: target 'empty.txt' is not a directory")
    expect(run('cp -r docs docs/deep').stderr).toBe(
      "cp: cannot copy a directory, 'docs', into itself, 'docs/deep/docs'",
    )
    expect(run('cp notes.txt nowhere/x.txt').stderr).toBe(
      "cp: cannot create regular file 'nowhere/x.txt': No such file or directory",
    )
  })

  it('cannot read a file without r permission', () => {
    expect(run('cp locked.txt x.txt').stderr).toBe("cp: cannot open 'locked.txt' for reading: Permission denied")
  })

  it('cannot write into a folder without w permission, or over a read-only file', () => {
    expect(run('cp notes.txt shelf/').stderr).toBe(
      "cp: cannot create regular file 'shelf/notes.txt': Permission denied",
    )
    expect(run('cp notes.txt /etc/app.conf').stderr).toBe(
      "cp: cannot create regular file '/etc/app.conf': Permission denied",
    )
  })

  it('-i asks before replacing a file (and this terminal cannot answer, so it keeps it); -n never replaces', () => {
    const r = run('cp -i notes.txt diary.txt')
    expect(r.stderr).toBe("cp: overwrite 'diary.txt'? ")
    const diary = node(r.state, '/home/pip/diary.txt')
    expect(isFile(diary) && diary.content).toBe('dear diary')
    expect(run('cp -i notes.txt fresh.txt').stderr).toBe('')
    expect(run('cp -n notes.txt diary.txt').stderr).toBe('')
    expect(run('mv -i notes.txt diary.txt').stderr).toBe("mv: overwrite 'diary.txt'? ")
  })

  it('-v says what it copied', () => {
    expect(run('cp -v notes.txt b.txt').stdout).toBe("'notes.txt' -> 'b.txt'")
  })
})

describe('mv', () => {
  it('renames a file', () => {
    const r = run('mv notes.txt renamed.txt')
    expect(r.code).toBe(0)
    expect(node(r.state, '/home/pip/notes.txt')).toBeNull()
    expect(isFile(node(r.state, '/home/pip/renamed.txt'))).toBe(true)
  })

  it('moves files into a directory, and directories without -r', () => {
    let r = run('mv notes.txt run.sh docs')
    expect(isFile(node(r.state, '/home/pip/docs/run.sh'))).toBe(true)
    r = run('mv docs empty')
    expect(isFile(node(r.state, '/home/pip/empty/docs/deep/c.txt'))).toBe(true)
  })

  it('keeps the owner and permissions when moving', () => {
    const r = run('mv diary.txt docs/')
    expect(node(r.state, '/home/pip/docs/diary.txt')).toMatchObject({ owner: 'pip', mode: 0o600 })
  })

  it('gives GNU errors', () => {
    expect(run('mv').stderr).toBe("mv: missing file operand\nTry 'mv --help' for more information.")
    expect(run('mv notes.txt').stderr).toBe(
      "mv: missing destination file operand after 'notes.txt'\nTry 'mv --help' for more information.",
    )
    expect(run('mv nope x').stderr).toBe("mv: cannot stat 'nope': No such file or directory")
    expect(run('mv docs docs/deep').stderr).toBe(
      "mv: cannot move 'docs' to a subdirectory of itself, 'docs/deep/docs'",
    )
    expect(run('mv docs notes.txt').stderr).toBe(
      "mv: cannot overwrite non-directory 'notes.txt' with directory 'docs'",
    )
    expect(run('mv notes.txt nowhere/x').stderr).toBe(
      "mv: cannot move 'notes.txt' to 'nowhere/x': No such file or directory",
    )
  })

  it('needs write permission on both folders', () => {
    expect(run('mv shelf/book.txt .').stderr).toBe("mv: cannot move 'shelf/book.txt' to './book.txt': Permission denied")
    expect(run('mv notes.txt /etc/').stderr).toBe("mv: cannot move 'notes.txt' to '/etc/notes.txt': Permission denied")
  })

  it('in a sticky folder, only the owner may move a file out', () => {
    expect(run('mv /tmp/other.txt /tmp/mine.txt').stderr).toBe(
      "mv: cannot move '/tmp/other.txt' to '/tmp/mine.txt': Operation not permitted",
    )
  })
})

describe('rmdir', () => {
  it('removes an empty directory', () => {
    const r = run('rmdir empty')
    expect(r.code).toBe(0)
    expect(node(r.state, '/home/pip/empty')).toBeNull()
  })

  it('refuses a directory that is not empty, with the real message', () => {
    const r = run('rmdir docs')
    expect(r.stderr).toBe("rmdir: failed to remove 'docs': Directory not empty")
    expect(r.code).toBe(1)
    expect(isDir(node(r.state, '/home/pip/docs'))).toBe(true)
  })

  it('gives GNU errors', () => {
    expect(run('rmdir').stderr).toBe("rmdir: missing operand\nTry 'rmdir --help' for more information.")
    expect(run('rmdir nope').stderr).toBe("rmdir: failed to remove 'nope': No such file or directory")
    expect(run('rmdir notes.txt').stderr).toBe("rmdir: failed to remove 'notes.txt': Not a directory")
    expect(run('rmdir /etc').stderr).toBe("rmdir: failed to remove '/etc': Directory not empty")
  })

  it('-p removes empty parents too', () => {
    const r = runAll(['mkdir -p a/b/c', 'rmdir -p a/b/c'])
    expect(r.code).toBe(0)
    expect(node(r.state, '/home/pip/a')).toBeNull()
  })
})

describe('rm with permissions', () => {
  it('cannot delete from a folder you may not write to', () => {
    const r = run('rm shelf/book.txt')
    expect(r.stderr).toBe("rm: cannot remove 'shelf/book.txt': Permission denied")
    expect(isFile(node(r.state, '/home/pip/shelf/book.txt'))).toBe(true)
  })

  it('asks before deleting a write-protected file, and keeps it (no one can answer here)', () => {
    const r = run('rm readonly.txt')
    expect(r.stderr).toBe("rm: remove write-protected regular file 'readonly.txt'? ")
    expect(isFile(node(r.state, '/home/pip/readonly.txt'))).toBe(true)
    const f = run('rm -f readonly.txt')
    expect(f.code).toBe(0)
    expect(node(f.state, '/home/pip/readonly.txt')).toBeNull()
  })

  it('rm -r deletes a whole tree it may write to', () => {
    expect(node(run('rm -r docs').state, '/home/pip/docs')).toBeNull()
  })

  it('sudo bypasses permissions in the sandbox', () => {
    expect(run('rm -f /etc/app.conf', forest(), SANDBOX).stderr).toBe(
      "rm: cannot remove '/etc/app.conf': Permission denied",
    )
    // Without -f, GNU rm first asks about a file pip cannot write to.
    expect(run('rm /etc/app.conf', forest(), SANDBOX).stderr).toBe(
      "rm: remove write-protected regular file '/etc/app.conf'? ",
    )
    const r = run('sudo rm /etc/app.conf', forest(), SANDBOX)
    expect(r.code).toBe(0)
    expect(node(r.state, '/etc/app.conf')).toBeNull()
  })
})

describe('head and tail', () => {
  it('show 10 lines by default', () => {
    expect(run('head log.txt').stdout.split('\n')).toEqual(LOG.split('\n').slice(0, 10))
    expect(run('tail log.txt').stdout.split('\n')).toEqual(LOG.split('\n').slice(20))
  })

  it('take -n N, -nN, --lines=N and the short -N', () => {
    expect(run('head -n 3 log.txt').stdout).toBe('line 1\nline 2\nline 3')
    expect(run('head -n3 log.txt').stdout).toBe('line 1\nline 2\nline 3')
    expect(run('tail --lines=2 log.txt').stdout).toBe('line 29\nline 30')
    expect(run('tail -2 log.txt').stdout).toBe('line 29\nline 30')
  })

  it('tail -n +N starts at line N, head -n -N leaves off the last N', () => {
    expect(run('tail -n +29 log.txt').stdout).toBe('line 29\nline 30')
    expect(run('head -n -28 log.txt').stdout).toBe('line 1\nline 2')
  })

  it('show headers for several files', () => {
    expect(run('head -n 1 notes.txt log.txt').stdout).toBe('==> notes.txt <==\nhello world\n\n==> log.txt <==\nline 1')
  })

  it('give GNU errors', () => {
    expect(run('head nope.txt').stderr).toBe("head: cannot open 'nope.txt' for reading: No such file or directory")
    expect(run('tail docs').stderr).toBe("tail: error reading 'docs': Is a directory")
    expect(run('head -n abc log.txt').stderr).toBe('head: invalid number of lines: ‘abc’')
    expect(run('tail -n').stderr).toBe("tail: option requires an argument -- 'n'\nTry 'tail --help' for more information.")
  })

  it('need read permission', () => {
    expect(run('head locked.txt').stderr).toBe("head: cannot open 'locked.txt' for reading: Permission denied")
    expect(run('tail /etc/shadow').stderr).toBe("tail: cannot open '/etc/shadow' for reading: Permission denied")
  })
})

describe('wc', () => {
  it('counts lines, words and bytes, lined up like GNU wc', () => {
    expect(run('wc notes.txt').stdout).toBe(' 2  4 24 notes.txt')
  })

  it('-l, -w and -c on their own print just that number', () => {
    expect(run('wc -l log.txt').stdout).toBe('30 log.txt')
    expect(run('wc -w notes.txt').stdout).toBe('4 notes.txt')
    expect(run('wc -c notes.txt').stdout).toBe('24 notes.txt')
  })

  it('adds a total line for several files', () => {
    expect(run('wc -l notes.txt empty.txt').stdout).toBe(' 2 notes.txt\n 0 empty.txt\n 2 total')
  })

  it('gives GNU errors', () => {
    expect(run('wc nope').stderr).toBe('wc: nope: No such file or directory')
    const d = run('wc docs')
    expect(d.stderr).toBe('wc: docs: Is a directory')
    expect(d.stdout).toBe('0 0 0 docs')
    expect(run('wc locked.txt').stderr).toBe('wc: locked.txt: Permission denied')
  })
})

describe('find', () => {
  it('lists everything under a path', () => {
    expect(run('find docs').stdout).toBe('docs\ndocs/a.txt\ndocs/b.md\ndocs/deep\ndocs/deep/c.txt')
  })

  it('-name matches with * and ?, quoted so the shell leaves it alone', () => {
    expect(run("find . -name '*.txt'").stdout).toContain('./docs/deep/c.txt')
    expect(run('find docs -name "?.md"').stdout).toBe('docs/b.md')
    expect(run('find docs -iname "A.TXT"').stdout).toBe('docs/a.txt')
  })

  it('-type f and -type d', () => {
    expect(run('find docs -type d').stdout).toBe('docs\ndocs/deep')
    expect(run('find docs -type f -name "*.txt"').stdout).toBe('docs/a.txt\ndocs/deep/c.txt')
  })

  it('defaults to the current folder and keeps a trailing slash as typed', () => {
    expect(run('find -name c.txt').stdout).toBe('./docs/deep/c.txt')
    expect(run('find docs/ -name c.txt').stdout).toBe('docs/deep/c.txt')
  })

  it('an unquoted pattern gets expanded by the shell first', () => {
    const s = createShellState({
      seedFs: dir({ home: dir({ pip: dir({ 'a.txt': file('a'), 'b.txt': file('b'), sub: dir({ 'c.txt': file('c') }) }) }) }),
    })
    const r = runCommand(s, 'find . -name *.txt', ALL)
    expect(r.stderr).toBe("find: paths must precede expression: `b.txt'\nfind: possible unquoted pattern after predicate `-name'?")
    expect(runCommand(s, "find . -name '*.txt'", ALL).stdout).toBe('./a.txt\n./b.txt\n./sub/c.txt')
  })

  it('gives findutils errors', () => {
    expect(run('find nope').stderr).toBe('find: ‘nope’: No such file or directory')
    expect(run('find . -nmae x').stderr).toBe("find: unknown predicate `-nmae'")
    expect(run('find . -name').stderr).toBe("find: missing argument to `-name'")
    expect(run('find . -type x').stderr).toBe('find: Unknown argument to -type: x')
  })

  it('reports folders it may not read, and keeps going', () => {
    const r = run('find . -name x.txt')
    expect(r.stderr).toBe('find: ‘./sealed’: Permission denied\nfind: ‘./vault’: Permission denied')
    expect(r.code).toBe(1)
  })

  it('glob patterns', () => {
    expect(globToRegExp('*.log').test('error.log')).toBe(true)
    expect(globToRegExp('*.log').test('error.log.1')).toBe(false)
    expect(globToRegExp('[ab]?.txt').test('b1.txt')).toBe(true)
    expect(globToRegExp('[!ab]*').test('apple')).toBe(false)
  })
})

describe('chmod', () => {
  it('numeric modes', () => {
    expect(applyMode('600', 0o644, false)).toBe(0o600)
    expect(applyMode('755', 0o644, false)).toBe(0o755)
    expect(applyMode('0644', 0o777, false)).toBe(0o644)
    expect(applyMode('99', 0o644, false)).toBeNull()
  })

  it('symbolic modes', () => {
    expect(applyMode('u+x', 0o644, false)).toBe(0o744)
    expect(applyMode('go-r', 0o644, false)).toBe(0o600)
    expect(applyMode('a+r', 0o600, false)).toBe(0o644)
    expect(applyMode('u=rw,go=', 0o755, false)).toBe(0o600)
    expect(applyMode('o=r', 0o777, false)).toBe(0o774)
    expect(applyMode('g=u', 0o640, false)).toBe(0o660)
    expect(applyMode('a+X', 0o644, true)).toBe(0o755)
    expect(applyMode('a+X', 0o644, false)).toBe(0o644)
  })

  it('with no u, g, o or a, leaves the umask bits alone (umask 022)', () => {
    expect(applyMode('+x', 0o644, false)).toBe(0o755)
    expect(applyMode('+w', 0o444, false)).toBe(0o644)
    expect(applyMode('-r', 0o644, false)).toBe(0o200)
  })

  it('rejects modes it does not understand', () => {
    for (const bad of ['abc', 'u+q', 'x+u', '8', '77777', 'u+x,']) expect(applyMode(bad, 0o644, false), bad).toBeNull()
  })

  it('changes the file, shown by ls -l', () => {
    let r = run('chmod 600 notes.txt')
    expect(r.code).toBe(0)
    expect(runCommand(r.state, 'ls -l notes.txt', ALL).stdout).toMatch(/^-rw------- 1 pip pip/)
    r = run('chmod u+x run.sh')
    expect(runCommand(r.state, 'ls -l run.sh', ALL).stdout).toMatch(/^-rwxr--r-- /)
  })

  it('gives GNU errors', () => {
    expect(run('chmod').stderr).toBe("chmod: missing operand\nTry 'chmod --help' for more information.")
    expect(run('chmod 600').stderr).toBe("chmod: missing operand after ‘600’\nTry 'chmod --help' for more information.")
    expect(run('chmod abc notes.txt').stderr).toBe("chmod: invalid mode: ‘abc’\nTry 'chmod --help' for more information.")
    expect(run('chmod 600 nope').stderr).toBe("chmod: cannot access 'nope': No such file or directory")
  })

  it('only the owner (or root) may change permissions', () => {
    expect(run('chmod 777 rootfile.txt').stderr).toBe("chmod: changing permissions of 'rootfile.txt': Operation not permitted")
    expect(run('sudo chmod 777 rootfile.txt', forest(), SANDBOX).code).toBe(0)
  })

  it('chmod -x is a mode, not an option, and -R changes a whole tree', () => {
    expect(node(run('chmod -r notes.txt').state, '/home/pip/notes.txt')).toMatchObject({ mode: 0o200 })
    const r = run('chmod -R go-rx docs')
    expect(node(r.state, '/home/pip/docs/deep/c.txt')).toMatchObject({ mode: 0o600 })
  })

  it('-v explains the change', () => {
    expect(run('chmod -v 600 notes.txt').stdout).toBe(
      "mode of 'notes.txt' changed from 0644 (rw-r--r--) to 0600 (rw-------)",
    )
  })
})

describe('permissions for pip', () => {
  it('no read permission: cat, head, tail and cp fail', () => {
    for (const cmd of ['cat locked.txt', 'head locked.txt', 'tail locked.txt', 'cp locked.txt x']) {
      expect(run(cmd).stderr, cmd).toContain('Permission denied')
    }
    expect(run('cat locked.txt').stderr).toBe('cat: locked.txt: Permission denied')
  })

  it('no write permission: the file cannot be changed', () => {
    const r = run('cp notes.txt readonly.txt')
    expect(r.stderr).toBe("cp: cannot create regular file 'readonly.txt': Permission denied")
    const ro = node(r.state, '/home/pip/readonly.txt')
    expect(isFile(ro) && ro.content).toBe('look, do not touch')
    expect(run('touch /etc/app.conf').stderr).toBe("touch: cannot touch '/etc/app.conf': Permission denied")
    expect(run('mkdir /etc/new').stderr).toBe("mkdir: cannot create directory '/etc/new': Permission denied")
  })

  it('no execute permission on a folder: cd and anything inside fail', () => {
    expect(run('cd vault').stderr).toBe('bash: cd: vault: Permission denied')
    expect(run('cat vault/gold.txt').stderr).toBe('cat: vault/gold.txt: Permission denied')
  })

  it('chmod fixes it', () => {
    const r = runAll(['chmod 700 vault', 'cd vault', 'cat gold.txt'])
    expect(r.stdout).toBe('gold')
  })

  it('sudo bypasses permissions in the sandbox only (sudo is locked in levels)', () => {
    expect(run('sudo cat /etc/shadow', forest(), SANDBOX).stdout).toBe('secret hashes')
    expect(run('sudo cat /etc/shadow', forest(), { commands: ['cat'] }).stdout).toContain('Root powers unlock')
  })

  it('new files and folders belong to whoever made them', () => {
    const r = runAll(['touch new.txt', 'mkdir newdir', 'cp run.sh run2.sh'])
    for (const p of ['new.txt', 'newdir', 'run2.sh']) {
      expect(node(r.state, `/home/pip/${p}`)).toMatchObject({ owner: 'pip', group: 'pip' })
    }
    const sudo = runAll(['sudo touch /etc/made.txt'], SANDBOX)
    expect(node(sudo.state, '/etc/made.txt')).toMatchObject({ owner: 'root', group: 'root', mode: 0o644 })
  })
})

describe('less', () => {
  it('is not in Pip’s terminal', () => {
    expect(run('less log.txt').stderr).toBe('less: command not found')
  })
})

describe('mkdir -p and touch', () => {
  it('mkdir -p makes the parents, and does not mind if it exists', () => {
    const r = runAll(['mkdir -p a/b/c', 'mkdir -p a/b'])
    expect(r.code).toBe(0)
    expect(isDir(node(r.state, '/home/pip/a/b/c'))).toBe(true)
  })
})
