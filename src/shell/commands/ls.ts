import { fileBytes, joinPath, listDir } from '../fs'
import { parseOptions } from '../options'
import { resolvePath } from '../path'
import { ERRNO_TEXT, lookup, modeString, permits, statNode } from '../perm'
import { isDir, type Command, type DirNode, type FsNode, type ShellState } from '../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SIX_MONTHS_MS = 15_778_476_000

/** ls -l's date: "Nov 20 09:14", or "Nov 20  2025" when older than six months or in the future. */
export function lsDate(mtime: number, now = Date.now()): string {
  const d = new Date(mtime)
  const day = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, ' ')}`
  const recent = now - mtime < SIX_MONTHS_MS && mtime <= now + 60_000
  if (recent) return `${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${day}  ${d.getFullYear()}`
}

/** Hard links: 1 for a file; for a directory, 2 plus one per subdirectory. */
function linkCount(node: FsNode): number {
  if (!isDir(node)) return 1
  return 2 + Object.values(node.children).filter(isDir).length
}

function sizeOf(node: FsNode): number {
  return isDir(node) ? 4096 : fileBytes(node.content)
}

/** Disk blocks (1K each) for "total": a 4K block for each directory and non-empty file. */
function blocksOf(node: FsNode): number {
  return sizeOf(node) === 0 ? 0 : 4 * Math.ceil(sizeOf(node) / 4096)
}

type Entry = { name: string; abs: string; node: FsNode }

/** The ls -l lines for some entries, with the columns lined up like GNU ls. */
function longLines(state: ShellState, entries: Entry[]): string[] {
  const rows = entries.map(({ name, abs, node }) => {
    const st = statNode(state, abs, node)
    return {
      mode: modeString(node, st.mode),
      links: String(linkCount(node)),
      owner: st.owner,
      group: st.group,
      size: String(sizeOf(node)),
      date: lsDate(st.mtime),
      name,
    }
  })
  const w = (key: 'links' | 'owner' | 'group' | 'size') => Math.max(0, ...rows.map((r) => r[key].length))
  const [wl, wo, wg, ws] = [w('links'), w('owner'), w('group'), w('size')]
  return rows.map(
    (r) =>
      `${r.mode} ${r.links.padStart(wl)} ${r.owner.padEnd(wo)} ${r.group.padEnd(wg)} ${r.size.padStart(ws)} ${r.date} ${r.name}`,
  )
}

export const ls: Command = {
  name: 'ls',
  summary: 'list what is here',
  usage: 'ls [-l] [-a] [path...]',
  description:
    'Lists the files and directories at the given path, or the current directory. -l shows details: permissions, owner, group, size and date. -a also shows hidden names that start with a dot.',
  run: ({ args, state }) => {
    const opts = parseOptions('ls', args, {
      flags: 'laAd1',
      long: { all: 'a', 'almost-all': 'A', directory: 'd' },
    })
    if (opts.error) return { stderr: opts.error, code: 2 }
    const long = opts.flags.has('l')
    const all = opts.flags.has('a')
    const almostAll = opts.flags.has('A')
    const operands = opts.operands.length > 0 ? opts.operands : ['.']

    const err: string[] = []
    let code = 0
    const files: Entry[] = []
    const dirs: Entry[] = []
    for (const op of operands) {
      const abs = resolvePath(state.cwd, op, state.home)
      const found = lookup(state, abs)
      if (found.error) {
        err.push(`ls: cannot access '${op}': ${ERRNO_TEXT[found.error]}`)
        code = 2
        continue
      }
      if (isDir(found.node) && !opts.flags.has('d')) dirs.push({ name: op, abs, node: found.node })
      else files.push({ name: op, abs, node: found.node })
    }

    const blocks: string[] = []
    if (files.length > 0) blocks.push(long ? longLines(state, files).join('\n') : files.map((f) => f.name).join('  '))

    const showHeaders = operands.length > 1
    for (const d of dirs) {
      const node = d.node as DirNode
      const header = showHeaders ? `${d.name}:` : ''
      if (!permits(state, d.abs, node, 'r')) {
        err.push(`ls: cannot open directory '${d.name}': Permission denied`)
        code = 2
        continue
      }
      const entries: Entry[] = listDir(node)
        .filter((name) => all || almostAll || !name.startsWith('.'))
        .map((name) => ({ name, abs: joinPath(d.abs, name), node: node.children[name] }))
      if (all) {
        const parentAbs = resolvePath(d.abs, '..', state.home)
        const parent = lookup(state, parentAbs).node ?? node
        entries.unshift({ name: '.', abs: d.abs, node }, { name: '..', abs: parentAbs, node: parent })
      }
      let body: string
      if (long) {
        const total = entries.filter((e) => e.name !== '.' && e.name !== '..').reduce((n, e) => n + blocksOf(e.node), 0)
        const dots = all ? 8 : 0
        body = [`total ${total + dots}`, ...longLines(state, entries)].join('\n')
      } else body = entries.map((e) => e.name).join('  ')
      blocks.push(header && body ? `${header}\n${body}` : header || body)
    }

    return {
      stdout: blocks.join('\n\n') || undefined,
      stderr: err.join('\n') || undefined,
      code,
    }
  },
}
