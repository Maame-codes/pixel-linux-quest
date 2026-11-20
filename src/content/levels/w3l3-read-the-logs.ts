import { dir, file } from '../../shell'
import { ran } from '../checks'
import type { Level } from '../types'

const PAGES = ['/', '/trails', '/about', '/map', '/photos', '/contact']

/** The web server's log: calm for a long time, then trouble right at the end. */
function serverLog(): string[] {
  const lines: string[] = []
  for (let i = 0; i < 58; i++) {
    const min = String(Math.floor(i / 2)).padStart(2, '0')
    const sec = i % 2 === 0 ? '05' : '35'
    lines.push(`2026-11-20 09:${min}:${sec} INFO GET ${PAGES[i % PAGES.length]} 200`)
  }
  lines.push(
    '2026-11-20 09:29:10 WARN disk 99% full',
    '2026-11-20 09:29:40 ERROR cannot save /srv/www/cache/map.html: No space left on device',
    '2026-11-20 09:29:41 INFO retrying in 5 seconds',
    '2026-11-20 09:29:46 ERROR cannot save /srv/www/cache/map.html: No space left on device',
    '2026-11-20 09:29:47 ERROR web server stopped',
  )
  return lines
}

export const LOG_LINES = serverLog()

const seedFs = dir({
  home: dir({
    pip: dir({ 'todo.txt': file('1. find out why the website is down\n2. fix it') }),
  }),
  var: dir({
    log: dir({
      web: dir({ 'server.log': file(LOG_LINES.join('\n')) }),
    }),
  }),
})

export const readTheLogs: Level = {
  id: 'w3-l3-read-the-logs',
  world: 3,
  level: 3,
  title: 'Read the Logs',
  blurb: 'The website is down. Find the error near the end of a long log with head, tail and wc.',
  xp: 70,
  lessonPages: [
    '**Mission:** the forest website is down! Programs write what they are doing to **log files**, one line per event. On Linux, logs usually live in `/var/log`. The answer is in there somewhere.',
    'Logs can be thousands of lines long, far too long for `cat`.\n\n- `head FILE` shows the first 10 lines.\n- `tail FILE` shows the last 10 lines.\n- Add `-n` and a number for a different amount, like `head -n 3 FILE`.',
    'New lines are added at the **end** of a log, so the latest news (and the latest error) is at the bottom. That makes `tail` a favourite.\n\n`wc -l FILE` counts the lines, so you know how big a file is before you look inside.',
    'On a real system, `less FILE` lets you scroll through a long file one screen at a time (press q to quit). Pip’s terminal cannot scroll like that, so here you use `head` and `tail`.',
  ],
  test: {
    kind: 'challenge',
    seedFs,
    startDir: '/home/pip',
    commands: ['ls', 'cd', 'pwd', 'cat', 'cp', 'mv', 'rm', 'rmdir', 'head', 'tail', 'wc'],
    objectives: [
      {
        id: 'cd',
        label: 'Go to /var/log/web, where the web server keeps its logs',
        hint: 'You learned this in World 2.',
        answer: 'cd /var/log/web',
        recall: true,
        check: (s) => s.cwd === '/var/log/web',
      },
      {
        id: 'head',
        label: 'Peek at the first 5 lines of server.log',
        hint: 'head shows the start of a file, and -n sets how many lines.',
        answer: 'head -n 5 server.log',
        check: (_s, last) => ran(last, 'head') && last.stdout === LOG_LINES.slice(0, 5).join('\n'),
      },
      {
        id: 'count',
        label: 'Count how many lines server.log has',
        hint: 'wc counts things. One of its options counts only lines.',
        answer: 'wc -l server.log',
        check: (_s, last) => ran(last, 'wc') && last.stdout.trim().startsWith(`${LOG_LINES.length} `),
      },
      {
        id: 'tail',
        label: 'Show the last 10 lines, where the newest news is',
        hint: 'The newest lines are at the end of a log. With no -n, you get 10.',
        answer: 'tail server.log',
        check: (_s, last) => ran(last, 'tail') && last.stdout === LOG_LINES.slice(-10).join('\n'),
      },
      {
        id: 'error',
        label: 'Zoom in on just the last 3 lines to read the final error',
        hint: 'The same command as before, with -n and a number.',
        answer: 'tail -n 3 server.log',
        check: (_s, last) => ran(last, 'tail') && last.stdout === LOG_LINES.slice(-3).join('\n'),
      },
    ],
  },
}
