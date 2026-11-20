// Small helpers for objective checks, shared by levels and practice tasks.

import { resolvePath, tokenize, type CommandResult, type ShellState } from '../shell'

/** The words of the last command line (quotes removed, no * expansion), without a leading sudo. */
export function wordsOf(last: CommandResult): string[] {
  const t = tokenize(last.input.trim())
  if (!t.ok) return []
  const words = t.tokens.map((tok) => tok.text)
  while (words[0] === 'sudo' && words.length > 1) words.shift()
  return words
}

/** Did the last command run `name` successfully? */
export function ran(last: CommandResult, name: string): boolean {
  return last.code === 0 && wordsOf(last)[0] === name
}

/** The non-option arguments of the last command. */
export function operandsOf(last: CommandResult): string[] {
  return wordsOf(last)
    .slice(1)
    .filter((w) => !w.startsWith('-'))
}

/**
 * Did the last command name this absolute path among its arguments? Paths
 * are resolved from the current directory, so use it for commands that do
 * not move you (ls, cat, head and so on).
 */
export function namedPath(last: CommandResult, shell: ShellState, abs: string): boolean {
  return operandsOf(last).some((w) => resolvePath(shell.cwd, w, shell.home) === abs)
}
