import { useCallback, useRef, useState } from 'react'

import {
  createShellState,
  runCommand,
  shortenPath,
  type CommandResult,
  type DirNode,
  type ShellState,
} from '../shell'

export type TerminalTone = 'in' | 'out' | 'err' | 'info'
export type TerminalLine = { id: number; text: string; tone: TerminalTone }

export type ShellSessionOptions = {
  commands: string[]
  seedFs?: DirNode
  startDir?: string
  welcome?: string
}

export type ShellSession = {
  lines: TerminalLine[]
  state: ShellState
  prompt: string
  /** Run a command line; returns the result so callers can check objectives. */
  submit: (input: string) => CommandResult
  reset: () => void
}

function promptFor(state: ShellState): string {
  return `${state.user}@${state.host}:${shortenPath(state.cwd, state.home)}$`
}

function makeInitialState(opts: ShellSessionOptions): ShellState {
  return createShellState({ seedFs: opts.seedFs, cwd: opts.startDir })
}

function welcomeLines(opts: ShellSessionOptions, nextId: () => number): TerminalLine[] {
  if (!opts.welcome) return []
  return opts.welcome.split('\n').map((text) => ({ id: nextId(), text, tone: 'info' as const }))
}

/**
 * React state wrapper around the pure shell engine. Owns the terminal
 * scrollback and the live ShellState, and exposes submit/reset.
 */
export function useShellSession(opts: ShellSessionOptions): ShellSession {
  const idRef = useRef(0)
  const nextId = useCallback(() => ++idRef.current, [])

  const stateRef = useRef<ShellState>(makeInitialState(opts))
  const [state, setState] = useState<ShellState>(stateRef.current)
  const [lines, setLines] = useState<TerminalLine[]>(() => welcomeLines(opts, nextId))

  const commands = opts.commands

  const submit = useCallback(
    (input: string): CommandResult => {
      const before = stateRef.current
      const result = runCommand(before, input, { commands })
      stateRef.current = result.state
      setState(result.state)

      if (result.clear) {
        setLines([])
        return result
      }

      const added: TerminalLine[] = [
        { id: nextId(), text: `${promptFor(before)} ${input}`, tone: 'in' },
      ]
      if (result.stdout) {
        for (const text of result.stdout.split('\n')) added.push({ id: nextId(), text, tone: 'out' })
      }
      if (result.stderr) {
        for (const text of result.stderr.split('\n')) added.push({ id: nextId(), text, tone: 'err' })
      }
      setLines((prev) => [...prev, ...added])
      return result
    },
    [commands, nextId],
  )

  const reset = useCallback(() => {
    const fresh = makeInitialState(opts)
    stateRef.current = fresh
    setState(fresh)
    setLines(welcomeLines(opts, nextId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextId])

  return { lines, state, prompt: promptFor(state), submit, reset }
}
