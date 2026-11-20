// Spotting command lines that would wreck a real Linux system. These are
// parsed, not matched as fixed strings, so spacing, flag order, quoting and
// a leading sudo all work the way bash would read them.

import { getNode } from './fs'
import { parseRmArgs } from './commands/rm'
import { parseWords } from './parse'
import { resolvePath } from './path'
import type { ShellState } from './types'

export type Danger =
  /** Recursive rm on "/" stopped by GNU rm's built-in failsafe. */
  | { kind: 'preserve-root'; sudo: boolean }
  /** Recursive rm that deletes "/" or the system folders Linux needs. */
  | { kind: 'wipe'; sudo: boolean }
  /** A function that keeps starting copies of itself. */
  | { kind: 'fork-bomb' }

/** Top-level folders a Linux system cannot run without. */
export const SYSTEM_DIRS = ['/bin', '/boot', '/etc', '/lib', '/sbin', '/usr']

type Lexeme = { type: 'word'; text: string } | { type: 'op'; text: string }

/** Split into words and the shell symbols ( ) { } ; | & that a function needs. */
function lexOps(line: string): Lexeme[] {
  const out: Lexeme[] = []
  let word = ''
  const flush = () => {
    if (word) out.push({ type: 'word', text: word })
    word = ''
  }
  for (const ch of line) {
    if (ch === ' ' || ch === '\t') flush()
    else if ('(){};|&'.includes(ch)) {
      flush()
      out.push({ type: 'op', text: ch })
    } else word += ch
  }
  flush()
  return out
}

/**
 * True for the classic fork bomb and its renamed versions:
 * NAME(){ NAME|NAME& };NAME, with any spacing. The function pipes itself
 * into itself in the background, then the line calls it.
 */
export function isForkBomb(line: string): boolean {
  const lx = lexOps(line)
  const at = (i: number, type: Lexeme['type'], text?: string) =>
    lx[i]?.type === type && (text === undefined || lx[i].text === text)

  let i = 0
  if (at(i, 'word', 'function')) i++
  if (!at(i, 'word')) return false
  const name = lx[i].text
  i++
  if (at(i, 'op', '(')) {
    if (!at(i + 1, 'op', ')')) return false
    i += 2
  }
  if (!at(i, 'op', '{')) return false
  const close = lx.findIndex((l, k) => k > i && l.type === 'op' && l.text === '}')
  if (close === -1) return false

  // The body must call NAME | NAME &, the part that doubles the processes.
  const body = lx.slice(i + 1, close)
  const callsItselfInBackground = body.some(
    (_, k) =>
      body[k]?.type === 'word' &&
      body[k].text === name &&
      body[k + 1]?.text === '|' &&
      body[k + 2]?.type === 'word' &&
      body[k + 2].text === name &&
      body[k + 3]?.text === '&',
  )
  if (!callsItselfInBackground) return false

  // Then the function is called: "; NAME" (the ; is optional after }).
  let j = close + 1
  if (at(j, 'op', ';')) j++
  return at(j, 'word', name) && j === lx.length - 1
}

/** Look at a command line before it runs and say if it is dangerous. */
export function analyzeDanger(line: string, state: ShellState): Danger | null {
  if (isForkBomb(line)) return { kind: 'fork-bomb' }

  const parsed = parseWords(line, state)
  if (!parsed.ok) return null
  let words = parsed.words
  let sudo = false
  while (words[0] === 'sudo') {
    sudo = true
    words = words.slice(1)
  }
  if (words[0] !== 'rm') return null

  const opts = parseRmArgs(words.slice(1))
  // With -i or -I, rm asks first, and nobody can answer here: nothing is deleted.
  if (opts.error || !opts.recursive || opts.interactive === 'always' || opts.interactive === 'once') return null

  const targets = opts.operands.map((op) => resolvePath(state.cwd, op, state.home))
  if (targets.includes('/')) {
    return opts.preserveRoot ? { kind: 'preserve-root', sudo } : { kind: 'wipe', sudo }
  }
  const hitsSystem = targets.some((t) => SYSTEM_DIRS.includes(t) && getNode(state.fs, t) !== null)
  return hitsSystem ? { kind: 'wipe', sudo } : null
}
