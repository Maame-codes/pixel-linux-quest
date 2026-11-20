// Practice tasks for the "weak spots" round: small, quick terminal tasks,
// at least two for every command a player can unlock. Each task starts
// from its own little filesystem, with the player's unlocked commands.

import { dir, file, getNode, isDir, isFile, type DirNode } from '../shell'
import { namedPath, ran, wordsOf } from './checks'
import type { Objective } from './types'

export type PracticeTask = Objective & {
  /** The command this task practises. */
  command: string
  seedFs: () => DirNode
  startDir: string
  /** Commands already run before the player starts (they show up in history). */
  preRun?: string[]
}

const HOME = '/home/pip'

/** A small home for practice, plus a few system folders to visit. */
function practiceFs(): DirNode {
  return dir({
    etc: dir({
      hostname: file('island'),
      motd: file('Welcome to Pip OS. Have a nice day!'),
    }),
    home: dir({
      pip: dir({
        'fish.txt': file('><> salmon\n><> cod\n><> herring'),
        docs: dir({ 'guide.txt': file('Step 1: breathe. Step 2: type.') }),
        games: dir({ 'scores.txt': file('snake 120') }),
        photos: dir({ '2024': dir({ 'beach.png': file('(a picture)') }) }),
        projects: dir({ 'plan.txt': file('Build an igloo.') }),
        snacks: dir({ 'krill.txt': file('crunchy') }),
      }),
    }),
    var: dir({ log: dir({ 'syslog': file('all quiet') }) }),
  })
}

export const PRACTICE_TASKS: PracticeTask[] = [
  // pwd
  {
    id: 'pwd-1',
    command: 'pwd',
    label: 'Print the folder you are standing in',
    hint: 'One short command prints your current location as a full path.',
    answer: 'pwd',
    seedFs: practiceFs,
    startDir: `${HOME}/photos`,
    check: (_s, last) => ran(last, 'pwd'),
  },
  {
    id: 'pwd-2',
    command: 'pwd',
    label: 'Pip dropped you somewhere new. Find out where you are.',
    hint: 'The command stands for "print working directory".',
    answer: 'pwd',
    seedFs: practiceFs,
    startDir: '/var/log',
    check: (_s, last) => ran(last, 'pwd'),
  },
  // whoami
  {
    id: 'whoami-1',
    command: 'whoami',
    label: 'Ask the system which user you are',
    hint: 'The command reads like a question: who am I?',
    answer: 'whoami',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'whoami'),
  },
  {
    id: 'whoami-2',
    command: 'whoami',
    label: 'Before changing anything, check your username',
    hint: 'Three words squashed into one command, all lowercase.',
    answer: 'whoami',
    seedFs: practiceFs,
    startDir: '/etc',
    check: (_s, last) => ran(last, 'whoami'),
  },
  // ls
  {
    id: 'ls-1',
    command: 'ls',
    label: 'List what is in the snacks folder, without going into it',
    hint: 'ls can take a folder name after it.',
    answer: 'ls snacks',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) => ran(last, 'ls') && namedPath(last, s, `${HOME}/snacks`),
  },
  {
    id: 'ls-2',
    command: 'ls',
    label: 'List the /etc folder using its absolute path',
    hint: 'An absolute path starts with /.',
    answer: 'ls /etc',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) => ran(last, 'ls') && namedPath(last, s, '/etc'),
  },
  // cd
  {
    id: 'cd-1',
    command: 'cd',
    label: 'Go into the games folder',
    hint: 'cd, a space, then the folder name.',
    answer: 'cd games',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => s.cwd === `${HOME}/games`,
  },
  {
    id: 'cd-2',
    command: 'cd',
    label: 'You are deep inside photos/2024. Go straight home.',
    hint: 'cd on its own takes you home. So does the ~ shortcut.',
    answer: 'cd ~',
    seedFs: practiceFs,
    startDir: `${HOME}/photos/2024`,
    check: (s) => s.cwd === HOME,
  },
  {
    id: 'cd-3',
    command: 'cd',
    label: 'Go up one folder, out of photos',
    hint: 'Two dots mean the folder above this one. Remember the space after cd.',
    answer: 'cd ..',
    seedFs: practiceFs,
    startDir: `${HOME}/photos`,
    check: (s) => s.cwd === HOME,
  },
  // mkdir
  {
    id: 'mkdir-1',
    command: 'mkdir',
    label: 'Make a new folder called music',
    hint: 'mkdir makes directories. Give it the new name.',
    answer: 'mkdir music',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isDir(getNode(s.fs, `${HOME}/music`)),
  },
  {
    id: 'mkdir-2',
    command: 'mkdir',
    label: 'Make a folder called drafts inside projects, without moving',
    hint: 'You can give mkdir a path: the parent folder, a slash, then the new name.',
    answer: 'mkdir projects/drafts',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isDir(getNode(s.fs, `${HOME}/projects/drafts`)),
  },
  // touch
  {
    id: 'touch-1',
    command: 'touch',
    label: 'Create an empty file called todo.txt',
    hint: 'touch creates empty files.',
    answer: 'touch todo.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isFile(getNode(s.fs, `${HOME}/todo.txt`)),
  },
  {
    id: 'touch-2',
    command: 'touch',
    label: 'Create notes.txt inside the docs folder, without moving',
    hint: 'Give touch a path: the folder, a slash, then the file name.',
    answer: 'touch docs/notes.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isFile(getNode(s.fs, `${HOME}/docs/notes.txt`)),
  },
  // cat
  {
    id: 'cat-1',
    command: 'cat',
    label: 'Show what is inside fish.txt',
    hint: 'cat prints a whole file. Put the file name after it.',
    answer: 'cat fish.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) => ran(last, 'cat') && namedPath(last, s, `${HOME}/fish.txt`),
  },
  {
    id: 'cat-2',
    command: 'cat',
    label: 'Read the message of the day in /etc/motd',
    hint: 'You can give cat a full path, starting with /.',
    answer: 'cat /etc/motd',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) => ran(last, 'cat') && namedPath(last, s, '/etc/motd'),
  },
  // echo
  {
    id: 'echo-1',
    command: 'echo',
    label: 'Make the terminal say hello',
    hint: 'echo prints back whatever you write after it.',
    answer: 'echo hello',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'echo') && last.stdout.trim().toLowerCase() === 'hello',
  },
  {
    id: 'echo-2',
    command: 'echo',
    label: 'Print the words: Linux is fun',
    hint: 'echo, a space, then the words.',
    answer: 'echo Linux is fun',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'echo') && last.stdout.trim().toLowerCase() === 'linux is fun',
  },
  // man
  {
    id: 'man-1',
    command: 'man',
    label: 'Open the manual page for pwd',
    hint: 'man, a space, then the command you want to read about.',
    answer: 'man pwd',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'man') && wordsOf(last)[1] === 'pwd',
  },
  {
    id: 'man-2',
    command: 'man',
    label: 'Look up how mkdir works in its manual',
    hint: 'The manual command is short for "manual".',
    answer: 'man mkdir',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'man') && wordsOf(last)[1] === 'mkdir',
  },
  // history
  {
    id: 'history-1',
    command: 'history',
    label: 'List the commands you have typed so far',
    hint: 'The command has the same name as the school subject about the past.',
    answer: 'history',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'history'),
  },
  {
    id: 'history-2',
    command: 'history',
    label: 'Pip typed some commands before you arrived. List them.',
    hint: 'The shell keeps a numbered list of past commands. Ask for it.',
    answer: 'history',
    seedFs: practiceFs,
    startDir: HOME,
    preRun: ['ls', 'cd docs', 'cat guide.txt', 'cd ..'],
    check: (_s, last) => ran(last, 'history'),
  },
]

/** Commands that have practice tasks. */
export const PRACTISABLE: string[] = [...new Set(PRACTICE_TASKS.map((t) => t.command))]

export const MIN_TASKS = 3
export const MAX_TASKS = 5

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Choose 3 to 5 tasks for the weakest commands (most mistakes first): one
 * task per command, round after round, until there are 3. If the weak
 * commands run out of tasks, the round is topped up with tasks for other
 * `extra` commands (the player's other unlocked ones). `random` returns a
 * number in [0, 1).
 */
export function pickPracticeTasks(
  weakest: readonly string[],
  extra: readonly string[] = [],
  random: () => number = Math.random,
): PracticeTask[] {
  const commands = weakest.filter((c) => PRACTISABLE.includes(c)).slice(0, MAX_TASKS)
  if (commands.length === 0) return []
  const target = Math.max(MIN_TASKS, commands.length)
  const pools = new Map(commands.map((c) => [c, shuffled(PRACTICE_TASKS.filter((t) => t.command === c), random)]))
  const picked: PracticeTask[] = []
  let added = true
  while (picked.length < target && added) {
    added = false
    for (const c of commands) {
      if (picked.length >= target) break
      const next = pools.get(c)?.shift()
      if (next) {
        picked.push(next)
        added = true
      }
    }
  }
  if (picked.length < MIN_TASKS) {
    const others = shuffled(
      PRACTICE_TASKS.filter((t) => extra.includes(t.command) && !commands.includes(t.command)),
      random,
    )
    picked.push(...others.slice(0, MIN_TASKS - picked.length))
  }
  return picked
}
