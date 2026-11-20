import { parseOptions } from '../options'
import { basename, dirname } from '../path'
import { ERRNO_TEXT, lookup, permits, touched, unlinkError } from '../perm'
import { isDir, type Command, type DirNode } from '../types'
import { isInside, keepExisting, planTransfer } from './cp'

export const mv: Command = {
  name: 'mv',
  summary: 'move or rename files and directories',
  usage: 'mv [-i] SOURCE DEST',
  description:
    'Moves a file or directory. If DEST is a directory, it goes inside it. Otherwise it is renamed to DEST. No -r is needed for directories.',
  run: ({ args, state }) => {
    const opts = parseOptions('mv', args, {
      flags: 'vin',
      long: { verbose: 'v', interactive: 'i', 'no-clobber': 'n' },
    })
    const keep = opts.flags.has('n') ? 'never' : opts.flags.has('i') ? 'ask' : null
    const asked: string[] = []
    if (opts.error) return { stderr: opts.error, code: 1 }
    const plan = planTransfer('mv', opts.operands, state)
    if ('error' in plan) return { stderr: plan.error, code: 1 }

    const errors: string[] = []
    const said: string[] = []
    for (const src of plan.sources) {
      const found = lookup(state, src.abs)
      if (found.error) {
        errors.push(`mv: cannot stat '${src.shown}': ${ERRNO_TEXT[found.error]}`)
        continue
      }
      const node = found.node
      const target = plan.targetFor(src)
      if (src.abs === target.abs) {
        errors.push(`mv: '${src.shown}' and '${target.shown}' are the same file`)
        continue
      }
      if (src.abs === '/' || (isDir(node) && isInside(src.abs, target.abs))) {
        errors.push(`mv: cannot move '${src.shown}' to a subdirectory of itself, '${target.shown}'`)
        continue
      }

      const fail = (errno: keyof typeof ERRNO_TEXT) =>
        errors.push(`mv: cannot move '${src.shown}' to '${target.shown}': ${ERRNO_TEXT[errno]}`)

      const destParentAbs = dirname(target.abs)
      const destParent = lookup(state, destParentAbs)
      if (destParent.error) {
        fail(destParent.error)
        continue
      }
      if (!isDir(destParent.node)) {
        fail('ENOTDIR')
        continue
      }
      const existing = destParent.node.children[basename(target.abs)]
      if (existing) {
        if (keepExisting('mv', keep, target.shown, asked)) continue
        if (isDir(node) && !isDir(existing)) {
          errors.push(`mv: cannot overwrite non-directory '${target.shown}' with directory '${src.shown}'`)
          continue
        }
        if (!isDir(node) && isDir(existing)) {
          errors.push(`mv: cannot overwrite directory '${target.shown}' with non-directory`)
          continue
        }
        if (isDir(existing) && Object.keys(existing.children).length > 0) {
          fail('ENOTEMPTY')
          continue
        }
      }

      const srcParentAbs = dirname(src.abs)
      const srcParent = lookup(state, srcParentAbs).node as DirNode
      const fromErr = unlinkError(state, srcParentAbs, srcParent, src.abs, node)
      if (fromErr) {
        fail(fromErr)
        continue
      }
      const toErr = existing
        ? unlinkError(state, destParentAbs, destParent.node, target.abs, existing)
        : permits(state, destParentAbs, destParent.node, 'w') && permits(state, destParentAbs, destParent.node, 'x')
          ? null
          : 'EACCES'
      if (toErr) {
        fail(toErr)
        continue
      }
      // Moving a directory to a new parent rewrites its "..", which needs write permission on it.
      if (isDir(node) && srcParentAbs !== destParentAbs && !permits(state, src.abs, node, 'w')) {
        fail('EACCES')
        continue
      }

      delete srcParent.children[basename(src.abs)]
      destParent.node.children[basename(target.abs)] = node
      touched(srcParent)
      touched(destParent.node)
      if (opts.flags.has('v')) said.push(`renamed '${src.shown}' -> '${target.shown}'`)
    }

    return {
      state,
      stdout: said.join('\n') || undefined,
      stderr: [...asked, ...errors].join('\n') || undefined,
      // A declined -i question (nobody can answer here) also makes mv exit with 1.
      code: errors.length > 0 || asked.length > 0 ? 1 : 0,
    }
  },
}
