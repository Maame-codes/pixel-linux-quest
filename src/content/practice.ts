// Practice tasks for the "weak spots" round: small, quick terminal tasks,
// at least two for every command a player can unlock. Each task starts
// from its own little filesystem, with the player's unlocked commands.

import { dir, file, getNode, isDir, isFile, type DirNode, type ShellState } from '../shell'
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

/** A 30 line log, for head, tail and wc. */
const APP_LOG = Array.from({ length: 30 }, (_, i) => `09:${String(i).padStart(2, '0')} app: step ${i + 1} ok`).join('\n')
const LOG_LINES = APP_LOG.split('\n')

const modeOf = (s: ShellState, path: string) => getNode(s.fs, path)?.mode ?? 0

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
        'app.log': file(APP_LOG),
        'config.txt': file('colour=blue\nsound=off'),
        'junk.tmp': file(''),
        'script.sh': file('#!/bin/bash\necho "Hi from Pip"'),
        'secret.txt': file('Pip loves sardines.'),
        docs: dir({
          'guide.txt': file('Step 1: breathe. Step 2: type.'),
          howto: dir({ 'steps.txt': file('1. look 2. think 3. type') }),
        }),
        forest: dir({ oak: dir({ nest: dir({ 'egg.txt': file('a small blue egg') }) }), pine: dir() }),
        games: dir({ 'scores.txt': file('snake 120') }),
        old: dir(),
        photos: dir({ '2024': dir({ 'beach.png': file('(a picture)') }), '2025': dir() }),
        projects: dir({ 'plan.txt': file('Build an igloo.'), drafts: dir() }),
        snacks: dir({ 'krill.txt': file('crunchy') }),
        trash: dir({ 'a.tmp': file('a'), 'b.tmp': file('b') }),
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
    label: 'Make a folder called ideas inside projects, without moving',
    hint: 'You can give mkdir a path: the parent folder, a slash, then the new name.',
    answer: 'mkdir projects/ideas',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isDir(getNode(s.fs, `${HOME}/projects/ideas`)),
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
  // cp
  {
    id: 'cp-1',
    command: 'cp',
    label: 'Back up config.txt as config.bak before changing it',
    hint: 'cp, then the file to copy, then the name of the copy.',
    answer: 'cp config.txt config.bak',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => {
      const bak = getNode(s.fs, `${HOME}/config.bak`)
      return isFile(bak) && bak.content.startsWith('colour=blue') && isFile(getNode(s.fs, `${HOME}/config.txt`))
    },
  },
  {
    id: 'cp-2',
    command: 'cp',
    label: 'Copy the whole projects folder to a new folder called projects-copy',
    hint: 'Copying a folder needs one extra option, for "recursive".',
    answer: 'cp -r projects projects-copy',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isFile(getNode(s.fs, `${HOME}/projects-copy/plan.txt`)),
  },
  {
    id: 'cp-3',
    command: 'cp',
    label: 'Put a copy of fish.txt in the docs folder',
    hint: 'If the last name is a folder, cp puts the copy inside it.',
    answer: 'cp fish.txt docs',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => isFile(getNode(s.fs, `${HOME}/docs/fish.txt`)) && isFile(getNode(s.fs, `${HOME}/fish.txt`)),
  },
  // mv
  {
    id: 'mv-1',
    command: 'mv',
    label: 'Rename config.txt to settings.txt',
    hint: 'Moving a file to a new name in the same folder renames it.',
    answer: 'mv config.txt settings.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) =>
      ran(last, 'mv') && isFile(getNode(s.fs, `${HOME}/settings.txt`)) && !getNode(s.fs, `${HOME}/config.txt`),
  },
  {
    id: 'mv-2',
    command: 'mv',
    label: 'Move fish.txt into the snacks folder',
    hint: 'mv, the file, then the folder it should go into.',
    answer: 'mv fish.txt snacks',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) =>
      ran(last, 'mv') && isFile(getNode(s.fs, `${HOME}/snacks/fish.txt`)) && !getNode(s.fs, `${HOME}/fish.txt`),
  },
  // rm
  {
    id: 'rm-1',
    command: 'rm',
    label: 'Delete the empty file junk.tmp',
    hint: 'rm deletes files. There is no recycle bin, so check the name first.',
    answer: 'rm junk.tmp',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => getNode(s.fs, `${HOME}/junk.tmp`) === null && isFile(getNode(s.fs, `${HOME}/fish.txt`)),
  },
  {
    id: 'rm-2',
    command: 'rm',
    label: 'Delete the trash folder and everything in it',
    hint: 'rm deletes a folder only with the option for "recursive".',
    answer: 'rm -r trash',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => getNode(s.fs, `${HOME}/trash`) === null && isDir(getNode(s.fs, `${HOME}/docs`)),
  },
  // rmdir
  {
    id: 'rmdir-1',
    command: 'rmdir',
    label: 'Remove the empty folder called old, with the command that only removes empty folders',
    hint: 'This command is rm plus three letters for "directory".',
    answer: 'rmdir old',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) => ran(last, 'rmdir') && getNode(s.fs, `${HOME}/old`) === null,
  },
  {
    id: 'rmdir-2',
    command: 'rmdir',
    label: 'Remove the empty drafts folder inside projects, without moving',
    hint: 'Give rmdir the path: the parent folder, a slash, then the folder name.',
    answer: 'rmdir projects/drafts',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s, last) => ran(last, 'rmdir') && getNode(s.fs, `${HOME}/projects/drafts`) === null,
  },
  // head
  {
    id: 'head-1',
    command: 'head',
    label: 'Show only the first 3 lines of app.log',
    hint: 'head shows the start of a file. -n says how many lines.',
    answer: 'head -n 3 app.log',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'head') && last.stdout === LOG_LINES.slice(0, 3).join('\n'),
  },
  {
    id: 'head-2',
    command: 'head',
    label: 'Show the first 10 lines of app.log',
    hint: 'With no -n, head shows 10 lines.',
    answer: 'head app.log',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'head') && last.stdout === LOG_LINES.slice(0, 10).join('\n'),
  },
  // tail
  {
    id: 'tail-1',
    command: 'tail',
    label: 'Show the last 5 lines of app.log',
    hint: 'tail shows the end of a file. -n says how many lines.',
    answer: 'tail -n 5 app.log',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'tail') && last.stdout === LOG_LINES.slice(-5).join('\n'),
  },
  {
    id: 'tail-2',
    command: 'tail',
    label: 'Show just the newest line of app.log (the very last one)',
    hint: 'Logs grow at the end. Ask tail for 1 line.',
    answer: 'tail -n 1 app.log',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'tail') && last.stdout === LOG_LINES[LOG_LINES.length - 1],
  },
  // wc
  {
    id: 'wc-1',
    command: 'wc',
    label: 'Count how many lines app.log has',
    hint: 'wc counts. Its -l option counts lines.',
    answer: 'wc -l app.log',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'wc') && /^\s*30\b/.test(last.stdout),
  },
  {
    id: 'wc-2',
    command: 'wc',
    label: 'Count the words in fish.txt',
    hint: 'wc counts. Its -w option counts words.',
    answer: 'wc -w fish.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'wc') && /^\s*6 fish\.txt$/.test(last.stdout),
  },
  // find
  {
    id: 'find-1',
    command: 'find',
    label: 'Find egg.txt, hidden somewhere inside the forest folder',
    hint: 'find, the folder to search, then -name and the file name.',
    answer: 'find forest -name egg.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) => ran(last, 'find') && last.stdout.split('\n').some((l) => l.endsWith('nest/egg.txt')),
  },
  {
    id: 'find-2',
    command: 'find',
    label: 'Find every .txt file inside docs, however deep',
    hint: "A * pattern matches any name. Put the pattern in quotes, like '*.txt'.",
    answer: "find docs -name '*.txt'",
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) =>
      ran(last, 'find') && last.stdout.includes('guide.txt') && last.stdout.includes('howto/steps.txt'),
  },
  {
    id: 'find-3',
    command: 'find',
    label: 'List only the folders inside photos',
    hint: 'find has a -type test: f for files, d for folders.',
    answer: 'find photos -type d',
    seedFs: practiceFs,
    startDir: HOME,
    check: (_s, last) =>
      ran(last, 'find') && last.stdout.includes('photos/2025') && !last.stdout.includes('beach.png'),
  },
  // chmod
  {
    id: 'chmod-1',
    command: 'chmod',
    label: 'Make script.sh runnable for you, its owner',
    hint: 'chmod with u (you, the owner), + and x (execute).',
    answer: 'chmod u+x script.sh',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => (modeOf(s, `${HOME}/script.sh`) & 0o100) !== 0,
  },
  {
    id: 'chmod-2',
    command: 'chmod',
    label: 'Lock secret.txt so only you can read and write it',
    hint: 'In numbers: 6 is read plus write, 0 is nothing. Owner, then group, then others.',
    answer: 'chmod 600 secret.txt',
    seedFs: practiceFs,
    startDir: HOME,
    check: (s) => (modeOf(s, `${HOME}/secret.txt`) & 0o777) === 0o600,
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
