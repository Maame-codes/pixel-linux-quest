// Pure data model for the simulated shell. No React in this module.

/**
 * Owner, group, permission bits and last change time. Seed files may leave
 * these out: createShellState fills them in (see fillMeta in perm.ts).
 */
export type NodeMeta = {
  /** Permission bits, e.g. 0o644. Includes setuid/setgid/sticky (0o7000) for display. */
  mode?: number
  owner?: string
  group?: string
  /** Last modification time, in ms since 1970. */
  mtime?: number
}

/**
 * A file. `content` is the text as cat shows it; the file on disk is taken
 * to end with a newline (unless it is empty), as text files normally do.
 */
export type FileNode = { kind: 'file'; content: string } & NodeMeta
export type DirNode = { kind: 'dir'; children: Record<string, FsNode> } & NodeMeta
export type FsNode = FileNode | DirNode

export type ShellState = {
  /** Root of the in-memory filesystem ("/"). */
  fs: DirNode
  /** Absolute current working directory, e.g. "/home/pip". */
  cwd: string
  /** Absolute home directory; "~" is shorthand for it. */
  home: string
  user: string
  host: string
  env: Record<string, string>
  /** Every non-empty command line entered this session, oldest first. */
  history: string[]
}

/** What a single command run produces, before the engine fills in defaults. */
export type CommandOutput = {
  stdout?: string
  stderr?: string
  /** Process exit code; 0 means success. */
  code?: number
  /** New state if the command changed it. Omit to leave state unchanged. */
  state?: ShellState
  /** Signals the terminal UI to wipe the scrollback. */
  clear?: boolean
}

export type CommandContext = {
  /** Arguments after the command name. */
  args: string[]
  /** The full raw command line (trimmed). */
  raw: string
  /** A working copy of the state; commands may mutate it in place. */
  state: ShellState
  /** Command names unlocked for this level (for help). */
  unlocked: string[]
  /** Look up any command's metadata (for man / help). */
  lookup: (name: string) => Command | undefined
}

export type Command = {
  name: string
  /** One-line description shown by help. */
  summary: string
  /** Usage line shown by man and --help. */
  usage?: string
  /** Longer description shown by man. */
  description?: string
  run: (ctx: CommandContext) => CommandOutput
}

/** The fully-resolved result the terminal UI and objective checks consume. */
export type CommandResult = {
  /** The raw command line that produced this result. */
  input: string
  stdout: string
  stderr: string
  code: number
  state: ShellState
  clear: boolean
  /** Set when the command broke the (sandbox) system. */
  event: ShellEvent | null
}

/**
 * Something that ends the session: the system was wiped (with sudo), frozen
 * by a fork bomb, or (without sudo) only pip's own files were deleted.
 */
export type ShellEvent = 'destroyed' | 'frozen' | 'home-wiped'

export const isDir = (node: FsNode | null | undefined): node is DirNode =>
  node != null && node.kind === 'dir'

export const isFile = (node: FsNode | null | undefined): node is FileNode =>
  node != null && node.kind === 'file'

/** Authoring helper: make a file node (owner, group and mode are optional). */
export const file = (content = '', meta: NodeMeta = {}): FileNode => ({ kind: 'file', content, ...meta })

/** Authoring helper: make a directory node (owner, group and mode are optional). */
export const dir = (children: Record<string, FsNode> = {}, meta: NodeMeta = {}): DirNode => ({
  kind: 'dir',
  children,
  ...meta,
})
