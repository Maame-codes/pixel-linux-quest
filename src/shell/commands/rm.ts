import { joinPath, joinShown, listDir } from '../fs'
import { basename, dirname, resolvePath } from '../path'
import { ERRNO_TEXT, isRoot, lookup, permits, touched, unlinkError } from '../perm'
import { isDir, type Command, type DirNode, type FsNode, type ShellState } from '../types'

export type RmArgs = {
  recursive: boolean
  force: boolean
  /** -d: remove empty directories. */
  emptyDirs: boolean
  verbose: boolean
  /** On unless --no-preserve-root is given (GNU default). */
  preserveRoot: boolean
  operands: string[]
  /** Set when an option is not one rm knows. */
  error?: string
}

const TRY = "Try 'rm --help' for more information."

/**
 * Read rm's options the way GNU rm does: options may come before or after
 * the names, short ones can be bunched (-rf), and "--" ends the options.
 */
export function parseRmArgs(args: string[]): RmArgs {
  const out: RmArgs = {
    recursive: false,
    force: false,
    emptyDirs: false,
    verbose: false,
    preserveRoot: true,
    operands: [],
  }
  let optionsDone = false
  for (const arg of args) {
    if (optionsDone || arg === '-' || !arg.startsWith('-')) {
      out.operands.push(arg)
      continue
    }
    if (arg === '--') {
      optionsDone = true
      continue
    }
    if (arg.startsWith('--')) {
      switch (arg) {
        case '--recursive':
          out.recursive = true
          break
        case '--force':
          out.force = true
          break
        case '--dir':
          out.emptyDirs = true
          break
        case '--verbose':
          out.verbose = true
          break
        case '--no-preserve-root':
          out.preserveRoot = false
          break
        case '--preserve-root':
          out.preserveRoot = true
          break
        default:
          out.error ??= `rm: unrecognized option '${arg}'\n${TRY}`
      }
      continue
    }
    for (const flag of arg.slice(1)) {
      if (flag === 'r' || flag === 'R') out.recursive = true
      else if (flag === 'f') out.force = true
      else if (flag === 'd') out.emptyDirs = true
      else if (flag === 'v') out.verbose = true
      else if (flag === 'i' || flag === 'I') continue
      else out.error ??= `rm: invalid option -- '${flag}'\n${TRY}`
    }
  }
  return out
}

/** Does this rm operand name the root directory, however it is written? */
export function isRootOperand(state: ShellState, operand: string): boolean {
  return resolvePath(state.cwd, operand, state.home) === '/'
}

type RemoveCtx = {
  state: ShellState
  opts: RmArgs
  errors: string[]
  said: string[]
}

/** rm without -f asks before deleting a file you may not write to. */
function writeProtected(ctx: RemoveCtx, abs: string, node: FsNode): boolean {
  return !ctx.opts.force && !isRoot(ctx.state) && !isDir(node) && !permits(ctx.state, abs, node, 'w')
}

/**
 * Delete one name from its parent directory, and for a directory with -r,
 * everything inside it first. Returns true if it is gone.
 */
function removeTree(ctx: RemoveCtx, parentAbs: string, parent: DirNode, abs: string, shown: string, node: FsNode): boolean {
  if (isDir(node)) {
    const names = listDir(node)
    if (names.length > 0 && !(permits(ctx.state, abs, node, 'r') && permits(ctx.state, abs, node, 'x'))) {
      ctx.errors.push(`rm: cannot remove '${shown}': Permission denied`)
      return false
    }
    let allGone = true
    for (const name of names) {
      const ok = removeTree(ctx, abs, node, joinPath(abs, name), joinShown(shown, name), node.children[name])
      allGone &&= ok
    }
    // A directory whose contents could not all be deleted stays.
    if (!allGone) return false
  }
  if (abs === '/') return true
  if (writeProtected(ctx, abs, node)) {
    const empty = node.kind === 'file' && node.content === '' ? 'empty ' : ''
    ctx.errors.push(`rm: remove write-protected regular ${empty}file '${shown}'? `)
    return false
  }
  const e = unlinkError(ctx.state, parentAbs, parent, abs, node)
  if (e) {
    ctx.errors.push(`rm: cannot remove '${shown}': ${ERRNO_TEXT[e]}`)
    return false
  }
  delete parent.children[basename(abs)]
  touched(parent)
  if (ctx.opts.verbose) ctx.said.push(isDir(node) ? `removed directory '${shown}'` : `removed '${shown}'`)
  return true
}

export const rm: Command = {
  name: 'rm',
  summary: 'remove files or directories',
  usage: 'rm [-r] [-f] FILE...',
  description:
    'Deletes files for good: there is no recycle bin. Add -r to delete a directory and everything inside it. -f skips missing files without an error, and does not ask about write-protected files.',
  run: ({ args, state }) => {
    const opts = parseRmArgs(args)
    if (opts.error) return { stderr: opts.error, code: 1 }
    if (opts.operands.length === 0) {
      if (opts.force) return { state }
      return { stderr: `rm: missing operand\n${TRY}`, code: 1 }
    }

    const ctx: RemoveCtx = { state, opts, errors: [], said: [] }
    // A write-protected file that rm asked about (and this terminal could not answer) is not a failure.
    let failed = false
    for (const op of opts.operands) {
      const abs = resolvePath(state.cwd, op, state.home)
      const last = op.replace(/\/+$/, '').split('/').pop()

      if (opts.recursive && abs === '/' && opts.preserveRoot) {
        const same = op === '/' ? "'/'" : `'${op}' (same as '/')`
        ctx.errors.push(`rm: it is dangerous to operate recursively on ${same}`)
        ctx.errors.push('rm: use --no-preserve-root to override this failsafe')
        failed = true
        continue
      }
      if (opts.recursive && (last === '.' || last === '..')) {
        ctx.errors.push(`rm: refusing to remove '.' or '..' directory: skipping '${op}'`)
        failed = true
        continue
      }

      const found = lookup(state, abs)
      if (found.error) {
        if (!(opts.force && found.error === 'ENOENT')) {
          ctx.errors.push(`rm: cannot remove '${op}': ${ERRNO_TEXT[found.error]}`)
          failed = true
        }
        continue
      }
      const node = found.node
      if (isDir(node) && !opts.recursive) {
        if (!opts.emptyDirs) {
          ctx.errors.push(`rm: cannot remove '${op}': Is a directory`)
          failed = true
          continue
        }
        if (Object.keys(node.children).length > 0) {
          ctx.errors.push(`rm: cannot remove '${op}': Directory not empty`)
          failed = true
          continue
        }
      }
      const parentAbs = dirname(abs)
      const parent = abs === '/' ? state.fs : (lookup(state, parentAbs).node as DirNode)
      const before = ctx.errors.length
      const gone = removeTree(ctx, parentAbs, parent, abs, op, node)
      if (!gone && ctx.errors.slice(before).some((e) => !e.includes('remove write-protected'))) failed = true
    }

    return {
      state,
      stdout: ctx.said.join('\n') || undefined,
      stderr: ctx.errors.join('\n') || undefined,
      code: failed ? 1 : 0,
    }
  },
}
