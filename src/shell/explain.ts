// Pip explains mistakes. The terminal still prints the real Linux error;
// this adds one short, friendly sentence or two on top. Pure: no React.
// Messages point at the mistake, never at the answer to a quest objective.

import { getDir, getNode, listDir } from './fs'
import { registry } from './commands'
import { basename, dirname, resolvePath } from './path'
import { parseWords, tokenize } from './parse'
import { isDir, type CommandResult, type ShellState } from './types'

/** Real Linux commands and the world of this game where each one unlocks. */
export const COMMAND_WORLDS: Record<string, number> = {
  pwd: 2,
  ls: 2,
  whoami: 2,
  cd: 2,
  mkdir: 2,
  touch: 2,
  cat: 2,
  echo: 2,
  man: 2,
  history: 2,
  cp: 3,
  mv: 3,
  rm: 3,
  rmdir: 3,
  head: 3,
  tail: 3,
  less: 3,
  find: 3,
  chmod: 3,
  ps: 4,
  kill: 4,
  jobs: 4,
  top: 4,
  env: 4,
  export: 4,
  alias: 4,
  nano: 4,
  grep: 5,
  sort: 5,
  uniq: 5,
  wc: 5,
  cut: 5,
  bash: 6,
  ping: 6,
  ip: 6,
  sudo: 6,
  su: 6,
}

export const WORLD_NAMES: Record<number, string> = {
  1: 'Penguin Island',
  2: 'Command Caves',
  3: 'File Forest',
  4: 'Process Peaks',
  5: 'Text Tundra',
  6: 'Script Castle',
}

/**
 * Windows (Command Prompt) habits and the Linux command to use instead.
 * Only names that really are missing from a standard Linux system are here;
 * type and dir do exist on Linux and get their own rule.
 */
const WINDOWS: Record<string, { linux: string; does: string }> = {
  cls: { linux: 'clear', does: 'wipes the screen' },
  del: { linux: 'rm', does: 'deletes files' },
  erase: { linux: 'rm', does: 'deletes files' },
  copy: { linux: 'cp', does: 'copies files' },
  xcopy: { linux: 'cp', does: 'copies files' },
  move: { linux: 'mv', does: 'moves and renames files' },
  ren: { linux: 'mv', does: 'renames files' },
  md: { linux: 'mkdir', does: 'makes a directory' },
  rd: { linux: 'rmdir', does: 'removes an empty directory' },
  ipconfig: { linux: 'ip', does: 'shows network settings' },
  tasklist: { linux: 'ps', does: 'lists running programs' },
  notepad: { linux: 'nano', does: 'edits text in the terminal' },
}

export type ExplainOptions = {
  /** Commands unlocked where the learner is. */
  unlocked: string[]
  /** The world of the current level. Leave out in the sandbox. */
  world?: number
}

/**
 * Edit distance between two words: letters added, removed, changed, or two
 * neighbours swapped (so sl is 1 away from ls).
 */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

function unlockNote(cmd: string, opts: ExplainOptions): string {
  if (opts.unlocked.includes(cmd)) return ''
  const world = COMMAND_WORLDS[cmd]
  if (!world) return ''
  if (opts.world !== undefined && world <= opts.world) return ` It is not part of this level.`
  return ` You unlock it in World ${world}, ${WORLD_NAMES[world]}.`
}

/** Find a path that matches `abs` when capital letters are ignored. */
function caseMatch(state: ShellState, abs: string): string | null {
  let current = '/'
  for (const seg of abs.split('/').filter(Boolean)) {
    const d = getDir(state.fs, current)
    if (!d) return null
    const hit = listDir(d).find((n) => n.toLowerCase() === seg.toLowerCase())
    if (!hit) return null
    current = current === '/' ? `/${hit}` : `${current}/${hit}`
  }
  return current === abs ? null : current
}

const kindOf = (state: ShellState, abs: string) => (isDir(getNode(state.fs, abs)) ? 'folder' : 'file')

/**
 * A short, friendly explanation of what went wrong, or null if Pip has
 * nothing useful to add. `before` is the state the command ran in.
 */
export function explainMistake(
  input: string,
  result: CommandResult,
  before: ShellState,
  opts: ExplainOptions,
): string | null {
  const line = input.trim()
  if (line === '') return null
  const tokens = tokenize(line)
  if (!tokens.ok) return 'A quote mark was opened but never closed. Quotes come in pairs, like "my notes.txt".'
  const parsed = parseWords(line, before)
  const words = parsed.ok ? parsed.words : []
  while (words[0] === 'sudo' && words.length > 1) words.shift()
  const [name = '', ...args] = words
  const err = result.stderr

  // cat with no file is not an error: a real cat waits for typing.
  if (name === 'cat' && args.length === 0 && opts.unlocked.includes('cat')) {
    return 'cat needs a file name after it. With no name, a real cat waits for you to type, until you press Ctrl+D.'
  }

  if (result.code === 0) return null

  // rm's built-in failsafe.
  if (err.includes('dangerous to operate recursively')) {
    return 'Phew! Linux has a safety check built in: rm refuses to delete / (the whole system) by accident.'
  }

  // Backslashes, Windows style. "\ " is a fine way to type a space, so skip that.
  if (/\\[^ ]/.test(line)) {
    return 'Linux uses forward slashes / between folder names, not backslashes \\.'
  }

  const notFound = result.code === 127 && err.endsWith('command not found')
  if (notFound) {
    const lower = name.toLowerCase()

    // Missing space: cd.. or ls-l.
    const known = [...new Set([...opts.unlocked, ...Object.keys(COMMAND_WORLDS)])]
    const glued = known.find((c) => name.length > c.length && name.startsWith(c) && /^[.\-/~]/.test(name.slice(c.length)))
    if (glued) {
      return `Almost! Put a space after ${glued}. Linux read ${name} as one word, and there is no command with that name.`
    }

    // Windows commands.
    if (lower === 'dir') {
      return 'dir does exist on Linux, it lists a folder much like ls. In this game, use ls.'
    }
    const win = WINDOWS[lower]
    if (win) {
      return `${lower} is a Windows command. On Linux, ${win.linux} ${win.does}.${unlockNote(win.linux, opts)}`
    }

    // Wrong capital letters in the command name.
    if (lower !== name && (opts.unlocked.includes(lower) || lower in COMMAND_WORLDS)) {
      return `Close! Linux cares about capital letters. Commands are lowercase, so try ${lower}.`
    }

    // A real command that is locked here.
    if (name in COMMAND_WORLDS && !opts.unlocked.includes(name)) {
      const world = COMMAND_WORLDS[name]
      if (opts.world !== undefined && world <= opts.world) {
        return `${name} is a real Linux command, but it is not part of this level.`
      }
      if (!registry[name]) {
        return `${name} is a real Linux command, but Pip's terminal does not have it yet. It arrives in World ${world}, ${WORLD_NAMES[world]}.`
      }
      return `${name} is a real Linux command, but it is still locked. You unlock it in World ${world}, ${WORLD_NAMES[world]}.`
    }

    // A typo in an unlocked command.
    let best: { cmd: string; d: number } | null = null
    for (const cmd of opts.unlocked) {
      const d = editDistance(lower, cmd)
      if (d <= 2 && d < Math.max(name.length, cmd.length) && (!best || d < best.d)) best = { cmd, d }
    }
    if (best) return `Did you mean ${best.cmd}?`
    return null
  }

  // type is real on Linux, but it is not Windows' "show a file".
  if (name === 'type') {
    return `type does exist on Linux, but it tells you what kind of command a name is. To show what is inside a file, use cat.${unlockNote('cat', opts)}`
  }

  // Missing argument.
  if (/missing (file )?operand/.test(err)) {
    if (name === 'mkdir') return 'mkdir needs a name for the new folder. Put the name after it, with a space between.'
    if (name === 'touch') return 'touch needs a name for the new file. Put the name after it, with a space between.'
    if (name === 'rm') return 'rm needs the name of the file to delete.'
  }

  // A name with a space that needed quotes.
  if (args.length >= 2 && /No such file or directory|too many arguments/.test(err)) {
    for (let i = 0; i < args.length - 1; i++) {
      for (let j = i + 1; j < args.length; j++) {
        const joined = args.slice(i, j + 1).join(' ')
        if (getNode(before.fs, resolvePath(before.cwd, joined, before.home))) {
          return `That name has a space in it. Put quotes around it, like "${joined}", so Linux reads it as one name.`
        }
      }
    }
  }

  // Wrong capital letters in a file or folder name.
  if (err.includes('No such file or directory')) {
    for (const arg of args) {
      if (arg.startsWith('-')) continue
      const abs = resolvePath(before.cwd, arg, before.home)
      if (getNode(before.fs, abs)) continue
      const real = caseMatch(before, abs)
      if (real) {
        return `Close! Linux cares about capital letters. You typed ${basename(abs)}, but the ${kindOf(before, real)} is ${basename(real)}.`
      }
    }
  }

  // cd into a file, cat a folder, rm a folder.
  if (name === 'cd' && err.includes('Not a directory')) {
    return `${args[0]} is a file, not a folder. You can only cd into folders.`
  }
  if (name === 'cat' && err.includes('Is a directory')) {
    const target = args.find((a) => isDir(getNode(before.fs, resolvePath(before.cwd, a, before.home))))
    return `${target ?? 'That'} is a folder, not a file. cat shows what is inside a file. To see what is in a folder, use ls.`
  }
  if (name === 'rm' && err.includes('Is a directory')) {
    return 'That is a folder. rm only deletes a folder if you add -r, and then it deletes everything inside it too.'
  }

  // mkdir on a name that is taken.
  if (name === 'mkdir' && err.includes('File exists')) {
    const taken = args.find((a) => getNode(before.fs, resolvePath(before.cwd, a, before.home)))
    return `There is already something called ${taken ?? 'that'} here, so mkdir left it alone.`
  }

  if (name === 'cd' && err.includes('too many arguments')) {
    return 'cd takes just one folder at a time.'
  }

  // Nothing by that name.
  if (err.includes('No such file or directory')) {
    const missing = args.find(
      (a) => !a.startsWith('-') && !getNode(before.fs, resolvePath(before.cwd, a, before.home)),
    )
    if (missing && getDir(before.fs, dirname(resolvePath(before.cwd, missing, before.home)))) {
      return `There is nothing called ${missing} there. ls shows what is in a folder.`
    }
  }

  return null
}
