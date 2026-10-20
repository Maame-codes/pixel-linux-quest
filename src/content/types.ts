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
