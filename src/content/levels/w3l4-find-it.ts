import { dir, file, getNode, isFile } from '../../shell'
import { ran } from '../checks'
import type { Level } from '../types'

const HOME = '/home/pip'

const seedFs = dir({
  home: dir({
    pip: dir({
      site: dir({
        'index.html': file('<img src="images/logo.png"> (the logo is missing!)'),
        images: dir({ 'banner.png': file('(a forest banner)') }),
      }),
      forest: dir({
        'readme.txt': file('The forest is big. Use find.'),
        north: dir({
          'map.txt': file('North: pines and a hollow tree.'),
          pines: dir({
            'cone.txt': file('a pine cone'),
            hollow: dir({ 'logo.png': file('(the forest website logo)') }),
          }),
        }),
        east: dir({
          'bridge.txt': file('A wobbly bridge.'),
          river: dir({ 'stone.txt': file('a smooth stone') }),
        }),
        south: dir({
          'notes.md': file('# South\nNothing to see here.'),
          meadow: dir(),
        }),
      }),
    }),
  }),
})

const TXT = [
  'forest/readme.txt',
  'forest/north/map.txt',
  'forest/north/pines/cone.txt',
  'forest/east/bridge.txt',
  'forest/east/river/stone.txt',
]
const DIRS = [
  'forest',
  'forest/north',
  'forest/north/pines',
  'forest/north/pines/hollow',
  'forest/east',
  'forest/east/river',
  'forest/south',
  'forest/south/meadow',
]

/** The paths find printed, with any "./" in front taken off. */
const printed = (stdout: string) => stdout.split('\n').map((l) => l.replace(/^\.\//, ''))

export const findIt: Level = {
  id: 'w3-l4-find-it',
  world: 3,
  level: 4,
  title: 'Find It',
  blurb: 'The website logo is lost deep in the forest. Track it down with find.',
  xp: 70,
  lessonPages: [
    '**Mission:** the website’s logo has vanished somewhere in the forest, and there are far too many folders to check by hand.\n\n`find` searches a folder and every folder inside it. `find music -name song.mp3` prints the path of every file called `song.mp3` anywhere in `music`.',
    'Don’t know the full name? Use a **pattern**: `*` stands for any characters, or none at all. `find music -name \'*.mp3\'` finds every name that ends in `.mp3`.',
    'Put the pattern in **quotes**. Without them, the shell swaps `*.mp3` for the matching names in the folder you are standing in before `find` even starts. Then you get the wrong answer, or an error.',
    '`-type f` keeps only files and `-type d` keeps only directories. With no folder name, `find` searches where you are standing, which it calls `.`.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: HOME,
    commands: ['ls', 'cd', 'pwd', 'cat', 'cp', 'mv', 'rm', 'rmdir', 'head', 'tail', 'wc', 'find'],
    objectives: [
      {
        id: 'logo',
        label: 'Find logo.png, somewhere inside the forest',
        hint: 'find, then the folder to search, then -name and the file name.',
        answer: 'find forest -name logo.png',
        check: (_s, last) => ran(last, 'find') && printed(last.stdout).includes('forest/north/pines/hollow/logo.png'),
      },
      {
        id: 'txt',
        label: 'List every .txt file in the forest',
        hint: 'Use a * pattern, in quotes, so the shell leaves it for find.',
        answer: "find forest -name '*.txt'",
        check: (_s, last) => {
          if (!ran(last, 'find')) return false
          const paths = printed(last.stdout)
          return TXT.every((p) => paths.includes(p)) && !paths.some((p) => p.endsWith('.md'))
        },
      },
      {
        id: 'dirs',
        label: 'List only the folders in the forest',
        hint: 'find has a -type test: f for files, d for folders.',
        answer: 'find forest -type d',
        check: (_s, last) => {
          if (!ran(last, 'find')) return false
          const paths = printed(last.stdout)
          return DIRS.every((p) => paths.includes(p)) && paths.length === DIRS.length
        },
      },
      {
        id: 'home',
        label: 'Bring the logo home: copy it into site/images',
        hint: 'cp, the path that find printed, then the folder it should go into.',
        answer: 'cp forest/north/pines/hollow/logo.png site/images',
        check: (s) => isFile(getNode(s.fs, `${HOME}/site/images/logo.png`)),
      },
    ],
  },
}
