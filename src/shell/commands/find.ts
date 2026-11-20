import { joinPath, joinShown, listDir } from '../fs'
import { resolvePath } from '../path'
import { ERRNO_TEXT, lookup, permits } from '../perm'
import { isDir, type Command, type FsNode, type ShellState } from '../types'

// find prints its errors with the quotes GNU uses for messages: ‘name’,
// and its expression errors with `name'.

type Test = { kind: 'name'; pattern: RegExp } | { kind: 'type'; dir: boolean }

/** A shell-style pattern (* ? [abc]) as a RegExp for a whole name. */
export function globToRegExp(pattern: string, ignoreCase = false): RegExp {
  let src = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '*') src += '.*'
    else if (ch === '?') src += '.'
    else if (ch === '[') {
      const end = pattern.indexOf(']', i + 2)
      if (end === -1) {
        src += '\\['
        continue
      }
      let set = pattern.slice(i + 1, end)
      if (set.startsWith('!')) set = '^' + set.slice(1)
      src += `[${set.replace(/\\/g, '\\\\')}]`
      i = end
    } else src += ch.replace(/[.+^${}()|\\\]]/g, '\\$&')
  }
  return new RegExp(`^${src}$`, ignoreCase ? 'is' : 's')
}

type Parsed = { paths: string[]; tests: Test[] } | { error: string }

function parseFind(args: string[]): Parsed {
  let i = 0
  const paths: string[] = []
  while (i < args.length && !args[i].startsWith('-')) paths.push(args[i++])
  const tests: Test[] = []
  while (i < args.length) {
    const arg = args[i]
    if (arg === '-name' || arg === '-iname') {
      const pattern = args[i + 1]
      if (pattern === undefined) return { error: `find: missing argument to \`${arg}'` }
      tests.push({ kind: 'name', pattern: globToRegExp(pattern, arg === '-iname') })
      i += 2
      const next = args[i]
      // An unquoted pattern that the shell turned into several names.
      if (next !== undefined && !next.startsWith('-')) {
        return {
          error: `find: paths must precede expression: \`${next}'\nfind: possible unquoted pattern after predicate \`${arg}'?`,
        }
      }
      continue
    }
    if (arg === '-type') {
      const t = args[i + 1]
      if (t === undefined) return { error: "find: missing argument to `-type'" }
      if (t !== 'f' && t !== 'd') return { error: `find: Unknown argument to -type: ${t}` }
      tests.push({ kind: 'type', dir: t === 'd' })
      i += 2
      continue
    }
    if (arg.startsWith('-')) return { error: `find: unknown predicate \`${arg}'` }
    return { error: `find: paths must precede expression: \`${arg}'` }
  }
  return { paths: paths.length > 0 ? paths : ['.'], tests }
}

function matches(tests: Test[], name: string, node: FsNode): boolean {
  return tests.every((t) => (t.kind === 'type' ? isDir(node) === t.dir : t.pattern.test(name)))
}

export const find: Command = {
  name: 'find',
  summary: 'search for files and directories',
  usage: "find [PATH] [-name 'PATTERN'] [-type f|d]",
  description:
    "Searches PATH (or here) and every directory inside it. -name 'PATTERN' keeps names that match, where * means any letters. -type f keeps only files, -type d only directories. Quote the pattern so the shell leaves the * for find.",
  run: ({ args, state }) => {
    const parsed = parseFind(args)
    if ('error' in parsed) return { stderr: parsed.error, code: 1 }
    const out: string[] = []
    const err: string[] = []

    const walk = (s: ShellState, abs: string, shown: string, name: string, node: FsNode) => {
      if (matches(parsed.tests, name, node)) out.push(shown)
      if (!isDir(node)) return
      if (!permits(s, abs, node, 'r') || !permits(s, abs, node, 'x')) {
        err.push(`find: ‘${shown}’: Permission denied`)
        return
      }
      for (const child of listDir(node)) {
        walk(s, joinPath(abs, child), joinShown(shown, child), child, node.children[child])
      }
    }

    for (const start of parsed.paths) {
      const abs = resolvePath(state.cwd, start, state.home)
      const found = lookup(state, abs)
      if (found.error) {
        err.push(`find: ‘${start}’: ${ERRNO_TEXT[found.error]}`)
        continue
      }
      // The starting point is tested too, by its last part ("." for ".").
      const own = start.replace(/\/+$/, '').split('/').pop() || start
      walk(state, abs, start, own, found.node)
    }
    return {
      stdout: out.join('\n') || undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
