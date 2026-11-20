import { dir, file, getNode } from '../../shell'
import { ran } from '../checks'
import type { Level } from '../types'

const HOME = '/home/pip'

const seedFs = dir({
  home: dir({
    pip: dir({
      'thesis.txt': file('My thesis: penguins make great system administrators.'),
      'junk.tmp': file(''),
      downloads: dir({
        'installer.tmp': file('(a leftover installer)'),
        'passport-scan.pdf': file('(a scan of your passport)'),
      }),
      cache: dir({
        'page1.cache': file('(cached web page)'),
        'page2.cache': file('(cached web page)'),
        thumbs: dir({ 'tiny.cache': file('(a tiny picture)') }),
      }),
      'old-stuff': dir(),
      photos: dir({ 'family.jpg': file('(a family photo)') }),
    }),
  }),
})

/** Files the player must not delete. */
export const IMPORTANT = ['thesis.txt', 'downloads/passport-scan.pdf', 'photos/family.jpg']

const gone = (s: Parameters<typeof getNode>[0], path: string) => getNode(s, `${HOME}/${path}`) === null

export const cleanUp: Level = {
  id: 'w3-l2-clean-up',
  world: 3,
  level: 2,
  title: 'Clean Up',
  blurb: 'The disk is full. Delete the junk with rm and rmdir, and keep what matters.',
  xp: 60,
  lessonPages: [
    '**Mission:** the disk is full and the website cannot save anything new. Time to clear out the junk.\n\n`rm FILE` deletes a file. There is **no recycle bin**: once it is gone, it is gone. So read every name before you press Enter.',
    'Directories need more care.\n\n- `rmdir NAME` removes a directory only if it is **empty**. If anything is inside, it refuses, which makes it the safe choice.\n- `rm -r NAME` deletes a directory **and everything inside it**.',
    'Look before you delete: `ls downloads` shows what is inside `downloads` without going in. If you delete something important here, the level stops and RESTART LEVEL brings everything back. A real computer has no such button!',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: HOME,
    commands: ['ls', 'cd', 'pwd', 'cat', 'cp', 'mv', 'rm', 'rmdir'],
    failure: (s) => {
      const lost = IMPORTANT.find((p) => gone(s.fs, p))
      if (!lost) return null
      return `Oh no, ${lost} was important! rm has no recycle bin, so it is gone. Press RESTART LEVEL to put everything back and try again.`
    },
    objectives: [
      {
        id: 'junk',
        label: 'Delete junk.tmp',
        hint: 'rm deletes a file. There is no recycle bin, so read the name twice.',
        answer: 'rm junk.tmp',
        check: (s) => gone(s.fs, 'junk.tmp'),
      },
      {
        id: 'installer',
        label: 'Delete the leftover installer in downloads, and nothing else there',
        hint: 'Give rm the path: the folder, a slash, then the file name. Use ls downloads to see the names.',
        answer: 'rm downloads/installer.tmp',
        check: (s) => gone(s.fs, 'downloads/installer.tmp'),
      },
      {
        id: 'old-stuff',
        label: 'Remove the empty folder old-stuff, the safe way',
        hint: 'One command only removes folders that are empty, so it can never delete a file by accident.',
        answer: 'rmdir old-stuff',
        check: (s) => gone(s.fs, 'old-stuff'),
      },
      {
        id: 'cache',
        label: 'Delete the cache folder and everything inside it',
        hint: 'rm deletes a folder too, with the option for recursive. Check what is inside first.',
        answer: 'rm -r cache',
        check: (s) => gone(s.fs, 'cache'),
      },
      {
        id: 'check',
        label: 'Look around to check the important files are still here',
        hint: 'You learned this in World 2.',
        answer: 'ls',
        recall: true,
        check: (_s, last) => ran(last, 'ls'),
      },
    ],
  },
}
