// Turning a command line into words, the way bash does for simple commands:
// quotes, backslash escapes and * / ? filename patterns.

import { getDir, getNode, listDir } from './fs'
import { resolvePath } from './path'
import type { ShellState } from './types'

export type Token = {
  text: string
  /** True if the word had an unquoted * or ?, so the shell expands it. */
  glob: boolean
}

export type TokenizeResult = { ok: true; tokens: Token[] } | { ok: false; error: string }

/**
 * Split a line into words. Single quotes keep everything as typed, double
 * quotes allow \" and \\, and an unquoted backslash makes the next character
 * plain (so "my\ folder" is one word).
 */
export function tokenize(line: string): TokenizeResult {
  const tokens: Token[] = []
  let text = ''
  let glob = false
  let inWord = false
  let i = 0

  const push = () => {
    if (inWord) tokens.push({ text, glob })
    text = ''
    glob = false
    inWord = false
  }

  while (i < line.length) {
    const ch = line[i]
    if (ch === ' ' || ch === '\t') {
      push()
      i++
      continue
    }
    inWord = true
    if (ch === "'") {
      const end = line.indexOf("'", i + 1)
      if (end === -1) return { ok: false, error: "bash: unexpected EOF while looking for matching `''" }
      text += line.slice(i + 1, end)
      i = end + 1
      continue
    }
    if (ch === '"') {
      let j = i + 1
      let closed = false
      while (j < line.length) {
        const c = line[j]
        if (c === '\\' && (line[j + 1] === '"' || line[j + 1] === '\\')) {
          text += line[j + 1]
          j += 2
          continue
        }
        if (c === '"') {
          closed = true
          break
        }
        text += c
        j++
      }
      if (!closed) return { ok: false, error: 'bash: unexpected EOF while looking for matching `"\'' }
      i = j + 1
      continue
    }
    if (ch === '\\') {
      if (i + 1 < line.length) text += line[i + 1]
      i += 2
      continue
    }
    if (ch === '*' || ch === '?') glob = true
    text += ch
    i++
  }
  push()
  return { ok: true, tokens }
}

function patternToRegExp(seg: string): RegExp {
  let src = ''
  for (const ch of seg) {
    if (ch === '*') src += '[^/]*'
    else if (ch === '?') src += '[^/]'
    else src += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${src}$`)
}

/**
 * Expand one filename pattern against the filesystem, like bash does before
 * the command runs. Matches come back sorted; no match leaves the word as is.
 * Names starting with a dot only match a pattern that starts with a dot.
 */
export function expandPattern(pattern: string, state: ShellState): string[] {
  let pat = pattern
  if (pat === '~' || pat.startsWith('~/')) pat = state.home + pat.slice(1)
  const absolute = pat.startsWith('/')
  const segs = pat.split('/').filter((s) => s !== '')

  // Each candidate is the text as it will be shown, plus its absolute path.
  let candidates: { shown: string; abs: string }[] = [
    { shown: '', abs: absolute ? '/' : state.cwd },
  ]
  const join = (shown: string, name: string) => {
    if (absolute) return `${shown}/${name}`
    return shown === '' ? name : `${shown}/${name}`
  }

  for (const seg of segs) {
    const next: { shown: string; abs: string }[] = []
    const isPattern = seg.includes('*') || seg.includes('?')
    for (const c of candidates) {
      if (!isPattern) {
        next.push({ shown: join(c.shown, seg), abs: resolvePath(c.abs, seg, state.home) })
        continue
      }
      const d = getDir(state.fs, c.abs)
      if (!d) continue
      const re = patternToRegExp(seg)
      for (const name of listDir(d)) {
        if (name.startsWith('.') && !seg.startsWith('.')) continue
        if (re.test(name)) next.push({ shown: join(c.shown, name), abs: resolvePath(c.abs, name, state.home) })
      }
    }
    candidates = next
  }

  const found = candidates.filter((c) => getNode(state.fs, c.abs) !== null).map((c) => c.shown)
  if (found.length === 0 || segs.length === 0) return [pattern]
  return found.sort((a, b) => a.localeCompare(b))
}

/** Tokenize a line and expand its patterns. Returns plain words. */
export function parseWords(line: string, state: ShellState): { ok: true; words: string[] } | { ok: false; error: string } {
  const t = tokenize(line)
  if (!t.ok) return t
  const words: string[] = []
  for (const tok of t.tokens) {
    if (tok.glob) words.push(...expandPattern(tok.text, state))
    else words.push(tok.text)
  }
  return { ok: true, words }
}
