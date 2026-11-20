import type { CommandResult, DirNode, ShellState } from '../shell'

export type Objective = {
  id: string
  /** Shown in the quest list, e.g. "Make a directory called treasure". */
  label: string
  /** Pip's gentle nudge toward this objective. */
  hint: string
  /** The exact command revealed by SHOW ANSWER. */
  answer: string
  /** Returns true once this objective is satisfied. */
  check: (shell: ShellState, last: CommandResult) => boolean
  /**
   * A recall objective: a command from an earlier world, with no hint. Pip
   * may say which world it came from, never the command. SHOW ANSWER only
   * appears after 3 tries.
   */
  recall?: boolean
}

export type ChallengeTest = {
  kind: 'challenge'
  /** Starting filesystem (root node). */
  seedFs: DirNode
  /** Absolute directory the learner starts in. */
  startDir: string
  /** Commands unlocked for this level. */
  commands: string[]
  objectives: Objective[]
  /**
   * A boss level: timed (the player can turn the timer off in settings), and
   * SHOW ANSWER only appears after 3 tries. Running out of time costs nothing.
   */
  boss?: { timeLimitSec: number }
  /**
   * Called after every command. Return a message if the mission can no
   * longer be won (an important file was deleted), and the level must be
   * restarted. Return null while all is well.
   */
  failure?: (shell: ShellState) => string | null
}

export type QuizQuestion = {
  prompt: string
  options: string[]
  /** Index into options of the correct answer. */
  correct: number
  explain: string
}

export type QuizTest = {
  kind: 'quiz'
  questions: QuizQuestion[]
}

export type Test = ChallengeTest | QuizTest

export type Level = {
  /** Stable id, e.g. "w2-l4-dig-a-folder". */
  id: string
  world: number
  /** Position within the world, 1-based. */
  level: number
  title: string
  /** One-line summary for the map and headers. */
  blurb: string
  xp: number
  /** Short markdown pages, read before the test. */
  lessonPages: string[]
  test: Test
}
