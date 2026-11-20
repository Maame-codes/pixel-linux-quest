import { joinPath, joinShown, listDir } from '../fs'
import { basename, dirname, resolvePath } from '../path'
import { ERRNO_TEXT, isRoot, lookup, permits, touched, unlinkError } from '../perm'
import { isDir, type Command, type DirNode, type FsNode, type ShellState } from '../types'

/**
 * When rm asks before deleting, as in GNU rm (the last of -f, -i and -I wins):
 * - never: -f, never asks.
 * - sometimes: the default, asks only about write-protected files.
 * - once: -I, asks once before removing more than 3 names or anything recursively.
 * - always: -i, asks about every file and directory.
 */
export type RmInteractive = 'never' | 'sometimes' | 'once' | 'always'

export type RmArgs = {
  recursive: boolean
  /** -f: no error for a missing file. */
  force: boolean
  interactive: RmInteractive
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
    interactive: 'sometimes',
    emptyDirs: false,
    verbose: false,
    preserveRoot: true,
    operands: [],
  }
  const set = (flag: string) => {
    if (flag === 'r' || flag === 'R') out.recursive = true
    else if (flag === 'f') {
      out.force = true
      out.interactive = 'never'
    } else if (flag === 'i' || flag === 'I') {
      out.force = false
      out.interactive = flag === 'i' ? 'always' : 'once'
    } else if (flag === 'd') out.emptyDirs = true
    else if (flag === 'v') out.verbose = true
    else return false
    return true
  }
  const LONG: Record<string, string> = { '--recursive': 'r', '--force': 'f', '--dir': 'd', '--verbose': 'v' }
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
      if (arg === '--no-preserve-root') out.preserveRoot = false
      else if (arg === '--preserve-root') out.preserveRoot = true
      else if (LONG[arg]) set(LONG[arg])
      else out.error ??= `rm: unrecognized option '${arg}'\n${TRY}`
      continue
    }
    for (const flag of arg.slice(1)) {
      if (!set(flag)) out.error ??= `rm: invalid option -- '${flag}'\n${TRY}`
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
  /** Everything rm prints to stderr, in order: errors and its questions. */
  stderr: string[]
  said: string[]
  /** A real error happened (a question nobody answered is not one). */
  failed: boolean
}

function fail(ctx: RemoveCtx, message: string): void {
  ctx.stderr.push(message)
  ctx.failed = true
}

/**
 * rm's question before deleting. This terminal cannot answer, so the answer
 * is always no: the file stays, and that is not an error.
 */
function ask(ctx: RemoveCtx, question: string): void {
  ctx.stderr.push(`rm: ${question}? `)
}

function writeProtected(ctx: RemoveCtx, abs: string, node: FsNode): boolean {
  return !isRoot(ctx.state) && !permits(ctx.state, abs, node, 'w')
}

/** "regular file", "regular empty file" or "directory", with "write-protected" in front if so. */
function describe(ctx: RemoveCtx, abs: string, node: FsNode): string {
  const wp = writeProtected(ctx, abs, node) ? 'write-protected ' : ''
  if (isDir(node)) return `${wp}directory`
  return `${wp}regular ${node.content === '' ? 'empty ' : ''}file`
}

/**
 * Delete one name from its parent directory, and for a directory with -r,
 * everything inside it first. Returns true if it is gone.
 */
function removeTree(ctx: RemoveCtx, parentAbs: string, parent: DirNode, abs: string, shown: string, node: FsNode): boolean {
  const always = ctx.opts.interactive === 'always'
  if (isDir(node)) {
    const names = listDir(node)
    if (names.length > 0 && always) {
      ask(ctx, `descend into ${writeProtected(ctx, abs, node) ? 'write-protected ' : ''}directory '${shown}'`)
      return false
    }
    if (names.length > 0 && !(permits(ctx.state, abs, node, 'r') && permits(ctx.state, abs, node, 'x'))) {
      fail(ctx, `rm: cannot remove '${shown}': Permission denied`)
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
  const sometimes = ctx.opts.interactive === 'sometimes' || ctx.opts.interactive === 'once'
  if (always || (sometimes && !isDir(node) && writeProtected(ctx, abs, node))) {
    ask(ctx, `remove ${describe(ctx, abs, node)} '${shown}'`)
    return false
  }
  const e = unlinkError(ctx.state, parentAbs, parent, abs, node)
  if (e) {
    fail(ctx, `rm: cannot remove '${shown}': ${ERRNO_TEXT[e]}`)
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
  usage: 'rm [-r] [-f] [-i] FILE...',
  description:
    'Deletes files for good: there is no recycle bin. Add -r to delete a directory and everything inside it. -f skips missing files without an error, and never asks. -i asks before every deletion.',
  run: ({ args, state }) => {
    const opts = parseRmArgs(args)
    if (opts.error) return { stderr: opts.error, code: 1 }
    if (opts.operands.length === 0) {
      if (opts.force) return { state }
      return { stderr: `rm: missing operand\n${TRY}`, code: 1 }
    }

    const ctx: RemoveCtx = { state, opts, stderr: [], said: [], failed: false }

    // -I asks once before a big or recursive delete. Unanswered, nothing is removed.
    const n = opts.operands.length
    if (opts.interactive === 'once' && (opts.recursive || n > 3)) {
      const what = `${n} argument${n === 1 ? '' : 's'}`
      ask(ctx, opts.recursive ? `remove ${what} recursively` : `remove ${what}`)
      return { state, stderr: ctx.stderr.join('\n'), code: 0 }
    }

    for (const op of opts.operands) {
      const abs = resolvePath(state.cwd, op, state.home)
      const last = op.replace(/\/+$/, '').split('/').pop()

      if (opts.recursive && abs === '/' && opts.preserveRoot) {
        const same = op === '/' ? "'/'" : `'${op}' (same as '/')`
        fail(ctx, `rm: it is dangerous to operate recursively on ${same}`)
        ctx.stderr.push('rm: use --no-preserve-root to override this failsafe')
        continue
      }
      if (opts.recursive && (last === '.' || last === '..')) {
        fail(ctx, `rm: refusing to remove '.' or '..' directory: skipping '${op}'`)
        continue
      }

      const found = lookup(state, abs)
      if (found.error) {
        if (!(opts.force && found.error === 'ENOENT')) fail(ctx, `rm: cannot remove '${op}': ${ERRNO_TEXT[found.error]}`)
        continue
      }
      const node = found.node
      if (isDir(node) && !opts.recursive) {
        if (!opts.emptyDirs) {
          fail(ctx, `rm: cannot remove '${op}': Is a directory`)
          continue
        }
        if (Object.keys(node.children).length > 0) {
          fail(ctx, `rm: cannot remove '${op}': Directory not empty`)
          continue
        }
      }
      const parentAbs = dirname(abs)
      const parent = abs === '/' ? state.fs : (lookup(state, parentAbs).node as DirNode)
      removeTree(ctx, parentAbs, parent, abs, op, node)
    }

    return {
      state,
      stdout: ctx.said.join('\n') || undefined,
      stderr: ctx.stderr.join('\n') || undefined,
      code: ctx.failed ? 1 : 0,
    }
  },
}
