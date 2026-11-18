import { getNode } from '../fs'
import { basename, dirname, resolvePath } from '../path'
import { isDir, type Command, type ShellState } from '../types'

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

function removeAt(state: ShellState, abs: string): void {
  if (abs === '/') {
    state.fs.children = {}
    return
  }
  const parent = getNode(state.fs, dirname(abs))
  if (isDir(parent)) delete parent.children[basename(abs)]
}

export const rm: Command = {
  name: 'rm',
  summary: 'remove files or directories',
  usage: 'rm [-r] [-f] FILE...',
  description:
    'Deletes files for good: there is no recycle bin. Add -r to delete a directory and everything inside it. -f skips missing files without an error.',
  run: ({ args, state }) => {
    const opts = parseRmArgs(args)
    if (opts.error) return { stderr: opts.error, code: 1 }
    if (opts.operands.length === 0) {
      if (opts.force) return { state }
      return { stderr: `rm: missing operand\n${TRY}`, code: 1 }
    }

    const errors: string[] = []
    const said: string[] = []
    for (const op of opts.operands) {
      const abs = resolvePath(state.cwd, op, state.home)
      const last = op.replace(/\/+$/, '').split('/').pop()

      if (opts.recursive && abs === '/' && opts.preserveRoot) {
        const same = op === '/' ? "'/'" : `'${op}' (same as '/')`
        errors.push(`rm: it is dangerous to operate recursively on ${same}`)
        errors.push('rm: use --no-preserve-root to override this failsafe')
        continue
      }
      if (opts.recursive && (last === '.' || last === '..')) {
        errors.push(`rm: refusing to remove '.' or '..' directory: skipping '${op}'`)
        continue
      }

      const node = getNode(state.fs, abs)
      if (!node) {
        if (!opts.force) errors.push(`rm: cannot remove '${op}': No such file or directory`)
        continue
      }
      if (isDir(node) && !opts.recursive) {
        if (!opts.emptyDirs) {
          errors.push(`rm: cannot remove '${op}': Is a directory`)
          continue
        }
        if (Object.keys(node.children).length > 0) {
          errors.push(`rm: cannot remove '${op}': Directory not empty`)
          continue
        }
      }
      removeAt(state, abs)
      if (opts.verbose) said.push(isDir(node) ? `removed directory '${op}'` : `removed '${op}'`)
    }

    return {
      state,
      stdout: said.join('\n') || undefined,
      stderr: errors.join('\n') || undefined,
      code: errors.length > 0 ? 1 : 0,
    }
  },
}
