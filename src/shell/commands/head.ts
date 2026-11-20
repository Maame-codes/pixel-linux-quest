import { fileLines } from '../fs'
import { readText } from '../io'
import { parseOptions } from '../options'
import { resolvePath } from '../path'
import { ERRNO_TEXT } from '../perm'
import type { Command, CommandContext, CommandOutput } from '../types'

export const DEFAULT_LINES = 10

/** The old short form "head -5" means "head -n 5". */
function expandShortCount(args: string[]): string[] {
  const out: string[] = []
  let done = false
  args.forEach((a, i) => {
    if (a === '--') done = true
    // Not when it is the value of -n, as in "head -n -5".
    const isValue = args[i - 1] === '-n' || args[i - 1] === '--lines'
    if (!done && !isValue && /^-\d+$/.test(a)) out.push('-n', a.slice(1))
    else out.push(a)
  })
  return out
}

/**
 * Show part of each file: the start (head) or the end (tail). `pick` gets
 * the file's lines and the -n value, and returns the lines to show.
 */
function showPart(
  cmd: 'head' | 'tail',
  ctx: CommandContext,
  pick: (lines: string[], n: number, sign: '' | '+' | '-') => string[],
): CommandOutput {
  const { state } = ctx
  const opts = parseOptions(cmd, expandShortCount(ctx.args), {
    flags: 'qv',
    withValue: 'n',
    long: { lines: 'n', quiet: 'q', silent: 'q', verbose: 'v' },
  })
  if (opts.error) return { stderr: opts.error, code: 1 }
  const raw = opts.values.n ?? String(DEFAULT_LINES)
  const m = /^([+-]?)(\d+)$/.exec(raw)
  if (!m) return { stderr: `${cmd}: invalid number of lines: ‘${raw}’`, code: 1 }
  const sign = m[1] as '' | '+' | '-'
  const n = Number(m[2])

  // With no file, head and tail read the keyboard. This terminal cannot wait for typing.
  if (opts.operands.length === 0) return {}
  const headers = (opts.operands.length > 1 || opts.flags.has('v')) && !opts.flags.has('q')
  const blocks: string[] = []
  const err: string[] = []
  for (const name of opts.operands) {
    const read = readText(state, resolvePath(state.cwd, name, state.home))
    if (!read.ok) {
      err.push(
        read.errno === 'EISDIR'
          ? `${cmd}: error reading '${name}': Is a directory`
          : `${cmd}: cannot open '${name}' for reading: ${ERRNO_TEXT[read.errno]}`,
      )
      continue
    }
    const shown = pick(fileLines(read.content), n, sign)
    blocks.push([...(headers ? [`==> ${name} <==`] : []), ...shown].join('\n'))
  }
  return {
    stdout: blocks.join('\n\n') || undefined,
    stderr: err.join('\n') || undefined,
    code: err.length > 0 ? 1 : 0,
  }
}

export const head: Command = {
  name: 'head',
  summary: 'show the first lines of a file',
  usage: 'head [-n N] FILE...',
  description: 'Prints the first 10 lines of a file. -n N prints the first N lines instead.',
  run: (ctx) =>
    showPart('head', ctx, (lines, n, sign) =>
      // "head -n -5" prints everything except the last 5 lines.
      sign === '-' ? lines.slice(0, Math.max(0, lines.length - n)) : lines.slice(0, n),
    ),
}

export const tail: Command = {
  name: 'tail',
  summary: 'show the last lines of a file',
  usage: 'tail [-n N] FILE...',
  description:
    'Prints the last 10 lines of a file. -n N prints the last N lines instead. Handy for logs, where the newest lines are at the end.',
  run: (ctx) =>
    showPart('tail', ctx, (lines, n, sign) =>
      // "tail -n +5" prints from line 5 to the end.
      sign === '+' ? lines.slice(Math.max(0, n - 1)) : n === 0 ? [] : lines.slice(-n),
    ),
}
