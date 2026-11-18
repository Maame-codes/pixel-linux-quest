// Tab completion, like bash: finish a command name or a file or folder path.
// Pure: it reads the shell state and returns what to insert, never changes anything.

import { getDir, listDir } from './fs'
import { resolvePath } from './path'
import type { ShellState } from './types'

export type Completion = {
  /** Text to insert at the cursor. Empty when there is nothing to add. */
  insert: string
  /** Every candidate that fits (folders end in "/"). Shown on a second Tab when there are several. */
  matches: string[]
}

const NONE: Completion = { insert: '', matches: [] }

/** The word being typed at the end of `before`, split the way bash splits words. */
type CurrentWord = {
  /** The word with quotes and backslashes removed. */
  text: string
  /** The open quote the word is inside, if any. */
  quote: "'" | '"' | null
  /** How many complete words come before it. */
  index: number
  /** Those earlier words (unquoted). */
  previous: string[]
}

function currentWord(before: string): CurrentWord {
  const words: string[] = []
  let text = ''
  let inWord = false
  let quote: "'" | '"' | null = null
  for (let i = 0; i < before.length; i++) {
    const ch = before[i]
    if (quote) {
      if (ch === quote) quote = null
      else if (quote === '"' && ch === '\\' && (before[i + 1] === '"' || before[i + 1] === '\\')) text += before[++i]
      else text += ch
      continue
    }
    if (ch === ' ' || ch === '\t') {
      if (inWord) words.push(text)
      text = ''
      inWord = false
      continue
    }
    inWord = true
    if (ch === "'" || ch === '"') quote = ch
    else if (ch === '\\') {
      if (i + 1 < before.length) text += before[++i]
    } else text += ch
  }
  return { text, quote, index: words.length, previous: words }
}

/** Escape a name so it stays one word: a backslash before spaces and special characters. */
function escapeName(name: string, quote: CurrentWord['quote']): string {
  if (quote === "'") return name
  if (quote === '"') return name.replace(/["\\]/g, '\\$&')
  return name.replace(/[\s'"\\*?|&;<>()$`!#]/g, '\\$&')
}

/** The command the word belongs to, skipping any sudo in front. */
function commandName(word: CurrentWord): string | undefined {
  return word.previous.find((w) => w !== 'sudo')
}

function commonPrefix(items: string[]): string {
  if (items.length === 0) return ''
  let prefix = items[0]
  for (const item of items.slice(1)) {
    let i = 0
    while (i < prefix.length && i < item.length && prefix[i] === item[i]) i++
    prefix = prefix.slice(0, i)
  }
  return prefix
}

/** Build the result: one match is finished off, several are extended as far as they agree. */
function finish(typed: string, candidates: string[], word: CurrentWord): Completion {
  const matches = [...new Set(candidates)].sort((a, b) => a.localeCompare(b))
  if (matches.length === 0) return NONE
  if (matches.length === 1) {
    const only = matches[0]
    const isDir = only.endsWith('/')
    const rest = escapeName(only.slice(typed.length).replace(/\/$/, ''), word.quote)
    if (isDir) return { insert: rest + '/', matches }
    // A finished word gets its closing quote and a space, ready for the next one.
    return { insert: rest + (word.quote ?? '') + ' ', matches }
  }
  const shared = commonPrefix(matches)
  return { insert: escapeName(shared.slice(typed.length), word.quote), matches }
}

/**
 * Complete the word just before the cursor.
 *
 * @param before   The command line up to the cursor.
 * @param state    The shell, for the current directory and its files.
 * @param commands Command names the learner can run here.
 */
export function complete(before: string, state: ShellState, commands: readonly string[]): Completion {
  const word = currentWord(before)
  const sudoOnly = word.previous.every((w) => w === 'sudo') && commands.includes('sudo')
  const commandPosition = word.index === 0 || sudoOnly

  // A command name (no slash typed yet).
  if (commandPosition && !word.text.includes('/')) {
    if (word.text === '') return NONE
    return finish(word.text, commands.filter((c) => c.startsWith(word.text)), word)
  }

  // A path: complete the last part inside the folder named by the rest.
  const slash = word.text.lastIndexOf('/')
  const folderPart = slash === -1 ? '' : word.text.slice(0, slash + 1)
  const namePart = word.text.slice(slash + 1)
  // "~" and "~name" would be user names in bash, so leave them alone.
  if (folderPart === '' && namePart.startsWith('~')) return NONE

  const folder = getDir(state.fs, resolvePath(state.cwd, folderPart === '' ? '.' : folderPart, state.home))
  if (!folder) return NONE

  const candidates = listDir(folder)
    .filter((name) => name.startsWith(namePart))
    // Hidden files only show up when the learner has typed the dot.
    .filter((name) => namePart.startsWith('.') || !name.startsWith('.'))
    .map((name) => (folder.children[name].kind === 'dir' ? name + '/' : name))
    // cd can only go into folders, so it only offers folders (like bash-completion does).
    .filter((name) => commandName(word) !== 'cd' || name.endsWith('/'))

  return finish(namePart, candidates, word)
}
