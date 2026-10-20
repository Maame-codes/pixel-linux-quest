import { lookupCommand, registry } from './commands'
import { dir, file, type CommandResult, type DirNode, type ShellState } from './types'

/** Commands that always work, even when a level has not unlocked them. */
const ALWAYS_AVAILABLE = ['help', 'clear']

/** Friendly Pip messages for powerful commands that unlock later. */
const EASTER_EGGS: Record<string, string> = {
  sudo: 'sudo? Root powers unlock in World 6, Script Castle. Hang tight!',
  rm: "Whoa, rm deletes files for good. You'll unlock it safely in World 3, File Forest.",
  chmod: 'Permissions magic (chmod) is waiting for you in World 3, File Forest.',
}

export type RunOptions = {
  /** Command names unlocked for this level. */
  commands: string[]
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

  const parts = line.split(/\s+/)
  const name = parts[0]
  const args = parts.slice(1)

  const unlocked = options.commands
  const canRun = ALWAYS_AVAILABLE.includes(name) || unlocked.includes(name)

  if (!canRun) {
    if (name in EASTER_EGGS) {
      return result(input, next, { stdout: EASTER_EGGS[name] })
    }
    return result(input, next, { stderr: `${name}: command not found`, code: 127 })
  }

  const cmd = registry[name]
  if (!cmd) {
    return result(input, next, { stderr: `${name}: command not found`, code: 127 })
  }

  if (args[0] === '--help') {
    const text = [`${cmd.name} - ${cmd.summary}`, `Usage: ${cmd.usage ?? cmd.name}`].join('\n')
    return result(input, next, { stdout: text })
  }

  const out = cmd.run({
    args,
    raw: line,
    state: next,
    unlocked,
    lookup: lookupCommand,
  })

  const finalState = out.state ?? next
  if (out.clear) finalState.history = next.history
  return result(input, finalState, {
    stdout: out.stdout,
    stderr: out.stderr,
    code: out.code,
    clear: out.clear,
  })
}
