import { fileBytes, fileLines } from '../fs'
import { readText } from '../io'
import { parseOptions } from '../options'
import { resolvePath } from '../path'
import { ERRNO_TEXT } from '../perm'
import type { Command } from '../types'

type Counts = { lines: number; words: number; bytes: number }

export function countText(content: string): Counts {
  return {
    lines: fileLines(content).length,
    words: content.split(/\s+/).filter(Boolean).length,
    bytes: fileBytes(content),
  }
}

export const wc: Command = {
  name: 'wc',
  summary: 'count lines, words and bytes',
  usage: 'wc [-l] [-w] [-c] FILE...',
  description:
    'Counts the lines, words and bytes in a file. -l counts only lines, -w only words, -c only bytes.',
  run: ({ args, state }) => {
    const opts = parseOptions('wc', args, {
      flags: 'lwc',
      long: { lines: 'l', words: 'w', bytes: 'c' },
    })
    if (opts.error) return { stderr: opts.error, code: 1 }
    // With no option, wc shows all three, always in the order lines, words, bytes.
    const none = opts.flags.size === 0
    const show = (['lines', 'words', 'bytes'] as const).filter(
      (k) => none || opts.flags.has(k === 'lines' ? 'l' : k === 'words' ? 'w' : 'c'),
    )
    // With no file, wc reads the keyboard. This terminal cannot wait for typing.
    if (opts.operands.length === 0) return {}

    const rows: { counts: Counts; name: string }[] = []
    const err: string[] = []
    for (const name of opts.operands) {
      const read = readText(state, resolvePath(state.cwd, name, state.home))
      if (read.ok) {
        rows.push({ counts: countText(read.content), name })
        continue
      }
      err.push(`wc: ${name}: ${ERRNO_TEXT[read.errno]}`)
      // wc still prints a line of zeros for a directory.
      if (read.errno === 'EISDIR') rows.push({ counts: { lines: 0, words: 0, bytes: 0 }, name })
    }
    const total = rows.reduce(
      (t, r) => ({ lines: t.lines + r.counts.lines, words: t.words + r.counts.words, bytes: t.bytes + r.counts.bytes }),
      { lines: 0, words: 0, bytes: 0 },
    )
    if (opts.operands.length > 1) rows.push({ counts: total, name: 'total' })

    // GNU wc lines the columns up to the width of the total size. With one
    // number for one file there is nothing to line up.
    const width = show.length === 1 && opts.operands.length === 1 ? 1 : String(total.bytes).length
    const lines = rows.map((r) => [...show.map((k) => String(r.counts[k]).padStart(width)), r.name].join(' '))
    return {
      stdout: lines.join('\n') || undefined,
      stderr: err.join('\n') || undefined,
      code: err.length > 0 ? 1 : 0,
    }
  },
}
