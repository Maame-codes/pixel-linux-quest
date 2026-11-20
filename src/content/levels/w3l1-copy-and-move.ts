import { dir, file, getNode, isFile } from '../../shell'
import { ran } from '../checks'
import type { Level } from '../types'

const HOME = '/home/pip'
const CONF = "title=Pip's Forest\ntheme=green\nport=8080"

const seedFs = dir({
  home: dir({
    pip: dir({
      'draft.txt': file('Once upon a time, a penguin learned Linux.'),
      'tent.jpg': file('(a photo of the tent)'),
      'map.jpg': file('(a photo of the trail map)'),
      photos: dir({ 'sunrise.jpg': file('(a photo of the sunrise)') }),
      site: dir({
        'site.conf': file(CONF),
        'index.html': file('<h1>Welcome to the forest</h1>'),
      }),
    }),
  }),
})

const at = (s: Parameters<typeof getNode>[0], path: string) => getNode(s, `${HOME}/${path}`)

export const copyAndMove: Level = {
  id: 'w3-l1-copy-and-move',
  world: 3,
  level: 1,
  title: 'Copy and Move',
  blurb: 'Back up a config file before an update, then tidy the camp with cp and mv.',
  xp: 60,
  lessonPages: [
    '**Mission:** the forest website gets an update tonight. Updates sometimes go wrong, so first you make a **backup**: a copy you can go back to.\n\n`cp SOURCE DEST` copies a file. `cp notes.txt notes.old` makes a second file with the same contents, and the original stays where it was.',
    'If the last name is a **directory**, the copy goes inside it with the same name: `cp notes.txt backup/` makes `backup/notes.txt`.\n\nTo copy a whole directory with everything inside it, add `-r` (recursive): `cp -r photos photos-old`.',
    '`mv SOURCE DEST` **moves** a file. Nothing is copied, the file just goes somewhere else.\n\n- `mv song.mp3 music/` moves it into `music`.\n- `mv old.txt new.txt` renames it: moving to a new name in the same place is a rename.\n\n`mv` moves directories too, no `-r` needed.',
    'One warning: if the destination is a file that already exists, `cp` and `mv` replace it without asking (unless you add `-i`, which asks first). Look before you copy!',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: HOME,
    commands: ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'cp', 'mv'],
    objectives: [
      {
        id: 'where',
        label: 'Before you start, check which folder you are in',
        hint: 'You learned this in World 2.',
        answer: 'pwd',
        recall: true,
        check: (_s, last) => ran(last, 'pwd'),
      },
      {
        id: 'backup',
        label: 'Back up site/site.conf as site/site.conf.bak',
        hint: 'cp takes what to copy, then the name of the copy. Both are inside site.',
        answer: 'cp site/site.conf site/site.conf.bak',
        check: (s) => {
          const bak = at(s.fs, 'site/site.conf.bak')
          return isFile(bak) && bak.content === CONF && isFile(at(s.fs, 'site/site.conf'))
        },
      },
      {
        id: 'photos',
        label: 'Tidy up: move tent.jpg and map.jpg into photos',
        hint: 'mv can move several files at once when the last name is a folder.',
        answer: 'mv tent.jpg map.jpg photos',
        check: (s) =>
          isFile(at(s.fs, 'photos/tent.jpg')) &&
          isFile(at(s.fs, 'photos/map.jpg')) &&
          !at(s.fs, 'tent.jpg') &&
          !at(s.fs, 'map.jpg'),
      },
      {
        id: 'rename',
        label: 'Rename draft.txt to story.txt',
        hint: 'Moving a file to a new name in the same folder renames it.',
        answer: 'mv draft.txt story.txt',
        check: (s) => isFile(at(s.fs, 'story.txt')) && !at(s.fs, 'draft.txt'),
      },
      {
        id: 'site-backup',
        label: 'Copy the whole site folder to site-backup',
        hint: 'To copy a folder and everything in it, cp needs one extra option.',
        answer: 'cp -r site site-backup',
        check: (s) => isFile(at(s.fs, 'site-backup/index.html')) && isFile(at(s.fs, 'site/index.html')),
      },
    ],
  },
}
