import { lookupCommand, registry } from './commands'
import { analyzeDanger } from './danger'
import { parseWords } from './parse'
import {
  dir,
  file,
  type CommandResult,
  type DirNode,
  type ShellEvent,
  type ShellState,
} from './types'

/** Commands that always work, even when a level has not unlocked them. */
const ALWAYS_AVAILABLE = ['help', 'clear', 'type']

/** Every command the learner can run with these unlocked (plus the always-on ones). */
export function availableCommands(unlocked: readonly string[]): string[] {
  return [...new Set([...ALWAYS_AVAILABLE, ...unlocked])].sort()
}

/** Friendly Pip messages for powerful commands that unlock later. */
const EASTER_EGGS: Record<string, string> = {
  sudo: 'sudo? Root powers unlock in World 6, Script Castle. Hang tight!',
  rm: "Whoa, rm deletes files for good. You'll unlock it safely in World 3, File Forest.",
  chmod: 'Permissions magic (chmod) is waiting for you in World 3, File Forest.',
}

const SANDBOX_ONLY =
  'Whoa, that would wreck a real computer! Save it for the Break It sandbox, where nothing real can break.'

export type RunOptions = {
  /** Command names unlocked for this level. */
  commands: string[]
  /**
   * The Break It sandbox: dangerous commands really run and report an event.
   * Elsewhere they are stopped with a friendly message.
   */
  sandbox?: boolean
}

const DEFAULT_HOME = '/home/pip'

function defaultFs(): DirNode {
  return dir({
    home: dir({
      pip: dir({
        'readme.txt': file('Welcome to Pip’s pocket terminal.\nType help to get started.'),
      }),
    }),
  })
}

export type CreateStateOptions = {
  seedFs?: DirNode
  cwd?: string
  home?: string
  user?: string
  host?: string
  env?: Record<string, string>
}

export function createShellState(opts: CreateStateOptions = {}): ShellState {
  const home = opts.home ?? DEFAULT_HOME
  const cwd = opts.cwd ?? home
  const user = opts.user ?? 'pip'
  const host = opts.host ?? 'island'
  return {
    fs: opts.seedFs ?? defaultFs(),
    cwd,
    home,
    user,
    host,
    env: {
      HOME: home,
      USER: user,
      SHELL: '/bin/bash',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      PWD: cwd,
      ...opts.env,
    },
    history: [],
  }
}

function result(input: string, state: ShellState, partial: Partial<CommandResult> = {}): CommandResult {
  return {
    input,
    stdout: partial.stdout ?? '',
    stderr: partial.stderr ?? '',
    code: partial.code ?? 0,
    clear: partial.clear ?? false,
    event: partial.event ?? null,
    state,
  }
}

/**
 * Run one command line against the state. Returns a fresh state (the input
 * state is never mutated) plus stdout/stderr for the terminal UI.
 */
export function runCommand(state: ShellState, input: string, options: RunOptions): CommandResult {
  const line = input.trim()
  const next = structuredClone(state) as ShellState
  if (line !== '') next.history = [...state.history, line]

  if (line === '') {
    return result(input, next)
  }

  const danger = analyzeDanger(line, state)
  let event: ShellEvent | null = null
  if (danger?.kind === 'fork-bomb') {
    if (!options.sandbox) return result(input, next, { stdout: SANDBOX_ONLY })
    return result(input, next, { event: 'frozen' })
  }

  const parsed = parseWords(line, state)
  if (!parsed.ok) return result(input, next, { stderr: parsed.error, code: 2 })
  const words = parsed.words
  if (words.length === 0) return result(input, next)

  const unlocked = options.commands
  const isUnlocked = (name: string) => ALWAYS_AVAILABLE.includes(name) || unlocked.includes(name)

  // "sudo COMMAND" runs COMMAND (a real system would ask for a password first).
  let start = 0
  while (words[start] === 'sudo' && start + 1 < words.length && isUnlocked('sudo')) start++
  const name = words[start]
  const args = words.slice(start + 1)

  if (!isUnlocked(name)) {
    if (name in EASTER_EGGS) {
      return result(input, next, { stdout: EASTER_EGGS[name] })
    }
    return result(input, next, { stderr: `${name}: command not found`, code: 127 })
  }

  if (danger?.kind === 'wipe') {
    if (!options.sandbox) return result(input, next, { stdout: SANDBOX_ONLY })
    event = 'destroyed'
  }

  const cmd = registry[name]
  if (!cmd) {
    return result(input, next, { stderr: `${name}: command not found`, code: 127 })
  }

  if (args[0] === '--help') {
    const text = [`${cmd.name} - ${cmd.summary}`, `Usage: ${cmd.usage ?? cmd.name}`].join('\n')
    return result(input, next, { stdout: text })
  }

  // Under sudo the command runs as root, then the shell is pip's again.
  const asRoot = start > 0
  if (asRoot) next.user = 'root'
  const out = cmd.run({
    args,
    raw: line,
    state: next,
    unlocked,
    lookup: lookupCommand,
  })

  const finalState = out.state ?? next
  if (asRoot) finalState.user = state.user
  if (out.clear) finalState.history = next.history
  return result(input, finalState, {
    stdout: out.stdout,
    stderr: out.stderr,
    code: out.code,
    clear: out.clear,
    event,
  })
}
