import { joinPath, joinShown, listDir } from '../fs'
import { writableParent } from '../io'
import { parseOptions, tryHelp } from '../options'
import { basename, resolvePath } from '../path'
import { ERRNO_TEXT, UMASK, lookup, newDir, newFile, permits, statNode, touched } from '../perm'
import { isDir, type Command, type DirNode, type FsNode, type ShellState } from '../types'

export type Transfer = {
  /** Each source, as typed and as an absolute path. */
  sources: { shown: string; abs: string }[]
  /** Where each source goes: inside the destination directory, or the destination itself. */
  targetFor: (src: { shown: string; abs: string }) => { shown: string; abs: string }
}

/**
 * The part cp and mv share: "SOURCE DEST" or "SOURCE... DIRECTORY". Returns
 * the GNU error for a missing or wrong destination.
 */
export function planTransfer(cmd: string, operands: string[], state: ShellState): Transfer | { error: string } {
  if (operands.length === 0) return { error: `${cmd}: missing file operand\n${tryHelp(cmd)}` }
  if (operands.length === 1) {
    return { error: `${cmd}: missing destination file operand after '${operands[0]}'\n${tryHelp(cmd)}` }
  }
  const dest = operands[operands.length - 1]
  const destAbs = resolvePath(state.cwd, dest, state.home)
  const destNode = lookup(state, destAbs).node
  const intoDir = isDir(destNode)
  const sources = operands.slice(0, -1).map((shown) => ({ shown, abs: resolvePath(state.cwd, shown, state.home) }))
  if (sources.length > 1 && !intoDir) return { error: `${cmd}: target '${dest}' is not a directory` }
  return {
    sources,
    targetFor: (src) =>
      intoDir
        ? { shown: joinShown(dest, basename(src.abs)), abs: joinPath(destAbs, basename(src.abs)) }
        : { shown: dest, abs: destAbs },
  }
}

/** Is `inner` the same as or somewhere inside `outer`? */
export function isInside(outer: string, inner: string): boolean {
  return inner === outer || inner.startsWith(outer === '/' ? '/' : outer + '/')
}

type CopyCtx = {
  state: ShellState
  errors: string[]
  said: string[]
  verbose: boolean
  /** -i asks before replacing a file, -n never replaces one. */
  keep: 'ask' | 'never' | null
  /** -i questions. This terminal cannot answer them, so the answer is no. */
  asked: string[]
}

/** Should an existing file be left alone (cp -i or -n)? */
export function keepExisting(cmd: string, keep: 'ask' | 'never' | null, shown: string, asked: string[]): boolean {
  if (keep === 'ask') asked.push(`${cmd}: overwrite '${shown}'? `)
  return keep !== null
}

/** Copy one file onto `target` (made new, or overwritten). */
function copyFile(ctx: CopyCtx, srcAbs: string, src: FsNode & { kind: 'file' }, srcShown: string, target: { shown: string; abs: string }): void {
  const { state } = ctx
  if (!permits(state, srcAbs, src, 'r')) {
    ctx.errors.push(`cp: cannot open '${srcShown}' for reading: Permission denied`)
    return
  }
  const existing = lookup(state, target.abs)
  if (existing.node) {
    if (isDir(existing.node)) {
      ctx.errors.push(`cp: cannot overwrite directory '${target.shown}' with non-directory`)
      return
    }
    if (keepExisting('cp', ctx.keep, target.shown, ctx.asked)) return
    if (!permits(state, target.abs, existing.node, 'w')) {
      ctx.errors.push(`cp: cannot create regular file '${target.shown}': Permission denied`)
      return
    }
    // Overwriting keeps the file's own owner and permissions.
    existing.node.content = src.content
    touched(existing.node)
  } else {
    const parent = writableParent(state, target.abs)
    if (!parent.ok) {
      const errno = existing.error === 'EACCES' ? 'EACCES' : parent.errno
      ctx.errors.push(`cp: cannot create regular file '${target.shown}': ${ERRNO_TEXT[errno]}`)
      return
    }
    // A new copy gets the source's permissions, minus the umask, and belongs to you.
    const mode = statNode(state, srcAbs, src).mode & 0o777 & ~UMASK
    parent.dir.children[basename(target.abs)] = newFile(state, src.content, mode)
    touched(parent.dir)
  }
  if (ctx.verbose) ctx.said.push(`'${srcShown}' -> '${target.shown}'`)
}

/** cp -r: copy a directory and everything inside it. */
function copyDir(ctx: CopyCtx, srcAbs: string, src: DirNode, srcShown: string, target: { shown: string; abs: string }): void {
  const { state } = ctx
  const existing = lookup(state, target.abs)
  let dest: DirNode
  if (existing.node) {
    if (!isDir(existing.node)) {
      ctx.errors.push(`cp: cannot overwrite non-directory '${target.shown}' with directory '${srcShown}'`)
      return
    }
    dest = existing.node
  } else {
    const parent = writableParent(state, target.abs)
    if (!parent.ok) {
      const errno = existing.error === 'EACCES' ? 'EACCES' : parent.errno
      ctx.errors.push(`cp: cannot create directory '${target.shown}': ${ERRNO_TEXT[errno]}`)
      return
    }
    dest = newDir(state, statNode(state, srcAbs, src).mode & 0o777 & ~UMASK)
    parent.dir.children[basename(target.abs)] = dest
    touched(parent.dir)
  }
  if (ctx.verbose) ctx.said.push(`'${srcShown}' -> '${target.shown}'`)
  if (!permits(state, srcAbs, src, 'r') || !permits(state, srcAbs, src, 'x')) {
    ctx.errors.push(`cp: cannot access '${srcShown}': Permission denied`)
    return
  }
  // Copy what was there before starting, so a copy made inside itself is not copied again.
  for (const name of listDir(src)) {
    const child = src.children[name]
    const childAbs = joinPath(srcAbs, name)
    const childShown = joinShown(srcShown, name)
    const childTarget = { shown: joinShown(target.shown, name), abs: joinPath(target.abs, name) }
    if (isDir(child)) copyDir(ctx, childAbs, child, childShown, childTarget)
    else copyFile(ctx, childAbs, child, childShown, childTarget)
  }
}

export const cp: Command = {
  name: 'cp',
  summary: 'copy files and directories',
  usage: 'cp [-r] [-i] SOURCE DEST',
  description:
    'Copies a file. If DEST is a directory, the copy goes inside it with the same name. To copy a directory and everything in it, add -r (recursive).',
  run: ({ args, state }) => {
    const opts = parseOptions('cp', args, {
      flags: 'rRvin',
      long: { recursive: 'r', verbose: 'v', interactive: 'i', 'no-clobber': 'n' },
    })
    if (opts.error) return { stderr: opts.error, code: 1 }
    const plan = planTransfer('cp', opts.operands, state)
    if ('error' in plan) return { stderr: plan.error, code: 1 }
    const recursive = opts.flags.has('r') || opts.flags.has('R')
    // The last of -i and -n wins in GNU cp; here -n wins if both are given.
    const keep = opts.flags.has('n') ? 'never' : opts.flags.has('i') ? 'ask' : null
    const ctx: CopyCtx = { state, errors: [], said: [], verbose: opts.flags.has('v'), keep, asked: [] }

    for (const src of plan.sources) {
      const found = lookup(state, src.abs)
      if (found.error) {
        ctx.errors.push(`cp: cannot stat '${src.shown}': ${ERRNO_TEXT[found.error]}`)
        continue
      }
      const target = plan.targetFor(src)
      if (isDir(found.node)) {
        if (!recursive) {
          ctx.errors.push(`cp: -r not specified; omitting directory '${src.shown}'`)
          continue
        }
        if (isInside(src.abs, target.abs)) {
          ctx.errors.push(`cp: cannot copy a directory, '${src.shown}', into itself, '${target.shown}'`)
          continue
        }
        copyDir(ctx, src.abs, found.node, src.shown, target)
        continue
      }
      if (src.abs === target.abs) {
        ctx.errors.push(`cp: '${src.shown}' and '${target.shown}' are the same file`)
        continue
      }
      copyFile(ctx, src.abs, found.node, src.shown, target)
    }

    return {
      state,
      stdout: ctx.said.join('\n') || undefined,
      stderr: [...ctx.asked, ...ctx.errors].join('\n') || undefined,
      code: ctx.errors.length > 0 ? 1 : 0,
    }
  },
}
