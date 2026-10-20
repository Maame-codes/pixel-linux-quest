import { dir, file } from '../../shell'
import type { Level } from '../types'

const seedFs = dir({
  home: dir({
    pip: dir({ 'cheatsheet.txt': file('man COMMAND, or COMMAND --help') }),
  }),
})

export const gettingHelp: Level = {
  id: 'w2-l5-getting-help',
  world: 2,
  level: 5,
  title: 'Getting Help',
  blurb: 'You never have to memorise it all: man, --help and history.',
  xp: 40,
  lessonPages: [
    'Nobody remembers every command. Linux has help built in. `man COMMAND` opens the **manual page**: what a command does and how to use it. (Try `man ls`.)',
    'For a quick reminder, add `--help` to most commands, like `ls --help`. It prints a short usage summary without opening the full manual.',
    'Typed a long command already? `history` lists the commands you have run this session. You can also press the **Up arrow** in the terminal to bring back the previous one.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: '/home/pip',
    commands: ['man', 'ls', 'pwd', 'echo', 'history'],
    objectives: [
      {
        id: 'man',
        label: 'Read the manual for ls with man ls',
        hint: 'Type man ls to open the manual page for ls.',
        answer: 'man ls',
        check: (_s, last) => {
          const p = last.input.trim().split(/\s+/)
          return p[0] === 'man' && p[1] === 'ls' && last.code === 0
        },
      },
      {
        id: 'help',
        label: 'Get a quick usage summary with --help',
        hint: 'Add --help to a command, for example: ls --help',
        answer: 'ls --help',
        check: (_s, last) => last.input.trim().split(/\s+/).includes('--help') && last.code === 0,
      },
      {
        id: 'history',
        label: 'List the commands you have typed with history',
        hint: 'Type history to see everything you have run so far.',
        answer: 'history',
        check: (_s, last) => last.input.trim() === 'history' && last.code === 0,
      },
    ],
  },
}
